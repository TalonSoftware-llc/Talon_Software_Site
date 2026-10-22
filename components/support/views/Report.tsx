"use client";

import { changesThisMonth } from "@/lib/support/changes";
import { getSupportRepository } from "@/lib/support/data";
import { formatDay, money } from "@/lib/support/format";
import { averageResponseHours } from "@/lib/support/stats";
import type { ServiceState } from "@/lib/support/types";
import { usePageContext } from "../page-context";
import { useDemo } from "../use-demo";
import { cardClass } from "../ui";

const repo = getSupportRepository(null);

const labels: Record<string, string> = {
  website: "Website",
  m365: "Email",
  google: "Email",
  phones: "Phone",
  procore: "Procore",
  sage: "Sage 300",
  quickbooks: "QuickBooks",
  plans: "Plan room",
  bluebeam: "Bluebeam",
  tally: "Timekeeping",
};

function tone(status: ServiceState): string {
  if (status === "Down") return "bg-[#f8e8e6] text-[#7a3030]";
  if (status === "Degraded") return "bg-[#f8f1de] text-[#6d5420]";
  return "bg-[#e7f3ef] text-[#1f4d45]";
}

function word(status: ServiceState): string {
  if (status === "Down") return "Down";
  if (status === "Degraded") return "Slow";
  return "Up";
}

export default function ReportView() {
  const demo = useDemo();
  const executive = repo.executive(demo.workspaceId, "12m");
  const tickets = demo.tickets[demo.workspaceId] ?? [];
  const open = tickets.filter((ticket) => ticket.status !== "Resolved").length;
  const hours = averageResponseHours(tickets);
  const points = executive.series;
  const latest = points[points.length - 1];
  const prior = points[points.length - 2];
  const delta = (latest?.spend ?? 0) - (prior?.spend ?? 0);
  const weeks = repo.executive(demo.workspaceId, "30d").series;
  const maxOpened = Math.max(...weeks.map((point) => point.opened), 1);
  const renewals = [...executive.renewals].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);
  const recommendations = [
    ...executive.risks.slice(0, 2).map((risk) => risk.title),
    renewals[0] ? `${renewals[0].vendor} renews ${formatDay(renewals[0].date)}` : "",
  ].filter(Boolean).slice(0, 3);
  usePageContext({ section: "report", title: "Report", hints: ["What should we cover?"] });
  if (demo.role !== "leadership" || demo.tier !== "pro") return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Report</h1>
        <p className="text-sm font-semibold text-ink/60">October</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className={cardClass}>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Systems</h2>
          <ul className="mt-3 space-y-2">
            {executive.services.filter((service) => labels[service.id]).map((service) => (
              <li key={service.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold">{labels[service.id]}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tone(service.id === "procore" && demo.serviceUp ? "Operational" : service.status)}`}>
                  {word(service.id === "procore" && demo.serviceUp ? "Operational" : service.status)}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className={cardClass}>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Requests</h2>
          <div className="mt-3 flex items-end justify-between gap-4">
            <p className="text-3xl font-semibold tabular-nums">{open}</p>
            <p className="text-sm text-ink/60">{hours === null ? "No closed requests" : `${hours}h average`}</p>
          </div>
          <div className="mt-4 flex items-end gap-2">
            {weeks.map((point) => (
              <div key={point.label} className="min-w-0 flex-1">
                <div className="flex h-14 items-end">
                  <div className="w-full rounded-sm bg-pine/80" style={{ height: `${Math.max(8, (point.opened / maxOpened) * 100)}%` }} />
                </div>
                <p className="mt-1 truncate text-center text-[10px] text-ink/45">{point.label}</p>
              </div>
            ))}
          </div>
        </section>
        <section className={cardClass}>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Spending</h2>
          <p className="mt-3 text-3xl font-semibold tabular-nums">{money(latest?.spend ?? executive.monthSpend)}</p>
          <p className={`mt-1 text-sm font-semibold tabular-nums ${delta > 0 ? "text-[#7a3030]" : "text-[#1f4d45]"}`}>
            {delta > 0 ? "+" : "−"}{money(Math.abs(delta))} vs last month
          </p>
        </section>
        <section className={cardClass}>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Renewals</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {renewals.map((renewal) => (
              <li key={`${renewal.vendor}-${renewal.date}`} className="flex items-center justify-between gap-3">
                <span className="font-semibold">{renewal.vendor}</span>
                <span className="tabular-nums text-ink/60">{formatDay(renewal.date)} · {money(renewal.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <section className={cardClass}>
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Changes this month</h2>
        <ul className="mt-3 space-y-2">
          {changesThisMonth(demo.workspaceId).map((change) => (
            <li key={change.id} className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
              <span className="font-semibold">{change.title}</span>
              <span className="text-ink/55">{formatDay(change.at)} · {change.by} · {change.category}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className={cardClass}>
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Recommendations</h2>
        <ul className="mt-3 space-y-2 text-sm font-semibold">
          {recommendations.map((item) => <li key={item}>{item}</li>)}
        </ul>
      </section>
    </div>
  );
}
