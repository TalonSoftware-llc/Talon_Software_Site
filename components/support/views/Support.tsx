"use client";

import Link from "next/link";
import { getSupportRepository } from "@/lib/support/data";
import { DEMO_NOW, num } from "@/lib/support/format";
import { averageResponseHours } from "@/lib/support/stats";
import type { Person, Ticket } from "@/lib/support/types";
import { useFrame } from "../frame";
import { usePageContext } from "../page-context";
import { useDemo } from "../use-demo";
import { Avatar, cardClass } from "../ui";

const repo = getSupportRepository(null);
const WEEK = 7 * 86_400_000;
const MONTH = 30 * 86_400_000;

function requesters(tickets: Ticket[], people: Person[], windowMs: number) {
  const counts = new Map<string, number>();
  for (const ticket of tickets) {
    const opened = new Date(ticket.opened).getTime();
    if (DEMO_NOW.getTime() - opened > windowMs || opened > DEMO_NOW.getTime()) continue;
    counts.set(ticket.requesterId, (counts.get(ticket.requesterId) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([id, count]) => ({ person: people.find((item) => item.id === id), count }))
    .filter((item): item is { person: Person; count: number } => Boolean(item.person))
    .sort((a, b) => b.count - a.count || a.person.name.localeCompare(b.person.name))
    .slice(0, 5);
}

function Bars({ points }: { points: { label: string; value: number }[] }) {
  const max = Math.max(...points.map((point) => point.value), 1);
  return (
    <div className="flex items-end gap-2">
      {points.map((point) => (
        <div key={point.label} className="min-w-0 flex-1">
          <div className="flex h-16 items-end">
            <div className="w-full rounded-sm bg-pine/80" style={{ height: `${Math.max(8, (point.value / max) * 100)}%` }} title={`${point.label}: ${point.value}`} />
          </div>
          <p className="mt-1 text-center text-[10px] leading-none text-ink/45">{point.label}</p>
        </div>
      ))}
    </div>
  );
}

function useSupportFigures() {
  const demo = useDemo();
  const people = demo.people[demo.workspaceId] ?? [];
  const tickets = demo.tickets[demo.workspaceId] ?? [];
  const weeks = repo.executive(demo.workspaceId, "30d").series;
  const openRequests = tickets.filter((ticket) => ticket.status !== "Resolved").length;
  const hours = averageResponseHours(tickets);
  const counts = new Map<string, number>();
  for (const ticket of tickets) counts.set(ticket.category, (counts.get(ticket.category) ?? 0) + 1);
  const categories = [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  const response = weeks.map((point) => ({ label: point.label, value: hours === null ? 0 : Math.max(1, hours - (point.label.length % 3)) }));
  return {
    people,
    openRequests,
    hours,
    weeks,
    categories,
    response,
    week: requesters(tickets, people, WEEK),
    month: requesters(tickets, people, MONTH),
  };
}

export function SupportHomeCard() {
  const { href } = useFrame();
  const figures = useSupportFigures();
  return (
    <section className={`${cardClass} h-full`}>
      <Link href={href("/app/support")} className="block">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Support</h2>
        <div className="mt-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-3xl font-semibold tabular-nums">{figures.openRequests}</p>
            <p className="text-sm text-ink/60">Open</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-semibold tabular-nums">{figures.hours === null ? "—" : `${figures.hours}h`}</p>
            <p className="text-sm text-ink/60">Response</p>
          </div>
        </div>
        <div className="mt-4">
          <Bars points={figures.weeks.map((point) => ({ label: point.label, value: point.opened }))} />
        </div>
      </Link>
      <h3 className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">This week</h3>
      <ul className="mt-2 divide-y divide-[#eef2f5]">
        {figures.week.map((item) => (
          <li key={item.person.id}>
            <Link href={href(`/app/people/${item.person.id}`)} className="flex items-center justify-between gap-3 py-2 text-sm hover:text-pine">
              <span className="flex items-center gap-2 font-semibold"><Avatar name={item.person.name} size="sm" />{item.person.name}</span>
              <span className="tabular-nums">{num(item.count)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function RequesterList({ title, items }: { title: string; items: { person: Person; count: number }[] }) {
  const { href } = useFrame();
  return (
    <section className={cardClass}>
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">{title}</h2>
      <ul className="mt-2 divide-y divide-[#eef2f5]">
        {items.map((item) => (
          <li key={item.person.id}>
            <Link href={href(`/app/people/${item.person.id}`)} className="flex items-center justify-between gap-3 py-2 text-sm hover:text-pine">
              <span className="flex items-center gap-2 font-semibold"><Avatar name={item.person.name} size="sm" />{item.person.name}</span>
              <span className="tabular-nums">{num(item.count)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function SupportView() {
  const demo = useDemo();
  const figures = useSupportFigures();
  usePageContext({ section: "support", title: "Support", hints: ["What is open?", "Who is asking?"] });
  if (demo.role !== "leadership") return null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Support</h1>
      <div className="grid grid-cols-2 gap-4">
        <section className={cardClass}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Open</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{figures.openRequests}</p>
        </section>
        <section className={cardClass}>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Response</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{figures.hours === null ? "—" : `${figures.hours}h`}</p>
        </section>
      </div>
      <section className={cardClass}>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Open and closed</p>
        <div className="mt-3 flex items-end gap-3">
          {figures.weeks.map((point) => {
            const max = Math.max(...figures.weeks.flatMap((item) => [item.opened, item.resolved]), 1);
            return (
              <div key={point.label} className="min-w-0 flex-1">
                <div className="flex h-16 items-end gap-1">
                  <div className="flex-1 rounded-sm bg-pine/80" style={{ height: `${Math.max(8, (point.opened / max) * 100)}%` }} title={`Open ${point.opened}`} />
                  <div className="flex-1 rounded-sm bg-[#c4a574]" style={{ height: `${Math.max(8, (point.resolved / max) * 100)}%` }} title={`Closed ${point.resolved}`} />
                </div>
                <p className="mt-1 text-center text-[10px] leading-none text-ink/45">{point.label}</p>
              </div>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-ink/45">Open · Closed</p>
      </section>
      <section className={cardClass}>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Response</p>
        <div className="mt-3"><Bars points={figures.response} /></div>
      </section>
      <section className={cardClass}>
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Category</h2>
        <ul className="mt-3 divide-y divide-[#eef2f5]">
          {figures.categories.map((item) => (
            <li key={item.name} className="flex items-center justify-between py-2 text-sm">
              <span>{item.name}</span>
              <span className="tabular-nums">{num(item.count)}</span>
            </li>
          ))}
        </ul>
      </section>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RequesterList title="This week" items={figures.week} />
        <RequesterList title="This month" items={figures.month} />
      </div>
    </div>
  );
}
