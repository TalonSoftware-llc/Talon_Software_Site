import "./src/oidc-module";

import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import Provider, { interactionPolicy } from "oidc-provider";

import { DEV_PASSWORD, DEV_TOTP_SECRET } from "./src/dev-credentials";
import { fixtureByEmail, fixtureBySub } from "./src/fixtures";
import { OIDC_CLIENT_ID } from "./src/oidc-client";
import { base32Decode, fixedEqual, totpMatches } from "./src/totp";

const totpKey = base32Decode(DEV_TOTP_SECRET);

export type DevProvider = {
  issuer: string;
  port: number;
  close: () => Promise<void>;
};

export async function startDevProvider(options: {
  redirectUri: string;
  port?: number;
}): Promise<DevProvider> {
  const policy = interactionPolicy.base();
  policy.remove("consent");
  let provider!: Provider;
  const server = createServer((req, res) => {
    handle(provider, req, res).catch((error: unknown) => {
      if (res.headersSent) return;
      res.statusCode = 500;
      res.setHeader("content-type", "text/plain; charset=utf-8");
      res.end(error instanceof Error ? error.message : "dev SSO error");
    });
  });
  await new Promise<void>((resolve) => {
    server.listen(options.port ?? 0, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : options.port ?? 0;
  const issuer = `http://127.0.0.1:${port}`;
  provider = new Provider(issuer, {
    clients: [
      {
        client_id: OIDC_CLIENT_ID,
        redirect_uris: [options.redirectUri],
        response_types: ["code"],
        grant_types: ["authorization_code"],
        token_endpoint_auth_method: "none",
      },
    ],
    pkce: { required: () => true },
    // Authorization-code ID tokens otherwise keep only the openid scope.
    // Entra and Google put email and amr on the ID token, so the dev provider does too.
    conformIdTokenClaims: false,
    features: { devInteractions: { enabled: false } },
    cookies: { keys: ["dev-only-oidc-cookie-key-not-for-production"] },
    ttl: { Interaction: 600, Session: 600 },
    interactions: {
      policy,
      url(_ctx: unknown, interaction: { uid: string }) {
        return `/interaction/${interaction.uid}`;
      },
    },
    claims: {
      openid: ["sub", "amr"],
      email: ["email", "email_verified"],
      profile: ["name"],
    },
    findAccount(_ctx: unknown, id: string) {
      const user = fixtureBySub(id);
      if (!user) return undefined;
      return {
        accountId: id,
        async claims() {
          return {
            sub: id,
            email: user.email,
            email_verified: true,
            name: user.displayName,
          };
        },
      };
    },
    async loadExistingGrant(ctx: {
      oidc: {
        result?: { login?: { accountId?: string } };
        session?: { accountId?: string; grantIdFor: (clientId: string) => string | undefined };
        client?: { clientId: string };
        provider: { Grant: new (fields: { accountId: string; clientId: string }) => { addOIDCScope: (scope: string) => void; save: () => Promise<string> } };
      };
    }) {
      const accountId = ctx.oidc.session?.accountId ?? ctx.oidc.result?.login?.accountId;
      const clientId = ctx.oidc.client?.clientId;
      if (!accountId || !clientId) return undefined;
      const grant = new ctx.oidc.provider.Grant({ accountId, clientId });
      grant.addOIDCScope("openid email profile");
      await grant.save();
      return grant;
    },
  });
  return {
    issuer,
    port,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    }),
  };
}

async function handle(provider: Provider, req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  const loginMatch = url.pathname.match(/^\/interaction\/([^/]+)\/login$/);
  const pageMatch = url.pathname.match(/^\/interaction\/([^/]+)$/);
  if (req.method === "GET" && pageMatch) {
    await provider.interactionDetails(req, res);
    sendForm(res, pageMatch[1]!, 200, "");
    return;
  }
  if (req.method === "POST" && loginMatch) {
    const details = await provider.interactionDetails(req, res);
    if (details.uid !== loginMatch[1] || details.prompt.name !== "login") {
      res.statusCode = 400;
      res.end("Unexpected SSO prompt");
      return;
    }
    const form = new URLSearchParams(await readBody(req));
    const user = fixtureByEmail(String(form.get("email") ?? "").trim().toLowerCase());
    const passwordOk = fixedEqual(String(form.get("password") ?? ""), DEV_PASSWORD);
    const otpOk = totpMatches(totpKey, String(form.get("otp") ?? ""));
    if (!user || !passwordOk || !otpOk) {
      sendForm(res, loginMatch[1]!, 401, "Invalid email, password, or authenticator code");
      return;
    }
    await provider.interactionFinished(req, res, {
      login: { accountId: user.sub, amr: ["pwd", "otp"], remember: false },
    }, { mergeWithLastSubmission: false });
    return;
  }
  provider.callback()(req, res);
}

function sendForm(res: ServerResponse, uid: string, status: number, error: string): void {
  const message = error ? `<p>${escapeHtml(error)}</p>` : "";
  res.statusCode = status;
  res.setHeader("content-type", "text/html; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Dev SSO</title></head>
<body>
<h1>Dev SSO</h1>
<p>Local test provider. Password and authenticator code are both required.</p>
${message}
<form method="post" action="/interaction/${escapeHtml(uid)}/login">
<label>Email <input name="email" autocomplete="username"></label>
<label>Password <input name="password" type="password" autocomplete="current-password"></label>
<label>Authenticator code <input name="otp" inputmode="numeric" autocomplete="one-time-code"></label>
<button type="submit">Sign in</button>
</form>
</body></html>`);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}

const invokedDirectly = process.argv[1]?.includes("oidc-dev-server");
if (invokedDirectly) {
  if (process.env.PROTOTYPE_DEV !== "1") {
    console.error("Refusing to start the dev SSO provider without PROTOTYPE_DEV=1");
    process.exit(1);
  }
  const origin = process.env.PROTOTYPE_APP_ORIGIN ?? "http://127.0.0.1:3210";
  const port = Number(process.env.PROTOTYPE_OIDC_PORT ?? 3098);
  startDevProvider({
    port,
    redirectUri: `${origin}/api/prototype/vercel/auth/callback`,
  }).then((started) => {
    console.log(`dev SSO listening on ${started.issuer}`);
  }).catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
