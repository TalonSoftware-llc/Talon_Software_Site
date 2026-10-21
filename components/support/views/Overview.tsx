"use client";

import Link from "next/link";
import { useState } from "react";
import { getSupportRepository } from "@/lib/support/data";
import { money, num } from "@/lib/support/format";
import { personFlags, slaRate } from "@/lib/support/stats";
import type { DateRange } from "@/lib/support/types";
import { ScoreLine, SpendBars, SpendDonut, TicketBars, TrafficBars, chartPalette } from "../charts";
import { usePageContext } from "../page-context";
import { refreshFigures } from "../store";
import { useFrame } from "../frame";
import { useDemo } from "../use-demo";
import { Badge, Card, Empty, PageHeader, Skeleton, Stat, statusTone } from "../ui";

const repo = getSupportRepository(null);
const ranges: { id: DateRange; label: string }[] = [
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
  { id: "ytd", label: "Year to date" },
  { id: "12m", label: "12 months" },
];

export default function Overview() {
  const demo = useDemo();
  const { href } = useFrame();
  const [range, setRange] = useState<DateRange>("12m");
  const [loading, setLoading] = useState(false);
  const [slice, setSlice] = useState<string | null>(null);
  const [month, setMonth] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [page, setPage] = useState<string | null>(null);
  const workspace = repo.workspace(demo.workspaceId);
  const people = demo.people[demo.workspaceId] ?? [];
  const tickets = demo.tickets[demo.workspaceId] ?? [];
  const open = tickets.filter((ticket) => ticket.status !== "Resolved");
  const leadership = demo.role === "leadership";
  usePageContext({
    section: "overview",
    title: "Overview",
    hints: leadership
      ? ["Where is spend versus budget?", "What is down right now?", "Who still needs MFA?"]
      : ["What is down right now?", "How do I reset a password?", "Where is my device status?"],
  });

  const executive = repo.executive(demo.workspaceId, range);
  const visitors = executive.traffic.visitors + demo.pulse * 2;
  const selected = executive.breakdown.find((item) => item.name === slice);
  const point = executive.series.find((item) => item.label === month);
  const services = executive.services.map((service) => {
    if (service.id === "aviary" && demo.serviceUp) return { ...service, status: "Operational" as const, responseMs: 220 };
    if (service.id === "aviary") return { ...service, responseMs: service.responseMs + (demo.pulse % 4) * 12 };
    return service;
  });
  const focus = services.find((service) => service.id === serviceId) ?? services.find((service) => service.status !== "Operational") ?? services[0];
  const mfaMissing = people.filter((person) => person.status === "Active" && !person.mfa).length;
  const persona = people.find((person) => person.id === workspace.staffId);

  function choose(next: DateRange) {
    setLoading(true);
    setRange(next);
    setMonth(null);
    window.setTimeout(() => setLoading(false), 350);
  }

  if (!leadership) {
    const mine = tickets.filter((ticket) => ticket.requesterId === workspace.staffId && ticket.status !== "Resolved");
    return (
      <div className="space-y-4">
        <PageHeader eyebrow={workspace.plan} title={`Hello, ${persona?.name.split(" ")[0] ?? "there"}`} detail="Your tickets, your devices, and what is up. Spend stays on the leadership view." />
        <div className="flex flex-wrap gap-2">
          {services.map((service) => (
            <button key={service.id} type="button" onClick={() => setServiceId(service.id)} className="rounded-full border border-[#d5dde6] bg-white px-3 py-1 text-sm">
              <Badge tone={statusTone(service.status)}>{service.status}</Badge> <span className="ml-1">{service.name}</span>
            </button>
          ))}
        </div>
        {focus?.incidents[0] ? <Card><p className="text-sm">{focus.name}: {focus.incidents[0].summary}</p></Card> : null}
        <OutageList />
        <Card>
          <h2 className="font-semibold">Your open tickets</h2>
          {mine.length ? (
            <ul className="mt-3 divide-y divide-[#eef2f5]">
              {mine.map((ticket) => (
                <li key={ticket.id} className="py-2 text-sm">
                  <Link href={href(`/app/tickets/${ticket.id}`)} className="font-semibold text-pine hover:underline">{ticket.id}</Link> {ticket.subject}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-ink/60">Nothing open in your name.</p>
          )}
        </Card>
        <Card>
          <h2 className="font-semibold">Your devices</h2>
          <ul className="mt-2 text-sm text-ink/70">
            {(persona?.devices ?? []).map((device) => (
              <li key={device.id}>{device.name} · patches {persona?.health.patch.toLowerCase()}</li>
            ))}
          </ul>
          <Link href={href("/app/help")} className="mt-3 inline-block text-sm font-semibold text-pine underline">Fix something without a ticket</Link>
        </Card>
      </div>
    );
  }

  const gap = executive.periodSpend - executive.periodBudget;
  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow={`${workspace.name} · ${workspace.plan}`}
        title="Overview"
        detail="Sample figures for a fictional group. The retainer is not a published rate."
        actions={
          <>
            <div className="flex rounded-md border border-[#d5dde6] bg-white p-0.5 text-xs font-semibold">
              {ranges.map((item) => (
                <button key={item.id} type="button" className={`rounded px-2 py-1 ${range === item.id ? "bg-ink text-white" : "text-ink/60"}`} onClick={() => choose(item.id)}>
                  {item.label}
                </button>
              ))}
            </div>
            <button type="button" className="rounded-md border border-[#d5dde6] bg-white px-3 py-1.5 text-sm font-semibold" onClick={() => { setLoading(true); refreshFigures(); window.setTimeout(() => setLoading(false), 350); }}>
              Refresh
            </button>
          </>
        }
      />
      {loading ? (
        <div className="grid gap-3 md:grid-cols-4">{[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-24" />)}</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-4">
          <Stat label={executive.rangeLabel} value={money(executive.periodSpend)} detail={`${gap > 0 ? money(gap) + " over" : money(Math.abs(gap)) + " under"} ${money(executive.periodBudget)}`} />
          <Stat label="October run rate" value={money(executive.monthSpend)} detail={`${money(executive.costPerEmployee)} per person this month`} />
          <Link href={href("/app/tickets?status=Open")} className="block"><Stat label="Open tickets" value={String(open.length)} detail={`${slaRate(tickets)}% of closed tickets met the resolve time`} /></Link>
          <Link href={href("/app/people?flag=mfa")} className="block"><Stat label="Security" value={String(executive.securityScore)} detail={`${mfaMissing} active without MFA`} /></Link>
        </div>
      )}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <h2 className="font-semibold">Where the money goes</h2>
          <p className="text-xs text-ink/50">Click a slice. Talon retainer is a sample.</p>
          <SpendDonut data={executive.breakdown} selected={slice ?? undefined} onPick={(name) => setSlice((current) => (current === name ? null : name))} />
          <div className="mt-2 flex flex-wrap gap-2">
            {executive.breakdown.map((item, index) => (
              <button key={item.name} type="button" className={`rounded-full px-2 py-1 text-xs ${slice === item.name ? "bg-ink text-white" : "bg-[#f3f5f7]"}`} onClick={() => setSlice(item.name)}>
                <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: chartPalette[index % chartPalette.length] }} />
                {item.name}
              </button>
            ))}
          </div>
          {selected ? (
            <ul className="mt-3 space-y-1 text-sm">
              {selected.lines.map((line) => (
                <li key={line.name} className="flex justify-between gap-3"><span>{line.name}</span><span className="tabular-nums">{money(line.amount)}</span></li>
              ))}
              <li className="pt-1"><Link href={href(selected.name === "Talon retainer" ? "/app/billing" : "/app/company/software")} className="font-semibold text-pine underline">Open the detail</Link></li>
            </ul>
          ) : null}
        </Card>
        <Card>
          <h2 className="font-semibold">Spend and budget</h2>
          <p className="text-xs text-ink/50">Click a bar for that period.</p>
          <SpendBars data={executive.series} onPick={setMonth} />
          {point ? <p className="mt-2 text-sm">{point.label}: {money(point.spend)} spent, {money(point.budget)} budget.</p> : null}
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Website</h2>
            <Badge tone="ok">Live</Badge>
          </div>
          <p className="text-sm text-ink/60">{num(visitors)} visitors · {num(executive.traffic.sessions + demo.pulse * 2)} sessions · {executive.traffic.rate}% to an appointment request</p>
          <TrafficBars data={executive.series} onPick={setMonth} />
          <ul className="mt-2 space-y-1 text-sm">
            {executive.traffic.pages.map((item) => (
              <li key={item.path}>
                <button type="button" className="hover:underline" onClick={() => setPage(item.path)}>{item.path}</button>
                <span className="float-right tabular-nums text-ink/50">{num(item.views)}</span>
              </li>
            ))}
          </ul>
          {page ? <p className="mt-2 text-sm">{page} is a sample page on {workspace.website}.</p> : null}
        </Card>
        <Card>
          <h2 className="font-semibold">Tickets</h2>
          <TicketBars data={executive.series} onPick={setMonth} />
          {point ? <p className="mt-2 text-sm">{point.label}: {point.opened} opened, {point.resolved} resolved. <Link href={href("/app/tickets")} className="font-semibold text-pine underline">Open the queue</Link></p> : null}
        </Card>
        <Card>
          <h2 className="font-semibold">Uptime</h2>
          <ul className="mt-2 divide-y divide-[#eef2f5] text-sm">
            {services.map((service) => (
              <li key={service.id}>
                <button type="button" className="flex w-full items-center justify-between gap-3 py-2 text-left" onClick={() => setServiceId(service.id)}>
                  <span>{service.name}</span>
                  <span className="text-ink/50">{service.uptime30}% · {service.responseMs} ms</span>
                  <Badge tone={statusTone(service.status)}>{service.status}</Badge>
                </button>
              </li>
            ))}
          </ul>
          {focus ? <p className="mt-2 text-sm text-ink/70">{focus.incidents[0]?.summary ?? `${focus.name} has no incident in this sample.`}</p> : null}
          <OutageList />
        </Card>
        <Card>
          <h2 className="font-semibold">Security trend</h2>
          <ScoreLine data={executive.series} />
          <Link href={href("/app/security")} className="text-sm font-semibold text-pine underline">Security page</Link>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold">Decisions</h2>
          <ul className="mt-3 space-y-3 text-sm">
            {executive.renewals.map((item) => (
              <li key={item.vendor}><span className="font-semibold">{item.vendor}</span> · {item.date} · {money(item.amount)} · {item.note}</li>
            ))}
            {executive.savings.map((item) => (
              <li key={item.label}>{item.label}: {money(item.amount)} a month. {item.detail}</li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-semibold">Needs a decision</h2>
          <ul className="mt-3 space-y-3 text-sm">
            {executive.risks.map((risk) => (
              <li key={risk.id}>
                <Link href={href(risk.href)} className="font-semibold text-pine hover:underline">{risk.title}</Link>
                <p className="text-ink/70">{risk.detail}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink/50">{mfaMissing} active people without MFA. {people.filter((person) => personFlags(person).includes("Still licensed")).length} offboarding and still licensed.</p>
        </Card>
        <Card>
          <h2 className="font-semibold">Projects</h2>
          <ul className="mt-3 space-y-3">
            {executive.projects.map((project) => (
              <li key={project.id}>
                <div className="flex justify-between text-sm"><Link href={href("/app/projects")} className="font-semibold hover:underline">{project.name}</Link><span>{project.progress}%</span></div>
                <div className="mt-1 h-1.5 rounded-full bg-[#e6ebf0]"><div className="h-1.5 rounded-full bg-pine" style={{ width: `${project.progress}%` }} /></div>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="font-semibold">Backups</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {executive.backups.map((backup) => (
              <li key={backup.id} className="flex items-center justify-between gap-3">
                <span>{backup.label}<span className="block text-ink/60">{backup.detail}</span></span>
                <Badge tone={statusTone(backup.status)}>{backup.status}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>
      {open.length === 0 ? <Empty title="Queue is clear" detail="New requests will show up here." /> : null}
    </div>
  );
}

function channelList(flags: { sms: boolean; email: boolean; push: boolean }): string {
  const names = [flags.sms ? "SMS" : "", flags.email ? "email" : "", flags.push ? "push" : ""].filter(Boolean);
  return names.length ? names.join(", ") : "no channel";
}

function OutageList() {
  const demo = useDemo();
  const { href } = useFrame();
  const events = repo.outages(demo.workspaceId);
  const prefs = demo.prefs;
  return (
    <div className="mt-3 border-t border-[#eef2f5] pt-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">Outage events</h3>
        <Link href={href("/app/settings")} className="text-xs font-semibold text-pine underline">Alert settings</Link>
      </div>
      <p className="mt-1 text-ink/60">
        Internet: {channelList(prefs.internetAlerts)} to {prefs.outageRecipients}. Site: {channelList(prefs.siteAlerts)} to {prefs.outageRecipients}.
      </p>
      <ul className="mt-2 space-y-2">
        {events.map((event) => (
          <li key={event.id}>
            <span className="font-semibold">{event.title}</span> · {event.at} · {event.kind} · {event.status}
            <span className="block text-ink/70">{event.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
