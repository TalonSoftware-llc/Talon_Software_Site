"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { FilePlus, KeyRound, Monitor, TriangleAlert } from "lucide-react";
import { getSupportRepository } from "@/lib/support/data";
import { useFrame } from "../frame";
import { usePageContext } from "../page-context";
import { ask, setAssistantOpen } from "../store";
import { useDemo } from "../use-demo";
import { Badge, cardClass, fieldClass, primaryClass, quietClass, statusTone } from "../ui";

const repo = getSupportRepository(null);

const tiles = [
  { href: "/app/password", label: "Reset password", icon: KeyRound },
  { href: "/app/requests/new", label: "New request", icon: FilePlus },
  { href: "/app/devices", label: "My devices", icon: Monitor },
  { href: "/app/requests/new", label: "Report a problem", icon: TriangleAlert },
];

export function GetHelp() {
  const demo = useDemo();
  const { href } = useFrame();
  const [query, setQuery] = useState("");
  const staffId = repo.workspace(demo.workspaceId).staffId;
  const open = (demo.tickets[demo.workspaceId] ?? []).filter((ticket) => ticket.requesterId === staffId && ticket.status !== "Resolved");
  usePageContext({ section: "help", title: "Get help", hints: ["Reset password", "New request"] });

  function submit(event: FormEvent) {
    event.preventDefault();
    const text = query.trim();
    if (text.length < 2) return;
    ask(text);
    setAssistantOpen(true);
    setQuery("");
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Get help</h1>
      <form onSubmit={submit} className={`${cardClass} space-y-3`}>
        <label htmlFor="help-ask" className="block text-lg font-semibold">What do you need help with?</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input id="help-ask" className={fieldClass + " py-3 text-base"} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="What do you need help with?" />
          <button type="submit" className={primaryClass}>Ask</button>
        </div>
      </form>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Link key={tile.label} href={href(tile.href)} className={`${cardClass} flex items-center gap-3 hover:border-pine/40`}>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#e7f3ef] text-pine">
              <tile.icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="font-semibold">{tile.label}</span>
          </Link>
        ))}
      </div>
      <section className="overflow-hidden rounded-xl border border-[#e1e6ec] bg-white">
        <h2 className="px-4 pt-4 text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Open requests</h2>
        {open.length ? (
          <ul className="mt-2 divide-y divide-[#eef2f5]">
            {open.map((ticket) => (
              <li key={ticket.id}>
                <Link href={href(`/app/requests/${ticket.id}`)} className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-[#f7f9fb]">
                  <span className="font-semibold">{ticket.subject}</span>
                  <Badge tone={statusTone(ticket.status)}>{ticket.status}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        ) : <p className="px-4 py-6 text-sm">None</p>}
      </section>
    </div>
  );
}

export function ResetPassword() {
  const [done, setDone] = useState("");
  usePageContext({ section: "help", title: "Reset password", hints: ["Reset password"] });
  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
      <div className="flex gap-2">
        <button type="button" className={primaryClass} onClick={() => setDone("Password")}>Password</button>
        <button type="button" className={quietClass} onClick={() => setDone("New phone")}>New phone</button>
      </div>
      {done ? <p className="text-sm">Done</p> : null}
    </div>
  );
}

export function MyDevices() {
  const demo = useDemo();
  const workspace = repo.workspace(demo.workspaceId);
  const person = (demo.people[demo.workspaceId] ?? []).find((item) => item.id === workspace.staffId);
  usePageContext({ section: "devices", title: "My devices", hints: ["Where is my device?"] });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">My devices</h1>
      <ul className="divide-y divide-[#eef2f5] rounded-xl border border-[#e1e6ec] bg-white">
        {(person?.devices ?? []).map((device) => (
          <li key={device.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span>{device.name}</span>
            <Badge tone={device.threatdown === "Protected" ? "ok" : "warn"}>{device.threatdown === "Protected" ? "Protected" : "Needs attention"}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
