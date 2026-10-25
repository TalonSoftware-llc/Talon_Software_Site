import { withActor, type Database } from "./db";
import { HttpError } from "./errors";
import type { Actor } from "./identity";
import { canReadPortal } from "./roles";

export type PortalView = {
  tenantId: string;
  summary: string;
};

export async function readPortal(db: Database, actor: Actor): Promise<PortalView> {
  if (!canReadPortal(actor.role)) {
    throw new HttpError(403, "portal_forbidden", "This plan does not include the company portal");
  }
  const rows = await withActor(db, actor, (tx) => tx.query<{ tenant_id: string; summary: string }>(
    `SELECT tenant_id, summary FROM tenant_portal WHERE tenant_id = $1`,
    [actor.tenantId],
  ));
  const row = rows[0];
  if (!row) throw new HttpError(404, "not_found", "Portal record not found");
  return { tenantId: row.tenant_id, summary: row.summary };
}
