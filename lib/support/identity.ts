import type { Department, Device, DirectoryKind, License, Person } from "./types";

export function directoryLabel(kind: DirectoryKind): string {
  return kind === "entra" ? "Microsoft Entra ID" : "Google Workspace";
}

export function mailNoun(kind: DirectoryKind): string {
  return kind === "entra" ? "mailbox" : "Gmail and Drive";
}

export function meetingNoun(kind: DirectoryKind): string {
  return kind === "entra" ? "Teams" : "Meet";
}

export type OnboardTemplate = {
  id: string;
  label: string;
  department: Department;
  title: string;
  groups: string[];
  licenses: License[];
  devices: { name: string; type: Device["type"]; price: number }[];
};

export function groupCatalog(kind: DirectoryKind): string[] {
  if (kind === "google") return ["spartanburg-team", "asheville-team", "hickory-team", "greenville-team", "clinical", "front-desk", "finance", "operations"];
  return ["SG-Asheville", "SG-Hickory", "SG-Greenville", "SG-Clinical", "SG-FrontDesk", "SG-Finance", "SG-Operations"];
}

export function onboardTemplates(kind: DirectoryKind, pims: string, m365 = 26, pimsPrice = 80): OnboardTemplate[] {
  const place = kind === "google" ? "spartanburg-team" : "SG-Asheville";
  const clinical = kind === "google" ? "clinical" : "SG-Clinical";
  const desk = kind === "google" ? "front-desk" : "SG-FrontDesk";
  const finance = kind === "google" ? "finance" : "SG-Finance";
  const ops = kind === "google" ? "operations" : "SG-Operations";
  const base: License[] = [{ name: kind === "google" ? "Google Workspace" : "Microsoft 365", monthly: m365 }];
  return [
    {
      id: "vet",
      label: "Veterinarian",
      department: "Clinical",
      title: "Associate veterinarian",
      groups: [place, clinical],
      licenses: [...base, { name: pims, monthly: pimsPrice }],
      devices: [
        { name: "Laptop", type: "Laptop", price: 1480 },
        { name: "Exam tablet", type: "Tablet", price: 640 },
      ],
    },
    {
      id: "tech",
      label: "Veterinary technician",
      department: "Clinical",
      title: "Veterinary technician",
      groups: [place, clinical],
      licenses: [...base, { name: pims, monthly: pimsPrice }],
      devices: [{ name: "Laptop", type: "Laptop", price: 1480 }],
    },
    {
      id: "desk",
      label: "Client care",
      department: "Client care",
      title: "Client care",
      groups: [place, desk],
      licenses: base,
      devices: [{ name: "Front desk PC", type: "Desktop", price: 980 }],
    },
    {
      id: "finance",
      label: "Finance",
      department: "Finance",
      title: "Finance assistant",
      groups: [place, finance],
      licenses: [...base, { name: "Acrobat", monthly: 86 }],
      devices: [{ name: "Laptop", type: "Laptop", price: 1480 }],
    },
    {
      id: "ops",
      label: "Operations",
      department: "Operations",
      title: "Operations assistant",
      groups: [place, ops],
      licenses: base,
      devices: [{ name: "Laptop", type: "Laptop", price: 1480 }],
    },
  ];
}

export function offboardSteps(kind: DirectoryKind): { id: string; label: string; detail: string }[] {
  return [
    { id: "disable", label: "Disable the account", detail: "Sign-in stops at the end of this flow." },
    { id: "sessions", label: "Revoke sessions", detail: "Open browser and app sessions are closed." },
    { id: "licenses", label: "Remove licenses", detail: "Paid seats come off the person record." },
    {
      id: "transfer",
      label: kind === "entra" ? "Transfer the mailbox" : "Transfer Drive and Gmail",
      detail: kind === "entra" ? "Mail forwards to the manager for 30 days." : "Files and mail transfer to the manager.",
    },
    { id: "devices", label: "Recover devices", detail: "Assigned hardware is marked for pickup at the clinic." },
  ];
}

export function licenseCatalog(kind: DirectoryKind, pims: string): License[] {
  return [
    { name: kind === "google" ? "Google Workspace" : "Microsoft 365", monthly: kind === "google" ? 22 : 26 },
    { name: pims, monthly: kind === "google" ? 70 : 80 },
    { name: "Acrobat", monthly: kind === "google" ? 45 : 86 },
  ];
}

export function isPrivileged(person: Pick<Person, "privileged">): boolean {
  return person.privileged;
}

export function compromiseTemplate(company: string, person: { name: string; email: string }): { subject: string; body: string } {
  return {
    subject: `Account compromised: ${person.name}`,
    body: `${person.name}'s account (${person.email}) at ${company} is compromised. Do not open links or attachments from that mailbox. Do not send a password or a code. Wait for Talon before you reset anything.`,
  };
}
