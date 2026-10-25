import type { Database } from "./db";
import { HttpError } from "./errors";
import { isRole, type Role } from "./roles";

export type Actor = {
  userId: string;
  tenantId: string;
  email: string;
  displayName: string;
  role: Role;
  idp: "dev" | "entra" | "google";
  oidcIssuer: string | null;
};

type UserRow = {
  id: string;
  tenant_id: string;
  email: string;
  display_name: string;
  role: string;
  idp: string;
  oidc_issuer: string | null;
};

export async function findUsersBySub(db: Database, sub: string): Promise<Actor[]> {
  const rows = await db.query<UserRow>(
    `SELECT u.id, u.tenant_id, u.email, u.display_name, u.role, t.idp, t.oidc_issuer
     FROM users u
     JOIN tenants t ON t.id = u.tenant_id
     WHERE u.oidc_sub = $1`,
    [sub],
  );
  return rows.map(toActor);
}

export async function actorFromClaims(
  db: Database,
  claims: { sub?: unknown; email?: unknown; iss?: unknown; amr?: unknown },
  expectedIssuer: string,
): Promise<Actor> {
  assertMfa(claims);
  if (typeof claims.sub !== "string" || typeof claims.email !== "string" || claims.iss !== expectedIssuer) {
    throw new HttpError(401, "invalid_identity", "SSO token is missing a usable identity");
  }
  const matches = await findUsersBySub(db, claims.sub);
  const actor = matches.find((candidate) => issuerMatches(candidate, claims.iss as string, expectedIssuer));
  if (!actor || matches.filter((candidate) => issuerMatches(candidate, claims.iss as string, expectedIssuer)).length !== 1) {
    throw new HttpError(401, "unknown_account", "No single portal user matches this SSO account");
  }
  if (actor.email !== claims.email) {
    throw new HttpError(401, "email_mismatch", "SSO email does not match the portal user");
  }
  return actor;
}

export function assertMfa(claims: { amr?: unknown }): void {
  const amr = Array.isArray(claims.amr) ? claims.amr.map(String) : [];
  if (!amr.includes("otp") && !amr.includes("mfa")) {
    throw new HttpError(401, "mfa_required", "SSO sign-in did not satisfy MFA");
  }
}

function issuerMatches(actor: Actor, tokenIssuer: string, expectedIssuer: string): boolean {
  if (actor.idp === "dev") return tokenIssuer === expectedIssuer;
  return actor.oidcIssuer === tokenIssuer;
}

function toActor(row: UserRow): Actor {
  if (!isRole(row.role)) throw new HttpError(500, "bad_role", "Stored role is not recognized");
  if (row.idp !== "dev" && row.idp !== "entra" && row.idp !== "google") {
    throw new HttpError(500, "bad_idp", "Stored identity provider is not recognized");
  }
  return {
    userId: row.id,
    tenantId: row.tenant_id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    idp: row.idp,
    oidcIssuer: row.oidc_issuer,
  };
}
