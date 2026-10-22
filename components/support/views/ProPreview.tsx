"use client";

import { getSupportRepository } from "@/lib/support/data";
import { categoryLabel } from "@/lib/support/format";
import { averageResponseHours } from "@/lib/support/stats";
import type { ServiceState } from "@/lib/support/types";
import { SpendPie, spendPalette } from "../charts";
import { useFrame } from "../frame";
import { usePageContext } from "../page-context";
import { useDemo } from "../use-demo";
import { primaryClass } from "../ui";

const repo = getSupportRepository(null);
const adds = ["People", "Changes", "Report", "Ask"];
const systemIds = ["m365", "google", "phones", "procore", "sage", "quickbooks", "plans", "bluebeam", "tally"];
const systemLabels: Record<string, string> = {
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

function word(status: ServiceState): "Up" | "Slow" | "Down" {
  if (status === "Down") return "Down";
  if (status === "Degraded") return "Slow";
  return "Up";
}

function pillClass(state: "Up" | "Slow" | "Down"): string {
  if (state === "Down") return "bg-[#f8e8e6] text-[#7a3030]";
  if (state === "Slow") return "bg-[#f8f1de] text-[#6d5420]";
  return "bg-[#e7f3ef] text-[#1f4d45]";
}

function share(amount: number, total: number): string {
  if (!total) return "0%";
  return `${Math.round((amount / total) * 100)}%`;
}

function Bars({ points }: { points: { label: string; value: number }[] }) {
  const max = Math.max(...points.map((point) => point.value), 1);
  return (
    <div className="mt-2 flex h-8 items-end gap-1">
      {points.map((point) => (
        <div key={point.label} className="min-w-0 flex-1 rounded-sm bg-pine/80" style={{ height: `${Math.max(12, (point.value / max) * 100)}%` }} />
      ))}
    </div>
  );
}

export default function ProPreview() {
  const demo = useDemo();
  const { contactHref } = useFrame();
  const month = repo.executive(demo.workspaceId, "30d");
  const year = repo.executive(demo.workspaceId, "12m");
  const services = month.services;
  const website = services.find((service) => service.id === "website");
  const systems = services.filter((service) => systemIds.includes(service.id));
  const locations = repo.locations(demo.workspaceId);
  const tickets = demo.tickets[demo.workspaceId] ?? [];
  const open = tickets.filter((ticket) => ticket.status !== "Resolved").length;
  const hours = averageResponseHours(tickets);
  const slices = year.breakdown.map((item) => ({ name: categoryLabel(item.name), amount: item.amount }));
  const total = slices.reduce((sum, item) => sum + item.amount, 0);
  usePageContext({ section: "pro", title: "Get Pro", hints: [] });
  if (demo.tier !== "essentials") return null;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Get Pro</h1>
      <section className="rounded-xl border border-[#e1e6ec] bg-[#f3f5f7] p-3">
        <div className="mb-2 flex justify-end">
          <span className="rounded-full bg-[#f4ecd8] px-2 py-0.5 text-xs font-semibold text-[#5c4816]">Preview</span>
        </div>
        <div className="pointer-events-none grid grid-cols-2 items-start gap-2" aria-hidden="true">
          <article className="rounded-lg border border-[#e1e6ec] bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/45">Website</h2>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${pillClass(word(website?.status ?? "Operational"))}`}>{word(website?.status ?? "Operational")}</span>
            </div>
            <Bars points={month.series.map((point) => ({ label: point.label, value: point.visitors }))} />
          </article>
          <article className="rounded-lg border border-[#e1e6ec] bg-white p-3">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/45">Network</h2>
            <ul className="mt-1">
              {locations.map((location) => (
                <li key={location.id} className="flex items-center justify-between gap-2 py-0.5 text-xs">
                  <span className="truncate">{location.name}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${pillClass("Up")}`}>Up</span>
                </li>
              ))}
            </ul>
          </article>
          <article className="rounded-lg border border-[#e1e6ec] bg-white p-3">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/45">Systems</h2>
            <ul className="mt-1">
              {systems.map((system) => (
                <li key={system.id} className="flex items-center justify-between gap-2 py-0.5 text-xs">
                  <span className="truncate">{systemLabels[system.id] ?? system.name}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${pillClass(word(system.status))}`}>{word(system.status)}</span>
                </li>
              ))}
            </ul>
          </article>
          <article className="rounded-lg border border-[#e1e6ec] bg-white p-3">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/45">Support</h2>
            <div className="mt-2 flex items-end justify-between gap-2">
              <p className="text-xl font-semibold tabular-nums">{open}</p>
              <p className="text-xs text-ink/55">{hours === null ? "—" : `${hours}h`}</p>
            </div>
            <Bars points={month.series.map((point) => ({ label: point.label, value: point.opened }))} />
          </article>
        </div>
        <div className="pointer-events-none mt-2 grid items-center gap-2 rounded-lg border border-[#e1e6ec] bg-white p-3 sm:grid-cols-[minmax(0,1fr)_9.5rem]" aria-hidden="true">
          <SpendPie data={slices} className="h-36 sm:h-40" />
          <ul className="space-y-1 text-xs">
            {slices.map((item, index) => (
              <li key={item.name} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: spendPalette[index % spendPalette.length] }} />
                <span className="min-w-0 flex-1 truncate font-semibold">{item.name}</span>
                <span className="tabular-nums text-ink/55">{share(item.amount, total)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm font-semibold">
        {adds.map((item) => <li key={item}>{item}</li>)}
      </ul>
      <a href={contactHref} className={primaryClass}>Talk to Talon</a>
    </div>
  );
}
