import { NextResponse } from "next/server";

import { authorizeUrl, createPkce, oidcConfig } from "@/prototype/vercel/src/oidc-client";
import { fail, json, setCookie } from "@/prototype/vercel/src/request";
import { LOGIN_COOKIE, signLogin } from "@/prototype/vercel/src/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const config = oidcConfig();
    if (!config) return json({ error: { code: "sso_unconfigured", message: "Dev SSO is not configured" } }, 503);
    const pkce = createPkce();
    const cookie = setCookie(
      LOGIN_COOKIE,
      await signLogin({ state: pkce.state, nonce: pkce.nonce, verifier: pkce.verifier }),
      600,
      "/api/prototype/vercel/auth",
    );
    const response = NextResponse.redirect(authorizeUrl(config, pkce), 302);
    response.headers.set("cache-control", "no-store");
    response.headers.set("x-robots-tag", "noindex");
    response.headers.append("set-cookie", cookie);
    return response;
  } catch (error) {
    return fail(error);
  }
}
