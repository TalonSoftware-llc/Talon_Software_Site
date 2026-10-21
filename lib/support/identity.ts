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
  if (kind === "google") return ["office-team", "yard-team", "field", "estimating", "finance", "operations"];
  return ["SG-Office", "SG-Yard", "SG-Field", "SG-Estimating", "SG-Finance", "SG-Operations"];
}

export function accountingName(kind: DirectoryKind): string {
  return kind === "google" ? "QuickBooks" : "Sage 300";
}

export function onboardTemplates(kind: DirectoryKind, pims: string, m365 = 26, pimsPrice = 80): OnboardTemplate[] {
  const place = kind === "google" ? "office-team" : "SG-Office";
  const field = kind === "google" ? "field" : "SG-Field";
  const estimating = kind === "google" ? "estimating" : "SG-Estimating";
  const finance = kind === "google" ? "finance" : "SG-Finance";
  const ops = kind === "google" ? "operations" : "SG-Operations";
  const base: License[] = [{ name: kind === "google" ? "Google Workspace" : "Microsoft 365", monthly: m365 }];
  const books = accountingName(kind);
  return [
    {
      id: "pm",
      label: "Project manager",
      department: "Field",
      title: "Project manager",
      groups: [place, field],
      licenses: [...base, { name: pims, monthly: pimsPrice }],
      devices: [
        { name: "Laptop", type: "Laptop", price: 1480 },
        { name: "Field tablet", type: "Tablet", price: 640 },
      ],
    },
    {
      id: "super",
      label: "Superintendent",
      department: "Field",
      title: "Superintendent",
      groups: [place, field],
      licenses: [...base, { name: pims, monthly: pimsPrice }],
      devices: [{ name: "Field tablet", type: "Tablet", price: 640 }],
    },
    {
      id: "foreman",
      label: "Field foreman",
      department: "Field",
      title: "Field foreman",
      groups: [field],
      licenses: [...base, { name: pims, monthly: pimsPrice }],
      devices: [{ name: "Work phone", type: "Phone", price: 720 }],
    },
    {
      id: "estimator",
      label: "Estimator",
      department: "Office",
      title: "Estimator",
      groups: [place, estimating],
      licenses: [...base, { name: "Bluebeam", monthly: kind === "google" ? 35 : 40 }],
      devices: [{ name: "Laptop", type: "Laptop", price: 1480 }],
    },
    {
      id: "finance",
      label: "Accounting",
      department: "Finance",
      title: "Accounting",
      groups: [place, finance],
      licenses: [...base, { name: books, monthly: kind === "google" ? 90 : 150 }],
      devices: [{ name: "Laptop", type: "Laptop", price: 1480 }],
    },
    {
      id: "ops",
      label: "Operations",
      department: "Operations",
      title: "Coordinator",
      groups: [place, ops],
      licenses: base,
      devices: [{ name: "Laptop", type: "Laptop", price: 1480 }],
    },
  ];
}

export function offboardSteps(kind: DirectoryKind): { id: string; label: string; detail: string }[] {
  return [
    { id: "disable", label: "Block sign-in", detail: "Sign-in stops." },
    { id: "sessions", label: "Sign out sessions", detail: "Open sessions close." },
    { id: "licenses", label: "Remove licenses", detail: "Paid seats come off." },
    {
      id: "transfer",
      label: kind === "entra" ? "Transfer mailbox" : "Transfer Drive and Gmail",
      detail: kind === "entra" ? "Mail goes to the manager." : "Files and mail go to the manager.",
    },
    { id: "devices", label: "Collect devices", detail: "Laptop or tablet returns to the office." },
  ];
}

export function licenseCatalog(kind: DirectoryKind, pims: string): License[] {
  return [
    { name: kind === "google" ? "Google Workspace" : "Microsoft 365", monthly: kind === "google" ? 22 : 26 },
    { name: pims, monthly: kind === "google" ? 70 : 80 },
    { name: "Bluebeam", monthly: kind === "google" ? 35 : 40 },
    { name: accountingName(kind), monthly: kind === "google" ? 90 : 150 },
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
