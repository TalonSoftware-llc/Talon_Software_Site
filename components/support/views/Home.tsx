"use client";

import Link from "next/link";
import { useState } from "react";
import { getSupportRepository } from "@/lib/support/data";
import { categoryLabel, formatDay, money, num } from "@/lib/support/format";
import { averageResponseHours } from "@/lib/support/stats";
import { SpendBars } from "../charts";
import { useFrame } from "../frame";
import { usePageContext } from "../page-context";
import { decideApproval } from "../store";
import { useDemo } from "../use-demo";
import { cardClass, primaryClass, quietClass } from "../ui";

const repo = getSupportRepository(null);
const barColors = ["#1f4d45", "#1b2430", "#3e7c6f", "#c4a574", "#6d7c8a", "#8fa89a"];

function systemRole(id: string): string {
  if (id === "aviary" || id === "meadow") return "Charting";
  if (id === "website") return "Website";
  if (id === "internet") return "Internet";
  if (id === "phones") return "Phones";
  return "System";
}

function MiniBars({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-12 items-end gap-1" aria-hidden="true">
      {values.map((value, index) => (
        <div key={index} className="min-w-0 flex-1 rounded-sm bg-pine/80" style={{ height: `${Math.max(12, (value / max) * 100)}%` }} />
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
  const attention = missing.length + devices.length + others.length > 0;
  usePageContext({ section: "home", title: "Home", hints: ["Am I safe?", "What am I spending?"] });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Home</h1>
      <div className="grid gap-4 lg:grid-cols-2">
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
            {others.map((service) => (
              <li key={service.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span>{service.name} · {systemRole(service.id)}</span>
                <Link href={href("/app/security")} className={quietClass}>Review</Link>
              </li>
            ))}
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
            <MiniBars values={points.map((point) => point.spend)} />
          </div>
        </Link>

        <section className={cardClass}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Website</h2>
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
          <p className="mt-3 text-sm tabular-nums text-ink/70">Visits {num(visits)}</p>
          {others.map((service) => (
            <div key={service.id} className="mt-3 flex items-center justify-between text-sm">
              <span>{service.name} <span className="text-ink/50">{systemRole(service.id)}</span></span>
              <span className="rounded-full bg-[#f8f1de] px-2 py-0.5 text-xs font-semibold text-[#6d5420]">{service.status === "Down" ? "Down" : "Slow"}</span>
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
          <div className="mt-4">
            <MiniBars values={points.slice(-6).map((point) => point.opened)} />
          </div>
        </Link>
      </div>

      <section className={cardClass}>
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Waiting</h2>
        <ul className="mt-3 divide-y divide-[#eef2f5]">
          {pending.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span>{item.kind} {item.target}</span>
              <span className="flex gap-2">
                <button type="button" className={primaryClass} onClick={() => decideApproval(item.id, true)}>Approve</button>
                <button type="button" className={quietClass} onClick={() => decideApproval(item.id, false)}>Decline</button>
              </span>
            </li>
          ))}
          {renewal ? (
            <li className="flex items-center justify-between gap-3 py-2.5 text-sm">
              <span>{renewal.vendor} · {formatDay(renewal.date)}</span>
              <Link href={href("/app/spending")} className={quietClass}>Review</Link>
            </li>
          ) : null}
          {!pending.length && !renewal ? <li className="py-2.5 text-sm">None</li> : null}
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
