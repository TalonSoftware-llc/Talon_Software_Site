"use client";

import { useState } from "react";
import { getSupportRepository } from "@/lib/support/data";
import { categoryLabel, formatDay, money } from "@/lib/support/format";
import { SpendBars, SpendPie, spendPalette } from "../charts";
import { usePageContext } from "../page-context";
import { useDemo } from "../use-demo";
import { cardClass, quietClass } from "../ui";

const repo = getSupportRepository(null);

function share(amount: number, total: number): string {
  if (!total) return "0%";
  return `${Math.round((amount / total) * 100)}%`;
}

export function SpendingView() {
  const demo = useDemo();
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const executive = repo.executive(demo.workspaceId, "12m");
  const billing = repo.billing(demo.workspaceId);
  const points = executive.series;
  const latest = points[points.length - 1];
  const prior = points[points.length - 2];
  const delta = (latest?.spend ?? 0) - (prior?.spend ?? 0);
  const total = executive.breakdown.reduce((sum, item) => sum + item.amount, 0);
  const slices = executive.breakdown.map((item) => ({ name: categoryLabel(item.name), amount: item.amount, source: item.name }));
  const selected = slices.find((item) => item.name === picked);
  const selectedLines = executive.breakdown.find((item) => categoryLabel(item.name) === picked)?.lines ?? [];
  const lineTotal = selectedLines.reduce((sum, line) => sum + line.amount, 0);
  usePageContext({ section: "spending", title: "Spending", hints: ["What am I spending?"] });
  if (demo.role !== "leadership") return null;

  function toggle(name: string) {
    setPicked(picked === name ? null : name);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Spending</h1>
      <section className={cardClass}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">This month</p>
          <p className="text-3xl font-semibold tabular-nums">{money(total)}</p>
        </div>
        <div className="mt-4 grid grid-cols-1 items-center gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
          <SpendPie data={slices} selected={picked ?? undefined} onPick={toggle} />
          <ul className="space-y-1">
            {slices.map((item, index) => (
              <li key={item.source}>
                <button
                  type="button"
                  className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm ${picked === item.name ? "bg-[#e7f3ef]" : "hover:bg-[#f7f9fb]"}`}
                  onClick={() => toggle(item.name)}
                >
                  <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: spendPalette[index % spendPalette.length] }} />
                  <span className="min-w-0 flex-1 font-semibold">{item.name}</span>
                  <span className="tabular-nums">{money(item.amount)}</span>
                  <span className="w-10 text-right tabular-nums text-ink/60">{share(item.amount, total)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        {selected ? (
          <div className="mt-6 border-t border-[#eef2f5] pt-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">{selected.name}</h2>
              <button type="button" className={quietClass} onClick={() => setPicked(null)}>All</button>
            </div>
            <div className="mt-3 grid grid-cols-1 items-center gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
              <SpendPie data={selectedLines} />
              <ul className="space-y-1">
                {selectedLines.map((line, index) => (
                  <li key={line.name} className="flex items-center gap-2 px-2 py-2 text-sm">
                    <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: spendPalette[index % spendPalette.length] }} />
                    <span className="min-w-0 flex-1">{line.name}</span>
                    <span className="tabular-nums">{money(line.amount)}</span>
                    <span className="w-10 text-right tabular-nums text-ink/60">{share(line.amount, lineTotal)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </section>
      <section className={cardClass}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">12 months</p>
          <p className={`text-sm font-semibold tabular-nums ${delta > 0 ? "text-[#7a3030]" : "text-[#1f4d45]"}`}>
            {delta > 0 ? "+" : "−"}{money(Math.abs(delta))} vs last month
          </p>
        </div>
        <div className="mt-3">
          <SpendBars data={points.map((point) => ({ label: point.label, spend: point.spend, budget: point.budget }))} onPick={() => undefined} />
        </div>
      </section>
      <button type="button" className={quietClass} onClick={() => setOpen((value) => !value)}>Details</button>
      {open ? (
        <section className={`${cardClass} space-y-3 text-sm`}>
          <p className="tabular-nums">Hours {billing.hoursUsed} / {billing.hoursIncluded}</p>
          <ul className="space-y-1">
            {billing.invoices.map((invoice) => (
              <li key={invoice.id} className="flex justify-between"><span>{invoice.id} · {formatDay(invoice.date)}</span><span className="tabular-nums">{money(invoice.amount)} · {invoice.status}</span></li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
