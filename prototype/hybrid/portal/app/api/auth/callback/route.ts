import { createRemoteJWKSet, jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

import { open, seal, sessionCookie } from "../../../../lib/session";

const jwks = createRemoteJWKSet(new URL("/jwks", process.env.OIDC_ISSUER || "http://127.0.0.1:4180"));

export async function GET(request: NextRequest) {
  const origin = process.env.PORTAL_ORIGIN;
  const issuer = process.env.OIDC_ISSUER;
  const clientId = process.env.OIDC_CLIENT_ID;
  const clientSecret = process.env.OIDC_CLIENT_SECRET;
  if (!origin || !issuer || !clientId || !clientSecret) {
    return new NextResponse("Auth is not configured", { status: 500 });
  }

  const url = new URL(request.url);
  if (url.searchParams.get("error")) {
    return new NextResponse("Sign-in was declined", { status: 400 });
  }
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const login = await open(request.cookies.get("hybrid_login")?.value);
  if (!code || !state || !login || login.state !== state || typeof login.verifier !== "string" || typeof login.nonce !== "string") {
    return new NextResponse("Sign-in session expired", { status: 400 });
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: `${origin}/api/auth/callback`,
    code_verifier: login.verifier,
  });
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const tokenResponse = await fetch(new URL("/token", issuer), {
    method: "POST",
    headers: {
      authorization: `Basic ${basic}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!tokenResponse.ok) {
    return new NextResponse("Sign-in failed", { status: 400 });
  }
  const tokens = await tokenResponse.json() as { id_token?: string };
  if (!tokens.id_token) return new NextResponse("Sign-in failed", { status: 400 });

  const verified = await jwtVerify(tokens.id_token, jwks, { issuer, audience: clientId });
  if (verified.payload.nonce !== login.nonce) {
    return new NextResponse("Sign-in failed", { status: 400 });
  }

  const session = await seal({ idToken: tokens.id_token }, "1h");
  const response = NextResponse.redirect(new URL("/tickets", origin));
  response.cookies.set("hybrid_session", session, { ...sessionCookie, maxAge: 3600 });
  response.cookies.set("hybrid_login", "", { ...sessionCookie, maxAge: 0 });
  return response;
}
