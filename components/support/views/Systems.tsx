"use client";

import Link from "next/link";
import { getSupportRepository } from "@/lib/support/data";
import { DEMO_NOW, formatDay, num } from "@/lib/support/format";
import type { ServiceState, ServiceStatus } from "@/lib/support/types";
import { useFrame } from "../frame";
import { usePageContext } from "../page-context";
import { useDemo } from "../use-demo";
import { cardClass } from "../ui";

const repo = getSupportRepository(null);
const sourceSplit = [
  { name: "Search", share: 0.46, color: "#1f4d45" },
  { name: "Direct", share: 0.28, color: "#1b2430" },
  { name: "Social", share: 0.1, color: "#c4a574" },
  { name: "Referral", share: 0.16, color: "#3e7c6f" },
];

function pill(status: ServiceState): "Up" | "Slow" | "Down" {
  if (status === "Down") return "Down";
  if (status === "Degraded") return "Slow";
  return "Up";
}

function pillClass(state: "Up" | "Slow" | "Down"): string {
  if (state === "Down") return "bg-[#f8e8e6] text-[#7a3030]";
  if (state === "Slow") return "bg-[#f8f1de] text-[#6d5420]";
  return "bg-[#e7f3ef] text-[#1f4d45]";
}

function systemName(service: ServiceStatus): string {
  if (service.id === "aviary" || service.id === "meadow") return `Charting app (${service.name})`;
  if (service.id === "m365" || service.id === "google") return "Email";
  if (service.id === "phones") return "Phone";
  if (service.id === "website") return "Website";
  return service.name;
}

function dayLabel(iso: string): string {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!dateOnly) return formatDay(iso);
  const when = new Date(Date.UTC(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]), 12));
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(when);
}

function dailyVisits(total: number): { label: string; value: number }[] {
  const weights = Array.from({ length: 30 }, (_, index) => 0.72 + ((index * 13) % 11) / 12);
  const sum = weights.reduce((totalWeight, weight) => totalWeight + weight, 0);
  return weights.map((weight, index) => {
    const when = new Date(DEMO_NOW.getTime() - (29 - index) * 86_400_000);
    const label = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" }).format(when);
    return { label, value: Math.max(1, Math.round((total * weight) / sum)) };
  });
}

function Trend({ points }: { points: { label: string; value: number }[] }) {
  const max = Math.max(...points.map((point) => point.value), 1);
  return (
    <div className="flex items-end gap-0.5">
      {points.map((point, index) => (
        <div key={point.label} className="group relative flex min-w-0 flex-1 flex-col justify-end">
          <div className="flex h-16 items-end">
            <div className="w-full rounded-sm bg-pine/80" style={{ height: `${Math.max(8, (point.value / max) * 100)}%` }} title={`${point.label}: ${num(point.value)}`} />
          </div>
          <span className="pointer-events-none absolute bottom-5 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-[#1b2430] px-1.5 py-0.5 text-[10px] font-semibold text-white group-hover:block">{num(point.value)}</span>
          <span className="mt-1 h-3 truncate text-center text-[9px] leading-none text-ink/45">{index % 5 === 0 ? point.label : ""}</span>
        </div>
      ))}
    </div>
  );
}

function Strip({ days, up }: { days: number; up: boolean }) {
  return (
    <div className="flex gap-px" aria-hidden="true">
      {Array.from({ length: days }, (_, index) => {
        const mark = !up && index > days - 4;
        return <span key={index} className={`h-6 flex-1 rounded-[1px] ${mark ? "bg-[#c4a574]" : "bg-[#1f4d45]"}`} />;
      })}
    </div>
  );
}

export function useSiteGlance() {
  const demo = useDemo();
  const executive = repo.executive(demo.workspaceId, "30d");
  const services = executive.services.map((service) =>
    service.id === "aviary" && demo.serviceUp ? { ...service, status: "Operational" as const } : service,
  );
  const website = services.find((service) => service.id === "website");
  const monthVisits = executive.series.reduce((sum, point) => sum + point.visitors, 0);
  const days = dailyVisits(monthVisits || 1);
  const today = days[days.length - 1]?.value ?? 0;
  const week = days.slice(-7).reduce((sum, point) => sum + point.value, 0);
  const month = days.reduce((sum, point) => sum + point.value, 0);
  const live = Math.max(4, Math.round(today * 0.07)) + demo.pulse;
  const locations = repo.locations(demo.workspaceId);
  const certs = demo.workspaceId === "south-ridge"
    ? { ssl: "2026-12-18", domain: "2027-04-02" }
    : { ssl: "2027-01-20", domain: "2027-06-14" };
  const systems = [
    ...services.filter((service) => ["website", "m365", "google", "phones", "aviary", "meadow"].includes(service.id)).map((service) => ({
      id: service.id,
      name: systemName(service),
      state: pill(service.status),
    })),
    ...locations.map((location) => ({ id: location.id, name: `${location.name} internet`, state: "Up" as const })),
  ];
  const incidents = services.flatMap((service) =>
    service.incidents.map((incident) => ({
      id: `${service.id}-${incident.at}`,
      at: incident.at,
      minutes: incident.minutes,
      affected: systemName(service),
    })),
  );
  return { website, days, today, week, month, live, systems, incidents, certs, pages: executive.traffic.pages, load: website?.responseMs ?? 0 };
}

export function SystemsHomeCard() {
  const { href } = useFrame();
  const glance = useSiteGlance();
  const websiteDown = glance.website && glance.website.status !== "Operational";
  return (
    <Link href={href("/app/systems")} className={`${cardClass} block h-full`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Website & systems</h2>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${websiteDown ? "bg-[#f8e8e6] text-[#7a3030]" : "bg-[#e7f3ef] text-[#1f4d45]"}`}>
          {websiteDown ? "Down" : `${glance.website?.uptime30 ?? 0}% · 30 days`}
        </span>
      </div>
      <p className="mt-3 flex items-center gap-2 text-sm tabular-nums text-ink/70">
        <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pine/40" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-pine" />
        </span>
        {num(glance.live)} now
      </p>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
        <div><dt className="text-xs text-ink/50">Today</dt><dd className="font-semibold tabular-nums">{num(glance.today)}</dd></div>
        <div><dt className="text-xs text-ink/50">7 days</dt><dd className="font-semibold tabular-nums">{num(glance.week)}</dd></div>
        <div><dt className="text-xs text-ink/50">30 days</dt><dd className="font-semibold tabular-nums">{num(glance.month)}</dd></div>
      </dl>
      <div className="mt-4">
        <Trend points={glance.days} />
      </div>
      <h3 className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Top pages</h3>
      <ul className="mt-2 divide-y divide-[#eef2f5]">
        {glance.pages.slice(0, 3).map((page) => (
          <li key={page.path} className="flex items-center justify-between gap-3 py-1.5 text-sm">
            <span className="truncate">{page.path.replace(/^[^/]+/, "") || "/"}</span>
            <span className="tabular-nums">{num(page.views)}</span>
          </li>
        ))}
      </ul>
      <h3 className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Sources</h3>
      <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
        {sourceSplit.map((source) => (
          <li key={source.name} className="flex items-center justify-between gap-2">
            <span>{source.name}</span>
            <span className="tabular-nums">{num(Math.round(glance.month * source.share))}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm">Page load <span className="font-semibold tabular-nums">{glance.load} ms</span></p>
      <p className="mt-3 text-xs text-ink/50">30 days</p>
      <div className="mt-1"><Strip days={30} up={!websiteDown} /></div>
      <p className="mt-2 text-xs text-ink/50">90 days · {glance.website?.uptime90 ?? 0}%</p>
      <div className="mt-1"><Strip days={90} up={!websiteDown} /></div>
      <h3 className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Incidents</h3>
      <ul className="mt-2 divide-y divide-[#eef2f5]">
        {glance.incidents.length ? glance.incidents.map((incident) => (
          <li key={incident.id} className="flex items-center justify-between gap-2 py-1.5 text-sm">
            <span>{formatDay(incident.at)}</span>
            <span className="tabular-nums">{incident.minutes}m</span>
            <span className="truncate">{incident.affected}</span>
          </li>
        )) : <li className="py-1.5 text-sm">None</li>}
      </ul>
      <h3 className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Renewals</h3>
      <ul className="mt-2 text-sm">
        <li className="flex items-center justify-between py-1"><span>SSL</span><span>{dayLabel(glance.certs.ssl)}</span></li>
        <li className="flex items-center justify-between py-1"><span>Domain</span><span>{dayLabel(glance.certs.domain)}</span></li>
      </ul>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {glance.systems.map((system) => (
          <li key={system.id} className={`rounded-full px-2 py-0.5 text-xs font-semibold ${pillClass(system.state)}`}>{system.name} {system.state}</li>
        ))}
      </ul>
    </Link>
  );
}

export function SystemsView() {
  const demo = useDemo();
  const glance = useSiteGlance();
  usePageContext({ section: "systems", title: "Website & systems", hints: ["Is the website up?", "How are visits?"] });
  if (demo.role !== "leadership") return null;
  const slow = glance.website && glance.website.status !== "Operational";

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Website & systems</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <section className={cardClass}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Now</p>
          <p className="mt-2 flex items-center gap-2 text-3xl font-semibold tabular-nums">
            <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pine/40" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-pine" />
            </span>
            {num(glance.live)}
          </p>
        </section>
        <section className={cardClass}><p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Today</p><p className="mt-2 text-3xl font-semibold tabular-nums">{num(glance.today)}</p></section>
        <section className={cardClass}><p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">7 days</p><p className="mt-2 text-3xl font-semibold tabular-nums">{num(glance.week)}</p></section>
        <section className={cardClass}><p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">30 days</p><p className="mt-2 text-3xl font-semibold tabular-nums">{num(glance.month)}</p></section>
      </div>
      <section className={cardClass}>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Visits</p>
        <div className="mt-3"><Trend points={glance.days} /></div>
      </section>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className={cardClass}>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Top pages</h2>
          <ul className="mt-3 divide-y divide-[#eef2f5]">
            {glance.pages.map((page) => (
              <li key={page.path} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="truncate">{page.path.replace(/^[^/]+/, "") || "/"}</span>
                <span className="tabular-nums">{num(page.views)}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className={cardClass}>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Sources</h2>
          <ul className="mt-3 space-y-3">
            {sourceSplit.map((source) => (
              <li key={source.name}>
                <div className="flex items-center justify-between text-sm">
                  <span>{source.name}</span>
                  <span className="tabular-nums">{num(Math.round(glance.month * source.share))}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#eef2f5]">
                  <div className="h-full rounded-full" style={{ width: `${source.share * 100}%`, background: source.color }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className={cardClass}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Uptime</h2>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${slow ? pillClass("Down") : pillClass("Up")}`}>
              {slow ? "Down" : `${glance.website?.uptime30 ?? 0}%`}
            </span>
          </div>
          <p className="mt-3 text-xs text-ink/50">30 days</p>
          <div className="mt-1"><Strip days={30} up={!slow} /></div>
          <p className="mt-3 text-xs text-ink/50">90 days · {glance.website?.uptime90 ?? 0}%</p>
          <div className="mt-1"><Strip days={90} up={!slow} /></div>
          <p className="mt-3 text-sm">Page load <span className="font-semibold tabular-nums">{glance.load} ms</span></p>
        </section>
        <section className={cardClass}>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Renewals</h2>
          <ul className="mt-3 divide-y divide-[#eef2f5] text-sm">
            <li className="flex items-center justify-between py-2"><span>SSL</span><span>{dayLabel(glance.certs.ssl)}</span></li>
            <li className="flex items-center justify-between py-2"><span>Domain</span><span>{dayLabel(glance.certs.domain)}</span></li>
          </ul>
        </section>
      </div>
      <section className={cardClass}>
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Systems</h2>
        <ul className="mt-3 divide-y divide-[#eef2f5]">
          {glance.systems.map((system) => (
            <li key={system.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span>{system.name}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${pillClass(system.state)}`}>{system.state}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className={cardClass}>
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Incidents</h2>
        <ul className="mt-3 divide-y divide-[#eef2f5]">
          {glance.incidents.length ? glance.incidents.map((incident) => (
            <li key={incident.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm">
              <span>{formatDay(incident.at)}</span>
              <span className="tabular-nums">{incident.minutes}m</span>
              <span>{incident.affected}</span>
            </li>
          )) : <li className="py-2.5 text-sm">None</li>}
        </ul>
      </section>
    </div>
  );
}
