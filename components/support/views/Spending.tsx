"use client";

import { useState } from "react";
import { getSupportRepository } from "@/lib/support/data";
import { categoryLabel, formatDay, money } from "@/lib/support/format";
import { usePageContext } from "../page-context";
import { useDemo } from "../use-demo";
import { quietClass } from "../ui";

const repo = getSupportRepository(null);

export function SpendingView() {
  const demo = useDemo();
  const [open, setOpen] = useState(false);
  const executive = repo.executive(demo.workspaceId, "12m");
  const billing = repo.billing(demo.workspaceId);
  const points = executive.series;
  const latest = points[points.length - 1];
  const prior = points[points.length - 2];
  const delta = (latest?.spend ?? 0) - (prior?.spend ?? 0);
  const top = [...executive.breakdown].sort((a, b) => b.amount - a.amount).slice(0, 4);
  usePageContext({ section: "spending", title: "Spending", hints: ["What am I spending?"] });
  if (demo.role !== "leadership") return null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Spending <span className="text-sm font-normal text-ink/50">Sample</span></h1>
      <div className="rounded-xl border border-[#e1e6ec] bg-white p-4 shadow-sm">
        <p className="text-3xl font-semibold tabular-nums">{money(executive.monthSpend)}</p>
        <p className="mt-1 text-sm tabular-nums">{delta >= 0 ? "Up" : "Down"} {money(Math.abs(delta))}</p>
        <ul className="mt-4 space-y-1 text-sm">
          {top.map((item) => (
            <li key={item.name} className="flex justify-between"><span>{categoryLabel(item.name)}</span><span className="tabular-nums">{money(item.amount)}</span></li>
          ))}
        </ul>
      </div>
      <button type="button" className={quietClass} onClick={() => setOpen((value) => !value)}>Details</button>
      {open ? (
        <div className="space-y-3 text-sm">
          <p className="tabular-nums">Hours {billing.hoursUsed} / {billing.hoursIncluded}</p>
          <ul className="space-y-1">
            {billing.invoices.map((invoice) => (
              <li key={invoice.id} className="flex justify-between"><span>{invoice.id} · {formatDay(invoice.date)}</span><span className="tabular-nums">{money(invoice.amount)} · {invoice.status}</span></li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
