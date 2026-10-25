import { createHash, randomBytes } from "node:crypto";

import { createRemoteJWKSet, jwtVerify } from "jose";

import { HttpError } from "./errors";
import { localDev } from "./session";

export const OIDC_CLIENT_ID = "talon-prototype";

const jwksByIssuer = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

export type OidcConfig = {
  issuer: string;
  origin: string;
  redirectUri: string;
};

export function oidcConfig(): OidcConfig | null {
  if (process.env.VERCEL_ENV === "production") return null;
  const issuer = process.env.PROTOTYPE_OIDC_ISSUER;
  const origin = process.env.PROTOTYPE_APP_ORIGIN;
  if (!issuer || !origin) {
    if (!localDev()) return null;
    const devIssuer = issuer || "http://127.0.0.1:3098";
    const devOrigin = origin || "http://127.0.0.1:3210";
    assertIssuer(devIssuer);
    return { issuer: devIssuer, origin: devOrigin, redirectUri: `${devOrigin}/api/prototype/vercel/auth/callback` };
  }
  assertIssuer(issuer);
  return { issuer, origin, redirectUri: `${origin}/api/prototype/vercel/auth/callback` };
}

export function assertIssuer(issuer: string): void {
  let url: URL;
  try {
    url = new URL(issuer);
  } catch {
    throw new HttpError(500, "bad_issuer", "OIDC issuer is not a URL");
  }
  const local = url.protocol === "http:" && (url.hostname === "127.0.0.1" || url.hostname === "localhost");
  if (local) {
    if (!localDev()) throw new HttpError(500, "dev_issuer_blocked", "Local SSO is only available in prototype dev mode");
    return;
  }
  if (url.protocol !== "https:") throw new HttpError(500, "bad_issuer", "OIDC issuer must use HTTPS");
}

export function createPkce(): { verifier: string; challenge: string; state: string; nonce: string } {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return {
    verifier,
    challenge,
    state: randomBytes(16).toString("base64url"),
    nonce: randomBytes(16).toString("base64url"),
  };
}

export function authorizeUrl(config: OidcConfig, pkce: { challenge: string; state: string; nonce: string }): string {
  const url = new URL("/auth", config.issuer);
  url.searchParams.set("client_id", OIDC_CLIENT_ID);
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", pkce.state);
  url.searchParams.set("nonce", pkce.nonce);
  url.searchParams.set("code_challenge", pkce.challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("prompt", "login");
  return url.href;
}

export async function exchangeCode(input: {
  issuer: string;
  redirectUri: string;
  code: string;
  verifier: string;
}): Promise<string> {
  const response = await fetch(new URL("/token", input.issuer), {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: input.code,
      redirect_uri: input.redirectUri,
      client_id: OIDC_CLIENT_ID,
      code_verifier: input.verifier,
    }),
  });
  if (!response.ok) throw new HttpError(401, "token_exchange_failed", "SSO token exchange failed");
  const body = (await response.json()) as { id_token?: unknown };
  if (typeof body.id_token !== "string") {
    throw new HttpError(401, "missing_id_token", "SSO response did not include an ID token");
  }
  return body.id_token;
}

export async function verifyIdToken(issuer: string, idToken: string, nonce: string): Promise<{
  sub: string;
  email: string;
  iss: string;
  amr?: unknown;
}> {
  const jwks = jwksByIssuer.get(issuer) ?? createRemoteJWKSet(new URL("/jwks", issuer));
  jwksByIssuer.set(issuer, jwks);
  try {
    const { payload } = await jwtVerify(idToken, jwks, {
      issuer,
      audience: OIDC_CLIENT_ID,
    });
    const claims = payload as typeof payload & { email?: unknown; nonce?: unknown; amr?: unknown };
    if (claims.nonce !== nonce || typeof claims.sub !== "string" || typeof claims.email !== "string") {
      throw new Error("claims");
    }
    return { sub: claims.sub, email: claims.email, iss: issuer, amr: claims.amr };
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(401, "invalid_id_token", "SSO ID token was rejected");
  }
}
