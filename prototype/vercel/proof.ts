import { spawn, type ChildProcess } from "node:child_process";

import { DEV_PASSWORD, DEV_TOTP_SECRET } from "./src/dev-credentials";
import { base32Decode, totp } from "./src/totp";

const appOrigin = "http://127.0.0.1:3210";
const issuer = "http://127.0.0.1:3098";
const secret = "dev-only-session-secret-not-for-production!!";

const children: ChildProcess[] = [];

async function main() {
  const env = {
    ...process.env,
    PROTOTYPE_DEV: "1",
    PROTOTYPE_OIDC_ISSUER: issuer,
    PROTOTYPE_OIDC_PORT: "3098",
    PROTOTYPE_APP_ORIGIN: appOrigin,
    PROTOTYPE_SESSION_SECRET: secret,
  };
  const oidc = start("dev SSO", process.execPath, ["--import", "tsx", "prototype/vercel/oidc-dev-server.ts"], env);
  const next = start("next", process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3210"], env);
  children.push(oidc, next);
  await waitFor(`${issuer}/.well-known/openid-configuration`, "dev SSO");
  await waitFor(`${appOrigin}/api/prototype/vercel/health`, "next");

  const health = await json<{ driver: string; pathway: string }>(await fetch(`${appOrigin}/api/prototype/vercel/health`));
  if (health.pathway !== "vercel-serverless" || health.driver !== "pglite") {
    throw new Error(`unexpected health ${JSON.stringify(health)}`);
  }

  const essentials = await signIn("essentials@sample-north.example", { rejectOtpFirst: true });
  if (essentials.user.role !== "essentials" || essentials.user.tenantId !== "sample-north") {
    throw new Error(`unexpected essentials session ${JSON.stringify(essentials.user)}`);
  }
  const created = await send(essentials.jar, "/api/prototype/vercel/tickets", {
    method: "POST",
    body: { title: "North printer queue", body: "Sample fixture", priority: "p1" },
  });
  const createdTicket = created.ticket as Ticket;
  if (createdTicket.slaState !== "within" || !createdTicket.slaDueAt) throw new Error("SLA was not stored");
  const updated = await send(essentials.jar, `/api/prototype/vercel/tickets/${createdTicket.id}`, {
    method: "PATCH",
    body: { status: "in_progress", slaDueAt: "2000-01-01T00:00:00.000Z", tenantId: "sample-north" },
  });
  const updatedTicket = updated.ticket as Ticket;
  if (updatedTicket.status !== "in_progress" || updatedTicket.slaDueAt !== createdTicket.slaDueAt) {
    throw new Error("ticket update did not keep the stored SLA");
  }
  const breached = await send(essentials.jar, `/api/prototype/vercel/tickets/${createdTicket.id}`, {
    headers: { "x-prototype-now": new Date(Date.parse(createdTicket.slaDueAt) + 60_000).toISOString() },
  });
  if ((breached.ticket as Ticket).slaState !== "breached") throw new Error("SLA did not breach from the stored due time");
  const portalDenied = await send(essentials.jar, "/api/prototype/vercel/portal", { expectStatus: 403 });
  if ((portalDenied.error as { code: string }).code !== "portal_forbidden") throw new Error("Essentials portal was not denied");

  const pro = await signIn("pro@sample-north.example");
  await send(pro.jar, "/api/prototype/vercel/tickets", {
    method: "POST",
    body: { title: "North firewall review", body: "Sample fixture", priority: "p2" },
  });
  const proList = await send(pro.jar, "/api/prototype/vercel/tickets");
  const titles = (proList.tickets as Ticket[]).map((ticket) => ticket.title).sort();
  if (titles.join(",") !== "North firewall review,North printer queue") {
    throw new Error(`Pro scope was ${titles.join(",")}`);
  }
  const portal = await send(pro.jar, "/api/prototype/vercel/portal");
  if (!(portal.portal as { summary: string }).summary.includes("Sample North")) throw new Error("Pro portal missing");

  const south = await signIn("pro@sample-south.example");
  const mismatch = await send(south.jar, "/api/prototype/vercel/tickets?tenantId=sample-north", { expectStatus: 403 });
  if ((mismatch.error as { code: string }).code !== "tenant_mismatch") throw new Error("cross-tenant query was not rejected");
  const hidden = await send(south.jar, `/api/prototype/vercel/tickets/${createdTicket.id}`, { expectStatus: 404 });
  if (JSON.stringify(hidden).includes("North printer")) throw new Error("cross-tenant read leaked a title");
  const southList = await send(south.jar, "/api/prototype/vercel/tickets");
  if (JSON.stringify(southList).includes("North")) throw new Error("south list leaked north data");

  const lead = await signIn("lead@sample-north.example");
  const leadTicket = await send(lead.jar, "/api/prototype/vercel/tickets", {
    method: "POST",
    body: { title: "North lead note", body: "Sample fixture", priority: "p3" },
  });
  const leadList = await send(lead.jar, "/api/prototype/vercel/tickets");
  const leadTitles = (leadList.tickets as Ticket[]).map((ticket) => ticket.title);
  if (leadTitles.join(",") !== "North lead note") throw new Error(`team-lead saw ${leadTitles.join(",")}`);
  await send(lead.jar, "/api/prototype/vercel/portal", { expectStatus: 403 });
  const proAfter = await send(pro.jar, `/api/prototype/vercel/tickets/${(leadTicket.ticket as Ticket).id}`);
  if ((proAfter.ticket as Ticket).title !== "North lead note") throw new Error("Pro could not see the lead ticket");

  const missing = await fetch(`${appOrigin}/api/prototype/vercel/team-lead`);
  if (missing.status !== 404) throw new Error(`team-lead route returned ${missing.status}`);

  console.log(JSON.stringify({
    ok: true,
    driver: health.driver,
    auth: "dev-oidc-mfa",
    sla: "stored-due-time",
    roles: ["essentials", "pro", "team_lead-fail-closed"],
    isolation: "sample-north/sample-south",
  }));
}

type Ticket = { id: string; title: string; status: string; slaDueAt: string; slaState: string };

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

async function signIn(email: string, options?: { rejectOtpFirst?: boolean }) {
  const jar = new CookieJar();
  const start = await fetch(`${appOrigin}/api/prototype/vercel/auth/login`, { redirect: "manual" });
  jar.store(start.url, start);
  if (start.status < 300 || start.status >= 400) {
    throw new Error(`login start ${start.status}: ${(await start.text()).slice(0, 240)}`);
  }
  let url = new URL(start.headers.get("location") ?? "", appOrigin).href;
  let posted = false;
  for (let hop = 0; hop < 10; hop += 1) {
    const response = await fetch(url, { redirect: "manual", headers: header(jar, url) });
    jar.store(url, response);
    if (response.status >= 300 && response.status < 400) {
      const next = new URL(response.headers.get("location") ?? "", url).href;
      if (next.startsWith(`${appOrigin}/api/prototype/vercel/auth/callback`)) {
        const callback = await fetch(next, { redirect: "manual", headers: header(jar, next) });
        jar.store(next, callback);
        const body = await callback.json() as { user: { email: string; role: string; tenantId: string } };
        if (!callback.ok) throw new Error(`callback ${callback.status} ${JSON.stringify(body)}`);
        return { jar, user: body.user };
      }
      url = next;
      continue;
    }
    if (!posted && response.status === 200 && url.includes("/interaction/")) {
      posted = true;
      const uid = new URL(url).pathname.split("/")[2];
      const postUrl = new URL(`/interaction/${uid}/login`, issuer).href;
      if (options?.rejectOtpFirst) {
        const rejected = await postLogin(jar, postUrl, email, "000000");
        if (rejected.status !== 401) throw new Error(`bad authenticator code returned ${rejected.status}`);
      }
      const accepted = await postLogin(jar, postUrl, email, totp(base32Decode(DEV_TOTP_SECRET)));
      if (accepted.status < 300 || accepted.status >= 400) {
        throw new Error(`SSO login failed (${accepted.status})`);
      }
      url = new URL(accepted.headers.get("location") ?? "", postUrl).href;
      continue;
    }
    throw new Error(`unexpected ${response.status} at ${url}: ${(await response.text()).slice(0, 240)}`);
  }
  throw new Error(`login did not finish for ${email}`);
}

async function postLogin(jar: CookieJar, url: string, email: string, otp: string) {
  const response = await fetch(url, {
    method: "POST",
    redirect: "manual",
    headers: { "content-type": "application/x-www-form-urlencoded", ...header(jar, url) },
    body: new URLSearchParams({ email, password: DEV_PASSWORD, otp }),
  });
  jar.store(url, response);
  return response;
}

async function send(
  jar: CookieJar,
  path: string,
  options?: { method?: string; body?: unknown; headers?: Record<string, string>; expectStatus?: number },
) {
  const url = `${appOrigin}${path}`;
  const response = await fetch(url, {
    method: options?.method ?? "GET",
    headers: {
      ...header(jar, url),
      ...(options?.body ? { "content-type": "application/json" } : {}),
      ...options?.headers,
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });
  const body = await response.json() as Record<string, unknown>;
  const expected = options?.expectStatus ?? (options?.method === "POST" ? 201 : 200);
  if (response.status !== expected) {
    throw new Error(`${options?.method ?? "GET"} ${path} -> ${response.status} ${JSON.stringify(body)}`);
  }
  return body;
}

function header(jar: CookieJar, url: string): { cookie?: string } {
  const cookie = jar.header(url);
  return cookie ? { cookie } : {};
}

async function json<T>(response: Response): Promise<T> {
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

function start(name: string, command: string, args: string[], env: NodeJS.ProcessEnv) {
  const child = spawn(command, args, { env, detached: true, stdio: ["ignore", "pipe", "pipe"] });
  const lines: string[] = [];
  const capture = (chunk: Buffer) => {
    for (const line of chunk.toString("utf8").split("\n")) {
      if (!line) continue;
      lines.push(line);
      if (lines.length > 40) lines.shift();
    }
  };
  child.stdout?.on("data", capture);
  child.stderr?.on("data", capture);
  child.on("exit", (code) => {
    if (code && code !== 0 && !shuttingDown) {
      console.error(`${name} exited ${code}\n${lines.join("\n")}`);
    }
  });
  return child;
}

let shuttingDown = false;

async function waitFor(url: string, name: string) {
  const started = Date.now();
  let last = "";
  while (Date.now() - started < 120_000) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
      last = `${response.status}`;
    } catch (error) {
      last = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw new Error(`timed out waiting for ${name}: ${last}`);
}

function stopChildren() {
  shuttingDown = true;
  for (const child of children) {
    if (!child.pid) continue;
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      child.kill("SIGTERM");
    }
  }
}

process.on("exit", stopChildren);
main().then(() => {
  stopChildren();
  process.exit(0);
}).catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  stopChildren();
  process.exit(1);
});
