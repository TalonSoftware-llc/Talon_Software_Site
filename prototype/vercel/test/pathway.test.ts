import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { DEV_PASSWORD, DEV_TOTP_SECRET } from "../src/dev-credentials";
import { createDatabase, driverFor, migrate, seed, withActor, type Database } from "../src/db";
import { HttpError } from "../src/errors";
import { actorFromClaims, assertMfa } from "../src/identity";
import { authorizeUrl, createPkce, exchangeCode, verifyIdToken } from "../src/oidc-client";
import { readPortal } from "../src/portal";
import { FUTURE_TEAM_LEAD, TEAM_LEAD_VIEWS_BUILT, ticketScope } from "../src/roles";
import { slaDueAt } from "../src/sla";
import { createTicket, getTicket, listTickets, unsafeSelectTicketIds, updateTicket } from "../src/tickets";
import { base32Decode, hotp, totp } from "../src/totp";
import { startDevProvider, type DevProvider } from "../oidc-dev-server";

const redirectUri = "http://127.0.0.1:3210/api/prototype/vercel/auth/callback";

async function fresh(): Promise<Database> {
  const db = await createDatabase();
  await migrate(db);
  await seed(db);
  return db;
}

async function actor(db: Database, sub: string) {
  const matches = await actorFromClaims(db, {
    sub,
    email: `${sub.includes("south") ? sub.replace("sample-south-", "") : sub.replace("sample-north-", "")}@${sub.includes("south") ? "sample-south" : "sample-north"}.example`,
    iss: "http://issuer.test",
    amr: ["pwd", "otp"],
  }, "http://issuer.test");
  return matches;
}

test("driver selection stays on Neon or local Postgres", () => {
  assert.equal(driverFor(undefined), "pglite");
  assert.equal(driverFor("postgresql://user:pass@ep-example.us-east-2.aws.neon.tech/neondb"), "neon");
  assert.throws(() => driverFor("postgresql://user:pass@db.example.com/app"), /Neon/);
});

test("TOTP matches the RFC 6238 SHA-1 vector", () => {
  const key = Buffer.from("12345678901234567890", "ascii");
  assert.equal(hotp(key, Math.floor(59 / 30)), "287082");
  assert.equal(hotp(key, Math.floor(1111111109 / 30)), "081804");
});

test("team-lead is designed and fail-closed", () => {
  assert.equal(TEAM_LEAD_VIEWS_BUILT, false);
  assert.equal(FUTURE_TEAM_LEAD.viewsBuilt, false);
  assert.equal(ticketScope("pro"), "tenant");
  assert.equal(ticketScope("essentials"), "own");
  assert.equal(ticketScope("team_lead"), "own");
});

test("MFA is required at the auth boundary", () => {
  assert.throws(() => assertMfa({ amr: ["pwd"] }), (error: unknown) => {
    return error instanceof HttpError && error.code === "mfa_required";
  });
  assert.doesNotThrow(() => assertMfa({ amr: ["pwd", "otp"] }));
});

test("one company cannot read another company's tickets", async () => {
  const db = await fresh();
  const northEssentials = await actor(db, "sample-north-essentials");
  const northPro = await actor(db, "sample-north-pro");
  const southPro = await actor(db, "sample-south-pro");
  const created = await createTicket(db, northEssentials, {
    title: "North printer queue",
    body: "Sample fixture",
    priority: "p3",
  });
  assert.equal(created.tenantId, "sample-north");

  const southView = await listTickets(db, southPro);
  assert.equal(southView.length, 0);
  await assert.rejects(() => getTicket(db, southPro, created.id), (error: unknown) => {
    return error instanceof HttpError && error.status === 404;
  });

  const rawSouth = await unsafeSelectTicketIds(db, southPro);
  assert.deepEqual(rawSouth, []);
  const rawNorth = await unsafeSelectTicketIds(db, northPro);
  assert.deepEqual(rawNorth, [created.id]);

  await assert.rejects(() => withActor(db, northEssentials, (tx) => tx.query(
    `INSERT INTO tickets (
       id, tenant_id, requester_id, title, body, status, priority, sla_due_at, created_at, updated_at
     ) VALUES ($1, 'sample-south', $2, 'leak', 'nope', 'open', 'p3', $3, $3, $3)`,
    ["cross-tenant", northEssentials.userId, new Date().toISOString()],
  )));
  await db.close();
});

test("Essentials, Pro, and the unbuilt team-lead role", async () => {
  const db = await fresh();
  const essentials = await actor(db, "sample-north-essentials");
  const pro = await actor(db, "sample-north-pro");
  const lead = await actor(db, "sample-north-lead");
  const southPro = await actor(db, "sample-south-pro");
  const own = await createTicket(db, essentials, { title: "Own ticket", body: "Sample", priority: "p3" });
  const broader = await createTicket(db, pro, { title: "Company ticket", body: "Sample", priority: "p2" });
  await createTicket(db, lead, { title: "Lead ticket", body: "Sample", priority: "p3" });
  await createTicket(db, southPro, { title: "South ticket", body: "Sample", priority: "p3" });

  const essentialsList = await listTickets(db, essentials);
  assert.deepEqual(essentialsList.map((ticket) => ticket.id), [own.id]);
  await assert.rejects(() => getTicket(db, essentials, broader.id), (error: unknown) => {
    return error instanceof HttpError && error.status === 404;
  });
  await assert.rejects(() => readPortal(db, essentials), (error: unknown) => {
    return error instanceof HttpError && error.status === 403;
  });

  const proList = await listTickets(db, pro);
  assert.deepEqual(proList.map((ticket) => ticket.title).sort(), ["Company ticket", "Lead ticket", "Own ticket"]);
  const portal = await readPortal(db, pro);
  assert.equal(portal.tenantId, "sample-north");
  assert.match(portal.summary, /Sample North/);
  const updated = await updateTicket(db, pro, own.id, { status: "in_progress" });
  assert.equal(updated.status, "in_progress");
  assert.equal(updated.requesterId, essentials.userId);

  const leadList = await listTickets(db, lead);
  assert.deepEqual(leadList.map((ticket) => ticket.title), ["Lead ticket"]);
  await assert.rejects(() => readPortal(db, lead), (error: unknown) => {
    return error instanceof HttpError && error.status === 403;
  });
  const southPortal = await readPortal(db, southPro);
  assert.equal(southPortal.summary.includes("Sample North"), false);
  await db.close();
});

test("SLA due time is stored, and state is computed without a worker", async () => {
  const dir = mkdtempSync(join(tmpdir(), "talon-vercel-prototype-"));
  const db = await createDatabase({ dataDir: dir });
  await migrate(db);
  await seed(db);
  const essentials = await actor(db, "sample-north-essentials");
  const createdAt = new Date("2026-10-25T12:00:00.000Z");
  const created = await createTicket(db, essentials, {
    title: "SLA sample",
    body: "Sample fixture",
    priority: "p1",
  }, createdAt);
  assert.equal(created.slaDueAt, slaDueAt(createdAt, "p1").toISOString());
  assert.equal(created.slaState, "within");

  const later = new Date(createdAt.getTime() + 10 * 60_000);
  const updated = await updateTicket(db, essentials, created.id, { status: "in_progress" }, later);
  assert.equal(updated.status, "in_progress");
  assert.equal(updated.slaDueAt, created.slaDueAt);
  assert.equal(updated.slaState, "within");

  const breached = await getTicket(db, essentials, created.id, new Date(createdAt.getTime() + 61 * 60_000));
  assert.equal(breached.slaDueAt, created.slaDueAt);
  assert.equal(breached.slaState, "breached");

  const met = await updateTicket(db, essentials, created.id, { status: "resolved" }, later);
  assert.equal(met.slaState, "met");
  await db.close();

  const reopened = await createDatabase({ dataDir: dir });
  await migrate(reopened);
  const stored = await getTicket(reopened, essentials, created.id, later);
  assert.equal(stored.status, "resolved");
  assert.equal(stored.slaDueAt, created.slaDueAt);
  assert.equal(stored.slaState, "met");
  await reopened.close();
  rmSync(dir, { recursive: true, force: true });
});

test("dev SSO requires the authenticator step and maps the ID token", async () => {
  const provider = await startDevProvider({ redirectUri });
  try {
    const db = await fresh();
    const failed = await completeLogin(provider, "essentials@sample-north.example", { otp: "000000", stopOnFailure: true });
    assert.equal(failed, "rejected");

    const code = await completeLogin(provider, "essentials@sample-north.example");
    assert.equal(typeof code.code, "string");
    const idToken = await exchangeCode({
      issuer: provider.issuer,
      redirectUri,
      code: code.code,
      verifier: code.verifier,
    });
    const claims = await verifyIdToken(provider.issuer, idToken, code.nonce);
    assert.equal(claims.email, "essentials@sample-north.example");
    assert.ok(Array.isArray(claims.amr) && claims.amr.map(String).includes("otp"));
    const signedIn = await actorFromClaims(db, claims, provider.issuer);
    assert.equal(signedIn.role, "essentials");
    assert.equal(signedIn.tenantId, "sample-north");
    const ticket = await createTicket(db, signedIn, { title: "Opened via SSO", body: "Sample", priority: "p3" });
    const south = await actor(db, "sample-south-pro");
    await assert.rejects(() => getTicket(db, south, ticket.id));
    await db.close();
  } finally {
    await provider.close();
  }
});

type LoginSuccess = { code: string; verifier: string; nonce: string };

async function completeLogin(
  provider: DevProvider,
  email: string,
  options?: { otp?: string; stopOnFailure?: boolean },
): Promise<LoginSuccess | "rejected"> {
  const pkce = createPkce();
  const jar = new CookieJar();
  let url = authorizeUrl({ issuer: provider.issuer, origin: "http://127.0.0.1:3210", redirectUri }, pkce);
  for (let hop = 0; hop < 8; hop += 1) {
    const response = await fetch(url, { redirect: "manual", headers: cookieHeader(jar, url) });
    jar.store(url, response);
    if (response.status >= 300 && response.status < 400) {
      const next = new URL(response.headers.get("location") ?? "", url).href;
      if (new URL(next).origin !== new URL(provider.issuer).origin) {
        const callback = new URL(next);
        const code = callback.searchParams.get("code");
        if (!code) throw new Error(`SSO redirect had no code: ${next}`);
        return { code, verifier: pkce.verifier, nonce: pkce.nonce };
      }
      url = next;
      continue;
    }
    if (response.status === 200 && new URL(url).pathname.startsWith("/interaction/")) {
      const uid = new URL(url).pathname.split("/")[2];
      const postUrl = new URL(`/interaction/${uid}/login`, provider.issuer).href;
      const posted = await fetch(postUrl, {
        method: "POST",
        redirect: "manual",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          ...cookieHeader(jar, postUrl),
        },
        body: new URLSearchParams({
          email,
          password: DEV_PASSWORD,
          otp: options?.otp ?? totp(base32Decode(DEV_TOTP_SECRET)),
        }),
      });
      jar.store(postUrl, posted);
      if (posted.status === 401 && options?.stopOnFailure) return "rejected";
      if (posted.status < 300 || posted.status >= 400) {
        throw new Error(`SSO login failed (${posted.status}): ${(await posted.text()).slice(0, 240)}`);
      }
      url = new URL(posted.headers.get("location") ?? "", postUrl).href;
      continue;
    }
    throw new Error(`Unexpected SSO response ${response.status} at ${url}: ${(await response.text()).slice(0, 240)}`);
  }
  throw new Error("SSO login did not finish");
}

class CookieJar {
  private readonly byOrigin = new Map<string, Map<string, string>>();

  store(url: string, response: Response) {
    const origin = new URL(url).origin;
    const jar = this.byOrigin.get(origin) ?? new Map<string, string>();
    this.byOrigin.set(origin, jar);
    for (const line of response.headers.getSetCookie()) {
      const pair = line.split(";")[0] ?? "";
      const separator = pair.indexOf("=");
      if (separator < 0) continue;
      const name = pair.slice(0, separator).trim();
      const value = pair.slice(separator + 1).trim();
      if (!value) jar.delete(name);
      else jar.set(name, value);
    }
  }

  header(url: string): string {
    const jar = this.byOrigin.get(new URL(url).origin);
    if (!jar || jar.size === 0) return "";
    return [...jar.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
  }
}

function cookieHeader(jar: CookieJar, url: string): { cookie?: string } {
  const cookie = jar.header(url);
  return cookie ? { cookie } : {};
}
