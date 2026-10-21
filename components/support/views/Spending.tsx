"use client";

import { useState } from "react";
import { getSupportRepository } from "@/lib/support/data";
import { categoryLabel, formatDay, money } from "@/lib/support/format";
import { SpendBars, SpendDonut } from "../charts";
import { usePageContext } from "../page-context";
import { useDemo } from "../use-demo";
import { cardClass, quietClass } from "../ui";

const repo = getSupportRepository(null);

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
  const slices = executive.breakdown.map((item) => ({ name: categoryLabel(item.name), amount: item.amount, source: item.name }));
  const selected = executive.breakdown.find((item) => categoryLabel(item.name) === picked);
  usePageContext({ section: "spending", title: "Spending", hints: ["What am I spending?"] });
  if (demo.role !== "leadership") return null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Spending</h1>
      <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <section className={cardClass}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">This month</p>
          <p className="mt-3 text-3xl font-semibold tabular-nums">{money(executive.monthSpend)}</p>
          <p className={`mt-1 text-sm font-semibold tabular-nums ${delta > 0 ? "text-[#7a3030]" : "text-[#1f4d45]"}`}>
            {delta > 0 ? "+" : "−"}{money(Math.abs(delta))} vs last month
          </p>
        </section>
        <section className={cardClass}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">12 months</p>
          <SpendBars data={points.map((point) => ({ label: point.label, spend: point.spend, budget: point.budget }))} onPick={() => undefined} />
        </section>
      </div>
      <section className={cardClass}>
        <div className="grid items-center gap-4 lg:grid-cols-2">
          <SpendDonut data={slices} selected={picked ?? undefined} onPick={setPicked} />
          <ul className="space-y-1">
            {slices.map((item) => (
              <li key={item.source}>
                <button type="button" className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${picked === item.name ? "bg-[#e7f3ef]" : "hover:bg-[#f7f9fb]"}`} onClick={() => setPicked(picked === item.name ? null : item.name)}>
                  <span className="font-semibold">{item.name}</span>
                  <span className="tabular-nums">{money(item.amount)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        {selected ? (
          <ul className="mt-4 divide-y divide-[#eef2f5] border-t border-[#eef2f5]">
            {selected.lines.map((line) => (
              <li key={line.name} className="flex items-center justify-between py-2 text-sm">
                <span>{line.name}</span>
                <span className="tabular-nums">{money(line.amount)}</span>
              </li>
            ))}
          </ul>
        ) : null}
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
