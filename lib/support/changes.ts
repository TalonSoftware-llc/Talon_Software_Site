export type ChangeCategory = "Network" | "Accounts" | "Website" | "Systems";

export type Change = {
  id: string;
  at: string;
  title: string;
  line: string;
  by: "Talon" | "Automation";
  category: ChangeCategory;
};

const granite: Change[] = [
  { id: "g-restore", at: "2026-10-21", title: "Restore list", line: "Sage and the plan room are the two systems that must come back first.", by: "Talon", category: "Systems" },
  { id: "g-key", at: "2026-10-20", title: "Sage sync key", line: "Sage sent a replacement key. Rotation is next.", by: "Talon", category: "Systems" },
  { id: "g-tablets", at: "2026-10-18", title: "Field tablets", line: "Six tablets are imaged and sitting at the main office.", by: "Talon", category: "Accounts" },
  { id: "g-kit", at: "2026-10-16", title: "State Street kit", line: "The State Street kit is on the dock.", by: "Talon", category: "Network" },
  { id: "g-budget", at: "2026-10-15", title: "2027 budget", line: "Cole has the 2027 number.", by: "Talon", category: "Accounts" },
  { id: "g-inbox", at: "2026-10-14", title: "Bid inbox", line: "The shared bid inbox is the mailbox that still matters.", by: "Talon", category: "Website" },
  { id: "g-export", at: "2026-10-11", title: "Job-cost export", line: "The nightly export failed after the credential expired.", by: "Automation", category: "Systems" },
  { id: "g-river", at: "2026-10-03", title: "River Street kit", line: "The River Street pilot stayed up through a pour week.", by: "Automation", category: "Network" },
  { id: "g-phones", at: "2026-10-02", title: "Yard phones", line: "Two phone bills cover the same yard handsets.", by: "Talon", category: "Network" },
];

const redline: Change[] = [
  { id: "r-kit", at: "2026-10-18", title: "Addison kit", line: "The current kit drops before noon.", by: "Talon", category: "Network" },
  { id: "r-books", at: "2026-10-09", title: "Job-cost sync", line: "Procore and QuickBooks have not started.", by: "Talon", category: "Systems" },
];

export function changesFor(workspaceId: string): Change[] {
  const rows = workspaceId === "redline" ? redline : granite;
  return [...rows].sort((a, b) => b.at.localeCompare(a.at));
}

export function changesThisMonth(workspaceId: string, month = "2026-10"): Change[] {
  return changesFor(workspaceId).filter((change) => change.at.startsWith(month));
}
