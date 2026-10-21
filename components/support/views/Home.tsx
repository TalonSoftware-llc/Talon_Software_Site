"use client";

import Link from "next/link";
import { useState } from "react";
import { getSupportRepository } from "@/lib/support/data";
import { categoryLabel, money, num } from "@/lib/support/format";
import { averageResponseHours } from "@/lib/support/stats";
import { SpendBars } from "../charts";
import { usePageContext } from "../page-context";
import { decideApproval } from "../store";
import { useFrame } from "../frame";
import { useDemo } from "../use-demo";
import { primaryClass, quietClass } from "../ui";

const repo = getSupportRepository(null);

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
  const down = services.filter((service) => service.status !== "Operational");
  const site = services.find((service) => service.id === "website");
  const missing = people.filter((person) => person.status === "Active" && !person.mfa).length;
  const devices = people.flatMap((person) =>
    person.devices.filter((device) => device.threatdown !== "Protected").map((device) => ({ ...device, person: person.name })),
  );
  const pending = (demo.approvals[demo.workspaceId] ?? []).filter((item) => item.status === "Pending Talon");
  const toReview = missing + devices.length + down.length;
  const openRequests = tickets.filter((ticket) => ticket.status !== "Resolved").length;
  const hours = averageResponseHours(tickets);
  const points = executive.series;
  const latest = points[points.length - 1];
  const prior = points[points.length - 2];
  const delta = (latest?.spend ?? 0) - (prior?.spend ?? 0);
  const top = [...executive.breakdown].sort((a, b) => b.amount - a.amount).slice(0, 4);
  const picked = points.find((point) => point.label === month);
  const visits = executive.traffic.visitors + demo.pulse * 2;
  usePageContext({ section: "home", title: "Home", hints: ["Am I safe?", "What am I spending?"] });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Home</h1>
      <div className="grid gap-3 md:grid-cols-3">
        <Link href={href("/app/security")} className="rounded-xl border border-[#e1e6ec] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/45">Safe</p>
          <p className="mt-2 text-3xl font-semibold">{toReview ? "Needs attention" : "Protected"}</p>
          <p className="mt-1 text-sm tabular-nums text-ink/70">{toReview} to review</p>
        </Link>
        <Link href={href("/app/spending")} className="rounded-xl border border-[#e1e6ec] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/45">Spending <span className="normal-case tracking-normal">Sample</span></p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{money(executive.monthSpend)}</p>
          <p className="mt-1 text-sm tabular-nums text-ink/70">{delta >= 0 ? "Up" : "Down"} {money(Math.abs(delta))}</p>
          <ul className="mt-3 space-y-1 text-sm">
            {top.map((item) => (
              <li key={item.name} className="flex justify-between gap-3">
                <span>{categoryLabel(item.name)}</span>
                <span className="tabular-nums">{money(item.amount)}</span>
              </li>
            ))}
          </ul>
        </Link>
        <div className="rounded-xl border border-[#e1e6ec] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/45">Up</p>
          <p className="mt-2 text-3xl font-semibold">{down.length ? "No" : "Yes"}</p>
          <p className="mt-1 text-sm text-ink/70">{down.length ? down.map((service) => service.name).join(", ") : `${site?.uptime30 ?? 0}%`}</p>
        </div>
      </div>
      <section className="rounded-xl border border-[#e1e6ec] bg-white p-4 shadow-sm">
        <h2 className="font-semibold">Waiting</h2>
        {pending.length || missing || devices.length || down.length ? (
          <ul className="mt-3 divide-y divide-[#eef2f5]">
            {pending.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span>{item.kind} {item.target}</span>
                <span className="flex gap-2">
                  <button type="button" className={primaryClass} onClick={() => decideApproval(item.id, true)}>Approve</button>
                  <button type="button" className={quietClass} onClick={() => decideApproval(item.id, false)}>Decline</button>
                </span>
              </li>
            ))}
            {missing ? (
              <li className="flex items-center justify-between gap-3 py-2 text-sm">
                <span>{missing} people</span>
                <Link href={href("/app/people?flag=mfa")} className={quietClass}>Review</Link>
              </li>
            ) : null}
            {devices.length ? (
              <li className="flex items-center justify-between gap-3 py-2 text-sm">
                <span>{devices.length} devices</span>
                <Link href={href("/app/security")} className={quietClass}>Review</Link>
              </li>
            ) : null}
            {down.map((service) => (
              <li key={service.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span>{service.name}</span>
                <span>Down</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm">None</p>
        )}
      </section>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href={href("/app/requests")} className="rounded-xl border border-[#e1e6ec] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/45">Open requests</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{openRequests}</p>
        </Link>
        <div className="rounded-xl border border-[#e1e6ec] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/45">Average response</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{hours === null ? "—" : `${hours}h`}</p>
        </div>
      </div>
      <button type="button" className={quietClass} onClick={() => setOpen((value) => !value)}>Details</button>
      {open ? (
        <section className="space-y-4 rounded-xl border border-[#e1e6ec] bg-white p-4 shadow-sm">
          <SpendBars data={points.map((point) => ({ label: point.label, spend: point.spend, budget: point.budget }))} onPick={setMonth} />
          {picked ? <p className="text-sm tabular-nums">{picked.label} {money(picked.spend)}</p> : null}
          <p className="text-sm tabular-nums">Visits {num(visits)}</p>
          <ul className="space-y-1 text-sm">
            {executive.breakdown.map((item) => (
              <li key={item.name} className="flex justify-between"><span>{categoryLabel(item.name)}</span><span className="tabular-nums">{money(item.amount)}</span></li>
            ))}
          </ul>
          <ul className="space-y-1 text-sm">
            {devices.map((device) => (
              <li key={device.id}>{device.person} · {device.name} · Needs attention</li>
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
