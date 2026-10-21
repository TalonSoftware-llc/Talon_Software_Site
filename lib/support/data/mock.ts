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

const firstNames = [
  "Beth", "Carl", "Diana", "Felix", "Gail", "Harvey", "Iris", "Joel", "Kara", "Liam",
  "Mia", "Nate", "Olive", "Pete", "Quinn", "Rita", "Seth", "Tara", "Uma", "Victor",
  "Willa", "Yves", "Zoe", "Aaron", "Brooke", "Cody", "Drew", "Elena", "Frank", "Gina",
  "Hugo", "Jade", "Kyle", "Lana", "Miles", "Nadia", "Omar", "Pia", "Reed", "Sage",
  "Tessa", "Uri", "Vera", "Walt", "Xenia", "Yara", "Zane", "Blake", "Cora", "Dean",
  "Eden", "Finn", "Hana", "Ivan", "June", "Kent", "Lucia", "Mason", "Nell", "Otto",
  "Paige", "Remy", "Shay", "Troy", "Una", "Vince",
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
    desktop: { name: "Front desk PC", type: "Desktop" as const, purchased: "2023-11-02", price: 980 },
    old: { name: "Laptop", type: "Laptop" as const, purchased: "2021-04-15", price: 1320 },
    tablet: { name: "Exam tablet", type: "Tablet" as const, purchased: "2024-06-01", price: 640 },
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

function licensesFor(department: Person["department"], pims: string, m365: number, pimsPrice: number, acrobat: number): Person["licenses"] {
  const items: Person["licenses"] = [{ name: "Microsoft 365", monthly: m365 }];
  if (department === "Clinical") items.push({ name: pims, monthly: pimsPrice });
  if (department === "Finance") items.push({ name: "Acrobat", monthly: acrobat });
  return items;
}

function groupsFor(spec: Named, directory: "entra" | "google"): string[] {
  const place = spec.location.split(" ")[0];
  const privileged = spec.id === "p-mara" || spec.id === "p-priya" || spec.id === "p-camille" || spec.id === "p-adele";
  if (directory === "google") {
    const groups = [`${place.toLowerCase()}-team`];
    if (spec.department === "Clinical") groups.push("clinical");
    if (spec.department === "Client care") groups.push("front-desk");
    if (spec.department === "Finance") groups.push("finance");
    if (spec.department === "Operations") groups.push("operations");
    if (privileged) groups.push("workspace-admins");
    return groups;
  }
  const groups = [`SG-${place}`];
  if (spec.department === "Clinical") groups.push("SG-Clinical");
  if (spec.department === "Client care") groups.push("SG-FrontDesk");
  if (spec.department === "Finance") groups.push("SG-Finance");
  if (spec.department === "Operations") groups.push("SG-Operations");
  if (privileged) groups.push("Privileged roles");
  return groups;
}

function buildPerson(
  spec: Named,
  domain: string,
  areaCode: (location: string) => string,
  index: number,
  pims: string,
  prices: { m365: number; pims: number; acrobat: number },
  directory: "entra" | "google",
): Person {
  const email = emailFor(spec.name, domain);
  const join = directory === "entra" ? "Entra" : "Google";
  const leadThreat: ThreatDownState = spec.device === "old" ? "Threats" : spec.id === "p-sam" || spec.id === "p-jordan" ? "Isolated" : "Protected";
  const devices: Device[] = [deviceFor(spec.id, spec.device ?? "laptop", email, join, leadThreat)];
  if (spec.id === "p-sam") devices[0].name = "Lab PC";
  if (spec.id === "p-jordan") devices[0].name = "Dental PC";
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
    phone: `(${areaCode(spec.location)}) 555-${String(1000 + index).padStart(4, "0")}`,
    startDate: spec.startDate,
    status: spec.status ?? "Active",
    mfa: spec.mfa ?? true,
    training: spec.training ?? "Current",
    licenses: licensesFor(spec.department, pims, prices.m365, prices.pims, prices.acrobat).map((license) =>
      directory === "google" && license.name === "Microsoft 365" ? { ...license, name: "Google Workspace" } : license,
    ),
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

const larkspurNamed: Named[] = [
  { id: "p-mara", name: "Mara Ellison", role: "Managing partner", department: "Leadership", location: "Asheville", managerId: null, startDate: "2014-04-02", phone: true },
  { id: "p-helen", name: "Helen Brooks", role: "Medical director", department: "Clinical", location: "Asheville", managerId: "p-mara", startDate: "2016-08-15", phone: true, tablet: true },
  { id: "p-priya", name: "Priya Shah", role: "Practice manager", department: "Operations", location: "Hickory", managerId: "p-mara", startDate: "2018-02-01", phone: true },
  { id: "p-jonah", name: "Jonah Keller", role: "Finance lead", department: "Finance", location: "Asheville", managerId: "p-mara", startDate: "2017-05-19", phone: true },
  { id: "p-evan", name: "Evan Cho", role: "Client care lead", department: "Client care", location: "Asheville", managerId: "p-mara", startDate: "2019-09-09", device: "desktop", phone: true },
  { id: "p-luis", name: "Luis Vega", role: "Clinic lead", department: "Clinical", location: "Greenville", managerId: "p-helen", startDate: "2018-11-12", phone: true, tablet: true },
  { id: "p-nora", name: "Nora Parks", role: "Clinic lead", department: "Operations", location: "Hickory", managerId: "p-priya", startDate: "2020-01-20", phone: true },
  { id: "p-amina", name: "Amina Diallo", role: "Veterinarian", department: "Clinical", location: "Asheville", managerId: "p-helen", startDate: "2021-03-08", tablet: true },
  { id: "p-chris", name: "Chris Nguyen", role: "Veterinarian", department: "Clinical", location: "Hickory", managerId: "p-helen", startDate: "2019-06-03", tablet: true },
  { id: "p-ruth", name: "Ruth Adler", role: "Veterinary technician", department: "Clinical", location: "Greenville", managerId: "p-luis", startDate: "2022-07-11" },
  { id: "p-owen", name: "Owen Blake", role: "Veterinary technician", department: "Clinical", location: "Asheville", managerId: "p-amina", startDate: "2023-02-14", mfa: false },
  { id: "p-sam", name: "Sam Ibarra", role: "Client care", department: "Client care", location: "Greenville", managerId: "p-evan", startDate: "2021-10-04", device: "desktop" },
  { id: "p-leah", name: "Leah Ortiz", role: "Bookkeeper", department: "Finance", location: "Asheville", managerId: "p-jonah", startDate: "2020-04-27" },
  { id: "p-wes", name: "Wes Palmer", role: "Clinic coordinator", department: "Operations", location: "Asheville", managerId: "p-priya", startDate: "2024-08-19" },
  { id: "p-dana", name: "Dana Cho", role: "Client care", department: "Client care", location: "Hickory", managerId: "p-evan", startDate: "2022-01-10", status: "Offboarding", device: "desktop" },
  { id: "p-imani", name: "Imani Reed", role: "Veterinary technician", department: "Clinical", location: "Hickory", managerId: "p-chris", startDate: "2019-12-02", device: "old" },
  { id: "p-theo", name: "Theo Marsh", role: "Associate veterinarian", department: "Clinical", location: "Greenville", managerId: "p-luis", startDate: "2026-10-06", status: "Onboarding", mfa: false, tablet: true },
  { id: "p-grace", name: "Grace Kim", role: "Client care", department: "Client care", location: "Asheville", managerId: "p-evan", startDate: "2023-05-22", device: "desktop" },
  { id: "p-neil", name: "Neil Soto", role: "Facilities", department: "Operations", location: "Asheville", managerId: "p-priya", startDate: "2015-09-14" },
  { id: "p-rosa", name: "Rosa Bennett", role: "Veterinary technician", department: "Clinical", location: "Asheville", managerId: "p-amina", startDate: "2024-01-16" },
];

function larkspurDepartment(index: number): Person["department"] {
  if (index < 34) return "Clinical";
  if (index < 45) return "Client care";
  if (index < 55) return "Operations";
  if (index < 63) return "Finance";
  return "Leadership";
}

function larkspurRole(department: Person["department"]): string {
  if (department === "Clinical") return "Veterinary assistant";
  if (department === "Client care") return "Client care";
  if (department === "Finance") return "Finance assistant";
  if (department === "Leadership") return "Partner";
  return "Operations assistant";
}

function larkspurLocation(index: number): string {
  return ["Asheville", "Hickory", "Greenville"][index % 3];
}

function larkspurManager(department: Person["department"], location: string): string {
  if (department === "Leadership") return "p-mara";
  if (department === "Finance") return "p-jonah";
  if (department === "Client care") return "p-evan";
  if (department === "Operations") return location === "Hickory" ? "p-nora" : "p-priya";
  if (location === "Greenville") return "p-luis";
  if (location === "Hickory") return "p-chris";
  return "p-helen";
}

function buildLarkspurPeople(): Person[] {
  const prices = { m365: 26, pims: 80, acrobat: 86 };
  const named = larkspurNamed.map((spec, index) =>
    buildPerson(spec, "larkspur.example", (location) => (location === "Greenville" ? "864" : "828"), index, "Aviary", prices, "entra"),
  );
  const generated = firstNames.map((first, index) => {
    const department = larkspurDepartment(index);
    const location = larkspurLocation(index);
    const startYear = 2017 + (index % 8);
    const startMonth = String((index % 12) + 1).padStart(2, "0");
    const noMfa = [4, 12, 20, 28, 36].includes(index);
    const status: Person["status"] = index === 8 ? "Onboarding" : index === 50 ? "Offboarding" : "Active";
    return buildPerson(
      {
        id: `p-l-${index + 21}`,
        name: `${first} ${lastNames[index % lastNames.length]}`,
        role: larkspurRole(department),
        department,
        location,
        managerId: larkspurManager(department, location),
        startDate: `${startYear}-${startMonth}-06`,
        status,
        mfa: status === "Active" ? !noMfa : false,
        training: index % 17 === 0 ? "Overdue" : "Current",
        device: index % 13 === 0 ? "old" : department === "Client care" ? "desktop" : "laptop",
      },
      "larkspur.example",
      (loc) => (loc === "Greenville" ? "864" : "828"),
      index + 21,
      "Aviary",
      prices,
      "entra",
    );
  });
  return [...named, ...generated];
}

const southNamed: Named[] = [
  { id: "p-camille", name: "Camille Ward", role: "Owner", department: "Leadership", location: "Spartanburg", managerId: null, startDate: "2013-05-01", phone: true },
  { id: "p-jordan", name: "Jordan Hale", role: "Client care lead", department: "Client care", location: "Spartanburg", managerId: "p-camille", startDate: "2019-04-12", device: "desktop", phone: true },
  { id: "p-miles", name: "Miles Harlow", role: "Veterinarian", department: "Clinical", location: "Spartanburg", managerId: "p-camille", startDate: "2017-09-18", tablet: true, phone: true },
  { id: "p-adele", name: "Adele Franco", role: "Practice manager", department: "Operations", location: "Spartanburg", managerId: "p-camille", startDate: "2020-02-03", phone: true },
  { id: "p-hassan", name: "Hassan Rahman", role: "Bookkeeper", department: "Finance", location: "Spartanburg", managerId: "p-camille", startDate: "2021-06-21" },
];

const southRest = [
  ["Nina", "Clinical", "Veterinary technician"],
  ["Paul", "Clinical", "Veterinary technician"],
  ["Celia", "Clinical", "Veterinary assistant"],
  ["Mark", "Clinical", "Veterinary assistant"],
  ["Ivy", "Clinical", "Veterinary assistant"],
  ["Omar", "Clinical", "Kennel lead"],
  ["Faye", "Clinical", "Veterinary assistant"],
  ["Ian", "Client care", "Client care"],
  ["Kira", "Client care", "Client care"],
  ["Bea", "Client care", "Client care"],
  ["Hugo", "Operations", "Facilities"],
  ["Ruthann", "Operations", "Inventory"],
  ["Leif", "Clinical", "Veterinary technician"],
  ["Nia", "Clinical", "Veterinary assistant"],
  ["Seth", "Finance", "Finance assistant"],
  ["Willa", "Leadership", "Associate owner"],
  ["Gideon", "Clinical", "Relief technician"],
] as const;

function buildSouthPeople(): Person[] {
  const prices = { m365: 22, pims: 70, acrobat: 45 };
  const named = southNamed.map((spec, index) =>
    buildPerson(spec, "southridge.example", () => "864", index, "Meadow", prices, "google"),
  );
  const generated = southRest.map((row, index) =>
    buildPerson(
      {
        id: `p-sr-${index + 6}`,
        name: `${row[0]} ${lastNames[(index + 3) % lastNames.length]}`,
        role: row[2],
        department: row[1],
        location: "Spartanburg",
        managerId: row[1] === "Clinical" ? "p-miles" : row[1] === "Client care" ? "p-jordan" : "p-camille",
        startDate: `${2018 + (index % 6)}-0${(index % 8) + 1}-04`.replace("-010", "-10").replace("-011", "-11"),
        mfa: index !== 4,
        device: row[1] === "Client care" ? "desktop" : index === 10 ? "old" : "laptop",
        status: index === 16 ? "Onboarding" : "Active",
      },
      "southridge.example",
      () => "864",
      index + 6,
      "Meadow",
      prices,
      "google",
    ),
  );
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
  attachments: Ticket["attachments"] = [],
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
    attachments,
  };
}

function larkspurTickets(): Ticket[] {
  return [
    ticket("larkspur", "LS-1052", "Shared inbox is not showing new appointment mail", "Software", "Normal", "Open", "p-evan", -20 * hour, -6 * hour, 4 * hour, 28 * hour, [
      message("m1", "Evan Cho", -20 * hour, "The front desk shared mailbox stopped showing messages that clients send from the appointment form. Personal mail still arrives."),
      message("m2", "Talon Support", -6 * hour, "The rule that files those messages was pointing at a folder Evan cannot see. Checking the mailbox permissions next."),
    ]),
    ticket("larkspur", "LS-1048", "Owen is locked out of Aviary", "Access", "High", "Open", "p-owen", -26 * hour, -3 * hour, -2 * hour, 8 * hour, [
      message("m1", "Owen Blake", -26 * hour, "I cannot finish the MFA prompt. Aviary sends me back to the sign-in page."),
      message("m2", "Helen Brooks", -18 * hour, "He is on the surgery board tomorrow. He needs a working login before 7."),
      message("m3", "Talon Support", -3 * hour, "The authenticator app was registered to an old phone. A new registration is ready when Owen is at the desk.", true),
    ]),
    ticket("larkspur", "LS-1044", "Greenville pharmacy label printer is offline", "Hardware", "High", "Waiting", "p-ruth", -70 * hour, -12 * hour, -60 * hour, 20 * hour, [
      message("m1", "Ruth Adler", -70 * hour, "The Dymo at the pharmacy desk prints a blank label, then goes offline. It started after the paper change."),
      message("m2", "Talon Support", -12 * hour, "The spooler is holding a bad job. We need someone at the clinic to power-cycle it while we watch."),
    ], [{ name: "printer-blank-label.jpg", size: "840 KB" }]),
    ticket("larkspur", "LS-1041", "Theo Marsh first-week accounts", "Onboarding", "Normal", "In progress", "p-priya", -80 * hour, -8 * hour, -70 * hour, 30 * hour, [
      message("m1", "Priya Shah", -80 * hour, "Theo starts at Greenville this week. He has a mailbox. Aviary and MFA are still open."),
      message("m2", "Talon Support", -8 * hour, "Mailbox is done. Aviary seat is assigned. MFA is waiting on Theo, which matches the onboarding checklist."),
    ]),
    ticket("larkspur", "LS-1036", "Dana Cho last day Friday", "Offboarding", "High", "Open", "p-priya", -40 * hour, -5 * hour, -20 * hour, 50 * hour, [
      message("m1", "Evan Cho", -40 * hour, "Dana's last day is Friday. Please close the mailbox, Aviary, and the Hickory door badge that afternoon."),
      message("m2", "Talon Support", -5 * hour, "Scheduled for Friday at 4. The license should not stay on after that.", true),
    ]),
    ticket("larkspur", "LS-1033", "Hickory reminders went to the wrong list", "Software", "Normal", "Resolved", "p-chris", -140 * hour, -110 * hour, -130 * hour, -100 * hour, [
      message("m1", "Chris Nguyen", -140 * hour, "Tuesday reminders went to last year's list. Clients called about appointments they already had."),
      message("m2", "Talon Support", -110 * hour, "The list was pointed back at the current Aviary export. A test reminder to the desk succeeded."),
    ]),
    ticket("larkspur", "LS-1028", "Shared login on the Greenville lab PC", "Security", "High", "In progress", "p-luis", -90 * hour, -9 * hour, -80 * hour, 12 * hour, [
      message("m1", "Luis Vega", -90 * hour, "The lab PC still uses one shared Windows login. Techs know the password."),
      message("m2", "Talon Support", -9 * hour, "Named accounts are created. The shared login comes off after Thursday's lab block.", true),
    ]),
    ticket("larkspur", "LS-1022", "Relief vet needs Aviary for Saturday", "Access", "Normal", "Waiting", "p-helen", -30 * hour, -10 * hour, -16 * hour, 40 * hour, [
      message("m1", "Helen Brooks", -30 * hour, "A relief veterinarian is in Asheville on Saturday. She needs Aviary for the day only."),
      message("m2", "Talon Support", -10 * hour, "Waiting on the legal name and mobile number before the temporary account is created."),
    ]),
    ticket("larkspur", "LS-1009", "Cedar results are not filing into Aviary", "Software", "Urgent", "Open", "p-amina", -50 * hour, -2 * hour, -40 * hour, -6 * hour, [
      message("m1", "Amina Diallo", -50 * hour, "Lab results since Monday are sitting in the Cedar portal. They are not on the patient chart."),
      message("m2", "Talon Support", -2 * hour, "The interface credential expired on the 19th. Cedar has been asked for a new one. Charts are being checked by hand until it is back."),
    ]),
    ticket("larkspur", "LS-1004", "Leah's password reset", "Access", "Low", "Resolved", "p-leah", -200 * hour, -190 * hour, -196 * hour, -170 * hour, [
      message("m1", "Leah Ortiz", -200 * hour, "I am locked out of Microsoft 365 after a password change."),
      message("m2", "Talon Support", -190 * hour, "Reset completed. MFA was already on the account, so mail is back."),
    ]),
    ticket("larkspur", "LS-0998", "Hickory exam room PC is due for replacement", "Hardware", "Normal", "In progress", "p-imani", -160 * hour, -24 * hour, -150 * hour, 60 * hour, [
      message("m1", "Imani Reed", -160 * hour, "Exam room 2 takes several minutes to open a chart. The laptop is from 2021."),
      message("m2", "Talon Support", -24 * hour, "It is on the Hickory refresh list. A replacement is staged for the next clinic visit."),
    ]),
    ticket("larkspur", "LS-0991", "Two Saturday techs start November 2", "Onboarding", "Normal", "Waiting", "p-priya", -15 * hour, -4 * hour, 8 * hour, 200 * hour, [
      message("m1", "Priya Shah", -15 * hour, "Two technician hires start at Hickory on November 2. Names are in the hiring packet."),
      message("m2", "Talon Support", -4 * hour, "Waiting on personal email addresses before the accounts are created."),
    ]),
  ];
}

function southTickets(): Ticket[] {
  return [
    ticket("south-ridge", "SR-188", "Dental PC imaging viewer will not open", "Software", "High", "Open", "p-miles", -18 * hour, -3 * hour, 2 * hour, 24 * hour, [
      message("m1", "Miles Harlow", -18 * hour, "The viewer on the dental PC opens a gray window and stops. We have two dentals this afternoon."),
      message("m2", "Talon Support", -3 * hour, "The viewer is pinned to an old display driver. A reinstall is ready for the lunch break."),
    ]),
    ticket("south-ridge", "SR-184", "New receptionist needs Google Workspace", "Access", "Normal", "In progress", "p-jordan", -60 * hour, -8 * hour, -40 * hour, 36 * hour, [
      message("m1", "Jordan Hale", -60 * hour, "Our new receptionist starts Thursday. She needs mail and the shared inbox, not Meadow yet."),
      message("m2", "Talon Support", -8 * hour, "Mailbox is created. MFA enrollment is the remaining step."),
    ]),
    ticket("south-ridge", "SR-179", "Front desk phone stuck on hold", "Hardware", "Normal", "Resolved", "p-jordan", -220 * hour, -200 * hour, -210 * hour, -180 * hour, [
      message("m1", "Jordan Hale", -220 * hour, "The front desk set keeps a caller on hold after we hang up."),
      message("m2", "Talon Support", -200 * hour, "The handset was replaced. A test call cleared the hold."),
    ]),
    ticket("south-ridge", "SR-170", "Owner MFA prompt on a new phone", "Security", "Normal", "Waiting", "p-camille", -30 * hour, -6 * hour, -10 * hour, 48 * hour, [
      message("m1", "Camille Ward", -30 * hour, "I replaced my phone and the MFA prompt never arrives."),
      message("m2", "Talon Support", -6 * hour, "Waiting until Camille is in the office so the old registration can be removed in person."),
    ]),
    ticket("south-ridge", "SR-166", "Reminder texts went out a day late", "Software", "Low", "Resolved", "p-adele", -300 * hour, -260 * hour, -290 * hour, -240 * hour, [
      message("m1", "Adele Franco", -300 * hour, "Saturday reminder texts arrived on Sunday."),
      message("m2", "Talon Support", -260 * hour, "The send window was set to the wrong timezone. It is back on Eastern time."),
    ]),
  ];
}

export function liveTicket(workspaceId: string): Ticket {
  if (workspaceId === "south-ridge") {
    return ticket("south-ridge", "SR-191", "Appointment confirmations are stuck in the outbox", "Software", "Normal", "Open", "p-jordan", 0, 0, 4 * hour, 24 * hour, [
      message("m1", "Jordan Hale", 0, "Confirmations for tomorrow are sitting in the outbox and have not gone out."),
    ]);
  }
  return ticket("larkspur", "LS-1096", "Greenville pharmacy printer jammed again", "Hardware", "Normal", "Open", "p-sam", 0, 0, 4 * hour, 24 * hour, [
    message("m1", "Sam Ibarra", 0, "The pharmacy printer jammed mid-label. The queue at the desk is backing up."),
  ]);
}

const articles: Article[] = [
  {
    slug: "onboarding-a-new-hire",
    title: "Onboarding a new hire",
    category: "Accounts",
    reviewed: "2026-09-12",
    owner: "Talon Support",
    summary: "Mailbox, Aviary or Meadow, and MFA before the first shift.",
    body: [
      "Send the start date, clinic, role, and personal email. Accounts are created the business day before, not the morning of.",
      "Every hire gets Microsoft 365. Clinical hires also get the practice system: Aviary at Larkspur, Meadow at South Ridge. Client care gets the shared mailbox for that clinic.",
      "MFA is enrolled before the temporary password is handed over. A hire without MFA does not get a badge code.",
      "The hiring manager confirms the person can open mail and the practice system on the first morning. That confirmation closes the ticket.",
    ],
    related: ["mfa-setup", "offboarding"],
  },
  {
    slug: "offboarding",
    title: "Offboarding",
    category: "Accounts",
    reviewed: "2026-08-28",
    owner: "Talon Support",
    summary: "Mailbox, practice system, and door badge close on the last day.",
    body: [
      "The manager opens the ticket with the last day and the clinic. Same-day notice is enough. A week of leftover access is not.",
      "On the last afternoon: block sign-in, remove the practice-system seat, forward the mailbox to the clinic lead for 30 days, and remove the door badge.",
      "A person who is gone and still licensed shows up on the people flags. That license comes off the same day the flag appears.",
      "Equipment goes to the clinic coordinator. Do not wipe a laptop before the coordinator has the charger.",
    ],
    related: ["onboarding-a-new-hire", "vendor-contacts"],
  },
  {
    slug: "mfa-setup",
    title: "MFA setup",
    category: "Security",
    reviewed: "2026-10-02",
    owner: "Talon Support",
    summary: "The authenticator app is the method. Text messages are the backup.",
    body: [
      "Install the authenticator app on the phone the person has with them at work. Scan the code while signed in on the clinic PC.",
      "Add a text-message backup only after the app works. The backup number is the personal mobile, not the front desk line.",
      "A lost phone is an access ticket. The old registration is removed while the person is in the clinic, not from a chat message.",
      "Shared logins do not get a shared MFA code. If a PC has one login for several people, that is a security ticket.",
    ],
    related: ["password-reset", "incident-response"],
  },
  {
    slug: "password-reset",
    title: "Password reset",
    category: "Accounts",
    reviewed: "2026-07-16",
    owner: "Talon Support",
    summary: "Reset the password, then check MFA, then have the person sign in once.",
    body: [
      "Open an access ticket. Include the clinic and whether the person can reach their phone.",
      "The temporary password is given in person or by a phone call to the number on the person record. It is not sent to the mailbox that is locked.",
      "If MFA is not enrolled, enroll it before the person leaves the desk. A reset without MFA comes back the same week.",
      "The person signs in once before the ticket is closed.",
    ],
    related: ["mfa-setup", "onboarding-a-new-hire"],
  },
  {
    slug: "printer-setup",
    title: "Printer setup",
    category: "Devices",
    reviewed: "2026-06-04",
    owner: "Talon Support",
    summary: "Which clinic, which room, and a photo of the error.",
    body: [
      "Label printers and letter printers are different queues. Say which one. The Greenville pharmacy printer is the label printer.",
      "Power-cycle the printer before opening a ticket if the lamp is amber. If it jams again, open the ticket and attach a photo.",
      "Do not install a printer driver from a search result. The driver is the one already on the clinic file share.",
      "A printer that fails every week is a hardware ticket with the replacement noted, not a new setup each time.",
    ],
    related: ["incident-response", "vendor-contacts"],
  },
  {
    slug: "incident-response",
    title: "Incident response",
    category: "Security",
    reviewed: "2026-09-30",
    owner: "Talon Support",
    summary: "Who to call, what to unplug, and what not to email.",
    body: [
      "If a clinic cannot chart or cannot take payments, call Talon and open a security or software ticket with the clinic name in the subject.",
      "Unplug the affected PC from the network if someone is unsure about a popup that asks for a password. Leave it powered on.",
      "Do not forward the suspicious message to the whole clinic. Forward one copy to Talon and delete the rest.",
      "Backups run nightly. A restore is a decision, not a button on the front desk. Greenville's restore test is overdue and is tracked on the security page.",
    ],
    related: ["mfa-setup", "vendor-contacts"],
  },
  {
    slug: "vendor-contacts",
    title: "Vendor contacts",
    category: "Vendors",
    reviewed: "2026-10-08",
    owner: "Talon Support",
    summary: "Who bills the clinics, and which renewal is actually a decision.",
    body: [
      "Microsoft 365, Aviary or Meadow, Cedar Diagnostics, Bramble phones, Clearwell backup, and ThreatDown endpoint are the contracts that matter.",
      "Cedar Diagnostics is the renewal in front of Larkspur. The lab interface is the only one in use. A decision is due before November 12.",
      "Do not start a second backup product or a second phone system to solve one clinic's problem. Add the note to the open ticket instead.",
      "Vendor login pages are listed on the company page. Passwords for those portals stay with Talon and the practice manager.",
    ],
    related: ["incident-response", "offboarding"],
  },
  {
    slug: "wifi-and-vpn",
    title: "Wi-Fi and VPN",
    category: "Devices",
    reviewed: "2026-09-02",
    owner: "Talon Support",
    summary: "Clinic Wi-Fi, guest Wi-Fi, and the VPN when someone is off site.",
    body: [
      "Use the clinic network named on the card at the desk. Guest Wi-Fi is a different name and does not reach the printers.",
      "Forget the network and join it again before opening a ticket. A VPN is only for someone working away from the clinic.",
      "The visitor network is a different name. It is not the staff password, and it does not reach the printers.",
    ],
    related: ["printer-setup", "slow-computer"],
  },
  {
    slug: "outlook-mail",
    title: "Outlook and Gmail",
    category: "Accounts",
    reviewed: "2026-08-19",
    owner: "Talon Support",
    summary: "When mail is missing, check the folder rule before resetting the password.",
    body: [
      "Larkspur mail is Outlook and Microsoft 365. South Ridge mail is Gmail. The steps are the same: confirm the right mailbox, then the focused or filtered view, then a stuck rule.",
      "Appointment mail belongs in the shared clinic mailbox, not a personal folder.",
      "A password reset is the access guide. Do not create a second mailbox to get around a rule.",
    ],
    related: ["password-reset", "wifi-and-vpn"],
  },
  {
    slug: "meeting-audio",
    title: "Teams and Meet audio",
    category: "Devices",
    reviewed: "2026-07-22",
    owner: "Talon Support",
    summary: "Pick the headset, then the app, then the call.",
    body: [
      "Larkspur uses Teams. South Ridge uses Meet. Plug the headset in before the meeting starts.",
      "In the app, choose the headset for both microphone and speaker. The laptop speakers are the usual mistake.",
      "If the other clinics can hear you and you cannot hear them, it is the output device, not the account.",
    ],
    related: ["slow-computer", "printer-setup"],
  },
  {
    slug: "slow-computer",
    title: "Slow computer",
    category: "Devices",
    reviewed: "2026-10-01",
    owner: "Talon Support",
    summary: "Restart, check patch status, then look at the age of the machine.",
    body: [
      "Restart the PC and leave it on the clinic network for ten minutes so patches can finish.",
      "The person page shows patch status. Pending means updates are waiting. Behind means the machine has missed more than one cycle.",
      "A laptop from 2021 that is still slow after a restart belongs on the hardware refresh, not a new software ticket every week.",
    ],
    related: ["printer-setup", "mfa-setup"],
  },
  {
    slug: "report-phishing",
    title: "Report a phishing email",
    category: "Security",
    reviewed: "2026-09-18",
    owner: "Talon Support",
    summary: "Do not forward it to the whole clinic.",
    body: [
      "Forward one copy to Talon. Say who it claimed to be and what it asked for. Do not paste passwords or codes.",
      "Delete the message after that. Do not send it to the rest of the clinic.",
      "If a mailbox is already sending mail the person did not write, leadership sends the compromised-account notice. A shared login on a lab PC is a separate security ticket.",
    ],
    related: ["incident-response", "mfa-setup"],
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
  pims: string;
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
  const pims = sumBy(people, input.pims);
  const acrobat = sumBy(people, "Acrobat");
  const software: SoftwareContract[] = [
    { name: suiteName, vendor: suiteName === "Google Workspace" ? "Google" : "Microsoft", monthly: suite.monthly, seats: `${suite.seats} people`, renewal: "2027-01-15", note: suiteName === "Google Workspace" ? "Business Standard, plus the shared mailbox." : "Business Standard, plus the shared mailbox at each clinic." },
    { name: input.pims, vendor: input.pims === "Aviary" ? "Aviary" : "Meadow", monthly: pims.monthly, seats: `${pims.seats} clinical`, renewal: input.pims === "Aviary" ? "2027-03-01" : "2027-02-01", note: "The charting system. One seat per clinical person." },
    { name: "Acrobat", vendor: "Adobe", monthly: acrobat.monthly, seats: `${acrobat.seats} finance`, renewal: "2027-04-01", note: "Finance only. Unused seats are called out on the overview." },
    ...input.extraSoftware,
  ];
  const softwareMonthly = software.reduce((sum, item) => sum + item.monthly, 0);
  const cloudMonthly = input.cloud.reduce((sum, item) => sum + item.amount, 0);
  const hardwareMonthly = input.hardware.reduce((sum, item) => sum + item.amount, 0);
  const telecomMonthly = input.telecom.reduce((sum, item) => sum + item.amount, 0);
  const securityMonthly = input.security.reduce((sum, item) => sum + item.amount, 0);
  const breakdown: SpendSlice[] = [
    { name: "Talon retainer", amount: input.retainer, lines: [{ name: "Monthly retainer", amount: input.retainer }] },
    { name: "Software", amount: softwareMonthly, lines: software.map((item) => ({ name: item.name, amount: item.monthly })) },
    { name: "Cloud and hosting", amount: cloudMonthly, lines: input.cloud },
    { name: "Hardware", amount: hardwareMonthly, lines: input.hardware },
    { name: "Telecom", amount: telecomMonthly, lines: input.telecom },
    { name: "Security tools", amount: securityMonthly, lines: input.security },
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
    ...input.cloud.map((item) => ({ name: item.name, category: "Cloud", monthly: item.amount, renewal: "2027-01-01", contact: "accounts@host.example", note: "Hosting and file storage for the clinics." })),
    ...input.telecom.map((item) => ({ name: item.name, category: "Telecom", monthly: item.amount, renewal: input.renewals[item.name]?.date ?? "2026-12-01", contact: "support@bramble.example", note: input.renewals[item.name]?.note ?? "Clinic internet and phones." })),
    ...input.security.map((item) => ({ name: item.name, category: "Security", monthly: item.amount, renewal: "2027-05-01", contact: "support@threatdown.example", note: "ThreatDown EDR and mail filtering." })),
  ];
  const monthSpend = breakdown.reduce((sum, slice) => sum + slice.amount, 0);
  return { monthSpend, breakdown, software, vendors };
}

const larkspurEconomics = (people: Person[]) =>
  economics(people, {
    pims: "Aviary",
    retainer: 4800,
    cloud: [
      { name: "Clinic website", amount: 900 },
      { name: "Azure files", amount: 1200 },
    ],
    hardware: [
      { name: "Hickory refresh accrual", amount: 2400 },
      { name: "Spares", amount: 1200 },
    ],
    telecom: [
      { name: "Asheville circuit", amount: 2100 },
      { name: "Hickory circuit", amount: 1800 },
      { name: "Greenville circuit", amount: 1500 },
    ],
    security: [
      { name: "ThreatDown", amount: 2100 },
      { name: "Mail filtering", amount: 1200 },
    ],
    extraSoftware: [
      { name: "Cedar Diagnostics", vendor: "Cedar Diagnostics", monthly: 1280, seats: "Workspace", renewal: "2026-11-12", note: "Lab results into Aviary. This is the renewal that needs a decision." },
      { name: "Bramble phones", vendor: "Bramble", monthly: 740, seats: "3 clinics", renewal: "2026-12-01", note: "Handsets and the auto-attendant at each clinic." },
      { name: "Clearwell backup", vendor: "Clearwell", monthly: 644, seats: "Workspace", renewal: "2027-06-01", note: "Nightly backup of Aviary and the file share." },
    ],
    renewals: {
      "Greenville circuit": { date: "2026-12-01", note: "Bundled with the Bramble handsets at Greenville." },
    },
  });

const southEconomics = (people: Person[]) =>
  economics(people, {
    pims: "Meadow",
    retainer: 1800,
    cloud: [{ name: "Clinic website", amount: 280 }],
    hardware: [{ name: "Spares", amount: 420 }],
    telecom: [{ name: "Spartanburg circuit", amount: 860 }],
    security: [{ name: "ThreatDown", amount: 360 }],
    extraSoftware: [
      { name: "Clearwell backup", vendor: "Clearwell", monthly: 180, seats: "Workspace", renewal: "2027-06-01", note: "Nightly backup of Meadow." },
      { name: "Bramble phones", vendor: "Bramble", monthly: 260, seats: "1 clinic", renewal: "2027-01-15", note: "Front desk and the treatment room." },
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
    const budget = label === "Aug" ? Math.round(monthSpend * (30000 / 28400)) : Math.round(monthSpend * (27000 / 28400));
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

const larkspurServices: ServiceStatus[] = [
  { id: "website", name: "Public website", status: "Operational", uptime30: 99.98, uptime90: 99.95, responseMs: 180, incidents: [] },
  { id: "m365", name: "Microsoft 365", status: "Operational", uptime30: 99.99, uptime90: 99.98, responseMs: 90, incidents: [] },
  {
    id: "aviary",
    name: "Aviary",
    status: "Degraded",
    uptime30: 99.9,
    uptime90: 99.7,
    responseMs: 480,
    incidents: [{ at: "2026-10-09T13:10:00.000Z", minutes: 46, summary: "Charts were slow after the Cedar credential expired. Staff kept charting. The interface is still the open urgent ticket." }],
  },
  { id: "phones", name: "Phones", status: "Operational", uptime30: 99.95, uptime90: 99.9, responseMs: 40, incidents: [] },
  {
    id: "internet",
    name: "Asheville internet",
    status: "Operational",
    uptime30: 99.99,
    uptime90: 99.9,
    responseMs: 22,
    incidents: [{ at: "2026-09-02T15:00:00.000Z", minutes: 18, summary: "Afternoon drop. Bramble failed over to the backup circuit." }],
  },
];

const southServices: ServiceStatus[] = [
  { id: "website", name: "Public website", status: "Operational", uptime30: 99.95, uptime90: 99.9, responseMs: 210, incidents: [] },
  { id: "google", name: "Google Workspace", status: "Operational", uptime30: 99.99, uptime90: 99.99, responseMs: 88, incidents: [] },
  {
    id: "meadow",
    name: "Meadow",
    status: "Operational",
    uptime30: 99.95,
    uptime90: 99.9,
    responseMs: 260,
    incidents: [{ at: "2026-09-18T16:20:00.000Z", minutes: 22, summary: "The dental viewer stalled. It was the PC, not Meadow." }],
  },
  { id: "phones", name: "Phones", status: "Operational", uptime30: 99.9, uptime90: 99.8, responseMs: 36, incidents: [] },
];

function pagesFor(host: string, sessions: number): { path: string; views: number }[] {
  const paths = ["/", "/locations", "/team", "/request-appointment", "/new-clients"];
  const weights = [0.34, 0.18, 0.12, 0.22, 0.08];
  return paths.map((path, index) => ({ path: `${host}${path === "/" ? "" : path}`, views: Math.round(sessions * weights[index]) }));
}

const larkspurLocations: ClinicLocation[] = [
  { id: "asheville", name: "Asheville", address: "18 Lark Street, Asheville, NC", hours: "Mon–Fri 7:30–6, Sat 8–12", circuits: [{ name: "Primary", detail: "Bramble fiber" }, { name: "Backup", detail: "Fixed wireless" }], note: "Headquarters, finance, and the main surgery day." },
  { id: "hickory", name: "Hickory", address: "900 Union Square, Hickory, NC", hours: "Mon–Fri 8–5:30", circuits: [{ name: "Primary", detail: "Bramble fiber" }], note: "The workstation refresh is aimed at this clinic." },
  { id: "greenville", name: "Greenville", address: "15 Augusta Road, Greenville, SC", hours: "Mon–Fri 8–6", circuits: [{ name: "Primary", detail: "Bramble fiber" }], note: "Pharmacy label printer and the overdue restore test." },
];

const southLocations: ClinicLocation[] = [
  { id: "spartanburg", name: "Spartanburg", address: "120 Ridge Court, Spartanburg, SC", hours: "Mon–Fri 8–5:30, Sat 8–12", circuits: [{ name: "Primary", detail: "Bramble fiber" }], note: "The only clinic on this workspace." },
];

function documentsFor(pims: string): WorkspaceDocument[] {
  return [
    { id: "acceptable-use", title: "Acceptable use", updated: "2026-05-02", owner: "Talon Support", summary: "Work accounts stay on work systems.", body: ["Clinic email is for clinic work. Personal mail stays on a personal account.", "Shared logins are not allowed on a PC that opens the practice system.", `Passwords for ${pims}, Microsoft 365, and the vendor portals are not written on a card at the desk.`] },
    { id: "network-sketch", title: "Network sketch", updated: "2026-08-14", owner: "Talon Support", summary: "Each clinic has one firewall, one primary circuit, and the backup noted where it exists.", body: ["Asheville has a backup circuit. Hickory and Greenville do not.", "The practice system is reached over the vendor's hosted service, not a server in a closet.", "Guest wifi is a separate name and does not reach the label printers."] },
    { id: "q3-note", title: "Q3 review notes", updated: "2026-10-06", owner: "Talon Support", summary: "Decisions from the October conversation.", body: ["MFA exceptions are down to a short list.", "The Hickory refresh stays on the calendar.", "Cedar remains the contract that needs a yes or a no before November 12."] },
  ];
}

function projectsFor(workspaceId: string): Project[] {
  if (workspaceId === "south-ridge") {
    return [
      { id: "dental", name: "Dental PC replacement", status: "In progress", progress: 40, owner: "Talon Support", summary: "The imaging viewer fails because the PC is old, not because Meadow is down.", spent: 420, budget: 1100, milestones: [{ name: "Confirm the viewer license", done: true, due: "Oct 8" }, { name: "Stage the replacement PC", done: false, due: "Oct 28" }, { name: "Move the viewer", done: false, due: "Nov 4" }] },
      { id: "mfa", name: "Close the MFA gap", status: "In progress", progress: 70, owner: "Talon Support", summary: "One active person is still missing MFA.", spent: 0, budget: 0, milestones: [{ name: "List the exceptions", done: true, due: "Sep 30" }, { name: "Enroll the last person", done: false, due: "Oct 24" }] },
    ];
  }
  return [
    { id: "hickory", name: "Hickory workstation refresh", status: "In progress", progress: 60, owner: "Talon Support", summary: "Exam-room laptops from 2021 are the ones staff actually complain about.", spent: 2400, budget: 8600, milestones: [{ name: "Count the machines due", done: true, due: "Sep 12" }, { name: "Stage the first four", done: true, due: "Oct 10" }, { name: "Swap them on a surgery-light day", done: false, due: "Nov 6" }] },
    { id: "mfa", name: "Clear MFA exceptions", status: "In progress", progress: 80, owner: "Talon Support", summary: "Six active people can still sign in with a password alone.", spent: 0, budget: 0, milestones: [{ name: "Send the list to Mara", done: true, due: "Oct 1" }, { name: "Enroll the technicians", done: false, due: "Oct 28" }, { name: "Remove the exception report", done: false, due: "Nov 8" }] },
    { id: "forms", name: "Appointment form cleanup", status: "In progress", progress: 45, owner: "Talon Support", summary: "Requests from the website should land in the shared inbox, not a side folder.", spent: 300, budget: 1200, milestones: [{ name: "Trace the current rule", done: true, due: "Oct 15" }, { name: "Fix the Asheville mailbox", done: false, due: "Oct 23" }, { name: "Repeat it at the other clinics", done: false, due: "Nov 13" }] },
  ];
}

function reportsFor(workspace: Workspace, exec: Executive, hours: { included: number; used: number }): { monthly: Report; qbr: Report } {
  const monthly: Report = {
    title: "October service report",
    period: "October 2026",
    blocks: [
      {
        heading: "This month",
        paragraphs: [
          `${workspace.name} spent ${money(exec.monthSpend)} against a ${money(exec.monthBudget)} budget. The retainer line is a sample, not a rate from the public site.`,
          `Talon used ${hours.used} of ${hours.included} included hours. The rest of the month is the Cedar interface, MFA exceptions, and the open hardware at the clinics.`,
        ],
        figures: [
          { label: "October spend", value: money(exec.monthSpend) },
          { label: "October budget", value: money(exec.monthBudget) },
          { label: "Hours used", value: `${hours.used} of ${hours.included}` },
        ],
      },
      {
        heading: "What moved",
        paragraphs: [
          "Hickory reminder mail was pointed back at the current list and closed. Leah's mailbox reset was routine.",
          "Cedar results stopped filing into the practice system on October 19. That ticket is still open and is the urgent item.",
        ],
      },
      {
        heading: "Watch next",
        paragraphs: ["Cedar's renewal is November 12. Dana Cho's access comes off on her last day. Greenville still needs a backup restore test."],
      },
    ],
  };
  const qbr: Report = {
    title: "Quarterly review",
    period: "Q3 2026, with October",
    blocks: [
      {
        heading: "The quarter",
        paragraphs: [
          `${workspace.name} is a ${workspace.plan} workspace with ${exec.headcount} people in ${workspace.region}.`,
          `Year to date spend is ${money(exec.ytdSpend)} against ${money(exec.ytdBudget)}. August is the month the hardware accrual shows up.`,
        ],
        figures: [
          { label: "Year to date", value: money(exec.ytdSpend) },
          { label: "YTD budget", value: money(exec.ytdBudget) },
          { label: "Security score", value: String(exec.securityScore) },
        ],
      },
      {
        heading: "Decisions",
        paragraphs: [
          "Keep the Hickory refresh on the calendar. It is the hardware number in the budget.",
          "Decide Cedar before November 12. There is not a second lab interface in use.",
          "Finish MFA for the remaining active people. That is the security gap a client will ask about.",
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

function buildLarkspur(): Bundle {
  const people = buildLarkspurPeople();
  const econ = larkspurEconomics(people);
  const visitors = 4200;
  const opened = 34;
  const score = 82;
  const series = seriesFor(econ.monthSpend, visitors, opened, score);
  const month = series.months[11];
  return {
    workspace: {
      id: "larkspur",
      name: "Larkspur Veterinary Group",
      plan: "Pro",
      industry: "Veterinary clinics",
      region: "Asheville, Hickory, and Greenville",
      website: "larkspur.example",
      domain: "larkspur.example",
      leaderId: "p-mara",
      staffId: "p-evan",
      blurb: "Three clinics. Microsoft 365 and Aviary. Pro retainer, sample figures.",
      directory: "entra",
      pims: "Aviary",
    },
    people,
    tickets: larkspurTickets(),
    economics: econ,
    series,
    services: larkspurServices,
    locations: larkspurLocations,
    documents: documentsFor("Aviary"),
    projects: projectsFor("larkspur"),
    roadmap: [
      { quarter: "Q4 2026", items: [{ name: "Finish MFA exceptions", state: "Now" }, { name: "Decide Cedar", state: "Now" }, { name: "Swap the first Hickory laptops", state: "Now" }] },
      { quarter: "Q1 2027", items: [{ name: "Greenville restore test", state: "Next" }, { name: "Appointment form at all three clinics", state: "Next" }] },
      { quarter: "Q2 2027", items: [{ name: "Review Acrobat seats", state: "Later" }, { name: "Backup circuit for Hickory", state: "Later" }] },
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
          { label: "Pro retainer (sample)", amount: 4800 },
          { label: "Included hours", amount: 0 },
        ],
      })),
    },
    backups: [
      { id: "asheville", label: "Asheville nightly", status: "Current", detail: "Succeeded Oct 21 at 2:10 AM." },
      { id: "hickory", label: "Hickory nightly", status: "Current", detail: "Succeeded Oct 21 at 2:18 AM." },
      { id: "greenville", label: "Greenville restore test", status: "Due", detail: "Last test was in August." },
    ],
    risks: [
      { id: "mfa", title: "Active people without MFA", detail: "The count is on the people page and updates with the directory.", href: "/app/people?flag=mfa" },
      { id: "cedar", title: "Cedar renewal on November 12", detail: "Lab results are already failing to file. The contract is the decision.", href: "/app/company/software" },
      { id: "dana", title: "Offboarding still licensed", detail: "Dana Cho is leaving Friday. The seat should come off that day.", href: "/app/people/p-dana" },
      { id: "restore", title: "Greenville restore test", detail: "Backups run. A restore has not been proven since August.", href: "/app/security" },
    ],
    renewals: [
      { vendor: "Cedar Diagnostics", date: "2026-11-12", amount: 15360, note: "Annual. Decision needed." },
      { vendor: "Bramble phones", date: "2026-12-01", amount: 8880, note: "Three clinics." },
      { vendor: "Microsoft 365", date: "2027-01-15", amount: Math.round(month.spend > 0 ? sumBy(people, "Microsoft 365").monthly * 12 : 0), note: "Annual, from the current seats." },
    ],
    savings: [
      { label: "Unused Acrobat seats", amount: 172, detail: "Two finance seats are assigned to people who do not open Acrobat." },
      { label: "Hickory fax line", amount: 95, detail: "The line is still billed. The clinic sends labs through Cedar." },
    ],
    security: {
      score,
      alerts: [
        { id: "a1", title: "Shared login on the Greenville lab PC", at: "2026-10-18", detail: "Tracked as LS-1028. Named accounts are created. The shared login is still on." },
        { id: "a2", title: "Cedar interface credential expired", at: "2026-10-19", detail: "Results are not filing. Staff are checking the portal by hand." },
      ],
      policies: [
        { title: "Acceptable use", href: "/app/company/documents" },
        { title: "Incident response", href: "/app/knowledge/incident-response" },
        { title: "MFA setup", href: "/app/knowledge/mfa-setup" },
      ],
      checks: [
        { id: "backup", label: "Nightly backups", state: "Met", detail: "Asheville and Hickory succeeded this morning.", href: "/app/security" },
        { id: "restore", label: "Restore test", state: "Gap", detail: "Greenville has not had one since August.", href: "/app/security" },
        { id: "patch", label: "Patching", state: "Met", detail: "Clinic PCs took the October updates.", href: "/app/security" },
        { id: "endpoint", label: "ThreatDown EDR", state: "Met", detail: "Protected, threats, and isolated are counted on this page.", href: "/app/security" },
      ],
    },
    notices: [
      { id: "n-owen", title: "Owen is locked out of Aviary", body: "He is on the surgery board tomorrow.", href: "/app/tickets/LS-1048", at: "Oct 20" },
    ],
    visitors,
    opened,
    score,
  };
}

function buildSouth(): Bundle {
  const people = buildSouthPeople();
  const econ = southEconomics(people);
  const visitors = 980;
  const opened = 9;
  const score = 86;
  const series = seriesFor(econ.monthSpend, visitors, opened, score);
  return {
    workspace: {
      id: "south-ridge",
      name: "South Ridge Animal Hospital",
      plan: "Essentials",
      industry: "Veterinary clinic",
      region: "Spartanburg, South Carolina",
      website: "southridge.example",
      domain: "southridge.example",
      leaderId: "p-camille",
      staffId: "p-jordan",
      blurb: "One clinic. Meadow and Google Workspace. Essentials retainer, sample figures.",
      directory: "google",
      pims: "Meadow",
    },
    people,
    tickets: southTickets(),
    economics: econ,
    series,
    services: southServices,
    locations: southLocations,
    documents: documentsFor("Meadow"),
    projects: projectsFor("south-ridge"),
    roadmap: [
      { quarter: "Q4 2026", items: [{ name: "Replace the dental PC", state: "Now" }, { name: "Finish MFA for Camille's new phone", state: "Now" }] },
      { quarter: "Q1 2027", items: [{ name: "Review Meadow seats", state: "Next" }] },
    ],
    billing: {
      plan: "Essentials",
      monthly: 1800,
      hoursIncluded: 4,
      hoursUsed: 3,
      invoices: [0, 1, 2].map((index) => ({
        id: `INV-22${2 - index}`,
        date: ["2026-10-01", "2026-09-01", "2026-08-01"][index],
        amount: 1800,
        status: "Paid" as const,
        lines: [{ label: "Essentials retainer (sample)", amount: 1800 }],
      })),
    },
    backups: [
      { id: "nightly", label: "Nightly backup", status: "Current", detail: "Succeeded Oct 21 at 1:40 AM." },
      { id: "restore", label: "Restore test", status: "Current", detail: "Tested in September." },
    ],
    risks: [
      { id: "dental", title: "Dental PC is the weak machine", detail: "The viewer fails on that PC. Meadow itself is up.", href: "/app/projects" },
      { id: "mfa", title: "One active person without MFA", detail: "The people page lists who.", href: "/app/people?flag=mfa" },
    ],
    renewals: [
      { vendor: "Bramble phones", date: "2027-01-15", amount: 3120, note: "One clinic." },
      { vendor: "Google Workspace", date: "2027-01-15", amount: sumBy(people, "Google Workspace").monthly * 12, note: "Annual, from the current seats." },
    ],
    savings: [{ label: "Spare Acrobat seat", amount: 45, detail: "Finance has a seat that was not opened this quarter." }],
    security: {
      score,
      alerts: [{ id: "a1", title: "MFA waiting on a new phone", at: "2026-10-20", detail: "Camille's replacement phone is not enrolled yet." }],
      policies: [
        { title: "Acceptable use", href: "/app/company/documents" },
        { title: "Incident response", href: "/app/knowledge/incident-response" },
      ],
      checks: [
        { id: "backup", label: "Nightly backups", state: "Met", detail: "Last night succeeded.", href: "/app/security" },
        { id: "restore", label: "Restore test", state: "Met", detail: "Tested in September.", href: "/app/security" },
        { id: "patch", label: "Patching", state: "Met", detail: "October updates are on the PCs.", href: "/app/security" },
        { id: "endpoint", label: "ThreatDown EDR", state: "Met", detail: "Protected, threats, and isolated are counted on this page.", href: "/app/security" },
      ],
    },
    notices: [
      { id: "n-dental", title: "Dental viewer is down again", body: "Two dentals are on today's book.", href: "/app/tickets/SR-188", at: "Oct 21" },
    ],
    visitors,
    opened,
    score,
  };
}

const bundles: Record<string, Bundle> = {
  larkspur: buildLarkspur(),
  "south-ridge": buildSouth(),
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
    const conversions = Math.round(sessions * (id === "larkspur" ? 0.036 : 0.041));
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
    if (id === "south-ridge") {
      return [
        {
          id: "o-ridge-net",
          at: "2026-08-11",
          kind: "internet",
          title: "Spartanburg internet",
          detail: "The circuit dropped for 14 minutes. Phones failed over.",
          status: "Resolved",
        },
      ];
    }
    return [
      {
        id: "o-asheville",
        at: "2026-09-02",
        kind: "internet",
        title: "Asheville internet",
        detail: "Afternoon drop, 18 minutes. Bramble failed over to the backup circuit.",
        status: "Resolved",
      },
      {
        id: "o-aviary",
        at: "2026-10-09",
        kind: "site",
        title: "Aviary slow",
        detail: "Charting was slow for 46 minutes. The public site stayed up.",
        status: "Resolved",
      },
    ];
  },
  devices(id: string): AssignedDevice[] {
    const item = bundle(id);
    const assigned = item.people.flatMap((person) =>
      person.devices.map((device) => ({
        ...device,
        location: person.location,
        assigneeId: person.id,
        assignee: person.name,
      })),
    );
    const network = networkDevices(id).map((device) => ({ ...device, assignee: "Clinic" }));
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
      .map((entry) => ({ kind: "Ticket" as const, id: entry.id, label: `${entry.id} ${entry.subject}`, detail: entry.status, href: `/app/tickets/${entry.id}` }));
    const foundArticles = articles
      .filter((article) => `${article.title} ${article.summary}`.toLowerCase().includes(q))
      .slice(0, 3)
      .map((article) => ({ kind: "Article" as const, id: article.slug, label: article.title, detail: article.category, href: `/app/knowledge/${article.slug}` }));
    return [...people, ...tickets, ...foundArticles].slice(0, 8);
  },
};

export function networkDevices(workspaceId: string): AssignedDevice[] {
  const join = workspaceId === "south-ridge" ? "Google" as const : "Entra" as const;
  const base = { join, primaryUser: "unassigned", threatdown: "Protected" as const, assignee: "Clinic" };
  if (workspaceId === "south-ridge") {
    return [{ id: "fw-spartanburg", name: "Firewall", type: "Network", purchased: "2023-04-01", refreshDue: "2028-04-01", price: 1800, location: "Spartanburg", ...base }];
  }
  return [
    { id: "fw-asheville", name: "Firewall", type: "Network", purchased: "2023-02-01", refreshDue: "2028-02-01", price: 2200, location: "Asheville", ...base },
    { id: "fw-hickory", name: "Firewall", type: "Network", purchased: "2022-11-01", refreshDue: "2027-11-01", price: 1800, location: "Hickory", ...base },
    { id: "fw-greenville", name: "Firewall", type: "Network", purchased: "2024-01-15", refreshDue: "2029-01-15", price: 1800, location: "Greenville", ...base },
  ];
}
