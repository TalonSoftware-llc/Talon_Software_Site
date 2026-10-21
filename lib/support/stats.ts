import { DEMO_NOW } from "./format";
import type { Person, Ticket } from "./types";

export function personCost(person: Person): { licenses: number; devices: number; total: number } {
  const licenses = person.licenses.reduce((sum, item) => sum + item.monthly, 0);
  const devices = person.devices.reduce((sum, item) => sum + Math.round(item.price / 48), 0);
  return { licenses, devices, total: licenses + devices };
}

export function personFlags(person: Person): string[] {
  const flags: string[] = [];
  if (!person.mfa && person.status === "Active") flags.push("No MFA");
  if (person.status === "Offboarding" && person.licenses.length > 0) flags.push("Still licensed");
  if (person.devices.some((device) => device.refreshDue < "2026-10-21")) flags.push("Refresh due");
  return flags;
}

export type PersonTicketStats = {
  opened: number;
  openNow: number;
  avgHours: number | null;
  categories: { name: string; count: number }[];
  trend: { label: string; count: number }[];
};

const trendLabels = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"];

export function ticketStats(personId: string, tickets: Ticket[]): PersonTicketStats {
  const mine = tickets.filter((ticket) => ticket.requesterId === personId);
  const openNow = mine.filter((ticket) => ticket.status !== "Resolved");
  const resolved = mine.filter((ticket) => ticket.status === "Resolved");
  const hours = resolved.map(
    (ticket) => (new Date(ticket.updated).getTime() - new Date(ticket.opened).getTime()) / 3_600_000,
  );
  const counts = new Map<string, number>();
  for (const ticket of mine) counts.set(ticket.category, (counts.get(ticket.category) ?? 0) + 1);
  const trend = trendLabels.map((label) => ({
    label,
    count: mine.filter((ticket) => monthLabel(ticket.opened) === label).length,
  }));
  return {
    opened: mine.length,
    openNow: openNow.length,
    avgHours: hours.length ? Math.round(hours.reduce((sum, value) => sum + value, 0) / hours.length) : null,
    categories: [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count),
    trend,
  };
}

function monthLabel(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "America/New_York" }).format(new Date(iso));
}

export function averageResponseHours(tickets: Ticket[]): number | null {
  const resolved = tickets.filter((ticket) => ticket.status === "Resolved");
  if (!resolved.length) return null;
  const hours = resolved.map((ticket) => (new Date(ticket.updated).getTime() - new Date(ticket.opened).getTime()) / 3_600_000);
  return Math.round(hours.reduce((sum, value) => sum + value, 0) / hours.length);
}

export function slaRate(tickets: Ticket[]): number {
  const closed = tickets.filter((ticket) => ticket.status === "Resolved");
  if (!closed.length) return 100;
  const met = closed.filter((ticket) => new Date(ticket.updated).getTime() <= new Date(ticket.resolveBy).getTime());
  return Math.round((met.length / closed.length) * 100);
}

export function ageLabel(startDate: string): string {
  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  const years = (DEMO_NOW.getTime() - start) / (365.25 * 24 * 3_600_000);
  if (years < 1) return "Under a year";
  const whole = Math.floor(years);
  return whole === 1 ? "1 year" : `${whole} years`;
}
