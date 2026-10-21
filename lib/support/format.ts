export const DEMO_NOW = new Date("2026-10-21T18:30:00.000Z");

const moneyFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const numberFormat = new Intl.NumberFormat("en-US");

export function money(value: number): string {
  return moneyFormat.format(Math.round(value));
}

export function num(value: number): string {
  return numberFormat.format(Math.round(value));
}

export function demoIso(offsetMs: number): string {
  return new Date(DEMO_NOW.getTime() + offsetMs).toISOString();
}

export function formatDay(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  }).format(new Date(iso));
}

export function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  }).format(new Date(iso));
}

export function sla(due: string, now = DEMO_NOW): { late: boolean; label: string } {
  const ms = new Date(due).getTime() - now.getTime();
  const hours = Math.max(1, Math.round(Math.abs(ms) / 3_600_000));
  const text = hours < 48 ? `${hours}h` : `${Math.round(hours / 24)}d`;
  return ms < 0 ? { late: true, label: `${text} over` } : { late: false, label: `${text} left` };
}

export function monthAdd(isoDate: string, years: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const next = new Date(Date.UTC(year + years, month - 1, day));
  return next.toISOString().slice(0, 10);
}
