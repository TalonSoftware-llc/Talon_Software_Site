"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { getSupportRepository } from "@/lib/support/data";
import { formatDay } from "@/lib/support/format";
import type { TicketCategory, TicketStatus } from "@/lib/support/types";
import { useFrame } from "../frame";
import { usePageContext } from "../page-context";
import { addTicket, addTicketNote, isFresh } from "../store";
import { useDemo } from "../use-demo";
import { Badge, fieldClass, primaryClass, statusTone } from "../ui";

const repo = getSupportRepository(null);
const statuses: Array<TicketStatus | "All"> = ["All", "Open", "Waiting", "In progress", "Resolved"];
const types: TicketCategory[] = ["Access", "Onboarding", "Offboarding", "Hardware", "Software", "Security"];

function label(status: string): string {
  return status === "Resolved" ? "Done" : status;
}

export function RequestList() {
  const demo = useDemo();
  const { href } = useFrame();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statuses)[number]>("All");
  const essentials = demo.tier === "essentials";
  const requester = repo.workspace(demo.workspaceId)[essentials || demo.role === "staff" ? "staffId" : "leaderId"];
  const person = (demo.people[demo.workspaceId] ?? []).find((item) => item.id === requester);
  const tickets = (demo.tickets[demo.workspaceId] ?? []).filter((ticket) => {
    if ((essentials || demo.role === "staff") && ticket.requesterId !== requester) return false;
    if (status !== "All" && ticket.status !== status) return false;
    return `${ticket.id} ${ticket.subject}`.toLowerCase().includes(query.toLowerCase());
  });
  usePageContext({ section: "requests", title: essentials || demo.role === "staff" ? "My requests" : "Requests", hints: ["New request", "What is open?"] });

  return (
    <div className={`space-y-4 ${essentials ? "mx-auto max-w-3xl" : ""}`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{essentials || demo.role === "staff" ? "My requests" : "Requests"}</h1>
          {essentials && person ? <p className="mt-1 text-sm text-ink/60">{person.name}</p> : null}
        </div>
        <Link href={href("/app/requests/new")} className={primaryClass}>New request</Link>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input className={fieldClass + " max-w-xs"} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" aria-label="Search" />
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Status">
          {statuses.map((item) => (
            <button key={item} type="button" aria-pressed={status === item} className={`rounded-full px-3 py-1 text-sm font-semibold ${status === item ? "bg-pine text-white" : "border border-[#d5dde6] bg-white text-ink"}`} onClick={() => setStatus(item)}>
              {label(item)}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-[#e1e6ec] bg-white">
        {tickets.length ? (
          <ul className="divide-y divide-[#eef2f5]">
            {tickets.map((ticket) => (
              <li key={ticket.id}>
                <Link href={href(`/app/requests/${ticket.id}`)} className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-[#f7f9fb]">
                  <span><span className="font-semibold">{ticket.subject}</span><span className="mt-0.5 block text-ink/50">{ticket.id}</span></span>
                  {isFresh(ticket.id) ? <Badge tone="ok">Just now</Badge> : <Badge tone={statusTone(ticket.status)}>{label(ticket.status)}</Badge>}
                </Link>
              </li>
            ))}
          </ul>
        ) : <p className="px-4 py-6 text-sm">None</p>}
      </div>
    </div>
  );
}

export function RequestDetail({ id }: { id: string }) {
  const demo = useDemo();
  const ticket = (demo.tickets[demo.workspaceId] ?? []).find((item) => item.id === id);
  const [body, setBody] = useState("");
  const selfId = repo.workspace(demo.workspaceId).staffId;
  const blocked = demo.tier === "essentials" && ticket?.requesterId !== selfId;
  usePageContext({ section: "request", title: ticket && !blocked ? ticket.subject : "Request", subject: ticket?.id, hints: ["New request"] });
  if (!ticket || blocked) return <p className="text-sm">None</p>;
  const messages = ticket.messages.filter((message) => demo.role === "leadership" || !message.internal);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{ticket.subject}</h1>
        <Badge tone={statusTone(ticket.status)}>{label(ticket.status)}</Badge>
      </div>
      <p className="text-xs text-ink/50">{ticket.id} · {formatDay(ticket.updated)}</p>
      <ul className="space-y-2">
        {messages.map((message) => (
          <li key={message.id} className="rounded-xl border border-[#e1e6ec] bg-white p-3 text-sm">
            <p className="text-xs text-ink/50">{message.author}</p>
            <p className="mt-1">{message.body}</p>
          </li>
        ))}
      </ul>
      {demo.role === "staff" ? (
        <form className="space-y-2" onSubmit={(event) => { event.preventDefault(); if (body.trim().length < 2) return; addTicketNote(ticket.id, body.trim(), false); setBody(""); }}>
          <textarea className={fieldClass} rows={3} value={body} onChange={(event) => setBody(event.target.value)} aria-label="Reply" />
          <button type="submit" className={primaryClass}>Send</button>
        </form>
      ) : null}
    </div>
  );
}

export function NewRequest() {
  const demo = useDemo();
  const { href } = useFrame();
  const router = useRouter();
  const [subject, setSubject] = useState(demo.draft?.subject ?? "");
  const [detail, setDetail] = useState(demo.draft?.detail ?? "");
  const [category, setCategory] = useState<TicketCategory>(demo.draft?.category ?? "Access");
  usePageContext({ section: "requests", title: "New request", hints: ["New request"] });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (subject.trim().length < 3 || detail.trim().length < 3) return;
    const ticket = addTicket({ subject, category, priority: demo.draft?.priority ?? "Normal", detail });
    router.push(href(`/app/requests/${ticket.id}`));
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">New request</h1>
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-sm font-semibold">Subject<input className={fieldClass + " mt-1"} value={subject} onChange={(event) => setSubject(event.target.value)} required minLength={3} /></label>
        <label className="block text-sm font-semibold">Type
          <select className={fieldClass + " mt-1"} value={category} onChange={(event) => setCategory(event.target.value as TicketCategory)}>
            {types.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="block text-sm font-semibold">Details<textarea className={fieldClass + " mt-1"} rows={4} value={detail} onChange={(event) => setDetail(event.target.value)} required minLength={3} /></label>
        <button type="submit" className={primaryClass}>Submit</button>
      </form>
    </div>
  );
}
