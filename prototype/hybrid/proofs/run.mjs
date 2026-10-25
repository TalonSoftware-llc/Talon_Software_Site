import { spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

import { totp } from "../oidc/totp.mjs";
import { devUsers } from "../oidc/users.mjs";
import { composeSync } from "../scripts/docker.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const portalDir = join(root, "portal");
const issuer = process.env.OIDC_ISSUER;
const portal = process.env.PORTAL_ORIGIN;
const dataPlane = process.env.DATA_PLANE_ORIGIN;
const clientId = process.env.OIDC_CLIENT_ID;
const clientSecret = process.env.OIDC_CLIENT_SECRET;
const callbackPrefix = `${portal}/api/auth/callback`;
const users = Object.fromEntries(devUsers().map((user) => [user.key, user]));
const children = [];
const logs = new Map();
const passed = [];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function proof(name) {
  passed.push(name);
  console.log(`PROOF pass ${name}`);
}

function capture(name, child) {
  const bucket = [];
  logs.set(name, bucket);
  const keep = (chunk) => {
    bucket.push(chunk.toString());
    const text = bucket.join("");
    if (text.length > 200_000) bucket.splice(0, bucket.length, text.slice(-100_000));
  };
  child.stdout?.on("data", keep);
  child.stderr?.on("data", keep);
  children.push(child);
}

function start(name, command, args, cwd) {
  const child = spawn(command, args, { cwd, env: process.env, stdio: ["ignore", "pipe", "pipe"] });
  capture(name, child);
  return child;
}

async function waitFor(url, tries = 80) {
  for (let attempt = 0; attempt < tries; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // The process is still booting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`timed out waiting for ${url}`);
}

function absorb(jar, response) {
  const lines = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
  for (const line of lines) {
    const [pair, ...attrs] = line.split(";").map((part) => part.trim());
    const eq = pair.indexOf("=");
    const name = pair.slice(0, eq);
    const value = pair.slice(eq + 1);
    const dead = attrs.some((attr) => attr.toLowerCase() === "max-age=0");
    if (dead || !value) jar.delete(name);
    else jar.set(name, value);
  }
  return lines;
}

async function send(url, jar, { method = "GET", form, headers = {} } = {}) {
  const requestHeaders = new Headers(headers);
  if (jar.size) requestHeaders.set("cookie", [...jar.entries()].map(([key, value]) => `${key}=${value}`).join("; "));
  let body;
  if (form) {
    requestHeaders.set("content-type", "application/x-www-form-urlencoded");
    body = new URLSearchParams(form);
  }
  const response = await fetch(url, { method, headers: requestHeaders, body, redirect: "manual" });
  const setCookies = absorb(jar, response);
  const location = response.headers.get("location");
  const text = response.status >= 300 && response.status < 400 ? "" : await response.text();
  return {
    status: response.status,
    text,
    setCookies,
    location: location ? new URL(location, url).toString() : null,
  };
}

async function follow(startUrl, jar, headers) {
  let url = startUrl;
  const setCookies = [];
  for (let hop = 0; hop < 20; hop += 1) {
    const response = await send(url, jar, { headers });
    setCookies.push(...response.setCookies);
    if (response.location) {
      url = response.location;
      continue;
    }
    return { ...response, url, setCookies };
  }
  throw new Error(`too many redirects from ${startUrl}`);
}

async function submit(url, jar, form, headers) {
  const response = await send(url, jar, { method: "POST", form, headers });
  if (!response.location) return { ...response, url, setCookies: response.setCookies };
  const next = await follow(response.location, jar, headers);
  return { ...next, setCookies: [...response.setCookies, ...next.setCookies] };
}

function formAction(html, pageUrl) {
  const match = html.match(/action="([^"]+)"/);
  if (!match) throw new Error(`no form in ${html.slice(0, 240)}`);
  return new URL(match[1].replaceAll("&amp;", "&"), pageUrl).toString();
}

function pkce() {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge, state: randomBytes(16).toString("base64url"), nonce: randomBytes(16).toString("base64url") };
}

async function loginAtIdp(user) {
  const { verifier, challenge, state, nonce } = pkce();
  const jar = new Map();
  const auth = new URL("/auth", issuer);
  auth.searchParams.set("client_id", clientId);
  auth.searchParams.set("redirect_uri", callbackPrefix);
  auth.searchParams.set("response_type", "code");
  auth.searchParams.set("scope", "openid email profile");
  auth.searchParams.set("state", state);
  auth.searchParams.set("nonce", nonce);
  auth.searchParams.set("code_challenge", challenge);
  auth.searchParams.set("code_challenge_method", "S256");

  const loginPage = await follow(auth.toString(), jar);
  assert(loginPage.text.includes('name="password"'), `${user.key} did not reach the password form`);
  const badPassword = await submit(formAction(loginPage.text, loginPage.url), jar, {
    email: user.email,
    password: "wrong-password-value",
  });
  assert(badPassword.text.includes('name="password"') && !badPassword.text.includes('name="code"'), `${user.key} password failure skipped MFA incorrectly`);

  const mfaPage = await submit(formAction(loginPage.text, loginPage.url), jar, {
    email: user.email,
    password: user.password,
  });
  assert(mfaPage.text.includes('name="code"'), `${user.key} password did not reach MFA`);
  const badCode = user.key === "ada" ? (totp(user.totpSecret) === "000000" ? "111111" : "000000") : null;
  if (badCode) {
    const rejected = await submit(formAction(mfaPage.text, mfaPage.url), jar, { code: badCode });
    assert(rejected.status === 401 && rejected.text.includes('name="code"'), "wrong TOTP was accepted");
  }

  const finished = await send(formAction(mfaPage.text, mfaPage.url), jar, {
    method: "POST",
    form: { code: totp(user.totpSecret) },
  });
  let location = finished.location;
  for (let hop = 0; hop < 8 && location && !location.startsWith(callbackPrefix); hop += 1) {
    const response = await send(location, jar);
    location = response.location;
  }
  assert(location && location.startsWith(callbackPrefix), `${user.key} did not return an authorization code`);
  const callback = new URL(location);
  assert(callback.searchParams.get("state") === state, "state mismatch");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: callback.searchParams.get("code") || "",
    redirect_uri: callbackPrefix,
    code_verifier: verifier,
  });
  const tokenResponse = await fetch(new URL("/token", issuer), {
    method: "POST",
    headers: {
      authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const tokens = await tokenResponse.json();
  assert(tokenResponse.ok && tokens.id_token, `token exchange failed for ${user.key}`);
  const payload = JSON.parse(Buffer.from(tokens.id_token.split(".")[1], "base64url").toString());
  assert(payload.sub === user.sub, "subject mismatch");
  assert(payload.nonce === nonce, "nonce mismatch");
  assert(Array.isArray(payload.amr) && payload.amr.includes("pwd") && payload.amr.includes("otp"), `MFA amr missing: ${JSON.stringify(payload)}`);
  return { idToken: tokens.id_token, payload };
}

async function api(token, path, init = {}, headers = {}) {
  const response = await fetch(new URL(path, dataPlane), {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...headers,
    },
  });
  const json = await response.json().catch(() => ({}));
  return { status: response.status, json };
}

async function portalLogin(user) {
  const jar = new Map();
  const loginPage = await follow(`${portal}/api/auth/login`, jar);
  assert(loginPage.text.includes('name="password"'), "portal did not reach the test SSO");
  const mfaPage = await submit(formAction(loginPage.text, loginPage.url), jar, {
    email: user.email,
    password: user.password,
  });
  const landed = await submit(formAction(mfaPage.text, mfaPage.url), jar, { code: totp(user.totpSecret) });
  assert(landed.url.startsWith(`${portal}/tickets`), `portal login landed on ${landed.url}`);
  assert(landed.setCookies.some((line) => line.startsWith("hybrid_session=") && /httponly/i.test(line)), "session cookie is not HttpOnly");
  return { jar, html: landed.text, setCookies: landed.setCookies };
}

async function main() {
  try {
    composeSync(["down", "-v"], root);
  } catch {
    // Nothing was running.
  }
  composeSync(["up", "-d", "--wait"], root);
  start("oidc", process.execPath, ["oidc/server.mjs"], root);
  start("data-plane", process.execPath, ["data-plane/server.mjs"], root);
  start("portal", process.execPath, [
    join(portalDir, "node_modules/next/dist/bin/next"),
    "dev",
    "--hostname",
    "127.0.0.1",
    "--port",
    process.env.PORTAL_PORT || "3210",
  ], portalDir);

  await waitFor(`${issuer}/health`);
  await waitFor(`${dataPlane}/health`);
  await waitFor(`${portal}/api/health`, 120);
  proof("services-up");

  const home = await fetch(portal);
  const homeText = await home.text();
  assert(home.status === 200 && homeText.includes("Sign in with the test SSO"), "portal sign-in page did not render");
  proof("portal-sign-in-page");

  const ada = await loginAtIdp(users.ada);
  const ben = await loginAtIdp(users.ben);
  const cara = await loginAtIdp(users.cara);
  const adaMe = await api(ada.idToken, "/me");
  const benMe = await api(ben.idToken, "/me");
  const caraMe = await api(cara.idToken, "/me");
  assert(adaMe.json.role === "essentials" && adaMe.json.tenantSlug === "harbor", "Ada was not Essentials at Harbor Sample");
  assert(benMe.json.role === "pro" && benMe.json.tenantSlug === "harbor", "Ben was not Pro at Harbor Sample");
  assert(caraMe.json.role === "pro" && caraMe.json.tenantSlug === "pine", "Cara was not Pro at Pine Sample");
  assert(!ada.payload.role && !ben.payload.role, "the IdP token carried a role");
  const forged = `${ada.idToken.slice(0, -4)}abcd`;
  const rejected = await api(forged, "/me");
  const noneAlg = await api("eyJhbGciOiJub25lIn0.eyJzdWIiOiJzYW1wbGV8YWRhIn0.", "/me");
  assert(rejected.status === 401 && noneAlg.status === 401, "bad tokens were accepted");
  proof("auth-sso-mfa");

  const benTicket = await api(ben.idToken, "/tickets", {
    method: "POST",
    body: JSON.stringify({
      subject: "Ben sample outage",
      body: "Sample only. The harbor office link is down.",
      priority: "normal",
      tenantId: caraMe.json.tenantId,
      respondDueAt: "2000-01-01T00:00:00.000Z",
    }),
  });
  assert(benTicket.status === 201 && benTicket.json.slaStatus === "within_sla", "Ben could not create a ticket");
  const caraTicket = await api(cara.idToken, "/tickets", {
    method: "POST",
    body: JSON.stringify({
      subject: "Cara sample vpn",
      body: "Sample only. Pine VPN will not connect.",
      priority: "urgent",
    }),
  });
  assert(caraTicket.status === 201, "Cara could not create a ticket");

  const portalAda = await portalLogin(users.ada);
  const created = await submit(`${portal}/api/tickets`, portalAda.jar, {
    subject: "Ada sample printer",
    body: "The sample printer on the second floor is jammed.",
    priority: "high",
  }, { origin: portal });
  const createdId = created.url.split("/").pop();
  assert(created.text.includes("Ada sample printer"), `portal did not show the created ticket (${created.status})`);
  assert(created.text.includes('data-sla="within_sla"'), "portal did not show the computed SLA");
  const updated = await submit(`${portal}/api/tickets/${createdId}`, portalAda.jar, {
    status: "in_progress",
  }, { origin: portal });
  assert(updated.text.includes('data-status="in_progress"'), `portal update did not persist (${updated.status} ${updated.text.slice(0, 180)})`);
  proof("portal-ticket-round-trip");

  const adaList = await api(ada.idToken, "/tickets", {}, { "x-tenant-id": caraMe.json.tenantId });
  const benList = await api(ben.idToken, "/tickets");
  const caraList = await api(cara.idToken, "/tickets", {}, { "x-tenant-id": adaMe.json.tenantId });
  const adaIds = adaList.json.tickets.map((ticket) => ticket.id);
  const benIds = benList.json.tickets.map((ticket) => ticket.id);
  const caraIds = caraList.json.tickets.map((ticket) => ticket.id);
  assert(adaIds.includes(createdId) && !adaIds.includes(benTicket.json.id) && !adaIds.includes(caraTicket.json.id), "Essentials saw another person's or company's ticket");
  assert(benIds.includes(createdId) && benIds.includes(benTicket.json.id) && !benIds.includes(caraTicket.json.id), "Pro did not see the company scope");
  assert(caraIds.includes(caraTicket.json.id) && !caraIds.includes(createdId), "Pine could read a Harbor ticket");
  const hidden = await api(cara.idToken, `/tickets/${createdId}`, {}, { "x-tenant-id": adaMe.json.tenantId });
  const adaHidden = await api(ada.idToken, `/tickets/${benTicket.json.id}`);
  assert(hidden.status === 404 && adaHidden.status === 404, "a hidden ticket was readable by id");
  const adaPatch = await api(ada.idToken, `/tickets/${benTicket.json.id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "resolved", respondDueAt: "2000-01-01T00:00:00.000Z" }),
  });
  assert(adaPatch.status === 404, "Essentials updated someone else's ticket");
  proof("tenant-and-role");

  const app = new pg.Client({ connectionString: process.env.DATABASE_URL });
  const admin = new pg.Client({ connectionString: process.env.ADMIN_DATABASE_URL });
  await app.connect();
  await admin.connect();
  try {
    const blind = await app.query("SELECT count(*)::int AS n FROM tickets");
    assert(blind.rows[0].n === 0, "RLS returned rows with no tenant set");
    await app.query("BEGIN");
    await app.query(
      "SELECT set_config('app.tenant_id', $1, true), set_config('app.user_id', $2, true), set_config('app.role', 'pro', true)",
      [caraMe.json.tenantId, caraMe.json.userId],
    );
    const wrongTenant = await app.query("SELECT id FROM tickets WHERE id = $1", [createdId]);
    assert(wrongTenant.rowCount === 0, "RLS showed a Harbor ticket inside the Pine tenant");
    await app.query("ROLLBACK");

    await app.query("BEGIN");
    await app.query("SELECT * FROM enter_principal($1, $2)", [issuer, users.ada.sub]);
    const own = await app.query(
      `SELECT status, priority, tenant_id,
              respond_due_at - created_at = make_interval(mins => 60) AS respond_ok,
              resolve_due_at - created_at = make_interval(mins => 480) AS resolve_ok,
              updated_at > created_at AS touched,
              sla_status(status, respond_due_at, resolve_due_at, now()) AS sla
       FROM tickets WHERE id = $1`,
      [createdId],
    );
    assert(own.rows[0].status === "in_progress", "Postgres does not have the updated status");
    assert(own.rows[0].respond_ok && own.rows[0].resolve_ok, "stored SLA due time does not match the high policy");
    assert(own.rows[0].touched, "updated_at did not move");
    assert(own.rows[0].tenant_id === adaMe.json.tenantId, "ticket was stored in the wrong tenant");
    assert(own.rows[0].sla === "within_sla", "fresh ticket was not within SLA");
    const vectors = await app.query(
      `SELECT sla_status('open', now() - interval '1 minute', now() + interval '1 hour', now()) AS response,
              sla_status('open', now() + interval '1 hour', now() - interval '1 second', now()) AS resolve,
              sla_status('resolved', now() - interval '1 day', now() - interval '1 day', now()) AS met,
              sla_status('in_progress', now() - interval '1 minute', now() + interval '1 hour', now()) AS handled`,
    );
    assert(vectors.rows[0].response === "response_breached", "response SLA was not computed");
    assert(vectors.rows[0].resolve === "resolve_breached", "resolve SLA was not computed");
    assert(vectors.rows[0].met === "met" && vectors.rows[0].handled === "within_sla", "SLA matrix mismatch");
    await app.query("ROLLBACK");

    const role = await app.query("SELECT implemented FROM roles WHERE name = 'team_lead'");
    const source = await admin.query("SELECT prosrc FROM pg_proc WHERE proname = 'ticket_visible'");
    assert(role.rows[0].implemented === false, "team_lead was marked implemented");
    assert(!source.rows[0].prosrc.includes("team_lead"), "ticket visibility grants team_lead");
    proof("sla-and-rls");
  } finally {
    await app.end();
    await admin.end();
  }

  console.log(JSON.stringify({ ok: true, proofs: passed }, null, 2));
}

try {
  await main();
} catch (error) {
  console.error(error.stack || error.message);
  for (const [name, bucket] of logs) {
    console.error(`\n--- ${name} log ---\n${bucket.join("").slice(-8000)}`);
  }
  process.exitCode = 1;
} finally {
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  await new Promise((resolve) => setTimeout(resolve, 400));
  try {
    composeSync(["down", "-v"], root);
  } catch (error) {
    console.error(error.message);
  }
}
