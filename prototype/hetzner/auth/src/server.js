import { generateKeyPairSync, timingSafeEqual } from "node:crypto";

import { interactionPolicy, Provider } from "oidc-provider";

import {
  apiAudience,
  clientId,
  mfaCode,
  redirectUri,
  userByEmail,
  userBySub,
} from "../fixtures.js";

const issuer = process.env.ISSUER || "http://localhost:5556";
const port = Number(process.env.PORT || 5556);
const resource = "http://localhost:8787";

const passwordOk = new Map();

function log(event, fields = {}) {
  console.log(JSON.stringify({ t: new Date().toISOString(), service: "auth", event, ...fields }));
}

function same(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function devKey() {
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const jwk = privateKey.export({ format: "jwk" });
  jwk.use = "sig";
  jwk.alg = "RS256";
  jwk.kid = "prototype-dev";
  return jwk;
}

async function readBody(ctx) {
  const chunks = [];
  let size = 0;
  for await (const chunk of ctx.req) {
    size += chunk.length;
    if (size > 16_000) {
      ctx.throw(413, "body_too_large");
    }
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  const type = ctx.get("content-type");
  if (type.includes("application/json")) return JSON.parse(raw);
  return Object.fromEntries(new URLSearchParams(raw));
}

function wantsJson(ctx) {
  const type = ctx.get("content-type");
  if (type.includes("application/json")) return true;
  return (ctx.get("accept") || "").includes("application/json");
}

const policy = interactionPolicy.base();
policy.remove("consent");

const provider = new Provider(issuer, {
  clients: [
    {
      client_id: clientId,
      redirect_uris: [redirectUri],
      response_types: ["code"],
      grant_types: ["authorization_code"],
      token_endpoint_auth_method: "none",
      application_type: "web",
    },
  ],
  jwks: { keys: [devKey()] },
  cookies: {
    keys: ["dev-only-cookie-signing-key-not-a-secret-01"],
  },
  interactions: {
    policy,
    url(_ctx, interaction) {
      return `/interaction/${interaction.uid}`;
    },
  },
  features: {
    devInteractions: { enabled: false },
    resourceIndicators: {
      enabled: true,
      async getResourceServerInfo(_ctx, indicator) {
        if (indicator !== resource) return undefined;
        return {
          scope: "openid email profile",
          audience: apiAudience,
          accessTokenFormat: "jwt",
          accessTokenTTL: 60 * 60,
        };
      },
    },
  },
  ttl: {
    AccessToken: 60 * 60,
    AuthorizationCode: 60,
    IdToken: 60 * 60,
    Interaction: 10 * 60,
    Session: 10 * 60,
    Grant: 60 * 60,
  },
  async findAccount(_ctx, id) {
    const user = userBySub(id);
    if (!user) return undefined;
    return {
      accountId: id,
      async claims() {
        return {
          sub: id,
          email: user.email,
          email_verified: true,
          name: user.name,
        };
      },
    };
  },
  async loadExistingGrant(ctx) {
    const session = ctx.oidc.session;
    if (!session?.accountId) return undefined;
    const existingId = session.grantIdFor(ctx.oidc.client.clientId);
    if (existingId) {
      const existing = await ctx.oidc.provider.Grant.find(existingId);
      if (existing) return existing;
    }
    const grant = new ctx.oidc.provider.Grant({
      accountId: session.accountId,
      clientId: ctx.oidc.client.clientId,
    });
    grant.addOIDCScope("openid email profile");
    grant.addResourceScope(resource, "openid email profile");
    await grant.save();
    return grant;
  },
  async extraTokenClaims(ctx, token) {
    const code = ctx.oidc.entities?.AuthorizationCode;
    const amr = code?.amr || ctx.oidc.session?.amr || [];
    const user = userBySub(token.accountId);
    return {
      amr,
      email: user?.email,
    };
  },
});

provider.proxy = false;

provider.use(async (ctx, next) => {
  if (ctx.path === "/health" && ctx.method === "GET") {
    ctx.body = { ok: true, service: "auth" };
    return;
  }

  const loginMatch = ctx.path.match(/^\/interaction\/([^/]+)\/login$/);
  const mfaMatch = ctx.path.match(/^\/interaction\/([^/]+)\/mfa$/);
  const pageMatch = ctx.path.match(/^\/interaction\/([^/]+)$/);

  if (ctx.method === "GET" && pageMatch) {
    const details = await provider.interactionDetails(ctx.req, ctx.res);
    if (details.uid !== pageMatch[1]) ctx.throw(400, "interaction_mismatch");
    const pending = passwordOk.get(details.uid);
    const step = pending ? "mfa" : "login";
    if (wantsJson(ctx)) {
      ctx.body = { uid: details.uid, step };
      return;
    }
    ctx.type = "html";
    ctx.body = pending ? mfaPage(details.uid) : loginPage(details.uid);
    return;
  }

  if (ctx.method === "POST" && loginMatch) {
    const details = await provider.interactionDetails(ctx.req, ctx.res);
    if (details.uid !== loginMatch[1]) ctx.throw(400, "interaction_mismatch");
    const body = await readBody(ctx);
    const user = userByEmail(String(body.email || ""));
    if (!user || !same(user.password, body.password || "")) {
      log("login_failed");
      ctx.status = 401;
      ctx.body = { error: "invalid_login" };
      return;
    }
    passwordOk.set(details.uid, { sub: user.sub, exp: Date.now() + 5 * 60 * 1000 });
    log("password_ok", { sub: user.sub });
    if (wantsJson(ctx)) {
      ctx.body = { next: "mfa" };
      return;
    }
    ctx.redirect(`/interaction/${details.uid}`);
    return;
  }

  if (ctx.method === "POST" && mfaMatch) {
    const details = await provider.interactionDetails(ctx.req, ctx.res);
    if (details.uid !== mfaMatch[1]) ctx.throw(400, "interaction_mismatch");
    const pending = passwordOk.get(details.uid);
    const body = await readBody(ctx);
    if (!pending || pending.exp < Date.now()) {
      ctx.status = 401;
      ctx.body = { error: "login_required" };
      return;
    }
    if (!same(mfaCode, body.code || "")) {
      log("mfa_failed", { sub: pending.sub });
      ctx.status = 401;
      ctx.body = { error: "invalid_mfa" };
      return;
    }
    passwordOk.delete(details.uid);
    log("mfa_ok", { sub: pending.sub });
    await provider.interactionFinished(ctx.req, ctx.res, {
      login: {
        accountId: pending.sub,
        amr: ["pwd", "otp"],
        acr: "urn:talon:dev:mfa",
      },
    });
    return;
  }

  await next();
});

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  }[ch]));
}

function loginPage(uid) {
  const action = escapeHtml(`/interaction/${uid}/login`);
  return `<!doctype html>
<meta charset="utf-8">
<title>Talon dev sign-in</title>
<h1>Dev sign-in</h1>
<p>Local stand-in. Password, then the dev MFA code.</p>
<form method="post" action="${action}">
  <label>Email <input name="email" autocomplete="username"></label>
  <label>Password <input name="password" type="password" autocomplete="current-password"></label>
  <button type="submit">Continue</button>
</form>`;
}

function mfaPage(uid) {
  const action = escapeHtml(`/interaction/${uid}/mfa`);
  return `<!doctype html>
<meta charset="utf-8">
<title>Talon dev MFA</title>
<h1>Dev MFA code</h1>
<form method="post" action="${action}">
  <label>Code <input name="code" inputmode="numeric" autocomplete="one-time-code"></label>
  <button type="submit">Sign in</button>
</form>`;
}

provider.listen(port, "0.0.0.0", () => {
  log("listening", { issuer, port });
});
