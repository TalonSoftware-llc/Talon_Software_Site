import { createHash } from "node:crypto";
import { NextResponse } from "next/server";

import { randomToken, seal, sessionCookie } from "../../../../lib/session";

export async function GET() {
  const issuer = process.env.OIDC_ISSUER;
  const clientId = process.env.OIDC_CLIENT_ID;
  const origin = process.env.PORTAL_ORIGIN;
  if (!issuer || !clientId || !origin) {
    return NextResponse.json({ error: "auth is not configured" }, { status: 500 });
  }

  const state = randomToken();
  const nonce = randomToken();
  const verifier = randomToken();
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const login = await seal({ state, nonce, verifier }, "10m");
  const url = new URL("/auth", issuer);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", `${origin}/api/auth/callback`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("nonce", nonce);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.redirect(url);
  response.cookies.set("hybrid_login", login, { ...sessionCookie, maxAge: 600 });
  return response;
}
