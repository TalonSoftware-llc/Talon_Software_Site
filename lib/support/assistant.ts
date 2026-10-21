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
  const hidden = "That figure is on the leadership view. This reply leaves it out.";

  if (/\b\d{6}\b/.test(turn.question) || /password is\b/.test(q)) {
    return {
      text: "I left a code or a password out of the reply. Use the password page for the reset steps. This assistant does not store what you type.",
      cites: [link("Password and MFA", "/app/help/password")],
    };
  }

  if (/train|training data|contained|tenant|redact|who can see|privacy|my data|client data/.test(q)) {
    return {
      text: `This assistant is contained to ${facts.workspaceName}. The company's data stays in this workspace, it is not used to train a model, and a staff reply cannot include leadership figures. The demo is scripted in the browser. Nothing you type is sent to a model.`,
      cites: [link("Settings", "/app/settings")],
    };
  }

  if (turn.pageSection === "ticket" && facts.ticket && /summar|sla|this ticket|status|reply/.test(q)) {
    const ticket = facts.ticket;
    const clock = ticket.late ? `${ticket.sla} on the resolve clock` : `${ticket.sla} to resolve`;
    return {
      text: `${ticket.id} is ${ticket.status.toLowerCase()}: ${ticket.subject} It is a ${ticket.category.toLowerCase()} request, ${clock}. A reply belongs on the thread. I can also draft a new ticket from what you just asked.`,
      cites: [link(ticket.id, `/app/tickets/${ticket.id}`), link("New ticket", "/app/tickets/new")],
    };
  }

  if (/compromis|account alert|lock the account|company-wide/.test(q)) {
    if (!leadership) {
      return {
        text: "A compromised-account notice is a leadership action. Switch to the leadership view, pick the person, preview the message, then confirm with MFA. Staff cannot send it.",
        cites: [link("People", "/app/people")],
      };
    }
    const personBit = facts.person ? ` For ${facts.person.name}, open the alert with that person already selected.` : "";
    return {
      text: `Open Compromised account, pick the person, and read the notice before you send it.${personBit} Leave "Also disable the account and revoke sessions" on unless you only need the warning. Confirm with the MFA step-up. The demo then shows a delivery status. It does not send email. A privileged role can be named in the notice, and the lock is blocked for that role.`,
      cites: [
        link("Compromised account", facts.person ? `/app/people/compromised?person=${facts.person.id}` : "/app/people/compromised"),
        link("Audit log", "/app/people/audit"),
      ],
    };
  }

  if (facts.person && /cost|license|device|mfa|ticket|this person|they|them|patch|health|threatdown/.test(q)) {
    const person = facts.person;
    const mfa = person.mfa ? "MFA is on." : "MFA is not on.";
    const moneyBit = leadership ? `About ${money(person.cost)} a month in licenses and devices. ` : `${hidden} `;
    return {
      text: `${person.name}, ${person.role}. ${moneyBit}${mfa} ${person.openTickets} open ${person.openTickets === 1 ? "ticket" : "tickets"}. The profile lists each device, the email it is joined to, patch status, and ThreatDown (protected, threats, or isolated).`,
      cites: [link(person.name, `/app/people/${person.id}`), link("Security", "/app/security")],
    };
  }

  if (/spend|budget|cost|retainer|invoice|billing/.test(q)) {
    if (!leadership) {
      return {
        text: `${hidden} Billing, reports, and cost per person stay on the leadership view.`,
        cites: [link("Billing", "/app/billing")],
      };
    }
    const gap = facts.monthlySpend - facts.monthlyBudget;
    const versus = gap > 0 ? `${money(gap)} over budget` : `${money(Math.abs(gap))} under budget`;
    return {
      text: `${facts.workspaceName} is at ${money(facts.monthlySpend)} this month, ${versus} of ${money(facts.monthlyBudget)}. Software and telecom are the large lines. The Talon retainer in this workspace is a sample figure, not a published rate. Open Billing for the plan and invoices, or the overview for the breakdown.`,
      cites: [link("Billing", "/app/billing"), link("Overview", "/app")],
    };
  }

  if (/outage alert|who gets|sms|notify me|notification setting/.test(q)) {
    return {
      text: "Outage alerts are a setting, not a banner on every page. Choose who receives them and which channels (SMS, email, push) for internet outages and for site outages. The overview status list shows the outage events. This demo does not send those alerts.",
      cites: [link("Outage notifications", "/app/settings"), link("Status", "/app")],
    };
  }

  if (/uptime|down|outage|aviary|meadow|status/.test(q)) {
    if (!facts.degraded.length) {
      return {
        text: "Nothing is down right now. Past outages stay in the status list on the overview, including the Asheville internet drop and the Aviary slowness on October 9. Change who hears about the next one in Settings.",
        cites: [link("Status", "/app"), link("Outage notifications", "/app/settings"), link("Incident response", "/app/knowledge/incident-response")],
      };
    }
    return {
      text: `${facts.degraded.join(" and ")} ${facts.degraded.length === 1 ? "is" : "are"} not healthy. Open the status list on the overview for the incident note. Outage alerts for the next internet or site event are configured in Settings.`,
      cites: [link("Status", "/app"), link("Outage notifications", "/app/settings")],
    };
  }

  if (/threatdown|endpoint|edr|isolated|malware/.test(q)) {
    return {
      text: "Endpoint protection is ThreatDown EDR. Security shows how many devices are protected, have threats, or are isolated. The same status is on each device in the person's profile. Devices in this demo are tied to the person's email.",
      cites: [link("Security", "/app/security"), link("Devices", "/app/company/devices")],
    };
  }

  if (/security score|posture|training|without mfa|missing mfa|mfa gap/.test(q)) {
    return {
      text: `${facts.mfaMissing} active ${facts.mfaMissing === 1 ? "person still needs" : "people still need"} MFA out of ${facts.headcount}. That is the main gap. ThreatDown is the endpoint product. Greenville still owes a restore test.`,
      cites: [link("Security", "/app/security"), link("People missing MFA", "/app/people?flag=mfa"), link("MFA setup", "/app/knowledge/mfa-setup")],
    };
  }

  if (/renew|cedar|saving|contract|vendor/.test(q)) {
    if (!leadership) {
      return {
        text: "Renewal amounts are on the leadership view. Vendor names and the knowledge article are available here.",
        cites: [link("Vendor contacts", "/app/knowledge/vendor-contacts"), link("Company", "/app/company")],
      };
    }
    return {
      text: "Cedar Diagnostics renews on November 12. That is the decision on the list. Bramble phones follow in December. Unused Acrobat seats and the Hickory fax line are the two savings already identified.",
      cites: [link("Software", "/app/company/software"), link("Vendor contacts", "/app/knowledge/vendor-contacts")],
    };
  }

  if (/backup|restore/.test(q)) {
    return {
      text: "Nightly backups are on the overview. Greenville has not had a restore test since August. That gap is on the security page.",
      cites: [link("Security", "/app/security"), link("Incident response", "/app/knowledge/incident-response")],
    };
  }

  if (/traffic|visitor|session|website|conversion|appointment/.test(q)) {
    return {
      text: `The ${facts.workspaceName} site is the marketing site on a sample host. Appointment requests are the conversion that matters. The overview breaks out visitors, sessions, and the top pages for the range you have selected.`,
      cites: [link("Overview", "/app")],
    };
  }

  if (/new ticket|file a ticket|open a ticket|create a ticket|draft/.test(q)) {
    return {
      text: "Use New ticket and choose access, onboarding, offboarding, hardware, software, or security. Or ask me here and choose Draft a ticket. The draft stays in this browser until you submit the form.",
      cites: [link("New ticket", "/app/tickets/new"), link("Ticket queue", "/app/tickets")],
    };
  }

  if (/ticket|queue|sla/.test(q)) {
    return {
      text: `There are ${facts.openTickets} open ${facts.openTickets === 1 ? "ticket" : "tickets"} in this workspace. Filter the queue by status, priority, or category. A late resolve clock is marked on the ticket.`,
      cites: [link("Ticket queue", "/app/tickets"), link("New ticket", "/app/tickets/new")],
    };
  }

  if (/offboard|last day|leaver/.test(q)) {
    const target = facts.person ? `/app/people/${facts.person.id}/offboard` : "/app/people";
    return {
      text: leadership
        ? "Offboarding is one flow: disable the account, revoke sessions, remove licenses, transfer the mailbox, and recover devices. Open it from the person, review the steps, then confirm with MFA. A privileged role cannot be offboarded here. If Talon approval is on, it waits in the audit queue."
        : "Offboarding is a leadership action on the person page. Staff can still open a ticket if a last day is coming up.",
      cites: [link("Offboard", target), link("Offboarding article", "/app/knowledge/offboarding")],
    };
  }

  if (/onboard|new hire|first day|checklist/.test(q)) {
    return {
      text: leadership
        ? "Onboard is under People. Pick a role template. It sets groups, licenses, and devices. The same screen has the new-hire checklist: mailbox, practice-system seat, MFA, clinic group, and device. Review it, then confirm with MFA. If Talon approval is on, it waits in the queue. Nothing calls the directory from this demo."
        : "New-hire setup is a leadership action. Staff can read the onboarding article and open a ticket.",
      cites: [link("Onboard", "/app/people/onboard"), link("Onboarding a new hire", "/app/knowledge/onboarding-a-new-hire")],
    };
  }

  if (/password|locked out|sign-in|sign in|login|mfa device|authenticator|new phone|re-register|reregister/.test(q)) {
    return {
      text: "Open Password and MFA. A reset is done at the clinic desk, and the temporary password is not emailed to the locked mailbox. A new phone is re-registered the same way: remove the old authenticator while signed in on a clinic PC, then scan the new code. This screen does not change a password or a device.",
      cites: [link("Password and MFA", "/app/help/password"), link("Password reset", "/app/knowledge/password-reset"), link("MFA setup", "/app/knowledge/mfa-setup")],
    };
  }

  if (/printer|wi-fi|wifi|vpn|outlook|gmail|teams|meet|headset|slow computer|running slow/.test(q)) {
    return {
      text: "Device and app fixes are handled by the endpoint agent, not a guide in this portal. If it is still broken, draft a hardware or software ticket and include the clinic. Patch status and ThreatDown are on the person's profile if you need to see the machine first.",
      cites: [link("New ticket", "/app/tickets/new"), link("Devices", "/app/company/devices")],
    };
  }

  if (/project|roadmap|quarter/.test(q)) {
    return {
      text: "Projects lists what is in progress and the next few quarters. Open a row for the milestones.",
      cites: [link("Projects", "/app/projects")],
    };
  }

  if (/report|qbr|monthly/.test(q)) {
    return {
      text: leadership
        ? "Reports has the October service note and the quarterly review. Figures there are samples."
        : "The monthly and quarterly reports include spend, so they stay on the leadership view.",
      cites: [link("Reports", "/app/reports")],
    };
  }

  if (/directory|entra|google workspace|intune|which directory/.test(q)) {
    return {
      text: `${facts.workspaceName} is connected to ${facts.directory}. Devices are joined to each person's email. Larkspur is Microsoft 365, with Intune and Entra. South Ridge uses Google Workspace, so the other directory is visible in the switcher. This preview does not call either directory.`,
      cites: [link("Settings", "/app/settings"), link("People", "/app/people")],
    };
  }

  if (/who|person|people|employee|user/.test(q)) {
    return {
      text: `${facts.workspaceName} has ${facts.headcount} people. ${leadership ? "Leaders onboard, update, offboard, and send a compromised-account notice from People." : "You can open a profile for contact info, devices, and tickets. Cost and account changes stay on the leadership view."}`,
      cites: [link("People", "/app/people")],
    };
  }

  if (/setting|approval|permission|workspace/.test(q)) {
    return {
      text: "Settings shows the signed-in profile, the directory connection, ticket notifications, and outage alerts. Leadership can require a Talon approval before onboard, offboard, or a license change. The audit log is where that queue is approved in this demo.",
      cites: [link("Settings", "/app/settings"), link("Audit log", "/app/people/audit")],
    };
  }

  if (/article|knowledge|how do i|how to/.test(q)) {
    return {
      text: "Knowledge has the runbooks: onboarding, offboarding, MFA, password reset, printers, incident response, and vendor contacts. I can also point at the page that does the action.",
      cites: [link("Knowledge", "/app/knowledge"), link("Password and MFA", "/app/help/password")],
    };
  }

  const hint = turn.hints[0];
  return {
    text: `I can walk through this workspace: tickets, people, onboard, a compromised-account notice, password and MFA, ThreatDown, outage alerts, security, projects, and billing. On ${turn.pageTitle}, a useful question is: ${hint ?? "What needs a decision this month?"} Ask that, or tell me to draft a ticket.`,
    cites: [link("Overview", "/app"), link("New ticket", "/app/tickets/new")],
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
