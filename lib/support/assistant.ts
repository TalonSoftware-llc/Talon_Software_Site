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

export type AssistantProject = {
  id: string;
  name: string;
  status: string;
  progress: number;
  next: string;
  nextDue: string;
  spent: number;
  budget: number;
};

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
  projects?: AssistantProject[];
  systems?: { name: string; state: string }[];
  sites?: { name: string; state: string }[];
  website?: { uptime: number; load: number; visitors: number; ssl: string };
  categories?: { name: string; amount: number }[];
  topRequester?: string;
  responseHours?: number | null;
  outage?: string;
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

const graniteProjects: AssistantProject[] = [
  { id: "connectivity", name: "Job-site connectivity standard", status: "In progress", progress: 55, next: "Install the State Street kit.", nextDue: "State Street install, Nov 7", spent: 6400, budget: 18000 },
  { id: "procore-sage", name: "Procore + Sage 300 integration", status: "In progress", progress: 40, next: "Replace the expired sync credential.", nextDue: "Credential rotation, Oct 28", spent: 8200, budget: 24000 },
  { id: "tenant", name: "Microsoft 365 tenant cleanup & license right-sizing", status: "In progress", progress: 70, next: "Remove seats still on people who have left.", nextDue: "Remove unused seats, Nov 20", spent: 2100, budget: 6000 },
  { id: "backup", name: "Backup & disaster recovery plan", status: "Planned", progress: 15, next: "Write the restore steps.", nextDue: "Restore test, Jan 16", spent: 400, budget: 9000 },
  { id: "tablets", name: "Field tablet rollout for superintendents", status: "In progress", progress: 35, next: "Swap Luis Ortega's tablet.", nextDue: "Hand them out, Dec 4", spent: 3200, budget: 12000 },
  { id: "estimating", name: "AI estimating assistant pilot", status: "Planned", progress: 10, next: "Pick the bid to pilot.", nextDue: "Pick a bid, Nov 14", spent: 0, budget: 8000 },
  { id: "roadmap", name: "IT roadmap & 2027 budget", status: "Done", progress: 100, next: "None.", nextDue: "None", spent: 4800, budget: 4800 },
  { id: "vendors", name: "Vendor/contract consolidation", status: "In progress", progress: 60, next: "Compare the two phone invoices.", nextDue: "End the extra phone line, Dec 1", spent: 1500, budget: 4000 },
];

function projectList(facts: AssistantFacts): AssistantProject[] {
  return facts.projects?.length ? facts.projects : graniteProjects;
}

function projectBlurb(project: AssistantProject, leadership: boolean): string {
  const moneyBit = leadership ? ` ${money(project.spent)} of ${money(project.budget)} is spent.` : "";
  const next = project.nextDue === "None" ? "Nothing is left on the list." : `Next is ${project.nextDue}.`;
  return `${project.name} is ${project.status}, ${project.progress}% done. ${next}${moneyBit}`;
}

function matchProject(list: AssistantProject[], q: string): AssistantProject | undefined {
  if (/procore|sage|integration|job cost|quickbooks/.test(q)) {
    return list.find((project) => /procore|sage|quickbooks/.test(project.name.toLowerCase()) || project.id === "procore-sage" || project.id === "books");
  }
  if (/starlink|connectivity|trailer kit/.test(q)) return list.find((project) => project.id === "connectivity");
  if (/tablet/.test(q)) return list.find((project) => project.id === "tablets");
  if (/estimat/.test(q)) return list.find((project) => project.id === "estimating");
  if (/roadmap|2027/.test(q)) return list.find((project) => project.id === "roadmap");
  if (/consolidat|vendor/.test(q)) return list.find((project) => project.id === "vendors");
  if (/backup|disaster|restore/.test(q)) return list.find((project) => project.id === "backup");
  if (/tenant|license right|microsoft 365 cleanup/.test(q)) return list.find((project) => project.id === "tenant");
  return undefined;
}

function hiddenReply(): AssistantReply {
  return { text: "That figure is on the leadership view. Ask a leader to open it.", cites: [link("Home", "/app")] };
}

export function draftAssistantReply(turn: AssistantTurn): AssistantReply {
  const q = turn.question.toLowerCase();
  const facts = turn.facts;
  const leadership = facts.role === "leadership";
  const projects = projectList(facts);

  if (/\b\d{6}\b/.test(turn.question) || /password is\b/.test(q)) {
    return { text: "Reset password on the password page. Do not paste a code here.", cites: [link("Reset password", "/app/password")] };
  }

  if (/train|training data|contained|redact|who can see|privacy|my data|client data/.test(q)) {
    return { text: "Answers are not used to train. They stay in this workspace and follow the view you have open.", cites: [link("Settings", "/app/settings")] };
  }

  if (/freeze|unfreeze|compromis|lock the account|lock account|alert the company|company-wide/.test(q)) {
    const href = facts.person ? `/app/people/${facts.person.id}` : "/app/people";
    return leadership
      ? { text: "Freeze account blocks sign-in and ends open sessions. Pick the person, then confirm. Unfreeze is in the same popup.", cites: [link("Freeze account", href)] }
      : { text: "Ask a leader. Freeze stays on the leadership view.", cites: [link("Home", "/app")] };
  }

  if (facts.person && /cost|license|device|mfa|ticket|request|this person|they|them|patch|health|threatdown/.test(q)) {
    const person = facts.person;
    const moneyBit = leadership ? ` Monthly cost is ${money(person.cost)}.` : "";
    return {
      text: `${person.name} is ${person.role}.${moneyBit} ${person.mfa ? "MFA is on." : "MFA is off."} ${person.openTickets} open requests.`,
      cites: [link(person.name, `/app/people/${person.id}`)],
    };
  }

  const matched = matchProject(projects, q);
  if (matched && /procore|sage|integration|job cost|quickbooks|project|roadmap|starlink|tablet|estimat|consolidat|backup|disaster|restore|vendor|tenant|2027|connectivity/.test(q)) {
    if (!leadership) return { text: "Ask a leader. Project status stays on the leadership view.", cites: [link("Home", "/app")] };
    const title = matched.id === "procore-sage" ? "Procore + Sage 300" : matched.name;
    return { text: projectBlurb(matched, true), cites: [link(title, `/app/projects/${matched.id}`)] };
  }

  if (/project|roadmap|starlink|tablet rollout|estimat|consolidation/.test(q)) {
    if (!leadership) return { text: "Ask a leader. Project status stays on the leadership view.", cites: [link("Home", "/app")] };
    const active = projects.filter((project) => project.status === "In progress").length;
    const planned = projects.filter((project) => project.status === "Planned").length;
    const done = projects.filter((project) => project.status === "Done").length;
    return { text: `${projects.length} projects are on the list. ${active} are in progress, ${planned} are planned, and ${done} are done.`, cites: [link("Projects", "/app/projects")] };
  }

  if (/spend|budget|cost|retainer|invoice|billing/.test(q)) {
    if (!leadership) return hiddenReply();
    const gap = facts.monthlySpend - facts.monthlyBudget;
    const versus = gap > 0 ? `${money(gap)} over budget` : `${money(Math.abs(gap))} under budget`;
    const lines = facts.categories ?? [];
    const top = [...lines].sort((a, b) => b.amount - a.amount)[0];
    const total = lines.reduce((sum, line) => sum + line.amount, 0);
    const share = top && total ? ` ${top.name} is the largest slice at ${money(top.amount)}, ${Math.round((top.amount / total) * 100)}%.` : " The pie splits retainer, software, cloud, hardware, telecom, and security.";
    return { text: `${money(facts.monthlySpend)} this month, ${versus}.${share}`, cites: [link("Spending", "/app/spending")] };
  }

  if (/outage|sms|who gets|notify/.test(q)) {
    return { text: "Outage notices go to the group chosen in Settings. Internet and site alerts can be SMS, email, or push.", cites: [link("Settings", "/app/settings")] };
  }

  if (/internet|latency|network|circuit/.test(q)) {
    const sites = facts.sites ?? [];
    const down = sites.filter((site) => site.state !== "Up");
    const names = sites.map((site) => site.name).join(", ");
    const outage = facts.outage ? ` ${facts.outage}` : "";
    const line = !sites.length
      ? `The sites are up.${outage}`
      : down.length
        ? `${down.map((site) => site.name).join(", ")} is not up.${outage}`
        : `${names} ${sites.length === 1 ? "is" : "are"} up.${outage}`;
    return { text: `${line} Speed and past outages are on Network.`, cites: [link("Network", "/network")] };
  }

  if (/email|bluebeam|timekeeping|plan room/.test(q) || (/\bphones?\b/.test(q) && !/new phone/.test(q))) {
    const systems = facts.systems ?? [];
    const slow = systems.filter((system) => system.state !== "Up");
    const text = slow.length
      ? `${slow.map((system) => `${system.name} is ${system.state === "Down" ? "down" : "slow"}`).join(". ")}. The other systems are up.`
      : "Email, phone, Procore, the accounting system, the plan room, Bluebeam, and timekeeping are up.";
    return { text, cites: [link("Systems", "/systems")] };
  }

  if (/uptime|website|visitor|page load|ssl|status/.test(q)) {
    const site = facts.website;
    if (facts.degraded.length && /status|system/.test(q)) {
      return { text: `${facts.degraded.join(", ")} needs a look. The rest of the stack is up.`, cites: [link("Systems", "/systems")] };
    }
    if (site) {
      return { text: `The website is up at ${site.uptime}% over 30 days. Page load is ${site.load} ms. SSL renews ${site.ssl}.`, cites: [link("Website", "/website")] };
    }
    return facts.degraded.length
      ? { text: `${facts.degraded.join(", ")} needs a look. Open Website for visits and uptime.`, cites: [link("Website", "/website")] }
      : { text: "The website is up. Visits, page load, and the SSL date are on Website.", cites: [link("Website", "/website")] };
  }

  if (/threatdown|endpoint|edr|isolated|malware|security/.test(q)) {
    return { text: "Talon handles security. Endpoint protection stays on the devices Talon manages.", cites: [link("Home", "/app")] };
  }

  if (/renew|saving|contract|vendor/.test(q)) {
    if (!leadership) return hiddenReply();
    const vendor = matchProject(projects, q);
    if (vendor && /consolidat/.test(q)) return { text: projectBlurb(vendor, true), cites: [link(vendor.name, `/app/projects/${vendor.id}`)] };
    return { text: "Sage renews December 1. Fieldshare and Microsoft dates are on Spending with the monthly pie.", cites: [link("Spending", "/app/spending")] };
  }

  if (/new request|new ticket|file a ticket|open a ticket|create a ticket|draft/.test(q)) {
    return { text: "Open New request and send the subject. It shows up in the queue for Talon.", cites: [link("New request", "/app/requests/new")] };
  }

  if (/ticket|request|queue|sla|support/.test(q)) {
    const who = facts.topRequester ? ` ${facts.topRequester} leads this week.` : "";
    const hours = facts.responseHours != null ? ` Average response is ${facts.responseHours}h.` : "";
    return { text: `${facts.openTickets} requests are open.${hours}${who} Week and month lists are on Support.`, cites: [link("Support", "/app/support")] };
  }

  if (/offboard|remove|last day|leaver/.test(q)) {
    const href = facts.person ? `/app/people/${facts.person.id}` : "/app/people";
    return leadership
      ? { text: "Offboard user blocks sign-in, removes licenses, transfers mail, and collects devices. Pick the person, then confirm.", cites: [link("Offboard user", href)] }
      : { text: "File a new request and a leader can offboard the account.", cites: [link("New request", "/app/requests/new")] };
  }

  if (/onboard|add person|new hire|first day|checklist/.test(q)) {
    return leadership
      ? { text: "Onboard user takes a name, title, manager, start date, license, and location. Confirm the checklist before the account is added.", cites: [link("Onboard user", "/app/people/add")] }
      : { text: "File a new request and a leader can add the account.", cites: [link("New request", "/app/requests/new")] };
  }

  if (/password|locked out|sign-in|sign in|login|authenticator|new phone|re-register|reregister/.test(q)) {
    return { text: "Reset password on its own page. The demo keeps the new password in this browser only.", cites: [link("Reset password", "/app/password")] };
  }

  if (/printer|wi-fi|wifi|vpn|outlook|gmail|teams|meet|headset|slow computer|running slow|plotter/.test(q)) {
    return { text: "File that as a new request. Talon picks it up in the queue.", cites: [link("New request", "/app/requests/new")] };
  }

  if (/report|qbr|monthly/.test(q)) {
    if (!leadership) return hiddenReply();
    return { text: `${money(facts.monthlySpend)} is this month on Spending. The 12-month trend sits under the pie.`, cites: [link("Spending", "/app/spending")] };
  }

  if (/directory|entra|google workspace|intune/.test(q)) {
    return { text: `${facts.directory}. Sign-in and licenses follow that directory.`, cites: [link("Settings", "/app/settings")] };
  }

  if (/who|person|people|employee/.test(q)) {
    return { text: `${facts.headcount} people are in ${facts.workspaceName}. Search them on People.`, cites: [link("People", "/app/people")] };
  }

  if (/setting|approval|workspace/.test(q)) {
    return { text: "Settings holds the workspace, outage recipients, and alert channels.", cites: [link("Settings", "/app/settings")] };
  }

  return {
    text: "Ask about the website, the network, systems, support, people, a project, or spending.",
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
