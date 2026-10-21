import { money } from "./format";
import type { ChatCite, RoleView, TicketCategory, TicketPriority } from "./types";

/**
 * Public demo seam for the support assistant.
 *
 * The portal is reachable without a sign-in. getAssistantClient() returns a
 * scripted client that builds replies in the browser. It does not read an API
 * key, call an AI SDK, or make a network request.
 *
 * Containment for a later authenticated backend: one tenant workspace, no
 * training on that company's data, answers limited to the signed-in role, and
 * redaction of secrets and leadership figures the role cannot see.
 *
 * When getSupportPrincipal() starts returning a session, replace the body of
 * getAssistantClient() with a client that talks to an authenticated backend.
 * Do not point the public demo at a model.
 */

export type AssistantFacts = {
  workspaceName: string;
  plan: string;
  role: RoleView;
  directory: string;
  monthlySpend: number;
  monthlyBudget: number;
  openTickets: number;
  mfaMissing: number;
  headcount: number;
  degraded: string[];
  person?: { name: string; role: string; cost: number; mfa: boolean; openTickets: number; id: string };
  ticket?: { id: string; subject: string; status: string; sla: string; category: string; late: boolean };
};

export type AssistantTurn = {
  question: string;
  pageTitle: string;
  pageSection: string;
  hints: string[];
  facts: AssistantFacts;
};

export type AssistantReply = {
  text: string;
  cites: ChatCite[];
};

export interface AssistantClient {
  reply(turn: AssistantTurn): AssistantReply;
}

function link(title: string, href: string): ChatCite {
  return { title, href };
}

export function draftAssistantReply(turn: AssistantTurn): AssistantReply {
  const q = turn.question.toLowerCase();
  const facts = turn.facts;
  const leadership = facts.role === "leadership";
  const hidden = "That figure is on the leadership view.";

  if (/\b\d{6}\b/.test(turn.question) || /password is\b/.test(q)) {
    return { text: "Reset password.", cites: [link("Reset password", "/app/password")] };
  }

  if (/train|training data|contained|tenant|redact|who can see|privacy|my data|client data/.test(q)) {
    return { text: "Answers are not used to train.", cites: [link("Settings", "/app/settings")] };
  }

  if (/freeze|unfreeze|compromis|lock the account|lock account|alert the company|company-wide/.test(q)) {
    const href = facts.person ? `/app/people/${facts.person.id}` : "/app/people";
    return leadership
      ? { text: "Freeze account.", cites: [link("Freeze account", href)] }
      : { text: "Ask a leader.", cites: [link("Home", "/app")] };
  }

  if (facts.person && /cost|license|device|mfa|ticket|request|this person|they|them|patch|health|threatdown/.test(q)) {
    const person = facts.person;
    const moneyBit = leadership ? `${money(person.cost)}. ` : `${hidden} `;
    return {
      text: `${person.name}. ${moneyBit}${person.mfa ? "Protected." : "Needs attention."} ${person.openTickets} open.`,
      cites: [link(person.name, `/app/people/${person.id}`)],
    };
  }

  if (/spend|budget|cost|retainer|invoice|billing/.test(q)) {
    if (!leadership) return { text: hidden, cites: [link("Home", "/app")] };
    const gap = facts.monthlySpend - facts.monthlyBudget;
    const versus = gap > 0 ? `${money(gap)} over` : `${money(Math.abs(gap))} under`;
    return { text: `${money(facts.monthlySpend)} this month. ${versus}.`, cites: [link("Spending", "/app/spending")] };
  }

  if (/outage|sms|who gets|notify/.test(q)) {
    return { text: "Choose who is told.", cites: [link("Settings", "/app/settings")] };
  }

  if (/procore|sage|integration|job cost/.test(q)) {
    return leadership
      ? { text: "In progress.", cites: [link("Procore + Sage 300", "/app/projects/procore-sage")] }
      : { text: "Ask a leader.", cites: [link("Home", "/app")] };
  }

  if (/project|roadmap|starlink|tablet rollout|estimat|consolidation/.test(q)) {
    return leadership
      ? { text: "Projects.", cites: [link("Projects", "/app/projects")] }
      : { text: "Ask a leader.", cites: [link("Home", "/app")] };
  }

  if (/backup|disaster|restore/.test(q)) {
    return leadership
      ? { text: "Planned.", cites: [link("Backup & disaster recovery plan", "/app/projects/backup")] }
      : { text: "Ask a leader.", cites: [link("Home", "/app")] };
  }

  if (/internet|latency|network|circuit/.test(q)) {
    return { text: "Network.", cites: [link("Network", "/network")] };
  }

  if (/email|bluebeam|timekeeping|plan room/.test(q) || (/\bphones?\b/.test(q) && !/new phone/.test(q))) {
    return { text: "Systems.", cites: [link("Systems", "/systems")] };
  }

  if (/uptime|down|website|visitor|page load|ssl|status|safe/.test(q)) {
    return facts.degraded.length
      ? { text: facts.degraded.join(", "), cites: [link("Website", "/website")] }
      : { text: "Up.", cites: [link("Website", "/website")] };
  }

  if (/threatdown|endpoint|edr|isolated|malware|security/.test(q)) {
    return { text: "Talon handles security.", cites: [link("Home", "/app")] };
  }

  if (/renew|saving|contract|vendor/.test(q)) {
    return leadership
      ? { text: "Sage renews December 1.", cites: [link("Spending", "/app/spending")] }
      : { text: hidden, cites: [link("Home", "/app")] };
  }

  if (/new request|new ticket|file a ticket|open a ticket|create a ticket|draft/.test(q)) {
    return { text: "New request.", cites: [link("New request", "/app/requests/new")] };
  }

  if (/ticket|request|queue|sla/.test(q)) {
    return { text: `${facts.openTickets} open.`, cites: [link("Requests", "/app/requests")] };
  }

  if (/offboard|remove|last day|leaver/.test(q)) {
    const href = facts.person ? `/app/people/${facts.person.id}` : "/app/people";
    return leadership
      ? { text: "Offboard user.", cites: [link("Offboard user", href)] }
      : { text: "New request.", cites: [link("New request", "/app/requests/new")] };
  }

  if (/onboard|add person|new hire|first day|checklist/.test(q)) {
    return leadership
      ? { text: "Onboard user.", cites: [link("Onboard user", "/app/people/add")] }
      : { text: "New request.", cites: [link("New request", "/app/requests/new")] };
  }

  if (/password|locked out|sign-in|sign in|login|authenticator|new phone|re-register|reregister/.test(q)) {
    return { text: "Reset password.", cites: [link("Reset password", "/app/password")] };
  }

  if (/printer|wi-fi|wifi|vpn|outlook|gmail|teams|meet|headset|slow computer|running slow/.test(q)) {
    return { text: "New request.", cites: [link("New request", "/app/requests/new")] };
  }

  if (/report|qbr|monthly/.test(q)) {
    return leadership
      ? { text: "Spending.", cites: [link("Spending", "/app/spending")] }
      : { text: hidden, cites: [link("Home", "/app")] };
  }

  if (/directory|entra|google|intune/.test(q)) {
    return { text: facts.directory, cites: [link("Settings", "/app/settings")] };
  }

  if (/who|person|people|employee/.test(q)) {
    return { text: `${facts.headcount} people.`, cites: [link("People", "/app/people")] };
  }

  if (/setting|approval|workspace/.test(q)) {
    return { text: "Settings.", cites: [link("Settings", "/app/settings")] };
  }

  return {
    text: "Ask for a person, a request, a project, or spending.",
    cites: [link("Home", "/app"), link("New request", "/app/requests/new")],
  };
}

export const scriptedAssistant: AssistantClient = {
  reply(turn) {
    return draftAssistantReply(turn);
  },
};

export function getAssistantClient(): AssistantClient {
  return scriptedAssistant;
}

export function inferCategory(text: string): TicketCategory {
  const q = text.toLowerCase();
  if (/offboard|last day|leaver/.test(q)) return "Offboarding";
  if (/onboard|new hire|first day/.test(q)) return "Onboarding";
  if (/password|mfa|access|login|locked/.test(q)) return "Access";
  if (/printer|laptop|headset|hardware|phone|pc\b/.test(q)) return "Hardware";
  if (/compromis|phish|security|virus|alert|threat/.test(q)) return "Security";
  return "Software";
}

export function inferPriority(text: string): TicketPriority {
  return /urgent|down|locked|cannot|can't|outage|compromis/.test(text.toLowerCase()) ? "High" : "Normal";
}
