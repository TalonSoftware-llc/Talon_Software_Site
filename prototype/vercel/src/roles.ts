export const TEAM_LEAD_VIEWS_BUILT = false;

export type Role = "essentials" | "pro" | "team_lead";

export function isRole(value: string): value is Role {
  return value === "essentials" || value === "pro" || value === "team_lead";
}

// Pro is the whole tenant portal. Essentials is own tickets only.
// team_lead is designed and stored, then fail-closed until the add-on exists.
export function ticketScope(role: Role): "own" | "tenant" {
  if (role === "pro") return "tenant";
  return "own";
}

export function canReadPortal(role: Role): boolean {
  return role === "pro";
}

export const FUTURE_TEAM_LEAD = {
  role: "team_lead" as const,
  viewsBuilt: TEAM_LEAD_VIEWS_BUILT,
  intendedScope:
    "Tickets requested by members of the lead's team, inside the same tenant. Not the whole tenant (Pro) and not only the lead's own tickets (Essentials).",
  notBuilt: ["team table", "team membership", "team ticket list", "team-lead pages"],
};
