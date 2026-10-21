"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { formatWhen, sla } from "@/lib/support/format";
import type { TicketCategory, TicketPriority, TicketStatus } from "@/lib/support/types";
import { useFrame } from "../frame";
import { usePageContext } from "../page-context";
import { addTicket, addTicketNote, clearDraft, isFresh, setTicketStatus } from "../store";
import { useDemo } from "../use-demo";
import { Badge, Empty, PageHeader, fieldClass, primaryClass, quietClass, statusTone } from "../ui";

const statuses: Array<TicketStatus | "All"> = ["All", "Open", "Waiting", "In progress", "Resolved"];
const priorities = ["All", "Urgent", "High", "Normal", "Low"] as const;
const categories: Array<TicketCategory | "All"> = ["All", "Access", "Onboarding", "Offboarding", "Hardware", "Software", "Security"];

export function TicketList() {
  const demo = useDemo();
  const { href } = useFrame();
  const router = useRouter();
  const params = useSearchParams();
  const [sort, setSort] = useState<"updated" | "priority">("updated");
  const [text, setText] = useState("");
  usePageContext({ section: "tickets", title: "Tickets", hints: ["Which tickets are outside the SLA?", "How do I reset a password?", "How do I file a ticket?"] });
  const status = params.get("status") ?? "All";
  const priority = params.get("priority") ?? "All";
  const category = params.get("category") ?? "All";
  const personId = params.get("person");
  let rows = [...(demo.tickets[demo.workspaceId] ?? [])];
  if (status !== "All") rows = rows.filter((ticket) => ticket.status === status);
  if (priority !== "All") rows = rows.filter((ticket) => ticket.priority === priority);
  if (category !== "All") rows = rows.filter((ticket) => ticket.category === category);
  if (personId) rows = rows.filter((ticket) => ticket.requesterId === personId);
  if (text.trim()) {
    const q = text.toLowerCase();
    rows = rows.filter((ticket) => `${ticket.id} ${ticket.subject}`.toLowerCase().includes(q));
  }
  const rank: Record<string, number> = { Urgent: 0, High: 1, Normal: 2, Low: 3 };
  rows.sort((a, b) => (sort === "priority" ? rank[a.priority] - rank[b.priority] : b.updated.localeCompare(a.updated)));

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value === "All" || !value) next.delete(key);
    else next.set(key, value);
    const query = next.toString();
    router.replace(query ? `${href("/app/tickets")}?${query}` : href("/app/tickets"));
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Tickets"
        detail="The queue for this workspace. New tickets stay in this browser."
        actions={<Link href={href("/app/tickets/new")} className={primaryClass}>New ticket</Link>}
      />
      <div className="flex flex-wrap gap-2">
        <select className={fieldClass + " w-auto"} value={status} onChange={(event) => setParam("status", event.target.value)} aria-label="Status">
          {statuses.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select className={fieldClass + " w-auto"} value={priority} onChange={(event) => setParam("priority", event.target.value)} aria-label="Priority">
          {priorities.map((item) => <option key={item}>{item}</option>)}
        </select>
        <select className={fieldClass + " w-auto"} value={category} onChange={(event) => setParam("category", event.target.value)} aria-label="Category">
          {categories.map((item) => <option key={item}>{item}</option>)}
        </select>
        <input className={fieldClass + " max-w-xs"} value={text} onChange={(event) => setText(event.target.value)} placeholder="Filter by word" aria-label="Filter tickets" />
        <button type="button" className={quietClass} onClick={() => setSort(sort === "updated" ? "priority" : "updated")}>Sort: {sort}</button>
      </div>
      {rows.length === 0 ? (
        <Empty title="No tickets match" detail="Clear a filter or file a new one." action={<button type="button" className={quietClass} onClick={() => router.replace(href("/app/tickets"))}>Clear filters</button>} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-[#e1e6ec] bg-white">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-[#eef2f5] text-xs uppercase tracking-[0.12em] text-ink/45">
              <tr><th className="px-3 py-2">Ticket</th><th className="px-3 py-2">Status</th><th className="px-3 py-2">Priority</th><th className="px-3 py-2">SLA</th><th className="px-3 py-2">Updated</th></tr>
            </thead>
            <tbody>
              {rows.map((ticket) => {
                const clock = sla(ticket.resolveBy);
                return (
                  <tr key={ticket.id} className="border-b border-[#f3f5f7] last:border-0">
                    <td className="px-3 py-3"><Link href={href(`/app/tickets/${ticket.id}`)} className="font-semibold text-pine hover:underline">{ticket.id}</Link><span className="mt-0.5 block text-ink">{ticket.subject}</span></td>
                    <td className="px-3 py-3"><Badge tone={statusTone(ticket.status)}>{ticket.status}</Badge></td>
                    <td className="px-3 py-3">{ticket.priority}</td>
                    <td className={`px-3 py-3 ${clock.late && ticket.status !== "Resolved" ? "text-[#7a3030]" : "text-ink/60"}`}>{ticket.status === "Resolved" ? "Closed" : clock.label}</td>
                    <td className="px-3 py-3 text-ink/60">{isFresh(ticket.id) ? "Just now" : formatWhen(ticket.updated)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function TicketDetail({ id }: { id: string }) {
  const demo = useDemo();
  const { href } = useFrame();
  const ticket = (demo.tickets[demo.workspaceId] ?? []).find((item) => item.id === id);
  const [reply, setReply] = useState("");
  const [internal, setInternal] = useState(false);
  const people = demo.people[demo.workspaceId] ?? [];
  usePageContext({
    section: "ticket",
    title: ticket ? ticket.subject : "Ticket",
    subject: id,
    hints: ["Summarize this ticket", "Is it inside the SLA?", "Draft a reply"],
  });
  if (!ticket) return <Empty title="Ticket not in this workspace" detail="It may belong to the other clinic, or the demo was reset." action={<Link href={href("/app/tickets")} className={quietClass}>Back to tickets</Link>} />;
  const requester = people.find((person) => person.id === ticket.requesterId);
  const clock = sla(ticket.resolveBy);
  const notes = demo.role === "leadership" ? ticket.messages : ticket.messages.filter((message) => !message.internal);
  return (
    <div className="space-y-4">
      <PageHeader eyebrow={ticket.id} title={ticket.subject} detail={`${ticket.category} · ${requester?.name ?? "Unknown"} · ${ticket.assignee}`} />
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={statusTone(ticket.status)}>{ticket.status}</Badge>
        <Badge tone={ticket.priority === "Urgent" || ticket.priority === "High" ? "warn" : "mute"}>{ticket.priority}</Badge>
        <span className={`text-sm ${clock.late && ticket.status !== "Resolved" ? "text-[#7a3030]" : "text-ink/60"}`}>{ticket.status === "Resolved" ? "Resolved" : clock.label}</span>
        {demo.role === "leadership" ? (
          <label className="text-sm">
            <span className="sr-only">Status</span>
            <select className={fieldClass + " w-auto"} value={ticket.status} onChange={(event) => setTicketStatus(ticket.id, event.target.value as TicketStatus)}>
              {statuses.filter((item) => item !== "All").map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
        ) : null}
      </div>
      <div className="space-y-3">
        {notes.map((message) => (
          <article key={message.id} className={`rounded-xl border px-4 py-3 text-sm ${message.internal ? "border-[#ead7a4] bg-[#fff8e8]" : "border-[#e1e6ec] bg-white"}`}>
            <p className="text-xs text-ink/50">{message.author} · {message.fresh || isFresh(message.id) ? "Just now" : formatWhen(message.at)}{message.internal ? " · Internal" : ""}</p>
            <p className="mt-1">{message.body}</p>
          </article>
        ))}
      </div>
      {demo.role === "staff" ? <p className="text-xs text-ink/50">Internal notes are hidden on the staff view.</p> : null}
      {ticket.attachments.length ? (
        <p className="text-sm text-ink/60">Sample files: {ticket.attachments.map((file) => `${file.name} (${file.size})`).join(", ")}. They are not downloads.</p>
      ) : null}
      <form
        className="space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          addTicketNote(ticket.id, reply, demo.role === "leadership" && internal);
          setReply("");
        }}
      >
        <label className="text-sm font-semibold" htmlFor="reply">Reply</label>
        <textarea id="reply" className={fieldClass} rows={3} value={reply} onChange={(event) => setReply(event.target.value)} />
        {demo.role === "leadership" ? (
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={internal} onChange={(event) => setInternal(event.target.checked)} /> Internal note</label>
        ) : null}
        <button type="submit" className={primaryClass}>Add to the thread</button>
      </form>
    </div>
  );
}

export function NewTicket() {
  const demo = useDemo();
  const { href } = useFrame();
  const router = useRouter();
  const draft = demo.draft;
  const [subject, setSubject] = useState(draft?.subject ?? "");
  const [detail, setDetail] = useState(draft?.detail ?? "");
  const [category, setCategory] = useState<TicketCategory>(draft?.category ?? "Software");
  const [priority, setPriority] = useState<TicketPriority>(draft?.priority ?? "Normal");
  const [error, setError] = useState("");
  usePageContext({ section: "new-ticket", title: "New ticket", hints: ["What should I include?", "How do I reset a password?"] });

  function submit(event: FormEvent) {
    event.preventDefault();
    if (subject.trim().length < 3 || detail.trim().length < 3) {
      setError("Add a subject and a short description.");
      return;
    }
    const ticket = addTicket({ subject, detail, category, priority });
    clearDraft();
    router.push(href(`/app/tickets/${ticket.id}`));
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-xl space-y-3" autoComplete="off">
      <PageHeader title="New ticket" detail={draft ? "Started from the assistant. Edit it before filing." : "Filed only in this browser."} />
      {error ? <p className="text-sm text-[#7a3030]">{error}</p> : null}
      <label className="block text-sm font-semibold" htmlFor="subject">Subject</label>
      <input id="subject" className={fieldClass} value={subject} onChange={(event) => setSubject(event.target.value)} />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold">Category
          <select className={fieldClass + " mt-1"} value={category} onChange={(event) => setCategory(event.target.value as TicketCategory)}>
            {categories.filter((item) => item !== "All").map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
        <label className="text-sm font-semibold">Priority
          <select className={fieldClass + " mt-1"} value={priority} onChange={(event) => setPriority(event.target.value as TicketPriority)}>
            {(["Low", "Normal", "High", "Urgent"] as const).map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>
      </div>
      <label className="block text-sm font-semibold" htmlFor="detail">What happened</label>
      <textarea id="detail" className={fieldClass} rows={5} value={detail} onChange={(event) => setDetail(event.target.value)} />
      <button type="submit" className={primaryClass}>File ticket</button>
    </form>
  );
}
