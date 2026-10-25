// Sample companies only. These are not Talon clients.

export type FixtureRole = "essentials" | "pro" | "team_lead";

export type FixtureUser = {
  sub: string;
  email: string;
  displayName: string;
  role: FixtureRole;
  tenantId: string;
};

export type FixtureTenant = {
  id: string;
  slug: string;
  displayName: string;
  portalSummary: string;
};

export const TENANTS: readonly FixtureTenant[] = [
  {
    id: "sample-north",
    slug: "sample-north",
    displayName: "Sample North",
    portalSummary: "Sample North portal scope. Masked fixture. No client data.",
  },
  {
    id: "sample-south",
    slug: "sample-south",
    displayName: "Sample South",
    portalSummary: "Sample South portal scope. Masked fixture. No client data.",
  },
];

export const USERS: readonly FixtureUser[] = [
  {
    sub: "sample-north-essentials",
    email: "essentials@sample-north.example",
    displayName: "North Essentials",
    role: "essentials",
    tenantId: "sample-north",
  },
  {
    sub: "sample-north-pro",
    email: "pro@sample-north.example",
    displayName: "North Pro",
    role: "pro",
    tenantId: "sample-north",
  },
  {
    sub: "sample-north-lead",
    email: "lead@sample-north.example",
    displayName: "North Lead",
    role: "team_lead",
    tenantId: "sample-north",
  },
  {
    sub: "sample-south-essentials",
    email: "essentials@sample-south.example",
    displayName: "South Essentials",
    role: "essentials",
    tenantId: "sample-south",
  },
  {
    sub: "sample-south-pro",
    email: "pro@sample-south.example",
    displayName: "South Pro",
    role: "pro",
    tenantId: "sample-south",
  },
];

export function fixtureByEmail(email: string): FixtureUser | undefined {
  return USERS.find((user) => user.email === email);
}

export function fixtureBySub(sub: string): FixtureUser | undefined {
  return USERS.find((user) => user.sub === sub);
}
