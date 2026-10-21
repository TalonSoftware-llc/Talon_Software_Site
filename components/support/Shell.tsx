"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { FolderKanban, Home, Inbox, KeyRound, LifeBuoy, Monitor, Settings, Users, Wallet, type LucideIcon } from "lucide-react";
import { getSupportRepository } from "@/lib/support/data";
import AssistantPanel from "./AssistantPanel";
import { FrameProvider, useFrame } from "./frame";
import { bootDemo, markNotice, pushLiveTicket, recoverService, setAssistantOpen, setRole, setWorkspace, tickPulse } from "./store";
import { useDemo } from "./use-demo";

const repo = getSupportRepository(null);

const leadershipNav: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/app", label: "Home", icon: Home },
  { href: "/app/people", label: "People", icon: Users },
  { href: "/app/requests", label: "Requests", icon: Inbox },
  { href: "/app/projects", label: "Projects", icon: FolderKanban },
  { href: "/app/spending", label: "Spending", icon: Wallet },
];

const staffNav: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/app", label: "Get help", icon: LifeBuoy },
  { href: "/app/requests", label: "My requests", icon: Inbox },
  { href: "/app/password", label: "Reset password", icon: KeyRound },
  { href: "/app/devices", label: "My devices", icon: Monitor },
];

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
  const { href, contactHref } = useFrame();
  const pathname = usePathname() || "/app";
  const path = publicPath(pathname);
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const [navPath, setNavPath] = useState(path);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  if (navPath !== path) {
    setNavPath(path);
    setNavOpen(false);
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

  useEffect(() => {
    if (!demo.hydrated || demo.role !== "staff") return;
    const allowed = path === "/app" || ["/app/requests", "/app/password", "/app/devices", "/app/assistant"].some((item) => path === item || path.startsWith(`${item}/`));
    if (!allowed) router.replace(href("/app"));
  }, [demo.hydrated, demo.role, path, href, router]);

  const workspace = repo.workspace(demo.workspaceId);
  const onAssistant = path === "/app/assistant";
  const showDock = demo.hydrated && !onAssistant;
  const mobileChat = showDock && demo.assistantOpen;
  const notices = [...demo.liveNotices, ...repo.notices(demo.workspaceId)].filter(visibleNotice);
  const unread = notices.filter((notice) => !demo.readNoticeIds.includes(notice.id)).length;
  const hits = searchHits(demo.workspaceId, demo.tickets[demo.workspaceId] ?? [], query, demo.role);
  const nav = demo.role === "staff" ? staffNav : leadershipNav;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#f3f5f7] text-ink">
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-52 shrink-0 flex-col bg-[#1b2430] text-white lg:flex">
          <div className="px-4 py-5">
            <p className="font-wordmark text-2xl leading-none">Talon</p>
            <p className="mt-2 text-sm text-white/70">{workspace.name}</p>
          </div>
          <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2">
            {nav.map((item) => (
              <Link key={item.href} href={href(item.href)} aria-current={active(path, item.href) ? "page" : undefined} className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${active(path, item.href) ? "bg-white/10 font-semibold" : "text-white/75 hover:bg-white/5"}`}>
                <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="space-y-2 border-t border-white/10 px-3 py-3 text-xs text-white/60">
            {demo.role === "leadership" ? (
              <Link href={href("/app/settings")} className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${active(path, "/app/settings") ? "bg-white/10 text-white" : "hover:text-white"}`}><Settings className="h-4 w-4" aria-hidden="true" />Settings</Link>
            ) : null}
            <a href={contactHref} className="block px-2 text-white/80 underline">Contact</a>
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex flex-wrap items-center gap-2 border-b border-[#e1e6ec] bg-white px-3 py-2">
            <button type="button" className="rounded-md border border-[#d5dde6] px-2 py-1 text-sm lg:hidden" onClick={() => setNavOpen(true)} aria-label="Open navigation">Menu</button>
            <span className="hidden rounded-full bg-[#f4ecd8] px-2 py-1 text-xs font-semibold text-[#5c4816] sm:inline">Demo data</span>
            <div className="relative min-w-[8rem] flex-1 basis-40">
              <label className="sr-only" htmlFor="portal-search">Search</label>
              <input id="portal-search" value={query} onChange={(event) => { setQuery(event.target.value); setSearchOpen(true); }} onFocus={() => setSearchOpen(true)} placeholder="Search" className="w-full rounded-md border border-[#d5dde6] px-3 py-2 text-sm outline-none focus:border-pine" />
              {searchOpen && query.trim().length >= 2 ? (
                <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border border-[#e1e6ec] bg-white shadow-lg">
                  {hits.length ? hits.map((hit) => (
                    <button key={`${hit.kind}-${hit.id}`} type="button" className="block w-full px-3 py-2 text-left text-sm hover:bg-[#f3f5f7]" onClick={() => { setSearchOpen(false); setQuery(""); router.push(href(hit.href)); }}>
                      {hit.label}
                    </button>
                  )) : <p className="px-3 py-3 text-sm">None</p>}
                </div>
              ) : null}
            </div>
            <div className="relative">
              <button type="button" className="rounded-md border border-[#d5dde6] px-2 py-1 text-sm" onClick={() => setNotesOpen((open) => !open)} aria-label="Alerts">Alerts{unread ? ` ${unread}` : ""}</button>
              {notesOpen ? (
                <div className="absolute right-0 z-30 mt-1 w-64 rounded-md border border-[#e1e6ec] bg-white p-2 shadow-lg">
                  {notices.slice(0, 6).map((notice) => (
                    <button key={notice.id} type="button" className="block w-full rounded-md px-2 py-2 text-left text-sm hover:bg-[#f3f5f7]" onClick={() => { markNotice(notice.id); setNotesOpen(false); router.push(href(notice.href)); }}>
                      {notice.title}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <label className="sr-only" htmlFor="workspace">Workspace</label>
            <select id="workspace" className="hidden rounded-md border border-[#d5dde6] px-2 py-1 text-sm md:block" value={demo.workspaceId} onChange={(event) => setWorkspace(event.target.value)}>
              {repo.workspaces().map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <div className="hidden items-center rounded-md border border-[#d5dde6] p-0.5 text-xs font-semibold lg:flex" aria-label="View">
              {(["leadership", "staff"] as const).map((role) => (
                <button key={role} type="button" className={`rounded px-2 py-1 capitalize ${demo.role === role ? "bg-ink text-white" : "text-ink/60"}`} onClick={() => setRole(role)}>{role}</button>
              ))}
            </div>
          </header>
          <div className="flex min-h-0 flex-1">
            <main className="min-w-0 flex-1 overflow-y-auto">
              {demo.hydrated ? <div className={`p-4 md:p-6 ${mobileChat ? "pb-80 lg:pb-6" : showDock ? "pb-20 lg:pb-6" : ""}`}>{children}</div> : (
                <div className="p-6"><div className="h-8 w-48 animate-pulse rounded bg-[#e4e9ee]" /><div className="mt-4 h-40 animate-pulse rounded-xl bg-[#e4e9ee]" /></div>
              )}
            </main>
            {showDock ? <div className="hidden w-80 shrink-0 border-l border-[#e1e6ec] lg:flex"><AssistantPanel /></div> : null}
          </div>
        </div>
      </div>
      {navOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button type="button" className="absolute inset-0 bg-ink/40" aria-label="Close navigation" onClick={() => setNavOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 overflow-y-auto bg-[#1b2430] p-4 text-white">
            <p className="font-wordmark text-2xl">Talon</p>
            <div className="mt-4 space-y-1">
              {nav.map((item) => <Link key={item.href} href={href(item.href)} className="flex items-center gap-2 rounded-md px-2 py-2 text-sm"><item.icon className="h-4 w-4" aria-hidden="true" />{item.label}</Link>)}
              {demo.role === "leadership" ? <Link href={href("/app/settings")} className="flex items-center gap-2 rounded-md px-2 py-2 text-sm"><Settings className="h-4 w-4" aria-hidden="true" />Settings</Link> : null}
            </div>
            <div className="mt-4 flex rounded-md bg-white p-0.5 text-xs font-semibold text-ink">
              {(["leadership", "staff"] as const).map((role) => (
                <button key={role} type="button" className={`flex-1 rounded px-2 py-1 capitalize ${demo.role === role ? "bg-ink text-white" : ""}`} onClick={() => setRole(role)}>{role}</button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
      {showDock && !mobileChat ? (
        <button type="button" className="fixed inset-x-3 bottom-3 z-30 rounded-full border border-[#d5dde6] bg-white px-4 py-3 text-sm font-semibold shadow-lg lg:hidden" onClick={() => setAssistantOpen(true)}>Ask anything</button>
      ) : null}
      {mobileChat ? (
        <div className="fixed inset-x-0 bottom-0 z-30 flex h-72 flex-col border-t border-[#e1e6ec] bg-white lg:hidden">
          <button type="button" className="border-b border-[#e1e6ec] px-4 py-2 text-left text-sm font-semibold" onClick={() => setAssistantOpen(false)}>Ask anything</button>
          <div className="min-h-0 flex-1">
            <AssistantPanel inputId="assistant-ask-mobile" />
          </div>
        </div>
      ) : null}
      <div className={`pointer-events-none fixed left-4 z-50 flex w-56 flex-col gap-2 ${mobileChat ? "bottom-80 lg:bottom-4" : "bottom-20 lg:bottom-4"}`} aria-live="polite">
        {demo.toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto rounded-lg border border-[#e1e6ec] bg-white px-3 py-2 text-sm font-semibold shadow-lg">{toast.title}</div>
        ))}
      </div>
    </div>
  );
}

function visibleNotice(notice: { title: string; href: string }): boolean {
  const text = `${notice.title} ${notice.href}`.toLowerCase();
  if (text.includes("/security")) return false;
  return !/spend|renew|cedar|invoice|billing|budget/.test(text);
}

function searchHits(workspaceId: string, tickets: { id: string; subject: string; status: string }[], query: string, role: string) {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const found = repo.search(workspaceId, q);
  const people = found.filter((hit) => hit.kind === "Person").slice(0, 4);
  const projects = role === "leadership" ? found.filter((hit) => hit.href.startsWith("/app/projects")).slice(0, 3) : [];
  const ticketHits = tickets
    .filter((ticket) => `${ticket.id} ${ticket.subject}`.toLowerCase().includes(q))
    .slice(0, 4)
    .map((ticket) => ({ kind: "Request" as const, id: ticket.id, label: ticket.subject, href: `/app/requests/${ticket.id}` }));
  return [...ticketHits, ...people.map((hit) => ({ kind: hit.kind, id: hit.id, label: hit.label, href: hit.href })), ...projects.map((hit) => ({ kind: hit.kind, id: hit.id, label: hit.label, href: hit.href }))]
    .filter((hit) => !hit.href.includes("/security"))
    .slice(0, 8);
}
