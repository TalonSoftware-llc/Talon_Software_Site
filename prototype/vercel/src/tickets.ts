import { randomUUID } from "node:crypto";

import { withActor, type Database, type Sql } from "./db";
import { HttpError } from "./errors";
import type { Actor } from "./identity";
import { ticketScope } from "./roles";
import {
  isPriority,
  isTicketStatus,
  slaDueAt,
  slaState,
  type Priority,
  type SlaState,
  type TicketStatus,
} from "./sla";

export type TicketView = {
  id: string;
  tenantId: string;
  requesterId: string;
  title: string;
  body: string;
  status: TicketStatus;
  priority: Priority;
  slaDueAt: string;
  slaState: SlaState;
  createdAt: string;
  updatedAt: string;
};

type TicketRow = {
  id: string;
  tenant_id: string;
  requester_id: string;
  title: string;
  body: string;
  status: string;
  priority: string;
  sla_due_at: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
};

const visibleSql = `
  tenant_id = $1
  AND ($2 = 'tenant' OR requester_id = $3)
`;

export async function createTicket(
  db: Database,
  actor: Actor,
  input: Record<string, unknown>,
  now = new Date(),
): Promise<TicketView> {
  const title = requiredText(input.title, "title", 200);
  const body = requiredText(input.body, "body", 8000);
  if (typeof input.priority !== "string" || !isPriority(input.priority)) {
    throw new HttpError(400, "bad_priority", "Priority must be p1, p2, or p3");
  }
  const priority = input.priority;
  const due = slaDueAt(now, priority);
  const id = randomUUID();
  const rows = await withActor(db, actor, (tx) => tx.query<TicketRow>(
    `INSERT INTO tickets (
       id, tenant_id, requester_id, title, body, status, priority, sla_due_at, created_at, updated_at
     ) VALUES ($1, $2, $3, $4, $5, 'open', $6, $7, $8, $8)
     RETURNING *`,
    [id, actor.tenantId, actor.userId, title, body, priority, due.toISOString(), now.toISOString()],
  ));
  const row = rows[0];
  if (!row) throw new HttpError(500, "not_stored", "Ticket was not stored");
  return present(row, now);
}

export async function listTickets(db: Database, actor: Actor, now = new Date()): Promise<TicketView[]> {
  const rows = await withActor(db, actor, (tx) => tx.query<TicketRow>(
    `SELECT * FROM tickets WHERE ${visibleSql} ORDER BY created_at DESC`,
    [actor.tenantId, ticketScope(actor.role), actor.userId],
  ));
  return rows.map((row) => present(row, now));
}

export async function getTicket(
  db: Database,
  actor: Actor,
  id: string,
  now = new Date(),
): Promise<TicketView> {
  const rows = await withActor(db, actor, (tx) => tx.query<TicketRow>(
    `SELECT * FROM tickets WHERE id = $4 AND ${visibleSql}`,
    [actor.tenantId, ticketScope(actor.role), actor.userId, id],
  ));
  const row = rows[0];
  if (!row) throw new HttpError(404, "not_found", "Ticket not found");
  return present(row, now);
}

export async function updateTicket(
  db: Database,
  actor: Actor,
  id: string,
  input: Record<string, unknown>,
  now = new Date(),
): Promise<TicketView> {
  if (typeof input.status !== "string" || !isTicketStatus(input.status)) {
    throw new HttpError(400, "bad_status", "Status is not recognized");
  }
  const status = input.status;
  const rows = await withActor(db, actor, (tx) => tx.query<TicketRow>(
    `UPDATE tickets
     SET status = $5, updated_at = $6
     WHERE id = $4 AND ${visibleSql}
     RETURNING *`,
    [actor.tenantId, ticketScope(actor.role), actor.userId, id, status, now.toISOString()],
  ));
  const row = rows[0];
  if (!row) throw new HttpError(404, "not_found", "Ticket not found");
  return present(row, now);
}

// Used by the isolation test. No tenant filter in SQL; row level security is the only gate.
export async function unsafeSelectTicketIds(db: Database, actor: Actor, txRunner = withActor): Promise<string[]> {
  const rows = await txRunner(db, actor, (tx: Sql) => tx.query<{ id: string }>(`SELECT id FROM tickets`));
  return rows.map((row) => row.id);
}

function present(row: TicketRow, now: Date): TicketView {
  if (!isTicketStatus(row.status) || !isPriority(row.priority)) {
    throw new HttpError(500, "bad_ticket", "Stored ticket is invalid");
  }
  const due = asDate(row.sla_due_at);
  const createdAt = asDate(row.created_at);
  const updatedAt = asDate(row.updated_at);
  return {
    id: row.id,
    tenantId: row.tenant_id,
    requesterId: row.requester_id,
    title: row.title,
    body: row.body,
    status: row.status,
    priority: row.priority,
    slaDueAt: due.toISOString(),
    slaState: slaState({ status: row.status, slaDueAt: due, updatedAt, now }),
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };
}

function requiredText(value: unknown, name: string, max: number): string {
  if (typeof value !== "string") throw new HttpError(400, "bad_field", `${name} is required`);
  const text = value.trim();
  if (!text || text.length > max) throw new HttpError(400, "bad_field", `${name} is required`);
  return text;
}

function asDate(value: Date | string): Date {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new HttpError(500, "bad_time", "Stored time is invalid");
  return date;
}
