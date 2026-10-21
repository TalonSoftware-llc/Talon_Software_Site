export const supportSections = [
  {
    path: "/ai",
    label: "AI support",
    title: "AI support",
    description: "AI support for a Talon Software client company. Not running yet.",
    body: "AI support for this company will live here. It is not running. When it does, it will answer from this company's own documents.",
  },
  {
    path: "/tickets",
    label: "Ticketing",
    title: "Ticketing",
    description: "Tickets for a Talon Software client company. No ticket system yet.",
    body: "Tickets for this company will live here. There is no ticket system on this page, and this page does not accept a request.",
  },
  {
    path: "/processes",
    label: "Process documentation",
    title: "Process documentation",
    description: "Process documentation for a Talon Software client company. Nothing posted yet.",
    body: "Process documentation for this company will live here. None of it is posted yet.",
  },
  {
    path: "/information",
    label: "Client information",
    title: "Client information",
    description: "Account and contact information for a Talon Software client company. Nothing shown yet.",
    body: "Contacts, accounts, and the other facts for this company will live here. None of that is shown yet.",
  },
] as const;

export type SupportSectionPath = (typeof supportSections)[number]["path"];
