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
  website: "Website",
};

const graniteLinks: Record<string, { mbps: number; ms: number; uptime: number }> = {
  office: { mbps: 940, ms: 12, uptime: 99.99 },
  yard: { mbps: 620, ms: 18, uptime: 99.95 },
  river: { mbps: 180, ms: 28, uptime: 99.9 },
  state: { mbps: 150, ms: 32, uptime: 99.92 },
  park: { mbps: 220, ms: 36, uptime: 99.94 },
};

const redlineLinks: Record<string, { mbps: number; ms: number; uptime: number }> = {
  office: { mbps: 480, ms: 14, uptime: 99.97 },
  yard: { mbps: 360, ms: 16, uptime: 99.95 },
  addison: { mbps: 90, ms: 40, uptime: 99.8 },
};

const outageMinutes: Record<string, number> = {
  "o-river": 18,
  "o-addison": 14,
};

function pill(status: ServiceState): "Up" | "Slow" | "Down" {
  if (status === "Down") return "Down";
  if (status === "Degraded") return "Slow";
  return "Up";
}

export function pillClass(state: "Up" | "Slow" | "Down"): string {
  if (state === "Down") return "bg-[#f8e8e6] text-[#7a3030]";
  if (state === "Slow") return "bg-[#f8f1de] text-[#6d5420]";
  return "bg-[#e7f3ef] text-[#1f4d45]";
}

function labelFor(service: ServiceStatus): string {
  return systemLabels[service.id] ?? service.name;
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

export function Trend({ points }: { points: { label: string; value: number }[] }) {
  const max = Math.max(...points.map((point) => point.value), 1);
  const mid = points[Math.floor((points.length - 1) / 2)];
  return (
    <div>
      <div className="flex items-end gap-0.5">
        {points.map((point) => (
          <div key={point.label} className="group relative flex min-w-0 flex-1 flex-col justify-end">
            <div className="flex h-16 items-end">
              <div className="w-full rounded-sm bg-pine/80" style={{ height: `${Math.max(8, (point.value / max) * 100)}%` }} title={`${point.label}: ${num(point.value)}`} />
            </div>
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-[#1b2430] px-1.5 py-0.5 text-[10px] font-semibold text-white group-hover:block">{num(point.value)}</span>
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] leading-none text-ink/45">
        <span>{points[0]?.label}</span>
        <span>{mid?.label}</span>
        <span>{points[points.length - 1]?.label}</span>
      </div>
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

export function useGlance() {
  const demo = useDemo();
  const executive = repo.executive(demo.workspaceId, "30d");
  const services = executive.services.map((service) =>
    service.id === "procore" && demo.serviceUp ? { ...service, status: "Operational" as const } : service,
  );
  const website = services.find((service) => service.id === "website");
  const monthVisits = executive.series.reduce((sum, point) => sum + point.visitors, 0);
  const days = dailyVisits(monthVisits || 1);
  const today = days[days.length - 1]?.value ?? 0;
  const week = days.slice(-7).reduce((sum, point) => sum + point.value, 0);
  const month = days.reduce((sum, point) => sum + point.value, 0);
  const live = Math.max(4, Math.round(today * 0.07)) + demo.pulse;
  const links = demo.workspaceId === "redline" ? redlineLinks : graniteLinks;
  const locations = repo.locations(demo.workspaceId).map((location) => {
    const link = links[location.id] ?? { mbps: 100, ms: 30, uptime: 99.9 };
    return { id: location.id, name: location.name, state: "Up" as const, ...link };
  });
  const certs = demo.workspaceId === "redline"
    ? { ssl: "2026-12-02", domain: "2027-05-20" }
    : { ssl: "2027-03-12", domain: "2027-08-01" };
  const systems = services
    .filter((service) => systemIds.includes(service.id))
    .map((service) => ({
      id: service.id,
      name: labelFor(service),
      state: pill(service.status),
      uptime: service.uptime30,
      incidents: service.incidents,
    }));
  const websiteIncidents = (website?.incidents ?? []).map((incident) => ({
    id: `website-${incident.at}`,
    at: incident.at,
    minutes: incident.minutes,
    affected: "Website",
  }));
  const systemIncidents = systems.flatMap((system) =>
    system.incidents.map((incident) => ({
      id: `${system.id}-${incident.at}`,
      at: incident.at,
      minutes: incident.minutes,
      affected: system.name,
    })),
  );
  const outages = repo.outages(demo.workspaceId)
    .filter((outage) => outage.kind === "internet")
    .map((outage) => ({ id: outage.id, at: outage.at, location: outage.title, minutes: outageMinutes[outage.id] ?? 0 }));
  return {
    website,
    days,
    today,
    week,
    month,
    live,
    systems,
    websiteIncidents,
    systemIncidents,
    certs,
    pages: executive.traffic.pages,
    load: website?.responseMs ?? 0,
    locations,
    outages,
  };
}

function Live({ value }: { value: number }) {
  return (
    <p className="mt-2 flex items-center gap-2 text-3xl font-semibold tabular-nums">
      <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pine/40" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-pine" />
      </span>
      {num(value)}
    </p>
  );
}

export function WebsiteHomeCard() {
  const { href } = useFrame();
  const glance = useGlance();
  const down = glance.website && glance.website.status !== "Operational";
  return (
    <Link href={href("/website")} className={`${cardClass} block h-full`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Website</h2>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${down ? pillClass("Down") : pillClass("Up")}`}>
          {down ? "Down" : `${glance.website?.uptime30 ?? 0}%`}
        </span>
      </div>
      <Live value={glance.live} />
      <p className="text-sm text-ink/60">Now</p>
      <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
        <div><dt className="text-xs text-ink/50">Today</dt><dd className="font-semibold tabular-nums">{num(glance.today)}</dd></div>
        <div><dt className="text-xs text-ink/50">7 days</dt><dd className="font-semibold tabular-nums">{num(glance.week)}</dd></div>
        <div><dt className="text-xs text-ink/50">30 days</dt><dd className="font-semibold tabular-nums">{num(glance.month)}</dd></div>
      </dl>
      <div className="mt-4"><Trend points={glance.days} /></div>
    </Link>
  );
}

export function NetworkHomeCard() {
  const { href } = useFrame();
  const glance = useGlance();
  return (
    <Link href={href("/network")} className={`${cardClass} block h-full`}>
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Network</h2>
      <ul className="mt-3 divide-y divide-[#eef2f5]">
        {glance.locations.map((location) => (
          <li key={location.id} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span>{location.name}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${pillClass(location.state)}`}>{location.state}</span>
          </li>
        ))}
      </ul>
    </Link>
  );
}

export function SystemsHomeCard() {
  const { href } = useFrame();
  const glance = useGlance();
  return (
    <Link href={href("/systems")} className={`${cardClass} block h-full`}>
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Systems</h2>
      <ul className="mt-3 divide-y divide-[#eef2f5]">
        {glance.systems.map((system) => (
          <li key={system.id} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span>{system.name}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${pillClass(system.state)}`}>{system.state}</span>
          </li>
        ))}
      </ul>
    </Link>
  );
}

export function WebsiteView() {
  const demo = useDemo();
  const glance = useGlance();
  usePageContext({ section: "website", title: "Website", hints: ["Is the website up?", "How are visits?"] });
  if (demo.role !== "leadership") return null;
  const down = glance.website && glance.website.status !== "Operational";

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Website</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <section className={cardClass}><p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Now</p><Live value={glance.live} /></section>
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
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${down ? pillClass("Down") : pillClass("Up")}`}>
              {down ? "Down" : `${glance.website?.uptime30 ?? 0}%`}
            </span>
          </div>
          <p className="mt-3 text-xs text-ink/50">30 days</p>
          <div className="mt-1"><Strip days={30} up={!down} /></div>
          <p className="mt-3 text-xs text-ink/50">90 days · {glance.website?.uptime90 ?? 0}%</p>
          <div className="mt-1"><Strip days={90} up={!down} /></div>
          <p className="mt-3 text-sm">Page load <span className="font-semibold tabular-nums">{glance.load} ms</span></p>
        </section>
        <section className={cardClass}>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Renewals</h2>
          <ul className="mt-3 divide-y divide-[#eef2f5] text-sm">
            <li className="flex items-center justify-between py-2"><span>SSL</span><span>{formatDay(glance.certs.ssl)}</span></li>
            <li className="flex items-center justify-between py-2"><span>Domain</span><span>{formatDay(glance.certs.domain)}</span></li>
          </ul>
        </section>
      </div>
      <section className={cardClass}>
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Incidents</h2>
        <ul className="mt-3 divide-y divide-[#eef2f5]">
          {glance.websiteIncidents.length ? glance.websiteIncidents.map((incident) => (
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

export function NetworkView() {
  const demo = useDemo();
  const glance = useGlance();
  usePageContext({ section: "network", title: "Network", hints: ["Is the yard up?", "Any outages?"] });
  if (demo.role !== "leadership") return null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Network</h1>
      <section className={cardClass}>
        <ul className="divide-y divide-[#eef2f5]">
          {glance.locations.map((location) => (
            <li key={location.id} className="grid grid-cols-2 gap-2 py-3 text-sm sm:grid-cols-4">
              <span className="font-semibold">{location.name}</span>
              <span className={`w-fit rounded-full px-2 py-0.5 text-xs font-semibold ${pillClass(location.state)}`}>{location.state}</span>
              <span className="tabular-nums">{location.uptime}%</span>
              <span className="tabular-nums">{num(location.mbps)} Mbps · {location.ms} ms</span>
            </li>
          ))}
        </ul>
      </section>
      <section className={cardClass}>
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Outages</h2>
        <ul className="mt-3 divide-y divide-[#eef2f5]">
          {glance.outages.length ? glance.outages.map((outage) => (
            <li key={outage.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm">
              <span>{formatDay(outage.at)}</span>
              <span className="tabular-nums">{outage.minutes}m</span>
              <span>{outage.location}</span>
            </li>
          )) : <li className="py-2.5 text-sm">None</li>}
        </ul>
      </section>
    </div>
  );
}

export function SystemsView() {
  const demo = useDemo();
  const glance = useGlance();
  usePageContext({ section: "systems", title: "Systems", hints: ["Is Procore up?", "Is email up?"] });
  if (demo.role !== "leadership") return null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Systems</h1>
      <section className={cardClass}>
        <ul className="divide-y divide-[#eef2f5]">
          {glance.systems.map((system) => (
            <li key={system.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <span className="font-semibold">{system.name}</span>
              <span className="tabular-nums">{system.uptime}%</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${pillClass(system.state)}`}>{system.state}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className={cardClass}>
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Incidents</h2>
        <ul className="mt-3 divide-y divide-[#eef2f5]">
          {glance.systemIncidents.length ? glance.systemIncidents.map((incident) => (
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
