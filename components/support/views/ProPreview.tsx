"use client";

import { getSupportRepository } from "@/lib/support/data";
import { categoryLabel } from "@/lib/support/format";
import { SpendPie, spendPalette } from "../charts";
import { useFrame } from "../frame";
import { usePageContext } from "../page-context";
import { useDemo } from "../use-demo";
import { cardClass, primaryClass } from "../ui";

const repo = getSupportRepository(null);
const missing = ["Home", "People", "Spending", "Projects", "Report", "Ask"];

function share(amount: number, total: number): string {
  if (!total) return "0%";
  return `${Math.round((amount / total) * 100)}%`;
}

export default function ProPreview() {
  const demo = useDemo();
  const { contactHref } = useFrame();
  const breakdown = repo.executive(demo.workspaceId, "12m").breakdown;
  const slices = breakdown.map((item) => ({ name: categoryLabel(item.name), amount: item.amount }));
  const total = slices.reduce((sum, item) => sum + item.amount, 0);
  usePageContext({ section: "pro", title: "Pro", hints: [] });
  if (demo.tier !== "essentials") return null;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Pro</h1>
      <ul className="flex flex-wrap gap-2">
        {missing.map((item) => (
          <li key={item} className="rounded-full border border-[#d5dde6] bg-white px-3 py-1 text-sm font-semibold">{item}</li>
        ))}
      </ul>
      <section className={cardClass}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Spending</h2>
          <span className="rounded-full bg-[#f4ecd8] px-2 py-0.5 text-xs font-semibold text-[#5c4816]">Preview</span>
        </div>
        <div className="pointer-events-none mt-2 grid grid-cols-1 items-center gap-4 lg:grid-cols-[minmax(0,1fr)_14rem]" aria-hidden="true">
          <SpendPie data={slices} className="h-56" />
          <ul className="space-y-1 text-sm">
            {slices.map((item, index) => (
              <li key={item.name} className="flex items-center gap-2 px-1 py-1">
                <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: spendPalette[index % spendPalette.length] }} />
                <span className="min-w-0 flex-1 font-semibold">{item.name}</span>
                <span className="tabular-nums text-ink/60">{share(item.amount, total)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <a href={contactHref} className={primaryClass}>Talk to Talon</a>
    </div>
  );
}
