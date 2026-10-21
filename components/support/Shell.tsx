"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { getSupportRepository } from "@/lib/support/data";
import { directoryLabel } from "@/lib/support/identity";
import AssistantPanel from "./AssistantPanel";
import { FrameProvider, useFrame } from "./frame";
import {
  bootDemo,
  markNotice,
  pushLiveTicket,
  recoverService,
  setAssistantOpen,
  setRole,
  setWorkspace,
  tickPulse,
} from "./store";
import { useDemo } from "./use-demo";

const repo = getSupportRepository(null);

const nav = [
  ["/app", "Overview"],
  ["/app/tickets", "Tickets"],
  ["/app/help", "Help"],
  ["/app/people", "People"],
  ["/app/knowledge", "Knowledge"],
  ["/app/company", "Company"],
  ["/app/security", "Security"],
  ["/app/projects", "Projects"],
  ["/app/reports", "Reports"],
  ["/app/billing", "Billing"],
] as const;

function publicPath(pathname: string): string {
  if (pathname === "/support") return "/";
  if (pathname.startsWith("/support/")) return pathname.slice("/support".length);
  return pathname || "/";
}

function active(path: string, item: string): boolean {
  if (item === "/app") return path === "/app";
  return path === item || path.startsWith(`${item}/`);
}

export default function Shell({
  demo,
  prefix,
  contactHref,
  children,
}: {
  demo: boolean;
  prefix: string;
  contactHref: string;
  children: ReactNode;
}) {
  return (
    <FrameProvider demo={demo} prefix={prefix} contactHref={contactHref}>
      <Chrome>{children}</Chrome>
    </FrameProvider>
  );
}

function Chrome({ children }: { children: ReactNode }) {
  const demo = useDemo();
  const { href, demo: showDemo, contactHref } = useFrame();
  const pathname = usePathname() || "/app";
  const path = publicPath(pathname);
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [navPath, setNavPath] = useState(path);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  if (navPath !== path) {
    setNavPath(path);
    setNavOpen(false);
    setSheet(false);
    setSearchOpen(false);
  }

  useEffect(() => {
    bootDemo();
    const id = window.setInterval(() => {
      const pulse = tickPulse();
      if (pulse === 6) recoverService();
      if (pulse === 10) pushLiveTicket();
    }, 4000);
    return () => window.clearInterval(id);
  }, []);

  const workspace = repo.workspace(demo.workspaceId);
  const people = demo.people[demo.workspaceId] ?? [];
  const persona = people.find((person) => person.id === (demo.role === "staff" ? workspace.staffId : workspace.leaderId));
  const onAssistant = path === "/app/assistant";
  const showDock = demo.hydrated && demo.assistantOpen && !onAssistant;
  const notices = [...demo.liveNotices, ...repo.notices(demo.workspaceId)];
  const unread = notices.filter((notice) => !demo.readNoticeIds.includes(notice.id)).length;
  const hits = searchHits(demo.workspaceId, demo.tickets[demo.workspaceId] ?? [], query);

  function toggleAsk() {
    if (window.matchMedia("(min-width: 1024px)").matches) setAssistantOpen(!demo.assistantOpen);
    else setSheet(true);
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#f3f5f7] text-ink">
      {showDemo ? (
        <p className="bg-[#f4ecd8] px-4 py-1.5 text-center text-xs text-[#5c4816]">
          Demo workspace. {workspace.name} is fictional. Sign-in on this site does not save what you type.
        </p>
      ) : null}
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-56 shrink-0 flex-col bg-[#1b2430] text-white lg:flex">
          <div className="px-4 py-5">
            <p className="font-wordmark text-2xl leading-none">Talon</p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-white/50">Support</p>
          </div>
          <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2">
            {nav.map(([item, label]) => (
              <Link
                key={item}
                href={href(item)}
                aria-current={active(path, item) ? "page" : undefined}
                className={`block rounded-md px-3 py-2 text-sm ${active(path, item) ? "bg-white/10 font-semibold" : "text-white/75 hover:bg-white/5"}`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="space-y-2 border-t border-white/10 px-3 py-3 text-xs text-white/60">
            <Link href={href("/app/settings")} className={`block rounded-md px-2 py-1.5 ${active(path, "/app/settings") ? "bg-white/10 text-white" : "hover:text-white"}`}>
              Settings
            </Link>
            <p>{workspace.plan} · {directoryLabel(workspace.directory)}</p>
            <a href={contactHref} className="block text-white/80 underline">
              Contact Talon
            </a>
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-2 border-b border-[#e1e6ec] bg-white px-3 py-2">
            <button type="button" className="rounded-md border border-[#d5dde6] px-2 py-1 text-sm lg:hidden" onClick={() => setNavOpen(true)} aria-label="Open navigation">
              Menu
            </button>
            <div className="relative min-w-0 flex-1">
              <label className="sr-only" htmlFor="portal-search">Search</label>
              <input
                id="portal-search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search people, tickets, articles"
                className="w-full rounded-md border border-[#d5dde6] px-3 py-2 text-sm outline-none focus:border-pine"
              />
              {searchOpen && query.trim().length >= 2 ? (
                <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-[#e1e6ec] bg-white shadow-lg">
                  {hits.length ? (
                    hits.map((hit) => (
                      <button
                        key={`${hit.kind}-${hit.id}`}
                        type="button"
                        className="block w-full px-3 py-2 text-left text-sm hover:bg-[#f3f5f7]"
                        onClick={() => {
                          setSearchOpen(false);
                          setQuery("");
                          router.push(href(hit.href));
                        }}
                      >
                        <span className="text-xs uppercase tracking-wide text-ink/40">{hit.kind}</span>
                        <span className="mt-0.5 block">{hit.label}</span>
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-3 text-sm text-ink/60">Nothing matches.</p>
                  )}
                </div>
              ) : null}
            </div>
            <div className="relative">
              <button type="button" className="rounded-md border border-[#d5dde6] px-2 py-1 text-sm" onClick={() => setNotesOpen((open) => !open)} aria-label="Notifications">
                Alerts{unread ? ` (${unread})` : ""}
              </button>
              {notesOpen ? (
                <div className="absolute right-0 z-30 mt-1 w-72 rounded-md border border-[#e1e6ec] bg-white p-2 shadow-lg">
                  {notices.map((notice) => (
                    <button
                      key={notice.id}
                      type="button"
                      className="block w-full rounded-md px-2 py-2 text-left text-sm hover:bg-[#f3f5f7]"
                      onClick={() => {
                        markNotice(notice.id);
                        setNotesOpen(false);
                        router.push(href(notice.href));
                      }}
                    >
                      <span className="font-semibold">{notice.title}</span>
                      <span className="mt-0.5 block text-ink/60">{notice.body}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <button type="button" className="rounded-md bg-pine px-2 py-1 text-sm font-semibold text-white lg:hidden" onClick={() => setSheet(true)}>
              Ask
            </button>
            <button type="button" className="hidden rounded-md border border-[#d5dde6] px-2 py-1 text-sm lg:inline" onClick={toggleAsk}>
              {demo.assistantOpen ? "Hide assistant" : "Ask"}
            </button>
            <label className="sr-only" htmlFor="workspace">Workspace</label>
            <select id="workspace" className="hidden rounded-md border border-[#d5dde6] px-2 py-1 text-sm md:block" value={demo.workspaceId} onChange={(event) => setWorkspace(event.target.value)}>
              {repo.workspaces().map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            <div className="hidden items-center rounded-md border border-[#d5dde6] p-0.5 text-xs font-semibold lg:flex" aria-label="Demo view">
              {(["leadership", "staff"] as const).map((role) => (
                <button key={role} type="button" className={`rounded px-2 py-1 capitalize ${demo.role === role ? "bg-ink text-white" : "text-ink/60"}`} onClick={() => setRole(role)}>
                  {role}
                </button>
              ))}
            </div>
          </header>
          <div className="flex min-h-0 flex-1">
            <main className="relative min-w-0 flex-1 overflow-y-auto">
              {demo.hydrated ? (
                <div className="p-4 md:p-6">
                  <p className="mb-4 text-xs text-ink/50">
                    Viewing as {persona?.name ?? "the workspace"} · {demo.role === "leadership" ? "User administrator" : "Staff"} · sample data
                    {demo.pulse > 0 ? ` · live ${demo.pulse * 4}s` : ""}
                  </p>
                  {children}
                  {demo.switching ? <div className="absolute inset-0 bg-white/70 p-6 text-sm">Opening workspace…</div> : null}
                </div>
              ) : (
                <div className="p-6">
                  <div className="h-8 w-48 animate-pulse rounded bg-[#e4e9ee]" />
                  <div className="mt-4 h-40 animate-pulse rounded-xl bg-[#e4e9ee]" />
                </div>
              )}
            </main>
            {showDock ? (
              <div className="hidden w-[22.5rem] shrink-0 border-l border-[#e1e6ec] lg:flex">
                <AssistantPanel />
              </div>
            ) : null}
          </div>
        </div>
      </div>
      {!demo.assistantOpen && !onAssistant && demo.hydrated ? (
        <button type="button" className="fixed bottom-6 right-0 hidden rounded-l-md bg-pine px-2 py-3 text-sm font-semibold text-white lg:block" onClick={() => setAssistantOpen(true)}>
          Ask
        </button>
      ) : null}
      {navOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Close navigation" onClick={() => setNavOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 overflow-y-auto bg-[#1b2430] p-4 text-white">
            <p className="font-wordmark text-2xl">Talon</p>
            <div className="mt-4 space-y-1">
              {nav.map(([item, label]) => (
                <Link key={item} href={href(item)} className="block rounded-md px-2 py-2 text-sm">{label}</Link>
              ))}
              <Link href={href("/app/settings")} className="block rounded-md px-2 py-2 text-sm">Settings</Link>
            </div>
          </div>
        </div>
      ) : null}
      {sheet ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Close assistant" onClick={() => setSheet(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[min(100%,22.5rem)] bg-white shadow-xl">
            <AssistantPanel />
          </div>
        </div>
      ) : null}
      <div className="pointer-events-none fixed bottom-4 left-4 z-50 flex w-72 flex-col gap-2" aria-live="polite">
        {demo.toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto rounded-lg border border-[#e1e6ec] bg-white p-3 shadow-lg">
            <p className="text-sm font-semibold">{toast.title}</p>
            {toast.body ? <p className="mt-1 text-xs text-ink/60">{toast.body}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function searchHits(workspaceId: string, tickets: { id: string; subject: string; status: string }[], query: string) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const base = repo.search(workspaceId, q).filter((hit) => hit.kind !== "Ticket");
  const ticketHits = tickets
    .filter((ticket) => `${ticket.id} ${ticket.subject}`.toLowerCase().includes(q))
    .slice(0, 4)
    .map((ticket) => ({ kind: "Ticket" as const, id: ticket.id, label: `${ticket.id} ${ticket.subject}`, detail: ticket.status, href: `/app/tickets/${ticket.id}` }));
  return [...ticketHits, ...base].slice(0, 8);
}
