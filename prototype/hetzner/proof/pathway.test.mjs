import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { before, describe, test } from "node:test";

import { mfaCode } from "../fixtures.js";
import { claims, login, loginAttempt } from "./oidc.mjs";

const api = "http://127.0.0.1:8787";

async function waitFor(url) {
  let last = "not started";
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
      last = `${response.status}`;
    } catch (error) {
      last = error.message;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`unavailable ${url}: ${last}`);
}

async function call(token, method, path, body) {
  const response = await fetch(`${api}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      ...(body ? { "content-type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let payload = text;
  try {
    payload = JSON.parse(text);
  } catch {
    // keep text
  }
  return { status: response.status, body: payload };
}

function psql(sql) {
  return execFileSync(
    "docker",
    ["compose", "exec", "-T", "postgres", "psql", "-U", "talon", "-d", "talon_prototype", "-v", "ON_ERROR_STOP=1", "-t", "-A", "-c", sql],
    { cwd: new URL("..", import.meta.url), encoding: "utf8" },
  ).trim();
}

describe("hetzner postgres pathway", { concurrency: false }, () => {
  before(async () => {
    await waitFor("http://127.0.0.1:5556/health");
    await waitFor(`${api}/health`);
  });

  test("auth with the dev SSO provider requires password and MFA", async () => {
    const discovery = await fetch("http://127.0.0.1:5556/.well-known/openid-configuration");
    assert.equal(discovery.status, 200);
    const metadata = await discovery.json();
    assert.equal(metadata.issuer, "http://localhost:5556");
    assert.ok(metadata.jwks_uri);

    const ada = await login("ada.essentials@cedar.example");
    const tokenClaims = claims(ada.accessToken);
    assert.ok(tokenClaims.amr.includes("pwd"));
    assert.ok(tokenClaims.amr.includes("otp"));
    assert.equal(tokenClaims.aud, "talon-api");

    const me = await call(ada.accessToken, "GET", "/me");
    assert.equal(me.status, 200);
    assert.equal(me.body.email, "ada.essentials@cedar.example");
    assert.equal(me.body.role, "essentials");
    assert.equal(me.body.tenant_slug, "cedar");

    const missing = await fetch(`${api}/tickets`);
    assert.equal(missing.status, 401);

    const garbage = await call("not-a-token", "GET", "/me");
    assert.equal(garbage.status, 401);

    const wrongPassword = await loginAttempt({
      email: "ada.essentials@cedar.example",
      password: "wrong-password",
      code: mfaCode,
    });
    assert.equal(wrongPassword.error, "invalid_login");
    assert.equal(wrongPassword.accessToken, undefined);

    const wrongMfa = await loginAttempt({
      email: "ada.essentials@cedar.example",
      password: "dev-password-ada",
      code: "999999",
    });
    assert.equal(wrongMfa.error, "invalid_mfa");
    assert.equal(wrongMfa.accessToken, undefined);
  });

  test("one client cannot read another client's ticket or file", async () => {
    const blake = await login("blake.pro@cedar.example");
    const casey = await login("casey.pro@harbor.example");

    const created = await call(blake.accessToken, "POST", "/tickets", {
      title: "Cedar only",
      body: "Sample ticket that Harbor must not see.",
      priority: "normal",
    });
    assert.equal(created.status, 201);
    const ticketId = created.body.ticket.id;

    const harborList = await call(casey.accessToken, "GET", "/tickets");
    assert.equal(harborList.status, 200);
    assert.equal(harborList.body.tickets.some((ticket) => ticket.id === ticketId), false);

    const harborRead = await call(casey.accessToken, "GET", `/tickets/${ticketId}`);
    assert.equal(harborRead.status, 404);

    const cedarRead = await call(blake.accessToken, "GET", `/tickets/${ticketId}`);
    assert.equal(cedarRead.status, 200);
    assert.equal(cedarRead.body.ticket.title, "Cedar only");

    const uploaded = await call(blake.accessToken, "POST", "/files", {
      filename: "note.txt",
      content_base64: Buffer.from("cedar sample file").toString("base64"),
    });
    assert.equal(uploaded.status, 201);
    const fileId = uploaded.body.file.id;
    const harborFile = await call(casey.accessToken, "GET", `/files/${fileId}`);
    assert.equal(harborFile.status, 404);
    const cedarFile = await call(blake.accessToken, "GET", `/files/${fileId}`);
    assert.equal(cedarFile.status, 200);
    assert.equal(Buffer.from(cedarFile.body.file.content_base64, "base64").toString(), "cedar sample file");
  });

  test("a ticket is stored in Postgres and carries an SLA due time", async () => {
    const blake = await login("blake.pro@cedar.example");
    const created = await call(blake.accessToken, "POST", "/tickets", {
      title: "Printer queue",
      body: "Sample request for the SLA proof.",
      priority: "normal",
    });
    assert.equal(created.status, 201);
    const ticket = created.body.ticket;
    assert.equal(ticket.sla_state, "within_sla");
    assert.ok(Date.parse(ticket.sla_due_at) > Date.now() + 7 * 60 * 60 * 1000);

    const stored = psql(
      `SELECT status || '|' || sla_due_at::text FROM tickets WHERE id = '${ticket.id}'`,
    );
    assert.ok(stored.startsWith("open|"));

    const updated = await call(blake.accessToken, "PATCH", `/tickets/${ticket.id}`, {
      status: "in_progress",
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.ticket.status, "in_progress");
    assert.equal(updated.body.ticket.sla_due_at, ticket.sla_due_at);

    const after = psql(
      `SELECT status || '|' || sla_due_at::text FROM tickets WHERE id = '${ticket.id}'`,
    );
    assert.ok(after.startsWith("in_progress|"));
    assert.equal(after.split("|")[1], stored.split("|")[1]);

    const resolved = await call(blake.accessToken, "PATCH", `/tickets/${ticket.id}`, {
      status: "resolved",
    });
    assert.equal(resolved.body.ticket.sla_state, "met");

    const breached = await call(blake.accessToken, "POST", "/tickets", {
      title: "Already due",
      body: "Dev priority stores a due time in the past.",
      priority: "dev_already_due",
    });
    assert.equal(breached.status, 201);
    assert.equal(breached.body.ticket.sla_state, "breached");
    assert.ok(Date.parse(breached.body.ticket.sla_due_at) < Date.now());

    assert.equal(psql("SELECT extname FROM pg_extension WHERE extname = 'vector'"), "vector");
  });

  test("Essentials sees only their own tickets and Pro sees the tenant", async () => {
    const ada = await login("ada.essentials@cedar.example");
    const drew = await login("drew.essentials@cedar.example");
    const blake = await login("blake.pro@cedar.example");
    const robin = await login("robin.lead@cedar.example");

    const adaTicket = await call(ada.accessToken, "POST", "/tickets", {
      title: "Ada laptop",
      body: "Essentials ticket.",
      priority: "urgent",
    });
    const drewTicket = await call(drew.accessToken, "POST", "/tickets", {
      title: "Drew monitor",
      body: "Another essentials ticket.",
      priority: "urgent",
    });
    assert.equal(adaTicket.status, 201);
    assert.equal(drewTicket.status, 201);

    const adaList = await call(ada.accessToken, "GET", "/tickets");
    assert.equal(adaList.body.tickets.every((ticket) => ticket.requester_id === ada.user.sub), true);
    assert.equal(adaList.body.tickets.some((ticket) => ticket.id === adaTicket.body.ticket.id), true);
    assert.equal(adaList.body.tickets.some((ticket) => ticket.id === drewTicket.body.ticket.id), false);

    const hidden = await call(ada.accessToken, "GET", `/tickets/${drewTicket.body.ticket.id}`);
    assert.equal(hidden.status, 404);
    const cannotUpdate = await call(ada.accessToken, "PATCH", `/tickets/${drewTicket.body.ticket.id}`, {
      status: "resolved",
    });
    assert.equal(cannotUpdate.status, 404);

    const proList = await call(blake.accessToken, "GET", "/tickets");
    const proIds = new Set(proList.body.tickets.map((ticket) => ticket.id));
    assert.equal(proIds.has(adaTicket.body.ticket.id), true);
    assert.equal(proIds.has(drewTicket.body.ticket.id), true);

    const lead = await call(robin.accessToken, "GET", "/tickets");
    assert.equal(lead.status, 403);
    assert.equal(lead.body.error, "role_not_available");
    const leadMe = await call(robin.accessToken, "GET", "/me");
    assert.equal(leadMe.body.role, "team_lead");

    const minted = await call(blake.accessToken, "POST", "/bot-tokens", {
      name: "cedar reader",
      scopes: ["tickets:read"],
    });
    assert.equal(minted.status, 201);
    const bot = minted.body.token;
    const botList = await call(bot, "GET", "/tickets");
    assert.equal(botList.status, 200);
    assert.equal(botList.body.tickets.some((ticket) => ticket.id === adaTicket.body.ticket.id), true);
    const botWrite = await call(bot, "POST", "/tickets", {
      title: "Should fail",
      body: "Read token cannot write.",
      priority: "normal",
    });
    assert.equal(botWrite.status, 403);
    assert.equal(botWrite.body.error, "missing_scope");

    const uses = Number(psql(
      `SELECT count(*) FROM bot_token_uses WHERE token_id = '${minted.body.bot_token.id}'`,
    ));
    assert.ok(uses >= 1);

    const revoked = await call(blake.accessToken, "POST", `/bot-tokens/${minted.body.bot_token.id}/revoke`);
    assert.equal(revoked.status, 200);
    const afterRevoke = await call(bot, "GET", "/tickets");
    assert.equal(afterRevoke.status, 401);
    assert.equal(afterRevoke.body.error, "token_revoked");

    const essentialsMint = await call(ada.accessToken, "POST", "/bot-tokens", {
      name: "not allowed",
      scopes: ["tickets:read"],
    });
    assert.equal(essentialsMint.status, 403);
  });
});
