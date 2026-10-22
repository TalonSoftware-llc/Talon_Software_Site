"use client";

import { useState } from "react";
import { AskThread, RenewalList, SpendDonut, StatusCluster, StatusPill } from "./snippets";

const tabs = ["Overview", "Spending", "Ask"] as const;
type Tab = (typeof tabs)[number];

const ticker = [
  ["Website", "Up"],
  ["Email", "Up"],
  ["Phone", "Up"],
  ["Procore", "Slow"],
  ["Sage 300", "Up"],
] as const;

export default function PortalStage({ demoHref }: { demoHref: string }) {
  const [tab, setTab] = useState<Tab>("Overview");

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2" aria-hidden="true">
        {ticker.map(([name, state]) => (
          <span key={name} className="inline-flex items-center gap-2 rounded-full border border-[#d5dde6] bg-white px-3 py-1 text-xs font-semibold text-ink">
            {state === "Slow" ? <span className="live-dot h-1.5 w-1.5 rounded-full bg-[#c4a574]" /> : <span className="h-1.5 w-1.5 rounded-full bg-pine" />}
            {name}
            <StatusPill state={state === "Slow" ? "Slow" : "Up"}>{state}</StatusPill>
          </span>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border border-[#d5dde6] bg-[#1b2430] shadow-[0_24px_60px_-28px_rgba(27,36,48,0.55)]">
        <div className="flex items-center gap-3 px-4 py-3 text-white/70">
          <span className="font-wordmark text-xl leading-none text-white">Talon</span>
          <span className="text-xs">Pro</span>
        </div>
        <div className="bg-[#f3f5f7] p-3 sm:p-4">
          <div className="mb-3 flex gap-1 rounded-lg bg-white p-1 text-sm font-semibold shadow-sm" role="tablist" aria-label="Portal preview">
            {tabs.map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={tab === item}
                className={`rounded-md px-3 py-1.5 ${tab === item ? "bg-pine text-white" : "text-ink/70 hover:bg-[#f3f5f7]"}`}
                onClick={() => setTab(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <div key={tab} className={`fade-in grid items-start gap-3 ${tab === "Ask" ? "" : "lg:grid-cols-[minmax(0,1fr)_15rem]"}`} role="tabpanel">
            <div className="min-w-0">
              {tab === "Overview" ? <StatusCluster /> : null}
              {tab === "Spending" ? (
                <div className="rounded-lg border border-[#e1e6ec] bg-white p-4 shadow-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/45">Spending</p>
                  <div className="mt-3"><SpendDonut size={148} /></div>
                  <RenewalList />
                </div>
              ) : null}
              {tab === "Ask" ? <AskThread long /> : null}
            </div>
            <div className={tab === "Ask" ? "hidden" : ""}>
              <AskThread />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6">
        <a href={demoHref} className="btn-pine">Try the live demo</a>
      </div>
    </div>
  );
}
