"use client";

import Link from "next/link";
import { getSupportRepository } from "@/lib/support/data";
import { DEMO_NOW, num } from "@/lib/support/format";
import { averageResponseHours } from "@/lib/support/stats";
import { useFrame } from "../frame";
import { usePageContext } from "../page-context";
import { useDemo } from "../use-demo";
import { Avatar, cardClass } from "../ui";
import { SystemsHomeCard } from "./Systems";

const repo = getSupportRepository(null);
const WEEK = 7 * 86_400_000;

function MiniBars({ points }: { points: { label: string; value: number }[] }) {
  const max = Math.max(...points.map((point) => point.value), 1);
  return (
    <div className="flex items-end gap-1">
      {points.map((point) => (
        <div key={point.label} className="group relative flex min-w-0 flex-1 flex-col justify-end">
          <div className="flex h-12 items-end">
            <div className="w-full rounded-sm bg-pine/80" style={{ height: `${Math.max(8, (point.value / max) * 100)}%` }} title={`${point.label}: ${point.value}`} />
          </div>
          <span className="pointer-events-none absolute bottom-6 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-[#1b2430] px-1.5 py-0.5 text-[10px] font-semibold text-white group-hover:block">{point.value}</span>
          <span className="mt-1 truncate text-center text-[10px] leading-none text-ink/45">{point.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const demo = useDemo();
  const { href } = useFrame();
  const people = demo.people[demo.workspaceId] ?? [];
  const tickets = demo.tickets[demo.workspaceId] ?? [];
  const weeks = repo.executive(demo.workspaceId, "30d").series;
  const openRequests = tickets.filter((ticket) => ticket.status !== "Resolved").length;
  const hours = averageResponseHours(tickets);
  const counts = new Map<string, number>();
  for (const ticket of tickets) {
    const opened = new Date(ticket.opened).getTime();
    if (DEMO_NOW.getTime() - opened > WEEK || opened > DEMO_NOW.getTime()) continue;
    counts.set(ticket.requesterId, (counts.get(ticket.requesterId) ?? 0) + 1);
  }
  const requesters = [...counts.entries()]
    .map(([id, count]) => ({ person: people.find((item) => item.id === id), count }))
    .filter((item): item is { person: NonNullable<typeof item.person>; count: number } => Boolean(item.person))
    .sort((a, b) => b.count - a.count || a.person.name.localeCompare(b.person.name))
    .slice(0, 5);
  usePageContext({ section: "home", title: "Home", hints: ["Is the website up?", "What is open?"] });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Home</h1>
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
        <SystemsHomeCard />
        <section className={`${cardClass} h-full`}>
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Support</h2>
          <div className="mt-3 flex items-end justify-between gap-4">
            <Link href={href("/app/requests")}>
              <p className="text-3xl font-semibold tabular-nums">{openRequests}</p>
              <p className="text-sm text-ink/60">Open requests</p>
            </Link>
            <div className="text-right">
              <p className="text-3xl font-semibold tabular-nums">{hours === null ? "—" : `${hours}h`}</p>
              <p className="text-sm text-ink/60">Average response</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-ink/50">Requests per week</p>
          <div className="mt-2">
            <MiniBars points={weeks.map((point) => ({ label: point.label, value: point.opened }))} />
          </div>
          <h3 className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Top requesters this week</h3>
          <ul className="mt-2 divide-y divide-[#eef2f5]">
            {requesters.map((item) => (
              <li key={item.person.id}>
                <Link href={href(`/app/people/${item.person.id}`)} className="flex items-center justify-between gap-3 py-2 text-sm hover:text-pine">
                  <span className="flex items-center gap-2 font-semibold"><Avatar name={item.person.name} size="sm" />{item.person.name}</span>
                  <span className="tabular-nums">{num(item.count)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
