import { demoIso, money, monthAdd } from "../format";
import type {
  Article,
  AssignedDevice,
  BillingSnapshot,
  ClinicLocation,
  DateRange,
  Device,
  Executive,
  Notice,
  OutageEvent,
  Person,
  Project,
  Report,
  RoadmapItem,
  SearchHit,
  SecuritySnapshot,
  SeriesPoint,
  ServiceStatus,
  SoftwareContract,
  SpendSlice,
  ThreatDownState,
  Ticket,
  TicketMessage,
  Vendor,
  Workspace,
  WorkspaceDocument,
} from "../types";

const hour = 3_600_000;
const GRANITE = "granite";
const REDLINE = "redline";

const firstNames = [
  "Beth", "Carl", "Diana", "Gail", "Harvey", "Iris", "Joel", "Kara", "Liam",
  "Mia", "Nate", "Olive", "Pete", "Quinn", "Rita", "Seth", "Tara", "Uma", "Victor",
  "Willa", "Yves", "Zoe", "Aaron", "Brooke", "Cody", "Drew", "Frank", "Gina",
  "Hugo", "Jade", "Lana", "Nadia", "Omar", "Pia", "Reed", "Tessa", "Uri", "Vera",
  "Walt", "Yara", "Zane", "Blake", "Dean", "Eden", "Finn", "Hana", "Ivan", "June",
  "Kent", "Lucia", "Mason", "Nell", "Otto", "Remy", "Shay", "Troy", "Una", "Vince",
  "Nora", "Chris", "Ruth", "Leah", "Wes", "Grace", "Rosa", "Helen", "Jonah",
];

const lastNames = [
  "Walsh", "Patel", "Diaz", "Cohen", "Hart", "Singh", "Berg", "Cole", "Frost", "Nash",
  "Perry", "Shaw", "Blair", "Cross", "Dale", "Eller", "Fry", "Gable", "Holt", "Ivers",
];

type Named = {
  id: string;
  name: string;
  role: string;
  department: Person["department"];
  location: string;
  managerId: string | null;
  startDate: string;
  status?: Person["status"];
  mfa?: boolean;
  training?: Person["training"];
  device?: "laptop" | "desktop" | "old";
  tablet?: boolean;
  phone?: boolean;
};

type Prices = { m365: number; field: number; bluebeam: number; books: number };

function emailFor(name: string, domain: string): string {
  const [first, ...rest] = name.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/);
  return `${first}.${rest.join("")}@${domain}`;
}

function deviceFor(
  personId: string,
  kind: "laptop" | "desktop" | "old" | "tablet" | "phone",
  email: string,
  join: Device["join"],
  threatdown: ThreatDownState,
): Device {
  const spec = {
    laptop: { name: "Laptop", type: "Laptop" as const, purchased: "2024-03-12", price: 1480 },
    desktop: { name: "Desk PC", type: "Desktop" as const, purchased: "2023-11-02", price: 980 },
    old: { name: "Laptop", type: "Laptop" as const, purchased: "2021-04-15", price: 1320 },
    tablet: { name: "Field tablet", type: "Tablet" as const, purchased: "2024-06-01", price: 640 },
    phone: { name: "Work phone", type: "Phone" as const, purchased: "2025-01-09", price: 720 },
  }[kind];
  return {
    id: `${personId}-${kind}`,
    name: spec.name,
    type: spec.type,
    purchased: spec.purchased,
    refreshDue: monthAdd(spec.purchased, 4),
    price: spec.price,
    join,
    primaryUser: email,
    threatdown,
  };
}

function licensesFor(department: Person["department"], fieldSystem: string, books: string, prices: Prices): Person["licenses"] {
  const suite = prices.m365 === 22 ? "Google Workspace" : "Microsoft 365";
  const items: Person["licenses"] = [{ name: suite, monthly: prices.m365 }];
  if (department === "Field") items.push({ name: fieldSystem, monthly: prices.field });
  if (department === "Office") items.push({ name: "Bluebeam", monthly: prices.bluebeam });
  if (department === "Finance") items.push({ name: books, monthly: prices.books });
  return items;
}

function groupsFor(spec: Named, directory: "entra" | "google"): string[] {
  const privileged = spec.id === "p-mara" || spec.id === "p-priya" || spec.id === "p-camille" || spec.id === "p-adele";
  const field = directory === "google" ? "field" : "SG-Field";
  const office = directory === "google" ? "office-team" : "SG-Office";
  const finance = directory === "google" ? "finance" : "SG-Finance";
  const ops = directory === "google" ? "operations" : "SG-Operations";
  const groups = [directory === "google" ? "office-team" : "SG-Office"];
  if (spec.department === "Field") groups.push(field);
  if (spec.department === "Office") groups.push(office);
  if (spec.department === "Finance") groups.push(finance);
  if (spec.department === "Operations") groups.push(ops);
  if (privileged) groups.push(directory === "google" ? "workspace-admins" : "Privileged roles");
  return groups;
}

function buildPerson(spec: Named, domain: string, index: number, fieldSystem: string, books: string, prices: Prices, directory: "entra" | "google"): Person {
  const email = emailFor(spec.name, domain);
  const join = directory === "entra" ? "Entra" : "Google";
  const leadThreat: ThreatDownState = spec.device === "old" ? "Threats" : spec.id === "p-sam" || spec.id === "p-jordan" ? "Isolated" : "Protected";
  const devices: Device[] = [deviceFor(spec.id, spec.device ?? "laptop", email, join, leadThreat)];
  if (spec.id === "p-sam") devices[0].name = "Plotter PC";
  if (spec.tablet) devices.push(deviceFor(spec.id, "tablet", email, join, "Protected"));
  if (spec.phone) devices.push(deviceFor(spec.id, "phone", email, join, "Protected"));
  return {
    id: spec.id,
    name: spec.name,
    role: spec.role,
    department: spec.department,
    location: spec.location,
    managerId: spec.managerId,
    email,
    phone: `(208) 555-${String(1000 + index).padStart(4, "0")}`,
    startDate: spec.startDate,
    status: spec.status ?? "Active",
    mfa: spec.mfa ?? true,
    training: spec.training ?? "Current",
    licenses: licensesFor(spec.department, fieldSystem, books, prices),
    devices,
    groups: groupsFor(spec, directory),
    privileged: spec.id === "p-mara" || spec.id === "p-priya" || spec.id === "p-camille" || spec.id === "p-adele",
    accountEnabled: (spec.status ?? "Active") !== "Offboarding",
    health: {
      patch: spec.device === "old" ? "Behind" : (spec.status ?? "Active") === "Onboarding" ? "Pending" : index % 19 === 0 ? "Pending" : "Current",
      checkIn: spec.device === "old" ? "2026-10-02" : "2026-10-21",
      encryption: spec.device !== "old",
    },
  };
}

const graniteNamed: Named[] = [
  { id: "p-mara", name: "Cole Brennan", role: "President", department: "Leadership", location: "Main office", managerId: null, startDate: "2011-03-04", phone: true },
  { id: "p-priya", name: "Ren Alvarez", role: "Operations manager", department: "Operations", location: "Main office", managerId: "p-mara", startDate: "2016-01-11", phone: true },
  { id: "p-helen", name: "June Adler", role: "Safety coordinator", department: "Operations", location: "Yard", managerId: "p-priya", startDate: "2018-05-02", phone: true },
  { id: "p-jonah", name: "Wes Calder", role: "Accounting lead", department: "Finance", location: "Main office", managerId: "p-mara", startDate: "2015-09-14", phone: true },
  { id: "p-evan", name: "Nina Cho", role: "Office manager", department: "Office", location: "Main office", managerId: "p-priya", startDate: "2019-04-08", device: "desktop", phone: true },
  { id: "p-luis", name: "Andre Vega", role: "Project manager", department: "Field", location: "River Street trailer", managerId: "p-priya", startDate: "2017-06-19", phone: true, tablet: true },
  { id: "p-nora", name: "Tess Nguyen", role: "Project manager", department: "Field", location: "State Street trailer", managerId: "p-priya", startDate: "2019-02-25", phone: true, tablet: true },
  { id: "p-amina", name: "Luis Ortega", role: "Superintendent", department: "Field", location: "River Street trailer", managerId: "p-luis", startDate: "2018-08-13", tablet: true, phone: true },
  { id: "p-chris", name: "Dana Ibarra", role: "Superintendent", department: "Field", location: "State Street trailer", managerId: "p-nora", startDate: "2020-03-02", tablet: true },
  { id: "p-ruth", name: "Omar Reid", role: "Field foreman", department: "Field", location: "Parkcenter trailer", managerId: "p-luis", startDate: "2021-07-12" },
  { id: "p-owen", name: "Kyle Brooks", role: "Field foreman", department: "Field", location: "Yard", managerId: "p-amina", startDate: "2023-01-16", mfa: false, phone: true },
  { id: "p-sam", name: "Paige Dalton", role: "Estimator", department: "Office", location: "Main office", managerId: "p-evan", startDate: "2020-11-09", device: "desktop" },
  { id: "p-leah", name: "Imani Shah", role: "Bookkeeper", department: "Finance", location: "Main office", managerId: "p-jonah", startDate: "2021-05-03" },
  { id: "p-wes", name: "Miles Okonkwo", role: "Estimator", department: "Office", location: "Main office", managerId: "p-evan", startDate: "2022-02-14" },
  { id: "p-dana", name: "Elena Frost", role: "Project coordinator", department: "Office", location: "Yard", managerId: "p-evan", startDate: "2022-09-01", status: "Offboarding", device: "desktop" },
  { id: "p-imani", name: "Felix Hart", role: "Field foreman", department: "Field", location: "Yard", managerId: "p-neil", startDate: "2019-12-02", device: "old" },
  { id: "p-theo", name: "Theo Lang", role: "Project manager", department: "Field", location: "Parkcenter trailer", managerId: "p-priya", startDate: "2026-10-06", status: "Onboarding", mfa: false, tablet: true },
  { id: "p-grace", name: "Cora Nguyen", role: "Estimator", department: "Office", location: "Main office", managerId: "p-evan", startDate: "2023-04-18" },
  { id: "p-neil", name: "Neil Soto", role: "Yard lead", department: "Operations", location: "Yard", managerId: "p-priya", startDate: "2014-10-20", phone: true },
  { id: "p-rosa", name: "Rosa Bennett", role: "Field foreman", department: "Field", location: "Main office", managerId: "p-neil", startDate: "2024-01-08" },
];

const graniteSites = ["Main office", "Yard", "River Street trailer", "State Street trailer", "Parkcenter trailer"];

function graniteDepartment(index: number): Person["department"] {
  if (index < 38) return "Field";
  if (index < 52) return "Office";
  if (index < 62) return "Operations";
  return "Finance";
}

function graniteRole(department: Person["department"]): string {
  if (department === "Field") return "Field foreman";
  if (department === "Office") return "Project coordinator";
  if (department === "Finance") return "Accounting";
  return "Coordinator";
}

function graniteManager(department: Person["department"]): string {
  if (department === "Office") return "p-evan";
  if (department === "Finance") return "p-jonah";
  if (department === "Operations") return "p-priya";
  return "p-amina";
}

function buildGranitePeople(): Person[] {
  const prices: Prices = { m365: 26, field: 80, bluebeam: 40, books: 150 };
  const named = graniteNamed.map((spec, index) => buildPerson(spec, "granitepeak.example", index, "Procore", "Sage 300", prices, "entra"));
  const generated = Array.from({ length: 70 }, (_, index) => {
    const department = graniteDepartment(index);
    const location = graniteSites[index % graniteSites.length];
    const spec: Named = {
      id: `p-g${index}`,
      name: `${firstNames[index % firstNames.length]} ${lastNames[index % lastNames.length]}`,
      role: graniteRole(department),
      department,
      location,
      managerId: graniteManager(department),
      startDate: `${2018 + (index % 7)}-0${(index % 8) + 1}-12`.replace("-010", "-10").replace("-011", "-11"),
      mfa: ![4, 12, 20, 28, 36].includes(index),
      device: index % 13 === 0 ? "old" : department === "Office" ? "desktop" : "laptop",
      phone: department === "Field" && index % 2 === 0,
    };
    return buildPerson(spec, "granitepeak.example", index + 20, "Procore", "Sage 300", prices, "entra");
  });
  return [...named, ...generated];
}

const redlineNamed: Named[] = [
  { id: "p-camille", name: "Harper Quinn", role: "Owner", department: "Leadership", location: "Office", managerId: null, startDate: "2009-06-01", phone: true },
  { id: "p-adele", name: "Sasha Petrova", role: "Operations manager", department: "Operations", location: "Office", managerId: "p-camille", startDate: "2017-03-20", phone: true },
  { id: "p-jordan", name: "Riley Chen", role: "Office manager", department: "Office", location: "Office", managerId: "p-adele", startDate: "2019-08-12", device: "desktop", phone: true },
  { id: "p-miles", name: "Andre Cole", role: "Superintendent", department: "Field", location: "Addison trailer", managerId: "p-adele", startDate: "2016-11-04", tablet: true, phone: true },
  { id: "p-hassan", name: "Hassan Rahman", role: "Accounting lead", department: "Finance", location: "Office", managerId: "p-camille", startDate: "2020-01-27" },
  { id: "p-r1", name: "Bea Lang", role: "Estimator", department: "Office", location: "Office", managerId: "p-jordan", startDate: "2021-09-14" },
  { id: "p-r2", name: "Ivan Cross", role: "Field foreman", department: "Field", location: "Yard", managerId: "p-miles", startDate: "2018-04-02", phone: true },
  { id: "p-r3", name: "Nia Holt", role: "Safety coordinator", department: "Operations", location: "Yard", managerId: "p-adele", startDate: "2022-06-06" },
];

function buildRedlinePeople(): Person[] {
  const prices: Prices = { m365: 22, field: 70, bluebeam: 35, books: 90 };
  const rows: [string, Person["department"], string][] = [
    ["Nina", "Field", "Field foreman"],
    ["Paul", "Field", "Field foreman"],
    ["Celia", "Field", "Field foreman"],
    ["Mark", "Office", "Project coordinator"],
    ["Ivy", "Field", "Field foreman"],
    ["Omar", "Field", "Field foreman"],
    ["Faye", "Finance", "Accounting"],
    ["Ian", "Office", "Estimator"],
    ["Kira", "Field", "Field foreman"],
    ["Leif", "Field", "Field foreman"],
    ["Gideon", "Operations", "Coordinator"],
    ["Priya", "Field", "Field foreman"],
    ["Noah", "Field", "Field foreman"],
    ["Elena", "Office", "Project coordinator"],
    ["Seth", "Field", "Field foreman"],
    ["Maya", "Finance", "Accounting"],
    ["Colin", "Field", "Field foreman"],
    ["Aria", "Field", "Field foreman"],
    ["Jonah", "Office", "Estimator"],
    ["Tess", "Field", "Field foreman"],
    ["Hugo", "Operations", "Coordinator"],
    ["Lila", "Field", "Field foreman"],
    ["Dean", "Field", "Field foreman"],
    ["Vera", "Finance", "Accounting"],
    ["Owen", "Field", "Field foreman"],
    ["Cora", "Office", "Project coordinator"],
    ["Felix", "Field", "Field foreman"],
  ];
  const sites = ["Office", "Yard", "Addison trailer"];
  const named = redlineNamed.map((spec, index) => buildPerson(spec, "redlinepaving.example", index, "Procore", "QuickBooks", prices, "google"));
  const generated = rows.map((row, index) => {
    const spec: Named = {
      id: `p-s${index}`,
      name: `${row[0]} ${lastNames[(index + 3) % lastNames.length]}`,
      role: row[2],
      department: row[1],
      location: sites[index % sites.length],
      managerId: row[1] === "Field" ? "p-miles" : row[1] === "Office" ? "p-jordan" : row[1] === "Finance" ? "p-hassan" : "p-adele",
      startDate: `${2019 + (index % 6)}-0${(index % 8) + 1}-08`.replace("-010", "-10").replace("-011", "-11"),
      mfa: index !== 4,
      device: row[1] === "Office" ? "desktop" : index === 10 ? "old" : "laptop",
    };
    return buildPerson(spec, "redlinepaving.example", index + 8, "Procore", "QuickBooks", prices, "google");
  });
  return [...named, ...generated];
}

function message(id: string, author: string, offset: number, body: string, internal = false): TicketMessage {
  return { id, author, at: demoIso(offset), body, internal };
}

function ticket(
  workspaceId: string,
  id: string,
  subject: string,
  category: Ticket["category"],
  priority: Ticket["priority"],
  status: Ticket["status"],
  requesterId: string,
  opened: number,
  updated: number,
  respondBy: number,
  resolveBy: number,
  messages: TicketMessage[],
): Ticket {
  return {
    id,
    workspaceId,
    subject,
    category,
    priority,
    status,
    requesterId,
    assignee: "Talon Support",
    opened: demoIso(opened),
    updated: demoIso(updated),
    respondBy: demoIso(respondBy),
    resolveBy: demoIso(resolveBy),
    messages,
    attachments: [],
  };
}

function graniteTickets(): Ticket[] {
  return [
    ticket(GRANITE, "GP-1052", "Bid inbox is not showing new mail", "Software", "Normal", "Open", "p-evan", -20 * hour, -6 * hour, 4 * hour, 28 * hour, [
      message("m1", "Nina Cho", -20 * hour, "The bid inbox stopped showing mail that estimators forward from the website form."),
      message("m2", "Talon Support", -6 * hour, "The rule was pointed at a folder Nina cannot see. Checking the mailbox permissions next."),
    ]),
    ticket(GRANITE, "GP-1048", "Kyle is locked out of Procore", "Access", "High", "Open", "p-owen", -26 * hour, -3 * hour, -2 * hour, 8 * hour, [
      message("m1", "Kyle Brooks", -26 * hour, "I cannot finish the MFA prompt. Procore sends me back to the sign-in page."),
      message("m2", "Talon Support", -3 * hour, "The prompt is waiting on the phone Kyle left in the yard truck."),
    ]),
    ticket(GRANITE, "GP-1044", "State Street trailer internet is down", "Hardware", "High", "Waiting", "p-ruth", -70 * hour, -12 * hour, -60 * hour, 20 * hour, [
      message("m1", "Omar Reid", -70 * hour, "The State Street trailer has no internet. The LTE kit shows no signal."),
      message("m2", "Talon Support", -12 * hour, "The kit needs a power cycle on site while we watch the failover."),
    ]),
    ticket(GRANITE, "GP-1041", "Procore access for Theo Lang", "Onboarding", "Normal", "In progress", "p-priya", -80 * hour, -8 * hour, -70 * hour, 30 * hour, [
      message("m1", "Ren Alvarez", -80 * hour, "Theo starts as a project manager at Parkcenter this week. He needs mail and Procore."),
      message("m2", "Talon Support", -8 * hour, "Mailbox is done. Procore seat is assigned. MFA is waiting on Theo."),
    ]),
    ticket(GRANITE, "GP-1036", "Elena Frost last day Friday", "Offboarding", "High", "Open", "p-priya", -40 * hour, -5 * hour, -20 * hour, 50 * hour, [
      message("m1", "Ren Alvarez", -40 * hour, "Elena's last day is Friday. Close the mailbox, Bluebeam, and the yard gate badge that afternoon."),
    ]),
    ticket(GRANITE, "GP-1033", "Main office plotter will not print a set", "Hardware", "Normal", "Resolved", "p-sam", -140 * hour, -110 * hour, -130 * hour, -100 * hour, [
      message("m1", "Paige Dalton", -140 * hour, "The plotter stops halfway through a 24x36 set."),
      message("m2", "Talon Support", -110 * hour, "A bad job was stuck in the queue. A test set printed."),
    ]),
    ticket(GRANITE, "GP-1028", "Tablet for a superintendent", "Hardware", "Normal", "In progress", "p-luis", -90 * hour, -9 * hour, -80 * hour, 12 * hour, [
      message("m1", "Andre Vega", -90 * hour, "Luis needs a field tablet at the River Street trailer. His current one will not hold a charge."),
    ]),
    ticket(GRANITE, "GP-1022", "Bluebeam seat for a new estimator", "Access", "Normal", "Waiting", "p-wes", -30 * hour, -10 * hour, -16 * hour, 40 * hour, [
      message("m1", "Miles Okonkwo", -30 * hour, "Cora needs Bluebeam on the estimating PC before the Friday bid."),
    ]),
    ticket(GRANITE, "GP-1009", "Sage job cost export failed", "Software", "Urgent", "Open", "p-jonah", -50 * hour, -2 * hour, -40 * hour, -6 * hour, [
      message("m1", "Wes Calder", -50 * hour, "Yesterday's Procore costs did not land in Sage 300."),
      message("m2", "Talon Support", -2 * hour, "The sync credential expired. A new one is with Sage. Costs are being checked by hand until it is back."),
    ]),
    ticket(GRANITE, "GP-1004", "Imani password reset", "Access", "Low", "Resolved", "p-leah", -200 * hour, -190 * hour, -196 * hour, -170 * hour, [
      message("m1", "Imani Shah", -200 * hour, "I am locked out of email."),
      message("m2", "Talon Support", -190 * hour, "Password reset in person. She signed in."),
    ]),
    ticket(GRANITE, "GP-0998", "Yard laptop is due for replacement", "Hardware", "Normal", "In progress", "p-imani", -160 * hour, -24 * hour, -150 * hour, 60 * hour, [
      message("m1", "Felix Hart", -160 * hour, "The yard laptop from 2021 takes several minutes to open a plan set."),
    ]),
    ticket(GRANITE, "GP-0991", "Two foremen start November 2", "Onboarding", "Normal", "Waiting", "p-priya", -15 * hour, -4 * hour, 8 * hour, 200 * hour, [
      message("m1", "Ren Alvarez", -15 * hour, "Two foremen start at the yard on November 2. Names are in the hiring packet."),
      message("m2", "Talon Support", -4 * hour, "Waiting on personal email addresses before the accounts are created."),
    ]),
  ];
}

function redlineTickets(): Ticket[] {
  return [
    ticket(REDLINE, "RC-188", "Addison trailer internet is down", "Hardware", "High", "Open", "p-miles", -18 * hour, -3 * hour, 2 * hour, 24 * hour, [
      message("m1", "Andre Cole", -18 * hour, "The Addison trailer lost internet before the pour. The LTE light is red."),
      message("m2", "Talon Support", -3 * hour, "Failover to the backup SIM is staged for the lunch break."),
    ]),
    ticket(REDLINE, "RC-184", "New estimator needs Google Workspace", "Access", "Normal", "In progress", "p-jordan", -60 * hour, -8 * hour, -40 * hour, 36 * hour, [
      message("m1", "Riley Chen", -60 * hour, "Our new estimator starts Thursday. She needs mail and the shared bid inbox."),
      message("m2", "Talon Support", -8 * hour, "Mailbox is created. MFA enrollment is the remaining step."),
    ]),
    ticket(REDLINE, "RC-179", "Yard phone stuck on hold", "Hardware", "Normal", "Resolved", "p-jordan", -220 * hour, -200 * hour, -210 * hour, -180 * hour, [
      message("m1", "Riley Chen", -220 * hour, "The yard phone keeps a caller on hold after we hang up."),
      message("m2", "Talon Support", -200 * hour, "The handset was replaced. A test call cleared."),
    ]),
    ticket(REDLINE, "RC-170", "Owner MFA prompt on a new phone", "Access", "Normal", "Waiting", "p-camille", -30 * hour, -6 * hour, -10 * hour, 48 * hour, [
      message("m1", "Harper Quinn", -30 * hour, "I replaced my phone and the MFA prompt never arrives."),
      message("m2", "Talon Support", -6 * hour, "Waiting until Harper is in the office so the old registration can be removed in person."),
    ]),
    ticket(REDLINE, "RC-166", "Timekeeping punches posted a day late", "Software", "Low", "Resolved", "p-adele", -300 * hour, -260 * hour, -290 * hour, -240 * hour, [
      message("m1", "Sasha Petrova", -300 * hour, "Saturday crew punches showed up on Sunday."),
      message("m2", "Talon Support", -260 * hour, "The send window was on the wrong timezone. It is back on Mountain time."),
    ]),
  ];
}

export function liveTicket(workspaceId: string): Ticket {
  if (workspaceId === REDLINE) {
    return ticket(REDLINE, "RC-191", "Bid confirmations are stuck in the outbox", "Software", "Normal", "Open", "p-jordan", 0, 0, 4 * hour, 24 * hour, [
      message("m1", "Riley Chen", 0, "Confirmations for tomorrow's bids are sitting in the outbox."),
    ]);
  }
  return ticket(GRANITE, "GP-1096", "Main office plotter jammed again", "Hardware", "Normal", "Open", "p-sam", 0, 0, 4 * hour, 24 * hour, [
    message("m1", "Paige Dalton", 0, "The plotter jammed mid-set. The bid room queue is backing up."),
  ]);
}

const articles: Article[] = [
  {
    slug: "onboarding-a-new-hire",
    title: "Onboarding a new hire",
    category: "Accounts",
    reviewed: "2026-09-12",
    owner: "Talon Support",
    summary: "Mailbox, Procore, and MFA before the first day.",
    body: ["Send the start date, location, role, and personal email."],
    related: ["mfa-setup"],
  },
  {
    slug: "password-reset",
    title: "Password reset",
    category: "Accounts",
    reviewed: "2026-07-16",
    owner: "Talon Support",
    summary: "Reset the password, then check MFA.",
    body: ["The temporary password is given in person or by a phone call."],
    related: ["mfa-setup"],
  },
];

function sumBy(people: Person[], name: string): { seats: number; monthly: number } {
  const holders = people.filter((person) => person.licenses.some((license) => license.name === name));
  const monthly = holders.reduce((sum, person) => sum + (person.licenses.find((license) => license.name === name)?.monthly ?? 0), 0);
  return { seats: holders.length, monthly };
}

type Economics = {
  monthSpend: number;
  breakdown: SpendSlice[];
  software: SoftwareContract[];
  vendors: Vendor[];
};

function economics(people: Person[], input: {
  fieldSystem: string;
  books: string;
  retainer: number;
  cloud: { name: string; amount: number }[];
  hardware: { name: string; amount: number }[];
  telecom: { name: string; amount: number }[];
  security: { name: string; amount: number }[];
  extraSoftware: SoftwareContract[];
  renewals: Record<string, { date: string; note: string }>;
}): Economics {
  const suite = sumBy(people, "Google Workspace").seats > 0 ? sumBy(people, "Google Workspace") : sumBy(people, "Microsoft 365");
  const suiteName = sumBy(people, "Google Workspace").seats > 0 ? "Google Workspace" : "Microsoft 365";
  const field = sumBy(people, input.fieldSystem);
  const bluebeam = sumBy(people, "Bluebeam");
  const books = sumBy(people, input.books);
  const software: SoftwareContract[] = [
    { name: suiteName, vendor: suiteName === "Google Workspace" ? "Google" : "Microsoft", monthly: suite.monthly, seats: `${suite.seats} people`, renewal: "2027-01-15", note: "Mail and files." },
    { name: input.fieldSystem, vendor: "Procore", monthly: field.monthly, seats: `${field.seats} field`, renewal: "2027-03-01", note: "Project management." },
    { name: "Bluebeam", vendor: "Bluebeam", monthly: bluebeam.monthly, seats: `${bluebeam.seats} estimating`, renewal: "2027-04-01", note: "Plan markup." },
    { name: input.books, vendor: input.books === "QuickBooks" ? "Intuit" : "Sage", monthly: books.monthly, seats: `${books.seats} accounting`, renewal: "2026-12-01", note: "Job cost." },
    ...input.extraSoftware,
  ];
  const softwareMonthly = software.reduce((sum, item) => sum + item.monthly, 0);
  const breakdown: SpendSlice[] = [
    { name: "Talon retainer", amount: input.retainer, lines: [{ name: "Monthly retainer", amount: input.retainer }] },
    { name: "Software", amount: softwareMonthly, lines: software.map((item) => ({ name: item.name, amount: item.monthly })) },
    { name: "Cloud and hosting", amount: input.cloud.reduce((sum, item) => sum + item.amount, 0), lines: input.cloud },
    { name: "Hardware", amount: input.hardware.reduce((sum, item) => sum + item.amount, 0), lines: input.hardware },
    { name: "Telecom", amount: input.telecom.reduce((sum, item) => sum + item.amount, 0), lines: input.telecom },
    { name: "Security tools", amount: input.security.reduce((sum, item) => sum + item.amount, 0), lines: input.security },
  ];
  const vendors: Vendor[] = [
    ...software.map((item) => ({
      name: item.vendor,
      category: "Software",
      monthly: item.monthly,
      renewal: item.renewal,
      contact: `billing@${item.vendor.toLowerCase().replace(/\s+/g, "")}.example`,
      note: item.note,
    })),
    ...input.cloud.map((item) => ({ name: item.name, category: "Cloud", monthly: item.amount, renewal: "2027-01-01", contact: "accounts@host.example", note: "Hosting and the plan room files." })),
    ...input.telecom.map((item) => ({ name: item.name, category: "Telecom", monthly: item.amount, renewal: input.renewals[item.name]?.date ?? "2026-12-01", contact: "support@summitvoice.example", note: input.renewals[item.name]?.note ?? "Internet and phones." })),
    ...input.security.map((item) => ({ name: item.name, category: "Security", monthly: item.amount, renewal: "2027-05-01", contact: "support@endpoint.example", note: "Endpoint protection." })),
  ];
  const monthSpend = breakdown.reduce((sum, slice) => sum + slice.amount, 0);
  return { monthSpend, breakdown, software, vendors };
}

const graniteEconomics = (people: Person[]) =>
  economics(people, {
    fieldSystem: "Procore",
    books: "Sage 300",
    retainer: 4800,
    cloud: [
      { name: "Company website", amount: 400 },
      { name: "Plan room storage", amount: 1100 },
    ],
    hardware: [
      { name: "Field tablet accrual", amount: 1800 },
      { name: "Plotter", amount: 600 },
      { name: "Spares", amount: 800 },
    ],
    telecom: [
      { name: "Main office circuit", amount: 1600 },
      { name: "Yard circuit", amount: 900 },
      { name: "River Street trailer", amount: 700 },
      { name: "State Street trailer", amount: 650 },
      { name: "Parkcenter trailer", amount: 550 },
      { name: "Summit Voice", amount: 740 },
    ],
    security: [{ name: "Endpoint protection", amount: 1600 }],
    extraSoftware: [
      { name: "Plan room", vendor: "Fieldshare", monthly: 860, seats: "Workspace", renewal: "2026-12-01", note: "Current sets for the field." },
      { name: "Tally", vendor: "Tally", monthly: 420, seats: "Field", renewal: "2027-02-01", note: "Timekeeping." },
    ],
    renewals: {
      "State Street trailer": { date: "2026-12-01", note: "LTE kit." },
    },
  });

const redlineEconomics = (people: Person[]) =>
  economics(people, {
    fieldSystem: "Procore",
    books: "QuickBooks",
    retainer: 1800,
    cloud: [{ name: "Company website", amount: 280 }],
    hardware: [{ name: "Spares", amount: 640 }],
    telecom: [
      { name: "Office circuit", amount: 700 },
      { name: "Yard circuit", amount: 480 },
      { name: "Addison trailer", amount: 360 },
    ],
    security: [{ name: "Endpoint protection", amount: 360 }],
    extraSoftware: [
      { name: "Plan room", vendor: "Fieldshare", monthly: 220, seats: "Workspace", renewal: "2027-03-01", note: "Current sets." },
      { name: "Tally", vendor: "Tally", monthly: 140, seats: "Field", renewal: "2027-02-01", note: "Timekeeping." },
    ],
    renewals: {},
  });

function seriesFor(monthSpend: number, visitors: number, opened: number, score: number): { months: SeriesPoint[]; weeks: SeriesPoint[] } {
  const labels = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];
  const spendFactor = [0.92, 0.95, 0.94, 0.96, 0.99, 0.95, 1.02, 0.97, 1, 1.06, 0.98, 1];
  const visitFactor = [0.74, 0.67, 0.81, 0.86, 0.93, 0.88, 0.98, 0.95, 1.02, 1.05, 0.98, 1];
  const openFactor = [0.65, 0.53, 0.76, 0.71, 0.85, 0.62, 0.91, 0.79, 0.88, 0.97, 0.82, 1];
  const months = labels.map((label, index) => {
    const spend = Math.round(monthSpend * spendFactor[index]);
    const budget = Math.round(monthSpend * (label === "Aug" ? 1.02 : 0.96));
    const monthVisitors = Math.round(visitors * visitFactor[index]);
    const monthOpened = Math.max(1, Math.round(opened * openFactor[index]));
    return {
      label,
      spend,
      budget,
      visitors: monthVisitors,
      sessions: Math.round(monthVisitors * 1.33),
      opened: monthOpened,
      resolved: Math.max(1, monthOpened - (index % 4 === 0 ? 2 : 1)),
      score: Math.min(90, score - Math.max(0, 8 - index)),
    };
  });
  const weekFactor = [0.24, 0.25, 0.24, 0.27];
  const weekLabels = ["Sep 28", "Oct 5", "Oct 12", "Oct 19"];
  const october = months[11];
  const weeks = weekLabels.map((label, index) => ({
    label,
    spend: index === 3 ? october.spend - weekFactor.slice(0, 3).reduce((sum, factor) => sum + Math.round(october.spend * factor), 0) : Math.round(october.spend * weekFactor[index]),
    budget: index === 3 ? october.budget - weekFactor.slice(0, 3).reduce((sum, factor) => sum + Math.round(october.budget * factor), 0) : Math.round(october.budget * weekFactor[index]),
    visitors: index === 3 ? october.visitors - weekFactor.slice(0, 3).reduce((sum, factor) => sum + Math.round(october.visitors * factor), 0) : Math.round(october.visitors * weekFactor[index]),
    sessions: 0,
    opened: index === 3 ? october.opened - weekFactor.slice(0, 3).reduce((sum, factor) => sum + Math.round(october.opened * factor), 0) : Math.max(1, Math.round(october.opened * weekFactor[index])),
    resolved: 0,
    score: october.score,
  }));
  for (const week of weeks) {
    week.sessions = Math.round(week.visitors * 1.33);
    week.resolved = Math.max(0, week.opened - 1);
  }
  return { months, weeks };
}

function sliceSeries(months: SeriesPoint[], weeks: SeriesPoint[], range: DateRange): { points: SeriesPoint[]; label: string } {
  if (range === "30d") return { points: weeks, label: "Last 30 days" };
  if (range === "90d") return { points: months.slice(-3), label: "Last 90 days" };
  if (range === "ytd") return { points: months.slice(2), label: "Year to date" };
  return { points: months, label: "Last 12 months" };
}

function sumPoints(points: SeriesPoint[], key: "spend" | "budget" | "visitors" | "sessions" | "opened" | "resolved"): number {
  return points.reduce((sum, point) => sum + point[key], 0);
}

const graniteServices: ServiceStatus[] = [
  { id: "website", name: "Public website", status: "Operational", uptime30: 99.98, uptime90: 99.95, responseMs: 180, incidents: [] },
  { id: "m365", name: "Microsoft 365", status: "Operational", uptime30: 99.99, uptime90: 99.98, responseMs: 90, incidents: [] },
  { id: "phones", name: "Phones", status: "Operational", uptime30: 99.95, uptime90: 99.9, responseMs: 40, incidents: [] },
  {
    id: "procore",
    name: "Procore",
    status: "Degraded",
    uptime30: 99.9,
    uptime90: 99.7,
    responseMs: 420,
    incidents: [{ at: "2026-10-09T13:10:00.000Z", minutes: 46, summary: "Procore was slow after the Sage credential expired." }],
  },
  { id: "sage", name: "Sage 300", status: "Operational", uptime30: 99.97, uptime90: 99.95, responseMs: 210, incidents: [{ at: "2026-10-11T16:00:00.000Z", minutes: 22, summary: "Job cost export failed once." }] },
  { id: "plans", name: "Plan room", status: "Operational", uptime30: 99.96, uptime90: 99.94, responseMs: 160, incidents: [] },
  { id: "bluebeam", name: "Bluebeam", status: "Operational", uptime30: 99.99, uptime90: 99.98, responseMs: 140, incidents: [] },
  { id: "tally", name: "Timekeeping", status: "Operational", uptime30: 99.94, uptime90: 99.9, responseMs: 110, incidents: [] },
  {
    id: "internet",
    name: "River Street trailer",
    status: "Operational",
    uptime30: 99.9,
    uptime90: 99.8,
    responseMs: 28,
    incidents: [{ at: "2026-09-02T15:00:00.000Z", minutes: 18, summary: "LTE drop. The kit failed over." }],
  },
];

const redlineServices: ServiceStatus[] = [
  { id: "website", name: "Public website", status: "Operational", uptime30: 99.95, uptime90: 99.9, responseMs: 210, incidents: [] },
  { id: "google", name: "Google Workspace", status: "Operational", uptime30: 99.99, uptime90: 99.99, responseMs: 88, incidents: [] },
  { id: "phones", name: "Phones", status: "Operational", uptime30: 99.9, uptime90: 99.8, responseMs: 36, incidents: [] },
  { id: "procore", name: "Procore", status: "Operational", uptime30: 99.95, uptime90: 99.9, responseMs: 240, incidents: [] },
  { id: "quickbooks", name: "QuickBooks", status: "Operational", uptime30: 99.97, uptime90: 99.95, responseMs: 180, incidents: [] },
  { id: "plans", name: "Plan room", status: "Operational", uptime30: 99.94, uptime90: 99.9, responseMs: 170, incidents: [] },
  { id: "bluebeam", name: "Bluebeam", status: "Operational", uptime30: 99.98, uptime90: 99.96, responseMs: 150, incidents: [] },
  { id: "tally", name: "Timekeeping", status: "Operational", uptime30: 99.92, uptime90: 99.88, responseMs: 120, incidents: [{ at: "2026-09-18T16:20:00.000Z", minutes: 22, summary: "Punches posted late." }] },
];

function pagesFor(host: string, sessions: number): { path: string; views: number }[] {
  const paths = ["/", "/projects", "/careers", "/bid", "/safety"];
  const weights = [0.34, 0.22, 0.12, 0.2, 0.12];
  return paths.map((path, index) => ({ path: `${host}${path === "/" ? "" : path}`, views: Math.round(sessions * weights[index]) }));
}

const graniteLocations: ClinicLocation[] = [
  { id: "office", name: "Main office", address: "400 Front Street, Boise, ID", hours: "Mon–Fri 7–5", circuits: [{ name: "Primary", detail: "Fiber" }, { name: "Backup", detail: "LTE" }], note: "Boise headquarters." },
  { id: "yard", name: "Yard", address: "90 Industrial Way, Meridian, ID", hours: "Mon–Fri 6–4", circuits: [{ name: "Primary", detail: "Fiber" }], note: "Meridian yard." },
  { id: "river", name: "River Street trailer", address: "River Street, Boise, ID", hours: "Mon–Sat 6–4", circuits: [{ name: "Primary", detail: "LTE" }, { name: "Backup", detail: "Starlink" }], note: "Active job." },
  { id: "state", name: "State Street trailer", address: "State Street, Boise, ID", hours: "Mon–Fri 6–4", circuits: [{ name: "Primary", detail: "LTE" }], note: "Active job." },
  { id: "park", name: "Parkcenter trailer", address: "Parkcenter Blvd, Boise, ID", hours: "Mon–Fri 6–4", circuits: [{ name: "Primary", detail: "Starlink" }], note: "Active job." },
];

const redlineLocations: ClinicLocation[] = [
  { id: "office", name: "Office", address: "18 Addison Avenue, Twin Falls, ID", hours: "Mon–Fri 7–5", circuits: [{ name: "Primary", detail: "Fiber" }], note: "Office." },
  { id: "yard", name: "Yard", address: "400 Locust Street, Twin Falls, ID", hours: "Mon–Fri 6–4", circuits: [{ name: "Primary", detail: "Fiber" }], note: "Yard." },
  { id: "addison", name: "Addison trailer", address: "Addison job, Twin Falls, ID", hours: "Mon–Sat 6–3", circuits: [{ name: "Primary", detail: "LTE" }], note: "Active pour." },
];

function documentsFor(books: string): WorkspaceDocument[] {
  return [
    { id: "acceptable-use", title: "Acceptable use", updated: "2026-05-02", owner: "Talon Support", summary: "Work accounts stay on work systems.", body: ["Job email is for job work."] },
    { id: "network-sketch", title: "Network sketch", updated: "2026-08-14", owner: "Talon Support", summary: "Office, yard, and trailer kits.", body: ["Trailers use LTE or Starlink."] },
    { id: "q3-note", title: "Q3 review notes", updated: "2026-10-06", owner: "Talon Support", summary: "October decisions.", body: [`${books} sync is the open item.`] },
  ];
}

function graniteProjects(): Project[] {
  return [
    {
      id: "connectivity",
      name: "Job-site connectivity standard",
      status: "In progress",
      progress: 55,
      owner: "Talon",
      summary: "Every trailer gets a known LTE or Starlink kit.",
      spent: 6400,
      budget: 18000,
      target: "2026-12-18",
      next: "Install the State Street kit.",
      milestones: [
        { name: "Pick the kit", done: true, due: "Sep 12" },
        { name: "Pilot at River Street", done: true, due: "Oct 3" },
        { name: "State Street install", done: false, due: "Nov 7" },
        { name: "Parkcenter install", done: false, due: "Dec 18" },
      ],
      updates: [
        { at: "Oct 3", text: "River Street pilot stayed up through a pour week." },
        { at: "Oct 16", text: "State Street kit is on the dock." },
      ],
    },
    {
      id: "procore-sage",
      name: "Procore + Sage 300 integration",
      status: "In progress",
      progress: 40,
      owner: "Talon",
      summary: "Job costs sync nightly.",
      spent: 8200,
      budget: 24000,
      target: "2027-01-30",
      next: "Replace the expired sync credential.",
      milestones: [
        { name: "Map cost codes", done: true, due: "Sep 20" },
        { name: "Nightly export", done: true, due: "Oct 8" },
        { name: "Credential rotation", done: false, due: "Oct 28" },
        { name: "Close the manual check", done: false, due: "Jan 30" },
      ],
      updates: [
        { at: "Oct 11", text: "Export failed after the credential expired." },
        { at: "Oct 20", text: "Sage sent a replacement key. Rotation is next." },
      ],
    },
    {
      id: "tenant",
      name: "Microsoft 365 tenant cleanup & license right-sizing",
      status: "In progress",
      progress: 70,
      owner: "Talon",
      summary: "Unused licenses come off.",
      spent: 2100,
      budget: 6000,
      target: "2026-11-20",
      next: "Remove seats still on people who have left.",
      milestones: [
        { name: "License inventory", done: true, due: "Sep 30" },
        { name: "Shared mailbox list", done: true, due: "Oct 14" },
        { name: "Remove unused seats", done: false, due: "Nov 20" },
      ],
      updates: [{ at: "Oct 14", text: "Shared bid inbox is the one that still matters." }],
    },
    {
      id: "backup",
      name: "Backup & disaster recovery plan",
      status: "Planned",
      progress: 15,
      owner: "Talon",
      summary: "A tested restore for files and Sage.",
      spent: 400,
      budget: 9000,
      target: "2027-02-27",
      next: "Write the restore steps.",
      milestones: [
        { name: "List what must come back", done: true, due: "Oct 21" },
        { name: "Restore test", done: false, due: "Jan 16" },
        { name: "Sign the plan", done: false, due: "Feb 27" },
      ],
      updates: [{ at: "Oct 21", text: "Sage and the plan room are the two systems that must return first." }],
    },
    {
      id: "tablets",
      name: "Field tablet rollout for superintendents",
      status: "In progress",
      progress: 35,
      owner: "Talon",
      summary: "Each superintendent has a current tablet.",
      spent: 3200,
      budget: 12000,
      target: "2026-12-04",
      next: "Swap Luis Ortega's tablet.",
      milestones: [
        { name: "Count the supers", done: true, due: "Sep 18" },
        { name: "Order the first six", done: true, due: "Oct 9" },
        { name: "Hand them out", done: false, due: "Dec 4" },
      ],
      updates: [{ at: "Oct 18", text: "Six tablets are imaged and sitting at the main office." }],
    },
    {
      id: "estimating",
      name: "AI estimating assistant pilot",
      status: "Planned",
      progress: 10,
      owner: "Talon",
      summary: "Estimators try a draft takeoff on one bid.",
      spent: 0,
      budget: 8000,
      target: "2027-03-31",
      next: "Pick the bid to pilot.",
      milestones: [
        { name: "Pick a bid", done: false, due: "Nov 14" },
        { name: "Run one takeoff", done: false, due: "Jan 23" },
        { name: "Keep or stop", done: false, due: "Mar 31" },
      ],
      updates: [{ at: "Oct 6", text: "Waiting on the next bid that is not already priced." }],
    },
    {
      id: "roadmap",
      name: "IT roadmap & 2027 budget",
      status: "Done",
      progress: 100,
      owner: "Talon",
      summary: "2027 budget is with the president.",
      spent: 4800,
      budget: 4800,
      target: "2026-10-15",
      next: "None.",
      milestones: [
        { name: "Draft the year", done: true, due: "Sep 26" },
        { name: "Review with Cole", done: true, due: "Oct 10" },
        { name: "File the budget", done: true, due: "Oct 15" },
      ],
      updates: [{ at: "Oct 15", text: "Cole has the 2027 number." }],
    },
    {
      id: "vendors",
      name: "Vendor/contract consolidation",
      status: "In progress",
      progress: 60,
      owner: "Talon",
      summary: "Overlapping phone and backup contracts come down to one each.",
      spent: 1500,
      budget: 4000,
      target: "2026-12-01",
      next: "Compare the two phone invoices.",
      milestones: [
        { name: "List the contracts", done: true, due: "Sep 5" },
        { name: "Mark the overlaps", done: true, due: "Oct 2" },
        { name: "End the extra phone line", done: false, due: "Dec 1" },
      ],
      updates: [{ at: "Oct 2", text: "Two phone bills cover the same yard handsets." }],
    },
  ];
}

function redlineProjects(): Project[] {
  return [
    {
      id: "connectivity",
      name: "Trailer connectivity",
      status: "In progress",
      progress: 30,
      owner: "Talon",
      summary: "The Addison trailer stays online during a pour.",
      spent: 900,
      budget: 4000,
      target: "2026-11-21",
      next: "Swap the LTE kit.",
      milestones: [
        { name: "Confirm the outage", done: true, due: "Oct 18" },
        { name: "Swap the kit", done: false, due: "Nov 21" },
      ],
      updates: [{ at: "Oct 18", text: "The current kit drops before noon." }],
    },
    {
      id: "books",
      name: "Procore and QuickBooks",
      status: "Planned",
      progress: 5,
      owner: "Talon",
      summary: "Job costs leave Procore without a spreadsheet.",
      spent: 0,
      budget: 6000,
      target: "2027-02-12",
      next: "Export one job by hand and compare.",
      milestones: [
        { name: "Sample export", done: false, due: "Nov 20" },
        { name: "Turn on the sync", done: false, due: "Feb 12" },
      ],
      updates: [{ at: "Oct 9", text: "Not started." }],
    },
  ];
}

function reportsFor(workspace: Workspace, exec: Executive, hours: { included: number; used: number }): { monthly: Report; qbr: Report } {
  const monthly: Report = {
    title: "October service report",
    period: "October 2026",
    blocks: [
      {
        heading: "This month",
        paragraphs: [`${workspace.name} spent ${money(exec.monthSpend)} against a ${money(exec.monthBudget)} budget.`],
        figures: [
          { label: "October spend", value: money(exec.monthSpend) },
          { label: "October budget", value: money(exec.monthBudget) },
          { label: "Hours used", value: `${hours.used} of ${hours.included}` },
        ],
      },
    ],
  };
  const qbr: Report = {
    title: "Quarterly review",
    period: "Q3 2026, with October",
    blocks: [
      {
        heading: "The quarter",
        paragraphs: [`${workspace.name} is a ${workspace.plan} workspace with ${exec.headcount} people.`],
        figures: [
          { label: "Year to date", value: money(exec.ytdSpend) },
          { label: "YTD budget", value: money(exec.ytdBudget) },
        ],
      },
    ],
  };
  return { monthly, qbr };
}

type Bundle = {
  workspace: Workspace;
  people: Person[];
  tickets: Ticket[];
  economics: Economics;
  series: { months: SeriesPoint[]; weeks: SeriesPoint[] };
  services: ServiceStatus[];
  locations: ClinicLocation[];
  documents: WorkspaceDocument[];
  projects: Project[];
  roadmap: RoadmapItem[];
  billing: BillingSnapshot;
  backups: Executive["backups"];
  risks: Executive["risks"];
  renewals: Executive["renewals"];
  savings: Executive["savings"];
  security: SecuritySnapshot;
  notices: Notice[];
  visitors: number;
  opened: number;
  score: number;
};

function buildGranite(): Bundle {
  const people = buildGranitePeople();
  const econ = graniteEconomics(people);
  const visitors = 2400;
  const opened = 28;
  const score = 84;
  const series = seriesFor(econ.monthSpend, visitors, opened, score);
  return {
    workspace: {
      id: GRANITE,
      name: "Granite Peak Builders",
      plan: "Pro",
      industry: "Commercial general contractor",
      region: "Boise and Meridian",
      website: "granitepeak.example",
      domain: "granitepeak.example",
      leaderId: "p-mara",
      staffId: "p-evan",
      blurb: "Commercial builder. Microsoft 365 and Procore.",
      directory: "entra",
      pims: "Procore",
    },
    people,
    tickets: graniteTickets(),
    economics: econ,
    series,
    services: graniteServices,
    locations: graniteLocations,
    documents: documentsFor("Sage 300"),
    projects: graniteProjects(),
    roadmap: [
      { quarter: "Q4 2026", items: [{ name: "State Street kit", state: "Now" }, { name: "Sage credential", state: "Now" }, { name: "Tablet handoff", state: "Now" }] },
      { quarter: "Q1 2027", items: [{ name: "Restore test", state: "Next" }, { name: "Procore sync close", state: "Next" }] },
    ],
    billing: {
      plan: "Pro",
      monthly: 4800,
      hoursIncluded: 12,
      hoursUsed: 7.5,
      invoices: [0, 1, 2].map((index) => ({
        id: `INV-48${2 - index}`,
        date: ["2026-10-01", "2026-09-01", "2026-08-01"][index],
        amount: 4800,
        status: "Paid" as const,
        lines: [
          { label: "Pro retainer", amount: 4800 },
          { label: "Included hours", amount: 0 },
        ],
      })),
    },
    backups: [
      { id: "office", label: "Main office nightly", status: "Current", detail: "Succeeded Oct 21." },
      { id: "plans", label: "Plan room nightly", status: "Current", detail: "Succeeded Oct 21." },
      { id: "sage", label: "Sage restore test", status: "Due", detail: "Last test was in August." },
    ],
    risks: [
      { id: "sync", title: "Sage sync credential", detail: "Job costs are not filing.", href: "/app/requests/GP-1009" },
      { id: "elena", title: "Offboarding still licensed", detail: "Elena Frost leaves Friday.", href: "/app/people/p-dana" },
    ],
    renewals: [
      { vendor: "Sage", date: "2026-12-01", amount: booksAnnual(people, "Sage 300"), note: "Annual." },
      { vendor: "Fieldshare", date: "2026-12-01", amount: 10320, note: "Plan room." },
      { vendor: "Microsoft", date: "2027-01-15", amount: Math.round(sumBy(people, "Microsoft 365").monthly * 12), note: "Annual." },
    ],
    savings: [
      { label: "Unused Bluebeam seats", amount: 80, detail: "Two estimating seats were not opened this quarter." },
      { label: "Extra yard phone line", amount: 45, detail: "A second line is still billed." },
    ],
    security: {
      score,
      alerts: [],
      policies: [{ title: "Acceptable use", href: "/app" }],
      checks: [{ id: "backup", label: "Nightly backups", state: "Met", detail: "Plan room succeeded.", href: "/app" }],
    },
    notices: [
      { id: "n-owen", title: "Kyle is locked out of Procore", body: "He is on the yard schedule tomorrow.", href: "/app/requests/GP-1048", at: "Oct 20" },
    ],
    visitors,
    opened,
    score,
  };
}

function booksAnnual(people: Person[], name: string): number {
  return Math.round(sumBy(people, name).monthly * 12);
}

function buildRedline(): Bundle {
  const people = buildRedlinePeople();
  const econ = redlineEconomics(people);
  const visitors = 640;
  const opened = 9;
  const score = 86;
  const series = seriesFor(econ.monthSpend, visitors, opened, score);
  return {
    workspace: {
      id: REDLINE,
      name: "Redline Concrete & Paving",
      plan: "Essentials",
      industry: "Concrete and paving",
      region: "Twin Falls",
      website: "redlinepaving.example",
      domain: "redlinepaving.example",
      leaderId: "p-camille",
      staffId: "p-jordan",
      blurb: "Concrete and paving. Google Workspace.",
      directory: "google",
      pims: "Procore",
    },
    people,
    tickets: redlineTickets(),
    economics: econ,
    series,
    services: redlineServices,
    locations: redlineLocations,
    documents: documentsFor("QuickBooks"),
    projects: redlineProjects(),
    roadmap: [{ quarter: "Q4 2026", items: [{ name: "Addison kit", state: "Now" }] }],
    billing: {
      plan: "Essentials",
      monthly: 1800,
      hoursIncluded: 4,
      hoursUsed: 2,
      invoices: [{ id: "INV-220", date: "2026-10-01", amount: 1800, status: "Paid", lines: [{ label: "Essentials retainer", amount: 1800 }] }],
    },
    backups: [{ id: "office", label: "Office nightly", status: "Current", detail: "Succeeded Oct 21." }],
    risks: [{ id: "net", title: "Addison trailer internet", detail: "The kit drops before noon.", href: "/app/requests/RC-188" }],
    renewals: [{ vendor: "Fieldshare", date: "2027-03-01", amount: 2640, note: "Plan room." }],
    savings: [],
    security: { score, alerts: [], policies: [], checks: [] },
    notices: [{ id: "n-addison", title: "Addison trailer internet is down", body: "A pour is on today's book.", href: "/app/requests/RC-188", at: "Oct 21" }],
    visitors,
    opened,
    score,
  };
}

const bundles: Record<string, Bundle> = {
  [GRANITE]: buildGranite(),
  [REDLINE]: buildRedline(),
};

function bundle(id: string): Bundle {
  const found = bundles[id];
  if (!found) throw new Error(`Unknown workspace ${id}`);
  return found;
}

function ytd(months: SeriesPoint[]): { spend: number; budget: number } {
  const points = months.slice(2);
  return { spend: sumPoints(points, "spend"), budget: sumPoints(points, "budget") };
}

export const mockRepository = {
  workspaces(): Workspace[] {
    return Object.values(bundles).map((item) => item.workspace);
  },
  workspace(id: string): Workspace {
    return bundle(id).workspace;
  },
  people(id: string): Person[] {
    return bundle(id).people;
  },
  person(id: string, personId: string): Person | undefined {
    return bundle(id).people.find((person) => person.id === personId);
  },
  seedTickets(id: string): Ticket[] {
    return structuredClone(bundle(id).tickets);
  },
  articles(): Article[] {
    return articles;
  },
  article(slug: string): Article | undefined {
    return articles.find((article) => article.slug === slug);
  },
  executive(id: string, range: DateRange): Executive {
    const item = bundle(id);
    const { points, label } = sliceSeries(item.series.months, item.series.weeks, range);
    const october = item.series.months[11];
    const year = ytd(item.series.months);
    const sessions = sumPoints(points, "sessions");
    const conversions = Math.round(sessions * (id === GRANITE ? 0.028 : 0.034));
    return {
      range,
      rangeLabel: label,
      periodSpend: sumPoints(points, "spend"),
      periodBudget: sumPoints(points, "budget"),
      monthSpend: october.spend,
      monthBudget: october.budget,
      ytdSpend: year.spend,
      ytdBudget: year.budget,
      costPerEmployee: Math.round(october.spend / item.people.length),
      headcount: item.people.length,
      deviceCount: item.people.reduce((sum, person) => sum + person.devices.length, 0) + item.locations.length,
      breakdown: item.economics.breakdown,
      renewals: item.renewals,
      savings: item.savings,
      series: points,
      traffic: {
        visitors: sumPoints(points, "visitors"),
        sessions,
        conversions,
        rate: sessions ? Math.round((conversions / sessions) * 1000) / 10 : 0,
        pages: pagesFor(item.workspace.website, sessions),
      },
      services: item.services,
      backups: item.backups,
      risks: item.risks,
      projects: item.projects.map((project) => ({ id: project.id, name: project.name, progress: project.progress, status: project.status })),
      securityScore: item.score,
    };
  },
  security(id: string): SecuritySnapshot {
    return bundle(id).security;
  },
  projects(id: string): Project[] {
    return bundle(id).projects;
  },
  roadmap(id: string): RoadmapItem[] {
    return bundle(id).roadmap;
  },
  billing(id: string): BillingSnapshot {
    return bundle(id).billing;
  },
  software(id: string): SoftwareContract[] {
    return bundle(id).economics.software;
  },
  vendors(id: string): Vendor[] {
    return bundle(id).economics.vendors;
  },
  locations(id: string): ClinicLocation[] {
    return bundle(id).locations;
  },
  documents(id: string): WorkspaceDocument[] {
    return bundle(id).documents;
  },
  reports(id: string): { monthly: Report; qbr: Report } {
    const item = bundle(id);
    return reportsFor(item.workspace, this.executive(id, "ytd"), { included: item.billing.hoursIncluded, used: item.billing.hoursUsed });
  },
  notices(id: string): Notice[] {
    return bundle(id).notices;
  },
  outages(id: string): OutageEvent[] {
    if (id === REDLINE) {
      return [{ id: "o-addison", at: "2026-08-11", kind: "internet", title: "Addison trailer", detail: "The circuit dropped for 14 minutes.", status: "Resolved" }];
    }
    return [
      { id: "o-river", at: "2026-09-02", kind: "internet", title: "River Street trailer", detail: "LTE drop, 18 minutes.", status: "Resolved" },
      { id: "o-procore", at: "2026-10-09", kind: "site", title: "Procore slow", detail: "Procore was slow for 46 minutes.", status: "Resolved" },
    ];
  },
  devices(id: string): AssignedDevice[] {
    const item = bundle(id);
    const assigned = item.people.flatMap((person) =>
      person.devices.map((device) => ({ ...device, location: person.location, assigneeId: person.id, assignee: person.name })),
    );
    const network = networkDevices(id).map((device) => ({ ...device, assignee: "Office" }));
    return [...assigned, ...network];
  },
  search(id: string, query: string): SearchHit[] {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const item = bundle(id);
    const people = item.people
      .filter((person) => `${person.name} ${person.role} ${person.location} ${person.department}`.toLowerCase().includes(q))
      .slice(0, 5)
      .map((person) => ({ kind: "Person" as const, id: person.id, label: person.name, detail: `${person.role} · ${person.location}`, href: `/app/people/${person.id}` }));
    const tickets = item.tickets
      .filter((entry) => `${entry.id} ${entry.subject} ${entry.category}`.toLowerCase().includes(q))
      .slice(0, 4)
      .map((entry) => ({ kind: "Ticket" as const, id: entry.id, label: `${entry.id} ${entry.subject}`, detail: entry.status, href: `/app/requests/${entry.id}` }));
    const projects = item.projects
      .filter((project) => project.name.toLowerCase().includes(q))
      .slice(0, 3)
      .map((project) => ({ kind: "Article" as const, id: project.id, label: project.name, detail: project.status, href: `/app/projects/${project.id}` }));
    return [...people, ...tickets, ...projects].slice(0, 8);
  },
};

export function networkDevices(workspaceId: string): AssignedDevice[] {
  const join = workspaceId === REDLINE ? "Google" as const : "Entra" as const;
  const base = { join, primaryUser: "unassigned", threatdown: "Protected" as const, assignee: "Office" };
  if (workspaceId === REDLINE) {
    return [{ id: "fw-office", name: "Firewall", type: "Network", purchased: "2023-04-01", refreshDue: "2028-04-01", price: 1800, location: "Office", ...base }];
  }
  return [
    { id: "fw-office", name: "Firewall", type: "Network", purchased: "2023-02-01", refreshDue: "2028-02-01", price: 2200, location: "Main office", ...base },
    { id: "fw-yard", name: "Firewall", type: "Network", purchased: "2022-11-01", refreshDue: "2027-11-01", price: 1800, location: "Yard", ...base },
  ];
}
