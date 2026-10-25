import { createServer } from "node:http";
import { createRemoteJWKSet, jwtVerify } from "jose";
import pg from "pg";

import { devIssuer } from "../oidc/users.mjs";

const issuer = devIssuer();
const port = Number(process.env.DATA_PLANE_PORT || 8088);
const databaseUrl = process.env.DATABASE_URL || "";
const audience = process.env.OIDC_AUDIENCE;

if (!audience || new URL(databaseUrl).username !== "hybrid_app") {
  console.error("data plane must use OIDC_AUDIENCE and the hybrid_app database role");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: databaseUrl,
  max: 4,
  application_name: "hybrid-data-plane",
});
const jwks = createRemoteJWKSet(new URL("/jwks", issuer));

function log(fields) {
  console.log(JSON.stringify({ time: new Date().toISOString(), service: "data-plane", ...fields }));
}

function send(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 65_536) {
      const error = new Error("body too large");
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString());
  } catch {
    const error = new Error("invalid json");
    error.status = 400;
    throw error;
  }
}

function ticketJson(row) {
  return {
    id: row.id,
    subject: row.subject,
    body: row.body,
    status: row.status,
    priority: row.priority,
    requesterId: row.requester_id,
    respondDueAt: row.respond_due_at.toISOString(),
    resolveDueAt: row.resolve_due_at.toISOString(),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    slaStatus: row.sla_status,
  };
}

const ticketSelect = `
  SELECT id, subject, body, status, priority, requester_id,
         respond_due_at, resolve_due_at, created_at, updated_at,
         sla_status(status, respond_due_at, resolve_due_at, now()) AS sla_status
  FROM tickets
`;

async function withPrincipal(token, fn) {
  let payload;
  try {
    ({ payload } = await jwtVerify(token, jwks, {
      issuer,
      audience,
      clockTolerance: 5,
    }));
  } catch {
    const error = new Error("invalid token");
    error.status = 401;
    throw error;
  }
  if (typeof payload.sub !== "string" || !payload.sub) {
    const error = new Error("invalid token");
    error.status = 401;
    throw error;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const principal = await client.query(
      `SELECT user_id, tenant_id, tenant_slug, tenant_name, role, email, display_name
       FROM enter_principal($1, $2)`,
      [payload.iss, payload.sub],
    );
    if (!principal.rows[0]) {
      const error = new Error("no membership");
      error.status = 403;
      throw error;
    }
    const result = await fn(client, principal.rows[0]);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // The connection may already be closed.
    }
    throw error;
  } finally {
    client.release();
  }
}

function httpError(error) {
  if (error.status) return error.status;
  if (error.code === "23514" || error.code === "23503" || error.code === "22P02") return 400;
  return 500;
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
  const ignoredTenantHeader = Boolean(req.headers["x-tenant-id"]);
  try {
    if (req.method === "GET" && url.pathname === "/health") {
      send(res, 200, { ok: true, service: "data-plane" });
      return;
    }

    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) {
      send(res, 401, { error: "missing token" });
      return;
    }

    if (req.method === "GET" && url.pathname === "/me") {
      const me = await withPrincipal(token, async (_client, principal) => ({
        userId: principal.user_id,
        tenantId: principal.tenant_id,
        tenantSlug: principal.tenant_slug,
        tenantName: principal.tenant_name,
        role: principal.role,
        email: principal.email,
        displayName: principal.display_name,
      }));
      log({ msg: "me", role: me.role, tenantSlug: me.tenantSlug, ignoredTenantHeader });
      send(res, 200, me);
      return;
    }

    if (req.method === "GET" && url.pathname === "/tickets") {
      const tickets = await withPrincipal(token, async (client) => {
        const rows = await client.query(`${ticketSelect} ORDER BY created_at DESC`);
        return rows.rows.map(ticketJson);
      });
      send(res, 200, { tickets });
      return;
    }

    const ticketMatch = url.pathname.match(/^\/tickets\/([0-9a-f-]{36})$/i);

    if (req.method === "POST" && url.pathname === "/tickets") {
      const body = await readJson(req);
      const subject = String(body.subject || "").trim();
      const text = String(body.body || "").trim();
      const priority = String(body.priority || "").trim();
      const created = await withPrincipal(token, async (client, principal) => {
        const rows = await client.query(
          `INSERT INTO tickets (tenant_id, requester_id, subject, body, priority)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, subject, body, status, priority, requester_id,
                     respond_due_at, resolve_due_at, created_at, updated_at,
                     sla_status(status, respond_due_at, resolve_due_at, now()) AS sla_status`,
          [principal.tenant_id, principal.user_id, subject, text, priority],
        );
        return ticketJson(rows.rows[0]);
      });
      log({ msg: "ticket created", ticketId: created.id, ignoredTenantHeader });
      send(res, 201, created);
      return;
    }

    if (ticketMatch && req.method === "GET") {
      const ticket = await withPrincipal(token, async (client) => {
        const rows = await client.query(`${ticketSelect} WHERE id = $1`, [ticketMatch[1]]);
        return rows.rows[0] ? ticketJson(rows.rows[0]) : null;
      });
      if (!ticket) {
        send(res, 404, { error: "not found" });
        return;
      }
      send(res, 200, ticket);
      return;
    }

    if (ticketMatch && req.method === "PATCH") {
      const body = await readJson(req);
      const status = String(body.status || "").trim();
      const ticket = await withPrincipal(token, async (client) => {
        const rows = await client.query(
          `UPDATE tickets SET status = $2 WHERE id = $1
           RETURNING id, subject, body, status, priority, requester_id,
                     respond_due_at, resolve_due_at, created_at, updated_at,
                     sla_status(status, respond_due_at, resolve_due_at, now()) AS sla_status`,
          [ticketMatch[1], status],
        );
        return rows.rows[0] ? ticketJson(rows.rows[0]) : null;
      });
      if (!ticket) {
        send(res, 404, { error: "not found" });
        return;
      }
      log({ msg: "ticket updated", ticketId: ticket.id, status: ticket.status, ignoredTenantHeader });
      send(res, 200, ticket);
      return;
    }

    send(res, 404, { error: "not found" });
  } catch (error) {
    const status = httpError(error);
    if (status === 500) log({ msg: "error", code: error.code || error.name });
    send(res, status, { error: status === 500 ? "data plane error" : error.message });
  }
});

server.listen(port, "127.0.0.1", () => {
  log({ msg: "listening", port });
});

process.on("SIGTERM", async () => {
  server.close();
  await pool.end();
  process.exit(0);
});
