export type DemoCompany = {
  id: string;
  name: string;
  industry: string;
  city: string;
  people: string;
  contact: string;
  systems: string[];
  tickets: { id: string; title: string; status: string; opened: string }[];
  articles: { title: string; body: string }[];
  assistant: { from: "Company" | "Assistant"; text: string }[];
};

export const demoCompanies: DemoCompany[] = [
  {
    id: "northline",
    name: "Northline Manufacturing",
    industry: "Light manufacturing",
    city: "Vancouver, Washington",
    people: "86",
    contact: "A. Nguyen, operations",
    systems: ["Microsoft 365", "An ERP the shop floor still argues with", "Nightly file backup"],
    tickets: [
      { id: "NL-1042", title: "New hire cannot reach the shared drive", status: "Open", opened: "Oct 18" },
      { id: "NL-1038", title: "Label printer offline on line two", status: "Waiting", opened: "Oct 16" },
      { id: "NL-1031", title: "Backup job warned on the file server", status: "Closed", opened: "Oct 9" },
    ],
    articles: [
      {
        title: "New hire, first morning",
        body: "Sample. Account is created the day before. Laptop, email, and the shop-floor login are checked before the person arrives. The manager walks them to the line.",
      },
      {
        title: "Backup and restore",
        body: "Sample. Files copy nightly. A restore of one folder is done on the first Monday of the quarter and written down.",
      },
      {
        title: "Who to call",
        body: "Sample. Business hours, one address. There is no overnight desk. An outage on the line is called in, then written up as a ticket.",
      },
    ],
    assistant: [
      { from: "Company", text: "Where is the backup policy?" },
      {
        from: "Assistant",
        text: "Sample answer, from this company's documents only. Files copy nightly. A restore of one folder is done on the first Monday of the quarter.",
      },
    ],
  },
  {
    id: "harbor",
    name: "Harbor and Pine Clinic",
    industry: "Outpatient clinic",
    city: "Portland, Oregon",
    people: "42",
    contact: "R. Ellis, office manager",
    systems: ["Microsoft 365", "The practice-management system", "A separate backup of the scanned charts"],
    tickets: [
      { id: "HP-220", title: "Front desk cannot open yesterday's scans", status: "Open", opened: "Oct 20" },
      { id: "HP-214", title: "New provider needs an account before Monday", status: "Waiting", opened: "Oct 17" },
    ],
    articles: [
      {
        title: "After-hours voicemail",
        body: "Sample. The mailbox is checked at the open of the next business day. It is not a clinical line.",
      },
      {
        title: "Access for a new provider",
        body: "Sample. The office manager requests the account. Access to charts waits until the start date on the form.",
      },
    ],
    assistant: [
      { from: "Company", text: "When does a new provider get chart access?" },
      {
        from: "Assistant",
        text: "Sample answer. Access to charts waits until the start date on the request. The office manager sends that form.",
      },
    ],
  },
];

export const defaultDemoCompanyId = demoCompanies[0].id;
