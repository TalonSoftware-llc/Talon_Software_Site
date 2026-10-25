import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import Provider, { interactionPolicy } from "oidc-provider";

import { verifyTotp } from "./totp.mjs";
import { devIssuer, devUsers } from "./users.mjs";

const issuer = devIssuer();
const port = Number(process.env.OIDC_PORT || 4180);
const cookieKey = process.env.OIDC_COOKIE_KEY;
if (!cookieKey || !process.env.OIDC_CLIENT_ID || !process.env.OIDC_CLIENT_SECRET || !process.env.PORTAL_ORIGIN) {
  console.error("missing OIDC client env");
  process.exit(1);
}

const users = devUsers();
const policy = interactionPolicy.base();
policy.remove("consent");

function passwordOk(input, expected) {
  const left = createHash("sha256").update(String(input)).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}

function signPending(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", cookieKey).update(body).digest("base64url");
  return `${body}.${sig}`;
}

function readPending(value) {
  if (!value || !value.includes(".")) return null;
  const [body, sig] = value.split(".");
  const expected = createHmac("sha256", cookieKey).update(body).digest("base64url");
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString());
    if (!data || data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}

function cookies(req) {
  const jar = new Map();
  for (const part of String(req.headers.cookie || "").split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    jar.set(part.slice(0, eq).trim(), part.slice(eq + 1).trim());
  }
  return jar;
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));
}

function page(title, body) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${esc(title)}</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 2rem auto; max-width: 28rem; color: #14202b; }
    label { display: block; font-weight: 650; margin-top: 0.8rem; }
    input { width: 100%; box-sizing: border-box; padding: 0.45rem; }
    button { margin-top: 1rem; padding: 0.5rem 0.8rem; }
    .error { color: #8a1f11; }
    p { line-height: 1.4; }
  </style>
</head>
<body>
  <p><strong>Local test SSO</strong> · dev mode · not Microsoft or Google</p>
  ${body}
</body>
</html>`;
}

function loginForm(uid, error) {
  return page("Sign in", `
    <h1>Sign in</h1>
    <p>Password first. A one-time code comes next.</p>
    ${error ? `<p class="error">${esc(error)}</p>` : ""}
    <form method="post" action="/interaction/${esc(uid)}/login">
      <label for="email">Email</label>
      <input id="email" name="email" type="email" autocomplete="username" required>
      <label for="password">Password</label>
      <input id="password" name="password" type="password" autocomplete="current-password" required>
      <button type="submit">Continue</button>
    </form>`);
}

function mfaForm(uid, email, error) {
  return page("Check the code", `
    <h1>Check the code</h1>
    <p>Enter the current 6-digit code for ${esc(email)}.</p>
    ${error ? `<p class="error">${esc(error)}</p>` : ""}
    <form method="post" action="/interaction/${esc(uid)}/mfa">
      <label for="code">Authentication code</label>
      <input id="code" name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" required>
      <button type="submit">Sign in</button>
    </form>`);
}

async function readForm(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 32_768) throw new Error("body too large");
    chunks.push(chunk);
  }
  return Object.fromEntries(new URLSearchParams(Buffer.concat(chunks).toString()));
}

function sendHtml(res, status, html, extraCookie) {
  res.statusCode = status;
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  if (extraCookie) {
    const prev = res.getHeader("set-cookie");
    const next = extraCookie;
    if (!prev) res.setHeader("set-cookie", next);
    else if (Array.isArray(prev)) res.setHeader("set-cookie", [...prev, next]);
    else res.setHeader("set-cookie", [prev, next]);
  }
  res.end(html);
}

const provider = new Provider(issuer, {
  clients: [
    {
      client_id: process.env.OIDC_CLIENT_ID,
      client_secret: process.env.OIDC_CLIENT_SECRET,
      redirect_uris: [`${process.env.PORTAL_ORIGIN}/api/auth/callback`],
      response_types: ["code"],
      grant_types: ["authorization_code"],
      token_endpoint_auth_method: "client_secret_basic",
    },
  ],
  cookies: { keys: [cookieKey] },
  features: { devInteractions: { enabled: false } },
  pkce: { required: () => true },
  interactions: { policy },
  ttl: {
    AccessToken: 3600,
    AuthorizationCode: 60,
    IdToken: 3600,
    Interaction: 600,
    Session: 600,
    Grant: 1200,
  },
  claims: {
    openid: ["sub", "amr"],
    email: ["email"],
    profile: ["name"],
  },
  async findAccount(_ctx, id) {
    const user = users.find((row) => row.sub === id);
    if (!user) return undefined;
    return {
      accountId: id,
      async claims() {
        return { sub: id, email: user.email, name: user.name };
      },
    };
  },
  async loadExistingGrant(ctx) {
    const existing = ctx.oidc.result?.consent?.grantId
      || ctx.oidc.session?.grantIdFor?.(ctx.oidc.client.clientId);
    if (existing) return ctx.oidc.provider.Grant.find(existing);
    if (!ctx.oidc.session?.accountId) return undefined;
    const grant = new ctx.oidc.provider.Grant({
      clientId: ctx.oidc.client.clientId,
      accountId: ctx.oidc.session.accountId,
    });
    grant.addOIDCScope("openid email profile");
    await grant.save();
    return grant;
  },
});

const oidc = provider.callback();

async function handleInteraction(req, res, url) {
  const parts = url.pathname.split("/").filter(Boolean);
  const uid = parts[1] || "";
  const action = parts[2] || "";
  if (!/^[A-Za-z0-9_-]{8,}$/.test(uid)) {
    sendHtml(res, 400, page("Sign in", "<p>This sign-in session is not valid.</p>"));
    return;
  }
  const details = await provider.interactionDetails(req, res);
  if (details.prompt.name !== "login") {
    sendHtml(res, 400, page("Sign in", `<p>Unexpected prompt: ${esc(details.prompt.name)}</p>`));
    return;
  }
  const pending = readPending(cookies(req).get("hybrid_mfa"));
  const pendingHere = pending && pending.uid === uid ? pending : null;

  if (req.method === "GET" && !action) {
    if (pendingHere) {
      const user = users.find((row) => row.sub === pendingHere.sub);
      sendHtml(res, 200, mfaForm(uid, user?.email || "that account"));
      return;
    }
    sendHtml(res, 200, loginForm(uid));
    return;
  }

  if (req.method === "POST" && action === "login") {
    const form = await readForm(req);
    const user = users.find((row) => row.email === String(form.email || "").trim().toLowerCase());
    if (!user || !passwordOk(form.password, user.password)) {
      sendHtml(res, 401, loginForm(uid, "Sign-in failed"));
      return;
    }
    const cookie = `hybrid_mfa=${signPending({ uid, sub: user.sub, exp: Date.now() + 5 * 60_000 })}; HttpOnly; SameSite=Lax; Path=/interaction; Max-Age=300`;
    sendHtml(res, 200, mfaForm(uid, user.email), cookie);
    return;
  }

  if (req.method === "POST" && action === "mfa") {
    const form = await readForm(req);
    const user = pendingHere ? users.find((row) => row.sub === pendingHere.sub) : null;
    if (!user || !verifyTotp(user.totpSecret, form.code)) {
      sendHtml(res, 401, mfaForm(uid, user?.email || "that account", "Code did not match"));
      return;
    }
    await provider.interactionFinished(req, res, {
      login: { accountId: user.sub, amr: ["pwd", "otp"] },
    });
    return;
  }

  sendHtml(res, 404, page("Sign in", "<p>Not found.</p>"));
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", issuer);
    if (url.pathname === "/health") {
      res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" });
      res.end(JSON.stringify({ ok: true, service: "oidc" }));
      return;
    }
    if (url.pathname.startsWith("/interaction/")) {
      await handleInteraction(req, res, url);
      return;
    }
    oidc(req, res);
  } catch (error) {
    console.error(JSON.stringify({ service: "oidc", msg: error.message }));
    if (!res.headersSent) {
      sendHtml(res, 400, page("Sign in", "<p>Sign-in could not continue.</p>"));
    }
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(JSON.stringify({ service: "oidc", msg: "listening", issuer }));
});
