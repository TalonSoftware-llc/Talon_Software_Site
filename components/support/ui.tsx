import type { ReactNode } from "react";

export const fieldClass =
  "w-full rounded-md border border-[#d5dde6] bg-white px-3 py-2 text-sm text-ink outline-none focus:border-pine focus:ring-2 focus:ring-pine/30";

export const primaryClass =
  "inline-flex items-center justify-center rounded-md bg-pine px-3 py-2 text-sm font-semibold text-white hover:bg-[#173f38] disabled:cursor-not-allowed disabled:opacity-50";

export const quietClass =
  "inline-flex items-center justify-center rounded-md border border-[#d5dde6] bg-white px-3 py-2 text-sm font-semibold text-ink hover:border-pine/40";

export const cardClass = "rounded-xl border border-[#e1e6ec] bg-white p-5 shadow-sm";

const tones = {
  ok: "bg-[#e7f3ef] text-[#1f4d45]",
  warn: "bg-[#f8f1de] text-[#6d5420]",
  bad: "bg-[#f8e8e6] text-[#7a3030]",
  mute: "bg-[#eef2f5] text-[#3e4c5a]",
};

export function Badge({ children, tone = "mute" }: { children: ReactNode; tone?: keyof typeof tones }) {
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export function statusTone(status: string): keyof typeof tones {
  if (status === "Open" || status === "Waiting" || status === "Onboarding" || status === "Gap" || status === "Due" || status === "Degraded" || status === "Threats" || status === "Behind" || status === "Pending") return "warn";
  if (status === "Urgent" || status === "Down" || status === "Offboarding" || status === "Isolated") return "bad";
  if (status === "Active" || status === "Resolved" || status === "In progress" || status === "Operational" || status === "Met" || status === "Current" || status === "Paid" || status === "Protected" || status === "Delivered") return "ok";
  return "mute";
}

const avatarTones = ["#1f4d45", "#1b2430", "#3d5c56", "#245c6b", "#4d4538"];

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
  let hash = 0;
  for (const char of name) hash = (hash + char.charCodeAt(0)) % avatarTones.length;
  const box = size === "lg" ? "h-16 w-16 text-xl" : size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${box}`} style={{ background: avatarTones[hash] }}>
      {initials}
    </span>
  );
}

export function PageHeader({ eyebrow, title, detail, actions }: { eyebrow?: string; title: string; detail?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.14em] text-pine">{eyebrow}</p> : null}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        {detail ? <p className="mt-1 max-w-2xl text-sm text-ink/70">{detail}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-[#e1e6ec] bg-white p-4 shadow-sm ${className}`}>{children}</section>;
}

export function Stat({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-xl border border-[#e1e6ec] bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/45">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-ink">{value}</p>
      {detail ? <p className="mt-1 text-sm text-ink/60">{detail}</p> : null}
    </div>
  );
}

export function Empty({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-[#d5dde6] bg-white px-4 py-10 text-center">
      <p className="font-semibold text-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-ink/60">{detail}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className = "h-28" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-[#e4e9ee] ${className}`} />;
}
