import { getAssistantClient, inferCategory, inferPriority } from "@/lib/support/assistant";
import type { AssistantFacts } from "@/lib/support/assistant";
import { getSupportRepository } from "@/lib/support/data";
import { liveTicket } from "@/lib/support/data/mock";
import { sla } from "@/lib/support/format";
import { compromiseTemplate, directoryLabel, onboardTemplates } from "@/lib/support/identity";
import { personCost } from "@/lib/support/stats";
import type {
  Approval,
  AuditEntry,
  ChatMessage,
  CompromiseNotice,
  PageContext,
  Person,
  RoleView,
  ServiceRequest,
  Ticket,
  TicketDraft,
  TicketMessage,
  TicketStatus,
} from "@/lib/support/types";

const repo = getSupportRepository(null);
const storageKey = "talon-support-demo-v2";

export type Toast = { id: string; title: string; body?: string };

export type AlertChannels = { sms: boolean; email: boolean; push: boolean };

export type DemoPrefs = {
  tickets: boolean;
  uptime: boolean;
  renewals: boolean;
  outageRecipients: "Leadership" | "Clinic leads" | "Everyone";
  internetAlerts: AlertChannels;
  siteAlerts: AlertChannels;
};

const seedApprovals = (): Record<string, Approval[]> => ({
  larkspur: [
    {
      id: "ap-laptop",
      at: "2026-10-20T15:00:00.000Z",
      requestedBy: "Priya Shah",
      status: "Pending Talon",
      kind: "Request",
      summary: "New hire laptop for Theo Marsh",
      target: "Theo Marsh",
      request: {
        kind: "Hardware",
        title: "New hire laptop for Theo Marsh",
        detail: "Greenville start. Standard clinical laptop.",
      },
    },
  ],
  "south-ridge": [],
});

function mergeApprovals(saved: Record<string, Approval[]>): Record<string, Approval[]> {
  const seeds = seedApprovals();
  return {
    larkspur: [...seeds.larkspur.filter((seed) => !saved.larkspur.some((item) => item.id === seed.id)), ...saved.larkspur],
    "south-ridge": [...seeds["south-ridge"].filter((seed) => !saved["south-ridge"].some((item) => item.id === seed.id)), ...saved["south-ridge"]],
  };
}

const defaultPrefs = (): DemoPrefs => ({
  tickets: true,
  uptime: true,
  renewals: true,
  outageRecipients: "Leadership",
  internetAlerts: { sms: true, email: true, push: true },
  siteAlerts: { sms: false, email: true, push: true },
});

export type DemoState = {
  hydrated: boolean;
  workspaceId: string;
  role: RoleView;
  assistantOpen: boolean;
  tickets: Record<string, Ticket[]>;
  people: Record<string, Person[]>;
  messages: ChatMessage[];
  prefs: DemoPrefs;
  readNoticeIds: string[];
  toasts: Toast[];
  pulse: number;
  serviceUp: boolean;
  switching: boolean;
  page: PageContext;
  draft: TicketDraft | null;
  liveNotices: { id: string; title: string; body: string; href: string; at: string }[];
  audit: Record<string, AuditEntry[]>;
  approvals: Record<string, Approval[]>;
  requests: Record<string, ServiceRequest[]>;
  approvalRequired: boolean;
  alerts: Record<string, CompromiseNotice[]>;
};

const greeting: ChatMessage = {
  id: "m-hello",
  role: "assistant",
  text: "Ask anything.",
  shown: "Ask anything.",
  cites: [],
  pending: false,
};

const defaultPage: PageContext = {
  section: "home",
  title: "Home",
  hints: ["Am I safe?", "What am I spending?"],
};

function seedTickets(): Record<string, Ticket[]> {
  return {
    larkspur: repo.seedTickets("larkspur"),
    "south-ridge": repo.seedTickets("south-ridge"),
  };
}

function seedPeople(): Record<string, Person[]> {
  return {
    larkspur: structuredClone(repo.people("larkspur")),
    "south-ridge": structuredClone(repo.people("south-ridge")),
  };
}

function blankLists<T>(): Record<string, T[]> {
  return { larkspur: [], "south-ridge": [] };
}

let state: DemoState = {
  hydrated: false,
  workspaceId: "larkspur",
  role: "leadership",
  assistantOpen: false,
  tickets: seedTickets(),
  people: seedPeople(),
  messages: [greeting],
  prefs: defaultPrefs(),
  readNoticeIds: [],
  toasts: [],
  pulse: 0,
  serviceUp: false,
  switching: false,
  page: defaultPage,
  draft: null,
  liveNotices: [],
  audit: blankLists(),
  approvals: seedApprovals(),
  requests: blankLists(),
  approvalRequired: false,
  alerts: blankLists(),
};

const listeners = new Set<() => void>();
const sessionFresh = new Set<string>();
let serial = 1;
let streamTimer: ReturnType<typeof setInterval> | null = null;
let booted = false;

function emit() {
  listeners.forEach((listener) => listener());
}

function persist() {
  if (!state.hydrated || typeof window === "undefined") return;
  const payload = {
    v: 3,
    workspaceId: state.workspaceId,
    role: state.role,
    assistantOpen: state.assistantOpen,
    tickets: state.tickets,
    people: state.people,
    messages: state.messages.map((message) => ({ ...message, pending: false, shown: message.text })),
    prefs: state.prefs,
    readNoticeIds: state.readNoticeIds,
    audit: state.audit,
    approvals: state.approvals,
    requests: state.requests,
    approvalRequired: state.approvalRequired,
    alerts: state.alerts,
  };
  localStorage.setItem(storageKey, JSON.stringify(payload));
}

function commit(next: DemoState, save = true) {
  state = next;
  if (save) persist();
  emit();
}

export function getDemoState(): DemoState {
  return state;
}

export function subscribeDemo(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isFresh(id: string): boolean {
  return sessionFresh.has(id);
}

function isPerson(value: unknown): value is Person {
  if (!value || typeof value !== "object") return false;
  const person = value as Person;
  return typeof person.id === "string" && typeof person.name === "string" && Array.isArray(person.licenses) && Array.isArray(person.groups);
}

function isTicket(value: unknown): value is Ticket {
  if (!value || typeof value !== "object") return false;
  const ticket = value as Ticket;
  return typeof ticket.id === "string" && typeof ticket.subject === "string" && Array.isArray(ticket.messages);
}

function readSaved(): Partial<DemoState> | null {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      v?: number;
      workspaceId?: string;
      role?: RoleView;
      assistantOpen?: boolean;
      tickets?: Record<string, unknown>;
      people?: Record<string, unknown>;
      messages?: ChatMessage[];
      prefs?: DemoPrefs;
      readNoticeIds?: string[];
      audit?: Record<string, AuditEntry[]>;
      approvals?: Record<string, Approval[]>;
      requests?: Record<string, ServiceRequest[]>;
      approvalRequired?: boolean;
      alerts?: Record<string, CompromiseNotice[]>;
    };
    if (parsed.v !== 3) return null;
    const tickets: Record<string, Ticket[]> = seedTickets();
    for (const id of Object.keys(tickets)) {
      const saved = parsed.tickets?.[id];
      if (Array.isArray(saved) && saved.every(isTicket)) tickets[id] = saved.map((ticket) => ({ ...ticket, fresh: false }));
    }
    const messages = Array.isArray(parsed.messages)
      ? parsed.messages
          .filter((message) => message && typeof message.text === "string" && (message.role === "user" || message.role === "assistant"))
          .map((message) => ({ ...message, shown: message.text, pending: false, cites: message.cites ?? [] }))
      : [greeting];
    const people: Record<string, Person[]> = seedPeople();
    for (const id of Object.keys(people)) {
      const saved = parsed.people?.[id];
      if (Array.isArray(saved) && saved.every(isPerson)) people[id] = saved;
    }
    const lists = <T,>(value: Record<string, T[]> | undefined): Record<string, T[]> => ({
      larkspur: Array.isArray(value?.larkspur) ? value.larkspur : [],
      "south-ridge": Array.isArray(value?.["south-ridge"]) ? value["south-ridge"] : [],
    });
    return {
      workspaceId: parsed.workspaceId === "south-ridge" ? "south-ridge" : "larkspur",
      role: parsed.role === "staff" ? "staff" : "leadership",
      assistantOpen: Boolean(parsed.assistantOpen),
      tickets,
      people,
      messages: messages.length ? messages : [greeting],
      prefs: {
        ...defaultPrefs(),
        tickets: parsed.prefs?.tickets !== false,
        uptime: parsed.prefs?.uptime !== false,
        renewals: parsed.prefs?.renewals !== false,
        outageRecipients: parsed.prefs?.outageRecipients ?? "Leadership",
        internetAlerts: { ...defaultPrefs().internetAlerts, ...parsed.prefs?.internetAlerts },
        siteAlerts: { ...defaultPrefs().siteAlerts, ...parsed.prefs?.siteAlerts },
      },
      readNoticeIds: Array.isArray(parsed.readNoticeIds) ? parsed.readNoticeIds.filter((id) => typeof id === "string") : [],
      audit: lists(parsed.audit),
      approvals: mergeApprovals(lists(parsed.approvals)),
      requests: lists(parsed.requests),
      approvalRequired: Boolean(parsed.approvalRequired),
      alerts: lists(parsed.alerts),
    };
  } catch {
    return null;
  }
}

export function bootDemo() {
  if (booted || typeof window === "undefined") return;
  booted = true;
  const saved = readSaved();
  commit({ ...state, ...saved, assistantOpen: false, hydrated: true }, false);
}

function toast(title: string, body?: string): Toast {
  return { id: `toast-${serial++}`, title, body };
}

function pushToast(title: string, body?: string) {
  void body;
  const item = toast(title);
  commit({ ...state, toasts: [...state.toasts, item].slice(-3) }, false);
  window.setTimeout(() => dismissToast(item.id), 4200);
}

export function dismissToast(id: string) {
  if (!state.toasts.some((item) => item.id === id)) return;
  commit({ ...state, toasts: state.toasts.filter((item) => item.id !== id) }, false);
}

export function publishPage(page: PageContext) {
  if (JSON.stringify(state.page) === JSON.stringify(page)) return;
  commit({ ...state, page }, false);
}

export function setWorkspace(workspaceId: string) {
  if (workspaceId === state.workspaceId) return;
  if (!repo.workspaces().some((workspace) => workspace.id === workspaceId)) return;
  commit({ ...state, workspaceId, switching: true });
  window.setTimeout(() => {
    if (state.workspaceId === workspaceId) commit({ ...state, switching: false }, false);
  }, 420);
}

export function setRole(role: RoleView) {
  commit({ ...state, role });
}

export function setAssistantOpen(assistantOpen: boolean) {
  commit({ ...state, assistantOpen });
}

export function setPrefs(prefs: DemoPrefs) {
  commit({ ...state, prefs });
}

export function markNotice(id: string) {
  if (state.readNoticeIds.includes(id)) return;
  commit({ ...state, readNoticeIds: [...state.readNoticeIds, id] });
}

export function resetDemo() {
  if (streamTimer) {
    clearInterval(streamTimer);
    streamTimer = null;
  }
  sessionFresh.clear();
  localStorage.removeItem(storageKey);
  commit({
    ...state,
    workspaceId: "larkspur",
    role: "leadership",
    tickets: seedTickets(),
    people: seedPeople(),
    messages: [greeting],
    prefs: defaultPrefs(),
    readNoticeIds: [],
    toasts: [],
    pulse: 0,
    serviceUp: false,
    draft: null,
    liveNotices: [],
    page: defaultPage,
    audit: blankLists(),
    approvals: seedApprovals(),
    requests: blankLists(),
    approvalRequired: false,
    alerts: blankLists(),
  });
  pushToast("Demo reset", "Sample tickets and the conversation are back to the start.");
}

function finishStream() {
  if (!streamTimer) return;
  clearInterval(streamTimer);
  streamTimer = null;
  commit({
    ...state,
    messages: state.messages.map((message) => (message.pending ? { ...message, shown: message.text, pending: false } : message)),
  });
}

function facts(): AssistantFacts {
  const workspace = repo.workspace(state.workspaceId);
  const executive = repo.executive(state.workspaceId, "30d");
  const people = state.people[state.workspaceId] ?? [];
  const tickets = state.tickets[state.workspaceId] ?? [];
  const openTickets = tickets.filter((ticket) => ticket.status !== "Resolved").length;
  const mfaMissing = people.filter((person) => person.status === "Active" && !person.mfa).length;
  const degraded = executive.services
    .filter((service) => (service.id === "aviary" && state.serviceUp ? false : service.status !== "Operational"))
    .map((service) => service.name);
  const person = state.page.section === "person" ? people.find((item) => item.name === state.page.subject) : undefined;
  const ticket = state.page.section === "ticket" ? tickets.find((item) => item.id === state.page.subject) : undefined;
  const clock = ticket ? sla(ticket.resolveBy) : undefined;
  return {
    workspaceName: workspace.name,
    plan: workspace.plan,
    role: state.role,
    directory: directoryLabel(workspace.directory),
    monthlySpend: executive.monthSpend,
    monthlyBudget: executive.monthBudget,
    openTickets,
    mfaMissing,
    headcount: people.length,
    degraded,
    person: person
      ? {
          id: person.id,
          name: person.name,
          role: person.role,
          cost: personCost(person).total,
          mfa: person.mfa,
          openTickets: tickets.filter((item) => item.requesterId === person.id && item.status !== "Resolved").length,
        }
      : undefined,
    ticket: ticket
      ? {
          id: ticket.id,
          subject: ticket.subject,
          status: ticket.status,
          sla: clock?.label ?? "",
          category: ticket.category,
          late: clock?.late ?? false,
        }
      : undefined,
  };
}

export function ask(question: string) {
  const trimmed = question.trim();
  if (!trimmed) return;
  finishStream();
  const reply = getAssistantClient().reply({
    question: trimmed,
    pageTitle: state.page.title,
    pageSection: state.page.section,
    hints: state.page.hints,
    facts: facts(),
  });
  const user: ChatMessage = { id: `u-${serial++}`, role: "user", text: trimmed, shown: trimmed, cites: [], pending: false };
  const assistantId = `a-${serial++}`;
  const assistant: ChatMessage = {
    id: assistantId,
    role: "assistant",
    text: reply.text,
    shown: "",
    cites: reply.cites,
    pending: true,
  };
  commit({ ...state, messages: [...state.messages, user, assistant] }, false);
  const parts = reply.text.split(/(\s+)/);
  let cursor = 0;
  streamTimer = setInterval(() => {
    cursor += 2;
    const done = cursor >= parts.length;
    const shown = parts.slice(0, cursor).join("");
    commit(
      {
        ...state,
        messages: state.messages.map((message) =>
          message.id === assistantId ? { ...message, shown, pending: !done } : message,
        ),
      },
      done,
    );
    if (done && streamTimer) {
      clearInterval(streamTimer);
      streamTimer = null;
    }
  }, 32);
}

export function clearMessages() {
  finishStream();
  commit({ ...state, messages: [greeting] });
}

export function draftFromChat(): TicketDraft | null {
  const latest = [...state.messages].reverse().find((message) => message.role === "user");
  if (!latest) {
    pushToast("Ask something first", "The draft uses the latest question.");
    return null;
  }
  const draft: TicketDraft = {
    key: `draft-${serial++}`,
    subject: latest.text.slice(0, 90),
    category: inferCategory(latest.text),
    priority: inferPriority(latest.text),
    detail: latest.text,
  };
  commit({ ...state, draft }, false);
  pushToast("Draft ready");
  return draft;
}

export function clearDraft() {
  if (!state.draft) return;
  commit({ ...state, draft: null }, false);
}

function nextTicketId(workspaceId: string, tickets: Ticket[]): string {
  const prefix = workspaceId === "larkspur" ? "LS" : "SR";
  const numbers = tickets.map((ticket) => Number(ticket.id.split("-")[1])).filter((value) => Number.isFinite(value));
  return `${prefix}-${Math.max(1000, ...numbers) + 1}`;
}

export function personaName(): string {
  const workspace = repo.workspace(state.workspaceId);
  const people = state.people[state.workspaceId] ?? [];
  const person = people.find((item) => item.id === (state.role === "staff" ? workspace.staffId : workspace.leaderId));
  return person?.name ?? "Workspace";
}

export function addTicket(input: { subject: string; category: Ticket["category"]; priority: Ticket["priority"]; detail: string }): Ticket {
  const tickets = state.tickets[state.workspaceId] ?? [];
  const id = nextTicketId(state.workspaceId, tickets);
  const author = personaName();
  const note: TicketMessage = { id: `tm-${serial++}`, author, at: new Date().toISOString(), body: input.detail, fresh: true };
  const ticket: Ticket = {
    id,
    workspaceId: state.workspaceId,
    subject: input.subject.trim(),
    category: input.category,
    priority: input.priority,
    status: "Open",
    requesterId: repo.workspace(state.workspaceId)[state.role === "staff" ? "staffId" : "leaderId"],
    assignee: "Talon Support",
    opened: new Date().toISOString(),
    updated: new Date().toISOString(),
    respondBy: new Date(Date.now() + 4 * 3_600_000).toISOString(),
    resolveBy: new Date(Date.now() + 48 * 3_600_000).toISOString(),
    messages: [note],
    attachments: [],
  };
  sessionFresh.add(id);
  commit({
    ...state,
    draft: null,
    tickets: { ...state.tickets, [state.workspaceId]: [ticket, ...tickets] },
  });
  pushToast("Request filed");
  return ticket;
}

export function setTicketStatus(id: string, status: TicketStatus) {
  const tickets = state.tickets[state.workspaceId] ?? [];
  commit({
    ...state,
    tickets: {
      ...state.tickets,
      [state.workspaceId]: tickets.map((ticket) =>
        ticket.id === id ? { ...ticket, status, updated: new Date().toISOString() } : ticket,
      ),
    },
  });
  pushToast("Updated");
}

export function addTicketNote(id: string, body: string, internal: boolean) {
  const trimmed = body.trim();
  if (!trimmed) return;
  const tickets = state.tickets[state.workspaceId] ?? [];
  const note: TicketMessage = {
    id: `tm-${serial++}`,
    author: internal ? "Talon Support" : personaName(),
    at: new Date().toISOString(),
    body: trimmed,
    internal,
    fresh: true,
  };
  sessionFresh.add(note.id);
  commit({
    ...state,
    tickets: {
      ...state.tickets,
      [state.workspaceId]: tickets.map((ticket) =>
        ticket.id === id ? { ...ticket, updated: note.at, messages: [...ticket.messages, note] } : ticket,
      ),
    },
  });
  pushToast("Saved");
}

export function tickPulse(): number {
  if (state.pulse >= 36) return state.pulse;
  commit({ ...state, pulse: state.pulse + 1 }, false);
  return state.pulse;
}

export function recoverService() {
  if (state.workspaceId !== "larkspur" || state.serviceUp) {
    if (!state.serviceUp && state.workspaceId === "larkspur") commit({ ...state, serviceUp: true }, false);
    return;
  }
  commit({ ...state, serviceUp: true }, false);
  if (state.prefs.uptime) pushToast("Site is back");
}

export function pushLiveTicket() {
  const arriving = liveTicket(state.workspaceId);
  const tickets = state.tickets[state.workspaceId] ?? [];
  if (tickets.some((ticket) => ticket.id === arriving.id)) return;
  sessionFresh.add(arriving.id);
  const notice = {
    id: `live-${arriving.id}`,
    title: arriving.subject,
    body: "New request in the queue.",
    href: `/app/requests/${arriving.id}`,
    at: "Just now",
  };
  commit({
    ...state,
    tickets: { ...state.tickets, [state.workspaceId]: [{ ...arriving, fresh: true }, ...tickets] },
    liveNotices: [notice, ...state.liveNotices],
  });
  if (state.prefs.tickets) pushToast("New request");
}

export function refreshFigures() {
  commit({ ...state, pulse: Math.min(36, state.pulse + 1) }, false);
  pushToast("Refreshed");
}

function peopleNow(): Person[] {
  return state.people[state.workspaceId] ?? [];
}

function withAudit(action: string, target: string, detail: string, result: AuditEntry["result"]): Record<string, AuditEntry[]> {
  const entry: AuditEntry = {
    id: `aud-${serial++}`,
    at: new Date().toISOString(),
    actor: `${personaName()} · user administrator`,
    action,
    target,
    detail,
    result,
  };
  return { ...state.audit, [state.workspaceId]: [entry, ...(state.audit[state.workspaceId] ?? [])] };
}

export function setApprovalRequired(approvalRequired: boolean) {
  commit({ ...state, approvalRequired });
}

export function onboardPerson(
  input: { name: string; templateId: string; location: string; managerId: string; startDate: string },
  stepUp: boolean,
): { ok: boolean; reason?: string } {
  if (state.role !== "leadership") return { ok: false, reason: "Only the leadership view can onboard someone." };
  if (!stepUp) return { ok: false, reason: "MFA step-up is required." };
  const workspace = repo.workspace(state.workspaceId);
  const template = onboardTemplates(
    workspace.directory,
    workspace.pims,
    workspace.directory === "google" ? 22 : 26,
    workspace.directory === "google" ? 70 : 80,
  ).find((item) => item.id === input.templateId);
  const name = input.name.trim();
  if (!template || name.length < 3) return { ok: false, reason: "Enter a name and choose a role template." };
  const id = `p-new-${serial++}`;
  const [first, ...rest] = name.toLowerCase().split(/\s+/);
  const email = `${first}.${rest.join("") || "hire"}@${workspace.domain}`;
  const person: Person = {
    id,
    name,
    role: template.title,
    department: template.department,
    location: input.location,
    managerId: input.managerId || workspace.leaderId,
    email,
    phone: "(828) 555-0199",
    startDate: input.startDate || "2026-11-02",
    status: "Onboarding",
    mfa: false,
    training: "Due",
    licenses: template.licenses,
    devices: template.devices.map((device, index) => ({
      id: `${id}-d${index}`,
      name: device.name,
      type: device.type,
      purchased: "2026-10-21",
      refreshDue: "2030-10-21",
      price: device.price,
      join: workspace.directory === "entra" ? "Entra" : "Google",
      primaryUser: email,
      threatdown: "Protected" as const,
    })),
    groups: template.groups,
    privileged: false,
    accountEnabled: true,
    health: { patch: "Pending", checkIn: "2026-10-21", encryption: true },
  };
  if (state.approvalRequired) {
    const approval: Approval = {
      id: `ap-${serial++}`,
      at: new Date().toISOString(),
      requestedBy: personaName(),
      status: "Pending Talon",
      kind: "Onboard",
      summary: `${name} · ${template.label}`,
      target: name,
      person,
    };
    commit({
      ...state,
      approvals: { ...state.approvals, [state.workspaceId]: [approval, ...(state.approvals[state.workspaceId] ?? [])] },
      audit: withAudit("Onboard", name, "Waiting for Talon. No directory was called.", "Queued"),
    });
    pushToast("Waiting");
    return { ok: true };
  }
  commit({
    ...state,
    people: { ...state.people, [state.workspaceId]: [person, ...peopleNow()] },
    audit: withAudit("Onboard", name, `${template.label}: ${template.groups.join(", ")} and ${template.licenses.map((item) => item.name).join(", ")}.`, "Applied"),
  });
  pushToast("Added");
  return { ok: true };
}

export function updatePerson(
  personId: string,
  patch: Partial<Pick<Person, "role" | "department" | "managerId" | "groups" | "licenses">>,
  stepUp: boolean,
): { ok: boolean; reason?: string } {
  const person = peopleNow().find((item) => item.id === personId);
  if (state.role !== "leadership") return { ok: false, reason: "Only the leadership view can update an account." };
  if (!person) return { ok: false, reason: "That person is not in this workspace." };
  if (person.privileged) return { ok: false, reason: "Privileged roles cannot be changed here." };
  const risky = patch.groups !== undefined || patch.licenses !== undefined || patch.department !== undefined;
  if (risky && !stepUp) return { ok: false, reason: "MFA step-up is required for groups, licenses, or department." };
  const next: Person = { ...person, ...patch };
  const detail = `Title ${next.role}. Department ${next.department}. Groups ${next.groups.join(", ") || "none"}.`;
  if (state.approvalRequired && risky) {
    const approval: Approval = {
      id: `ap-${serial++}`,
      at: new Date().toISOString(),
      requestedBy: personaName(),
      status: "Pending Talon",
      kind: "Update",
      summary: detail,
      target: person.name,
      personId,
      patch,
    };
    commit({
      ...state,
      approvals: { ...state.approvals, [state.workspaceId]: [approval, ...(state.approvals[state.workspaceId] ?? [])] },
      audit: withAudit("Update", person.name, "Waiting for Talon.", "Queued"),
    });
    pushToast("Waiting");
    return { ok: true };
  }
  commit({
    ...state,
    people: { ...state.people, [state.workspaceId]: peopleNow().map((item) => (item.id === personId ? next : item)) },
    audit: withAudit("Update", person.name, detail, "Applied"),
  });
  pushToast("Saved");
  return { ok: true };
}

export function offboardPerson(personId: string, stepUp: boolean): { ok: boolean; reason?: string } {
  const person = peopleNow().find((item) => item.id === personId);
  if (state.role !== "leadership") return { ok: false, reason: "Only the leadership view can offboard someone." };
  if (!person) return { ok: false, reason: "That person is not in this workspace." };
  if (person.privileged) return { ok: false, reason: "Privileged roles cannot be offboarded here." };
  if (!stepUp) return { ok: false, reason: "MFA step-up is required." };
  if (!person.accountEnabled && person.licenses.length === 0) return { ok: false, reason: "This account is already closed." };
  const manager = peopleNow().find((item) => item.id === person.managerId);
  const workspace = repo.workspace(state.workspaceId);
  const transfer = workspace.directory === "entra" ? "Mailbox forwards to" : "Drive and Gmail transfer to";
  const detail = `Disable account, revoke sessions, remove licenses, ${transfer} ${manager?.name ?? "the manager"}, recover ${person.devices.map((device) => device.name).join(", ") || "no devices"}.`;
  if (state.approvalRequired) {
    const approval: Approval = {
      id: `ap-${serial++}`,
      at: new Date().toISOString(),
      requestedBy: personaName(),
      status: "Pending Talon",
      kind: "Offboard",
      summary: detail,
      target: person.name,
      personId,
    };
    commit({
      ...state,
      approvals: { ...state.approvals, [state.workspaceId]: [approval, ...(state.approvals[state.workspaceId] ?? [])] },
      audit: withAudit("Offboard", person.name, "Waiting for Talon.", "Queued"),
    });
    pushToast("Waiting");
    return { ok: true };
  }
  commit({
    ...state,
    people: {
      ...state.people,
      [state.workspaceId]: peopleNow().map((item) =>
        item.id === personId ? { ...item, status: "Offboarding", accountEnabled: false, licenses: [], devices: [], groups: [] } : item,
      ),
    },
    audit: withAudit("Offboard", person.name, detail, "Applied"),
  });
  pushToast("Removed");
  return { ok: true };
}

export function sendCompromiseAlert(personId: string, lock: boolean): { ok: boolean; reason?: string } {
  if (state.role !== "leadership") return { ok: false, reason: "Only the leadership view can send this notice." };
  const person = peopleNow().find((item) => item.id === personId);
  if (!person) return { ok: false, reason: "That person is not in this workspace." };
  const workspace = repo.workspace(state.workspaceId);
  const template = compromiseTemplate(workspace.name, person);
  const recipients = peopleNow().filter((item) => item.accountEnabled).length;
  const lockBlocked = lock && person.privileged;
  const willLock = lock && !person.privileged && person.accountEnabled;
  const notice: CompromiseNotice = {
    id: `cmp-${serial++}`,
    at: new Date().toISOString(),
    personId: person.id,
    personName: person.name,
    email: person.email,
    subject: template.subject,
    body: template.body,
    locked: willLock,
    lockNote: lockBlocked
      ? "Notice sent. The account was not disabled because the role is privileged."
      : willLock
        ? "Account disabled and sessions revoked. Licenses stay until an offboard."
        : "Notice sent. The account was left enabled.",
    status: "Queued",
    deliveredTo: 0,
  };
  const workspaceId = state.workspaceId;
  commit({
    ...state,
    people: {
      ...state.people,
      [workspaceId]: willLock ? peopleNow().map((item) => (item.id === person.id ? { ...item, accountEnabled: false } : item)) : peopleNow(),
    },
    alerts: { ...state.alerts, [workspaceId]: [notice, ...(state.alerts[workspaceId] ?? [])] },
    audit: withAudit("Compromised account", person.name, notice.lockNote, "Applied"),
    liveNotices: [
      { id: notice.id, title: person.name, body: "", href: "/app/security/lock", at: "Just now" },
      ...state.liveNotices,
    ],
  });
  const noticeId = notice.id;
  window.setTimeout(() => {
    const current = state.alerts[workspaceId] ?? [];
    if (!current.some((item) => item.id === noticeId)) return;
    commit({
      ...state,
      alerts: {
        ...state.alerts,
        [workspaceId]: current.map((item) => (item.id === noticeId ? { ...item, status: "Delivered", deliveredTo: recipients } : item)),
      },
    });
    pushToast("Sent");
  }, 700);
  pushToast("Queued");
  return { ok: true };
}

export function decideApproval(id: string, accept: boolean) {
  if (state.role !== "leadership") return;
  const queue = state.approvals[state.workspaceId] ?? [];
  const item = queue.find((approval) => approval.id === id);
  if (!item || item.status !== "Pending Talon") return;
  const status = accept ? "Approved" : "Declined";
  let people = peopleNow();
  if (accept && item.kind === "Onboard" && item.person) people = [item.person, ...people];
  if (accept && item.kind === "Update" && item.personId && item.patch) {
    people = people.map((person) => (person.id === item.personId ? { ...person, ...item.patch } : person));
  }
  if (accept && item.kind === "Offboard" && item.personId) {
    people = people.map((person) =>
      person.id === item.personId ? { ...person, status: "Offboarding", accountEnabled: false, licenses: [], devices: [], groups: [] } : person,
    );
  }
  let requests = state.requests[state.workspaceId] ?? [];
  if (accept && item.kind === "Request" && item.request) {
    const ticket = addTicket({
      subject: item.request.title,
      detail: item.request.detail,
      category: item.request.kind === "Hardware" ? "Hardware" : item.request.kind === "Software" ? "Software" : "Access",
      priority: "Normal",
    });
    requests = [{ ...item.request, id: `req-${serial++}`, status: "Filed", ticketId: ticket.id }, ...requests];
  }
  commit({
    ...state,
    people: { ...state.people, [state.workspaceId]: people },
    requests: { ...state.requests, [state.workspaceId]: requests },
    approvals: {
      ...state.approvals,
      [state.workspaceId]: queue.map((approval) => (approval.id === id ? { ...approval, status } : approval)),
    },
    audit: withAudit(item.kind, item.target, accept ? "Talon approval applied in the demo." : "Declined in the demo.", accept ? "Applied" : "Blocked"),
  });
  pushToast(accept ? "Approved" : "Declined", item.summary);
}

export function submitRequest(input: Omit<ServiceRequest, "id" | "status" | "ticketId">): { ok: boolean; ticketId?: string } {
  const needsQueue = state.approvalRequired;
  if (needsQueue) {
    const approval: Approval = {
      id: `ap-${serial++}`,
      at: new Date().toISOString(),
      requestedBy: personaName(),
      status: "Pending Talon",
      kind: "Request",
      summary: input.title,
      target: input.title,
      request: input,
    };
    commit({
      ...state,
      approvals: { ...state.approvals, [state.workspaceId]: [approval, ...(state.approvals[state.workspaceId] ?? [])] },
      audit: withAudit(input.kind, input.title, "Waiting for approval.", "Queued"),
    });
    pushToast("Waiting");
    return { ok: true };
  }
  const ticket = addTicket({
    subject: input.title,
    detail: input.detail,
    category: input.kind === "Hardware" ? "Hardware" : input.kind === "Software" ? "Software" : "Access",
    priority: "Normal",
  });
  const request: ServiceRequest = { ...input, id: `req-${serial++}`, status: "Filed", ticketId: ticket.id };
  commit({
    ...state,
    requests: { ...state.requests, [state.workspaceId]: [request, ...(state.requests[state.workspaceId] ?? [])] },
  });
  return { ok: true, ticketId: ticket.id };
}
