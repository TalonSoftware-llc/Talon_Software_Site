import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";

import { authenticate, httpError } from "./auth.js";
import { ping, withTenant } from "./db.js";

const port = Number(process.env.PORT || 8787);
const blobDir = process.env.BLOB_DIR || "/data/blobs";
const dev = process.env.PROTOTYPE_DEV === "1";
const scopesAllowed = new Set(["tickets:read", "tickets:write", "files:read", "files:write"]);

function log(event, fields = {}) {
  console.log(JSON.stringify({ t: new Date().toISOString(), service: "api", event, ...fields }));
}

function send(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "content-length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 200_000) throw httpError(413, "body_too_large");
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw httpError(400, "invalid_json");
  }
}

function slaMinutes(priority) {
  if (priority === "normal") return 8 * 60;
  if (priority === "urgent") return 60;
  if (priority === "dev_already_due") {
    if (!dev) throw httpError(400, "unknown_priority");
    return -5;
  }
  throw httpError(400, "unknown_priority");
}

function presentTicket(row) {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    status: row.status,
    priority: row.priority,
    requester_id: row.requester_id,
    sla_due_at: row.sla_due_at,
    sla_state: row.sla_state,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function loadTicket(client, id) {
  const result = await client.query(
    `SELECT id, title, body, status, priority, requester_id, sla_due_at, sla_state, created_at, updated_at
     FROM tickets_with_sla WHERE id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

function requireScope(session, scope) {
  if (session.kind === "bot" && !session.scopes.includes(scope)) {
    throw httpError(403, "missing_scope");
  }
}

function requirePortalRole(session) {
  if (session.role === "team_lead") throw httpError(403, "role_not_available");
}

async function noteBot(session, action) {
  if (session.kind !== "bot") return;
  await withTenant(session, (client) =>
    client.query(
      "INSERT INTO bot_token_uses (token_id, tenant_id, action) VALUES ($1, $2, $3)",
      [session.tokenId, session.tenantId, action],
    ),
  );
}

const ticketColumns = `id, title, body, status, priority, requester_id, sla_due_at, sla_state, created_at, updated_at`;

async function handle(req, res) {
  const url = new URL(req.url, "http://localhost");
  const pathName = url.pathname;

  if (req.method === "GET" && pathName === "/health") {
    const ok = await ping();
    send(res, ok ? 200 : 503, { ok, service: "api" });
    return;
  }

  const session = await authenticate(req);

  if (req.method === "GET" && pathName === "/me") {
    send(res, 200, {
      kind: session.kind,
      role: session.role,
      tenant_id: session.tenantId,
      tenant_slug: session.tenantSlug ?? null,
      email: session.email ?? null,
      scopes: session.scopes ?? null,
    });
    return;
  }

  const ticketId = pathName.match(/^\/tickets\/([0-9a-f-]{36})$/);
  const revokeId = pathName.match(/^\/bot-tokens\/([0-9a-f-]{36})\/revoke$/);
  const fileId = pathName.match(/^\/files\/([0-9a-f-]{36})$/);

  if (req.method === "GET" && pathName === "/tickets") {
    requirePortalRole(session);
    requireScope(session, "tickets:read");
    await noteBot(session, "GET /tickets");
    const rows = await withTenant(session, (client) =>
      client.query(
        `SELECT ${ticketColumns} FROM tickets_with_sla ORDER BY created_at DESC`,
      ),
    );
    send(res, 200, { tickets: rows.rows.map(presentTicket) });
    return;
  }

  if (req.method === "POST" && pathName === "/tickets") {
    requirePortalRole(session);
    requireScope(session, "tickets:write");
    const body = await readJson(req);
    const title = String(body.title || "").trim();
    const text = String(body.body || "").trim();
    const priority = String(body.priority || "normal");
    if (!title || !text) throw httpError(400, "title_and_body_required");
    const minutes = slaMinutes(priority);
    await noteBot(session, "POST /tickets");
    const created = await withTenant(session, async (client) => {
      const inserted = await client.query(
        `INSERT INTO tickets (tenant_id, requester_id, title, body, priority, sla_due_at)
         VALUES ($1, $2, $3, $4, $5, now() + make_interval(mins => $6))
         RETURNING id`,
        [session.tenantId, session.userId, title, text, priority, minutes],
      );
      return loadTicket(client, inserted.rows[0].id);
    });
    send(res, 201, { ticket: presentTicket(created) });
    return;
  }

  if (ticketId && req.method === "GET") {
    requirePortalRole(session);
    requireScope(session, "tickets:read");
    await noteBot(session, "GET /tickets/:id");
    const row = await withTenant(session, (client) => loadTicket(client, ticketId[1]));
    if (!row) throw httpError(404, "not_found");
    send(res, 200, { ticket: presentTicket(row) });
    return;
  }

  if (ticketId && req.method === "PATCH") {
    requirePortalRole(session);
    requireScope(session, "tickets:write");
    const body = await readJson(req);
    const status = String(body.status || "");
    if (!["open", "in_progress", "resolved"].includes(status)) {
      throw httpError(400, "unknown_status");
    }
    await noteBot(session, "PATCH /tickets/:id");
    const row = await withTenant(session, async (client) => {
      const updated = await client.query(
        "UPDATE tickets SET status = $1 WHERE id = $2 RETURNING id",
        [status, ticketId[1]],
      );
      if (updated.rowCount === 0) return null;
      return loadTicket(client, ticketId[1]);
    });
    if (!row) throw httpError(404, "not_found");
    send(res, 200, { ticket: presentTicket(row) });
    return;
  }

  if (req.method === "POST" && pathName === "/bot-tokens") {
    requirePortalRole(session);
    if (session.kind !== "user" || session.role !== "pro") {
      throw httpError(403, "pro_required");
    }
    const body = await readJson(req);
    const name = String(body.name || "").trim();
    const scopes = Array.isArray(body.scopes) ? body.scopes.map(String) : [];
    if (!name || scopes.length === 0 || scopes.some((scope) => !scopesAllowed.has(scope))) {
      throw httpError(400, "invalid_bot_token");
    }
    const raw = `bot_${randomBytes(32).toString("base64url")}`;
    const hash = createHash("sha256").update(raw).digest("hex");
    const created = await withTenant(session, (client) =>
      client.query(
        `INSERT INTO bot_tokens (tenant_id, name, scopes, token_hash, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, scopes, created_at`,
        [session.tenantId, name, scopes, hash, session.userId],
      ),
    );
    send(res, 201, { token: raw, bot_token: created.rows[0] });
    return;
  }

  if (revokeId && req.method === "POST") {
    requirePortalRole(session);
    if (session.kind !== "user" || session.role !== "pro") {
      throw httpError(403, "pro_required");
    }
    const revoked = await withTenant(session, (client) =>
      client.query(
        `UPDATE bot_tokens SET revoked_at = now()
         WHERE id = $1 AND revoked_at IS NULL
         RETURNING id, revoked_at`,
        [revokeId[1]],
      ),
    );
    if (revoked.rowCount === 0) throw httpError(404, "not_found");
    send(res, 200, { bot_token: revoked.rows[0] });
    return;
  }

  if (req.method === "POST" && pathName === "/files") {
    requirePortalRole(session);
    requireScope(session, "files:write");
    const body = await readJson(req);
    const filename = path.basename(String(body.filename || "note.txt")).slice(0, 120);
    let bytes;
    try {
      bytes = Buffer.from(String(body.content_base64 || ""), "base64");
    } catch {
      throw httpError(400, "invalid_file");
    }
    if (!filename || bytes.length === 0 || bytes.length > 100_000) {
      throw httpError(400, "invalid_file");
    }
    const id = randomUUID();
    const dir = path.join(blobDir, session.tenantId);
    const disk = path.join(dir, id);
    if (!disk.startsWith(dir + path.sep)) throw httpError(400, "invalid_file");
    await noteBot(session, "POST /files");
    await mkdir(dir, { recursive: true });
    await writeFile(disk, bytes);
    const saved = await withTenant(session, (client) =>
      client.query(
        `INSERT INTO stored_files (id, tenant_id, filename, byte_size, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, filename, byte_size`,
        [id, session.tenantId, filename, bytes.length, session.userId],
      ),
    );
    send(res, 201, { file: saved.rows[0] });
    return;
  }

  if (fileId && req.method === "GET") {
    requirePortalRole(session);
    requireScope(session, "files:read");
    await noteBot(session, "GET /files/:id");
    const row = await withTenant(session, (client) =>
      client.query("SELECT id, filename, byte_size FROM stored_files WHERE id = $1", [fileId[1]]),
    );
    if (row.rowCount === 0) throw httpError(404, "not_found");
    const disk = path.join(blobDir, session.tenantId, row.rows[0].id);
    const content = await readFile(disk);
    send(res, 200, {
      file: { ...row.rows[0], content_base64: content.toString("base64") },
    });
    return;
  }

  throw httpError(404, "not_found");
}

const server = createServer((req, res) => {
  handle(req, res).catch((error) => {
    const status = error.status || 500;
    if (status === 500) log("error", { message: error.message });
    if (!res.headersSent) send(res, status, { error: error.code || "internal_error" });
  });
});

server.listen(port, "0.0.0.0", () => {
  log("listening", { port });
});
