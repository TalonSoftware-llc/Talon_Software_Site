"use client";

import Link from "next/link";
import { useState } from "react";
import { getSupportRepository } from "@/lib/support/data";
import { categoryLabel, money, num } from "@/lib/support/format";
import { averageResponseHours } from "@/lib/support/stats";
import { SpendBars } from "../charts";
import { useFrame } from "../frame";
import { usePageContext } from "../page-context";
import { decideApproval } from "../store";
import { useDemo } from "../use-demo";
import { cardClass, primaryClass, quietClass } from "../ui";

const repo = getSupportRepository(null);
const barColors = ["#1f4d45", "#1b2430", "#3e7c6f", "#c4a574", "#6d7c8a", "#8fa89a"];

function systemSentence(service: { id: string; name: string; status: string }): string {
  const state = service.status === "Down" ? "down" : "running slow";
  if (service.id === "aviary" || service.id === "meadow") return `Charting app (${service.name}) ${state}`;
  if (service.id === "internet") return `Internet ${state}`;
  if (service.id === "phones") return `Phones ${state}`;
  return `${service.name} ${state}`;
}

function shortDay(iso: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" }).format(new Date(iso));
}

function MiniBars({ points, format }: { points: { label: string; value: number }[]; format: (value: number) => string }) {
  const max = Math.max(...points.map((point) => point.value), 1);
  return (
    <div className="flex items-end gap-1">
      {points.map((point) => (
        <div key={point.label} className="group relative flex min-w-0 flex-1 flex-col justify-end">
          <div className="flex h-12 items-end">
            <div className="w-full rounded-sm bg-pine/80" style={{ height: `${Math.max(8, (point.value / max) * 100)}%` }} title={`${point.label}: ${format(point.value)}`} />
          </div>
          <span className="pointer-events-none absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-[#1b2430] px-1.5 py-0.5 text-[10px] font-semibold text-white group-hover:block">{format(point.value)}</span>
          <span className="mt-1 truncate text-center text-[10px] leading-none text-ink/45">{point.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const demo = useDemo();
  const { href } = useFrame();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<string | null>(null);
  const people = demo.people[demo.workspaceId] ?? [];
  const tickets = demo.tickets[demo.workspaceId] ?? [];
  const executive = repo.executive(demo.workspaceId, "12m");
  const weeks = repo.executive(demo.workspaceId, "30d").series;
  const services = executive.services.map((service) => {
    if (service.id === "aviary" && demo.serviceUp) return { ...service, status: "Operational" as const };
    return service;
  });
  const website = services.find((service) => service.id === "website");
  const others = services.filter((service) => service.id !== "website" && service.status !== "Operational");
  const missing = people.filter((person) => person.status === "Active" && !person.mfa);
  const devices = people.flatMap((person) =>
    person.devices.filter((device) => device.threatdown !== "Protected").map((device) => ({ ...device, person: person.name })),
  );
  const pending = (demo.approvals[demo.workspaceId] ?? []).filter((item) => item.status === "Pending Talon");
  const renewal = executive.renewals[0];
  const openRequests = tickets.filter((ticket) => ticket.status !== "Resolved").length;
  const hours = averageResponseHours(tickets);
  const points = executive.series;
  const latest = points[points.length - 1];
  const prior = points[points.length - 2];
  const delta = (latest?.spend ?? 0) - (prior?.spend ?? 0);
  const top = [...executive.breakdown].sort((a, b) => b.amount - a.amount).slice(0, 4);
  const spendTotal = top.reduce((sum, item) => sum + item.amount, 0) || 1;
  const picked = points.find((point) => point.label === month);
  const visits = executive.traffic.visitors + demo.pulse * 2;
  const websiteDown = website && website.status !== "Operational";
  const attention = missing.length + devices.length > 0;
  const onboarding = people.find((person) => person.id === "p-theo" && person.status === "Onboarding");
  usePageContext({ section: "home", title: "Home", hints: ["Am I safe?", "What am I spending?"] });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Home</h1>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className={cardClass}>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${attention ? "bg-[#c4a574]" : "bg-[#1f4d45]"}`} />
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Safe</h2>
          </div>
          <p className="mt-3 text-2xl font-semibold">{attention ? "Needs attention" : "Protected"}</p>
          <ul className="mt-4 divide-y divide-[#eef2f5]">
            {missing.length ? (
              <li className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span>{missing.length} people without MFA</span>
                <Link href={href("/app/people?flag=mfa")} className={quietClass}>Fix</Link>
              </li>
            ) : null}
            {devices.length ? (
              <li className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span>{devices.length} devices need attention</span>
                <Link href={href("/app/security")} className={quietClass}>Review</Link>
              </li>
            ) : null}
            {!attention ? <li className="py-2.5 text-sm text-ink/60">Protected</li> : null}
          </ul>
        </section>

        <Link href={href("/app/spending")} className={`${cardClass} block`}>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Spending</h2>
          <p className="mt-3 text-3xl font-semibold tabular-nums">{money(executive.monthSpend)}</p>
          <p className={`mt-1 text-sm font-semibold tabular-nums ${delta > 0 ? "text-[#7a3030]" : "text-[#1f4d45]"}`}>
            {delta > 0 ? "+" : "−"}{money(Math.abs(delta))} vs last month
          </p>
          <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-[#eef2f5]">
            {top.map((item, index) => (
              <div key={item.name} style={{ width: `${(item.amount / spendTotal) * 100}%`, background: barColors[index % barColors.length] }} />
            ))}
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            {top.map((item, index) => (
              <li key={item.name} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: barColors[index % barColors.length] }} />{categoryLabel(item.name)}</span>
                <span className="tabular-nums">{money(item.amount)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <MiniBars points={points.map((point) => ({ label: point.label, value: point.spend }))} format={money} />
          </div>
        </Link>

        <section className={cardClass}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Website & systems</h2>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${websiteDown ? "bg-[#f8e8e6] text-[#7a3030]" : "bg-[#e7f3ef] text-[#1f4d45]"}`}>
              {websiteDown ? "Down" : `${website?.uptime30 ?? 0}% · 30 days`}
            </span>
          </div>
          <div className="mt-4 flex gap-0.5" aria-hidden="true">
            {Array.from({ length: 30 }, (_, index) => {
              const live = index === 29 && demo.pulse % 2 === 1;
              const down = websiteDown && index > 26;
              const color = down ? "bg-[#7a3030]" : live ? "bg-[#3e7c6f]" : "bg-[#1f4d45]";
              return <span key={index} className={`h-8 flex-1 rounded-sm ${color}`} />;
            })}
          </div>
          <p className="mt-3 flex items-center gap-2 text-sm tabular-nums text-ink/70">
            <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pine/40" />
              <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${demo.pulse % 2 ? "bg-[#3e7c6f]" : "bg-pine"}`} />
            </span>
            Visits {num(visits)}
          </p>
          {others.map((service) => (
            <div key={service.id} className="mt-3 flex items-center justify-between gap-3 text-sm">
              <span>{systemSentence(service)}</span>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${service.status === "Down" ? "bg-[#f8e8e6] text-[#7a3030]" : "bg-[#f8f1de] text-[#6d5420]"}`}>{service.status === "Down" ? "Down" : "Slow"}</span>
            </div>
          ))}
        </section>

        <Link href={href("/app/requests")} className={`${cardClass} block`}>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Support</h2>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <p className="text-3xl font-semibold tabular-nums">{openRequests}</p>
              <p className="text-sm text-ink/60">Open requests</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-semibold tabular-nums">{hours === null ? "—" : `${hours}h`}</p>
              <p className="text-sm text-ink/60">Average response</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-ink/50">Requests per week</p>
          <div className="mt-2">
            <MiniBars points={weeks.map((point) => ({ label: point.label, value: point.opened }))} format={(value) => String(value)} />
          </div>
        </Link>
      </div>

      <section className={cardClass}>
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Waiting</h2>
        <ul className="mt-3 divide-y divide-[#eef2f5]">
          {pending.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm">
              <span>{item.summary}</span>
              <span className="flex gap-2">
                <button type="button" className={primaryClass} onClick={() => decideApproval(item.id, true)}>Approve</button>
                <button type="button" className={quietClass} onClick={() => decideApproval(item.id, false)}>Decline</button>
              </span>
            </li>
          ))}
          {onboarding ? (
            <li className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm">
              <span>{onboarding.name} onboarding</span>
              <Link href={href(`/app/people/${onboarding.id}`)} className={quietClass}>Review</Link>
            </li>
          ) : null}
          {renewal ? (
            <li className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-sm">
              <span>{renewal.vendor} contract renews {shortDay(renewal.date)}</span>
              <Link href={href("/app/spending")} className={quietClass}>Review</Link>
            </li>
          ) : null}
          {!pending.length && !onboarding && !renewal ? <li className="py-2.5 text-sm">None</li> : null}
        </ul>
      </section>

      <button type="button" className={quietClass} onClick={() => setOpen((value) => !value)}>Details</button>
      {open ? (
        <section className={`${cardClass} space-y-4`}>
          <SpendBars data={points.map((point) => ({ label: point.label, spend: point.spend, budget: point.budget }))} onPick={setMonth} />
          {picked ? <p className="text-sm tabular-nums">{picked.label} {money(picked.spend)}</p> : null}
          <ul className="space-y-1 text-sm">
            {devices.map((device) => (
              <li key={device.id}>{device.person} · {device.name}</li>
            ))}
          </ul>
          <ul className="space-y-1 text-sm">
            {repo.outages(demo.workspaceId).map((event) => (
              <li key={event.id}>{event.at} · {event.title}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
