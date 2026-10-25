export type Priority = "p1" | "p2" | "p3";
export type TicketStatus = "open" | "in_progress" | "waiting" | "resolved";
export type SlaState = "within" | "breached" | "met";

// Sample policy for the proof. A real contract would replace these numbers.
export const SLA_MINUTES: Record<Priority, number> = {
  p1: 60,
  p2: 240,
  p3: 1440,
};

export function isPriority(value: string): value is Priority {
  return value === "p1" || value === "p2" || value === "p3";
}

export function isTicketStatus(value: string): value is TicketStatus {
  return value === "open" || value === "in_progress" || value === "waiting" || value === "resolved";
}

export function slaDueAt(createdAt: Date, priority: Priority): Date {
  return new Date(createdAt.getTime() + SLA_MINUTES[priority] * 60_000);
}

// Stored due time is the timer. State is computed when the ticket is read.
export function slaState(input: {
  status: TicketStatus;
  slaDueAt: Date;
  updatedAt: Date;
  now: Date;
}): SlaState {
  if (input.status === "resolved") {
    return input.updatedAt.getTime() <= input.slaDueAt.getTime() ? "met" : "breached";
  }
  return input.now.getTime() <= input.slaDueAt.getTime() ? "within" : "breached";
}
