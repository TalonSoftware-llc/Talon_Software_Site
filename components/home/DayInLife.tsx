"use client";

import { useEffect, useRef, useState } from "react";
import { AskThread, OnboardSnippet, RenewalList, ReportSnippet, SpendDonut, StatusCluster } from "./snippets";

const moments = [
  { id: "hire", line: "New hire starts Monday." },
  { id: "renewal", line: "A renewal is coming." },
  { id: "alert", line: "Something looks off." },
  { id: "board", line: "The board meets this week." },
  { id: "ask", line: "A quick question." },
] as const;

type Scene = (typeof moments)[number]["id"];

const navFor: Record<Scene, string> = {
  hire: "People",
  renewal: "Spending",
  alert: "Home",
  board: "Report",
  ask: "Home",
};

export default function DayInLife() {
  const [active, setActive] = useState(0);
  const [recovered, setRecovered] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const scene = moments[active].id;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const nodes = [...root.querySelectorAll<HTMLElement>("[data-moment]")];
    const observer = new IntersectionObserver((entries) => {
      const best = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!best) return;
      const index = Number(best.target.getAttribute("data-moment"));
      if (!Number.isInteger(index) || index === activeRef.current) return;
      activeRef.current = index;
      if (moments[index]?.id === "alert") setRecovered(false);
      setActive(index);
    }, { threshold: [0.35, 0.55, 0.75], rootMargin: "-15% 0px -25% 0px" });
    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (scene !== "alert") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setRecovered(true), reduce ? 0 : 1400);
    return () => window.clearTimeout(timer);
  }, [scene]);

  return (
    <section className="bg-paper" ref={rootRef}>
      <div className="relative mx-auto max-w-6xl px-6 py-16 lg:min-h-[440vh] lg:py-28">
        <div className="sticky top-[4.25rem] z-10 bg-paper pb-3 lg:top-24 lg:w-[52%] lg:pb-0">
          <div className="h-[34vh] overflow-hidden lg:h-auto lg:overflow-visible">
            <div className="origin-top-left scale-[0.64] w-[156%] lg:w-full lg:scale-100">
              <PortalScreen scene={scene} recovered={scene === "alert" && recovered} />
            </div>
          </div>
        </div>
        <div className="lg:absolute lg:right-6 lg:top-28 lg:w-[40%]">
          {moments.map((moment, index) => (
            <article
              key={moment.id}
              data-moment={index}
              className="flex min-h-[62vh] items-end pb-8 lg:min-h-[88vh] lg:items-center lg:pb-0"
            >
              <h2 className={`max-w-xl font-serif text-4xl font-medium leading-[1.05] tracking-tight motion-safe:transition-colors motion-safe:duration-500 sm:text-5xl lg:text-6xl ${index === active ? "text-ink" : "text-ink/25"}`}>
                <span className={`mb-5 block h-px w-12 motion-safe:transition-colors ${index === active ? "bg-pine" : "bg-ink/15"}`} />
                {moment.line}
              </h2>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function PortalScreen({ scene, recovered }: { scene: Scene; recovered: boolean }) {
  const current = navFor[scene];
  return (
    <div data-scene={scene} data-recovered={recovered ? "yes" : "no"} className="overflow-hidden rounded-2xl border border-[#d7dee6] bg-[#1b2430] shadow-[0_30px_70px_-36px_rgba(27,36,48,0.55)]" aria-hidden="true">
      <div className="flex items-center justify-between px-4 py-3 text-white/60">
        <span className="font-wordmark text-xl leading-none text-white">Talon</span>
        <span className="text-[10px] uppercase tracking-[0.16em]">Pro</span>
      </div>
      <div className="grid bg-[#f3f5f7] sm:grid-cols-[7.25rem_minmax(0,1fr)]">
        <div className="hidden space-y-1.5 bg-[#1b2430] px-3 py-4 text-[11px] text-white/50 sm:block">
          {["Home", "People", "Requests", "Changes", "Spending", "Report"].map((item) => (
            <p key={item} className={item === current ? "font-semibold text-white" : ""}>{item}</p>
          ))}
        </div>
        <div key={scene} className="fade-in p-3 sm:min-h-[340px]">
          {scene === "hire" ? <OnboardSnippet /> : null}
          {scene === "renewal" ? (
            <div className="rounded-xl border border-[#e1e6ec] bg-white p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/45">Spending</p>
              <div className="mt-3"><SpendDonut size={120} /></div>
              <RenewalList />
            </div>
          ) : null}
          {scene === "alert" ? <StatusCluster procore={recovered ? "Up" : "Slow"} /> : null}
          {scene === "board" ? <ReportSnippet /> : null}
          {scene === "ask" ? <AskThread long /> : null}
        </div>
      </div>
    </div>
  );
}
