import { getDatabase } from "@/prototype/vercel/src/db";
import { actorFromClaims } from "@/prototype/vercel/src/identity";
import { exchangeCode, oidcConfig, verifyIdToken } from "@/prototype/vercel/src/oidc-client";
import { fail, json, loginStateFromRequest, setCookie } from "@/prototype/vercel/src/request";
import { HttpError } from "@/prototype/vercel/src/errors";
import { LOGIN_COOKIE, SESSION_COOKIE, signSession } from "@/prototype/vercel/src/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const config = oidcConfig();
    if (!config) return json({ error: { code: "sso_unconfigured", message: "Dev SSO is not configured" } }, 503);
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state) throw new HttpError(400, "missing_code", "SSO callback is missing a code");
    const login = await loginStateFromRequest(request);
    if (login.state !== state) throw new HttpError(400, "state_mismatch", "SSO state did not match");
    const idToken = await exchangeCode({
      issuer: config.issuer,
      redirectUri: config.redirectUri,
      code,
      verifier: login.verifier,
    });
    const claims = await verifyIdToken(config.issuer, idToken, login.nonce);
    const actor = await actorFromClaims(await getDatabase(), claims, config.issuer);
    const session = await signSession({ sub: actor.userId, email: actor.email });
    return json(
      {
        ok: true,
        mfa: true,
        user: {
          email: actor.email,
          role: actor.role,
          tenantId: actor.tenantId,
          displayName: actor.displayName,
        },
      },
      200,
      [
        setCookie(SESSION_COOKIE, session, 60 * 60 * 8, "/api/prototype/vercel"),
        setCookie(LOGIN_COOKIE, "", 0, "/api/prototype/vercel/auth"),
      ],
    );
  } catch (error) {
    return fail(error);
  }
}
