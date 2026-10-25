import { createHash } from "node:crypto";

import { createRemoteJWKSet, jwtVerify } from "jose";

import { resolveBotToken, resolveUser } from "./db.js";

const issuer = process.env.OIDC_ISSUER;
const audience = process.env.OIDC_AUDIENCE || "talon-api";
const jwks = createRemoteJWKSet(new URL(process.env.OIDC_JWKS_URL));

export function httpError(status, error) {
  const err = new Error(error);
  err.status = status;
  err.code = error;
  return err;
}

function bearer(req) {
  const header = req.headers.authorization || "";
  const match = /^Bearer\s+(\S+)$/.exec(header);
  return match ? match[1] : null;
}

async function userFromJwt(token) {
  let payload;
  try {
    ({ payload } = await jwtVerify(token, jwks, { issuer, audience }));
  } catch {
    throw httpError(401, "invalid_token");
  }
  const amr = Array.isArray(payload.amr) ? payload.amr : [];
  if (!amr.includes("otp")) throw httpError(401, "mfa_required");
  const user = await resolveUser(String(payload.sub || ""));
  if (!user) throw httpError(403, "user_not_provisioned");
  return {
    kind: "user",
    userId: user.id,
    tenantId: user.tenant_id,
    tenantSlug: user.tenant_slug,
    email: user.email,
    role: user.role,
  };
}

async function botFromToken(token) {
  const hash = createHash("sha256").update(token).digest("hex");
  const row = await resolveBotToken(hash);
  if (!row) throw httpError(401, "invalid_token");
  if (row.revoked_at) throw httpError(401, "token_revoked");
  return {
    kind: "bot",
    tokenId: row.id,
    userId: row.created_by,
    tenantId: row.tenant_id,
    role: "bot",
    scopes: row.scopes,
  };
}

export async function authenticate(req) {
  const token = bearer(req);
  if (!token) throw httpError(401, "unauthorized");
  if (token.startsWith("bot_")) return botFromToken(token);
  return userFromJwt(token);
}
