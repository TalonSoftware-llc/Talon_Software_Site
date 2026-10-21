export type DateRange = "30d" | "90d" | "ytd" | "12m";

export type RoleView = "leadership" | "staff";

export type TicketStatus = "Open" | "Waiting" | "In progress" | "Resolved";

export type TicketPriority = "Low" | "Normal" | "High" | "Urgent";

export type TicketCategory =
  | "Access"
  | "Onboarding"
  | "Offboarding"
  | "Hardware"
  | "Software"
  | "Security";

export type Department = "Leadership" | "Clinical" | "Client care" | "Operations" | "Finance";

export type PersonStatus = "Active" | "Onboarding" | "Offboarding";

export type License = { name: string; monthly: number };

export type ThreatDownState = "Protected" | "Threats" | "Isolated";

export type DeviceJoin = "Entra" | "Google";

export type Device = {
  id: string;
  name: string;
  type: "Laptop" | "Desktop" | "Tablet" | "Phone" | "Network";
  purchased: string;
  refreshDue: string;
  price: number;
  join: DeviceJoin;
  primaryUser: string;
  threatdown: ThreatDownState;
};

export type AssignedDevice = Device & {
  location: string;
  assigneeId?: string;
  assignee: string;
};

export type PatchState = "Current" | "Pending" | "Behind";

export type DeviceHealth = {
  patch: PatchState;
  checkIn: string;
  encryption: boolean;
};

export type Person = {
  id: string;
  name: string;
  role: string;
  department: Department;
  location: string;
  managerId: string | null;
  email: string;
  phone: string;
  startDate: string;
  status: PersonStatus;
  mfa: boolean;
  training: "Current" | "Due" | "Overdue";
  licenses: License[];
  devices: Device[];
  groups: string[];
  privileged: boolean;
  accountEnabled: boolean;
  frozen?: boolean;
  health: DeviceHealth;
};

export type TicketMessage = {
  id: string;
  author: string;
  at: string;
  body: string;
  internal?: boolean;
  fresh?: boolean;
};

export type Ticket = {
  id: string;
  workspaceId: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  requesterId: string;
  assignee: string;
  opened: string;
  updated: string;
  respondBy: string;
  resolveBy: string;
  messages: TicketMessage[];
  attachments: { name: string; size: string }[];
  fresh?: boolean;
};

export type Article = {
  slug: string;
  title: string;
  category: string;
  reviewed: string;
  owner: string;
  summary: string;
  body: string[];
  related: string[];
};

export type DirectoryKind = "entra" | "google";

export type Workspace = {
  id: string;
  name: string;
  plan: "Essentials" | "Pro";
  industry: string;
  region: string;
  website: string;
  domain: string;
  leaderId: string;
  staffId: string;
  blurb: string;
  directory: DirectoryKind;
  pims: string;
};

export type SeriesPoint = {
  label: string;
  spend: number;
  budget: number;
  visitors: number;
  sessions: number;
  opened: number;
  resolved: number;
  score: number;
};

export type SpendLine = { name: string; amount: number };

export type SpendSlice = { name: string; amount: number; lines: SpendLine[] };

export type ServiceState = "Operational" | "Degraded" | "Down";

export type ServiceStatus = {
  id: string;
  name: string;
  status: ServiceState;
  uptime30: number;
  uptime90: number;
  responseMs: number;
  incidents: { at: string; minutes: number; summary: string }[];
};

export type OutageKind = "internet" | "site";

export type OutageEvent = {
  id: string;
  at: string;
  kind: OutageKind;
  title: string;
  detail: string;
  status: "Resolved" | "Monitoring";
};

export type Executive = {
  range: DateRange;
  rangeLabel: string;
  periodSpend: number;
  periodBudget: number;
  monthSpend: number;
  monthBudget: number;
  ytdSpend: number;
  ytdBudget: number;
  costPerEmployee: number;
  headcount: number;
  deviceCount: number;
  breakdown: SpendSlice[];
  renewals: { vendor: string; date: string; amount: number; note: string }[];
  savings: { label: string; amount: number; detail: string }[];
  series: SeriesPoint[];
  traffic: {
    visitors: number;
    sessions: number;
    conversions: number;
    rate: number;
    pages: { path: string; views: number }[];
  };
  services: ServiceStatus[];
  backups: { id: string; label: string; status: "Current" | "Due"; detail: string }[];
  risks: { id: string; title: string; detail: string; href: string }[];
  projects: { id: string; name: string; progress: number; status: string }[];
  securityScore: number;
};

export type SoftwareContract = {
  name: string;
  vendor: string;
  monthly: number;
  seats: string;
  renewal: string;
  note: string;
};

export type Vendor = {
  name: string;
  category: string;
  monthly: number;
  renewal: string;
  contact: string;
  note: string;
};

export type ClinicLocation = {
  id: string;
  name: string;
  address: string;
  hours: string;
  circuits: { name: string; detail: string }[];
  note: string;
};

export type WorkspaceDocument = {
  id: string;
  title: string;
  updated: string;
  owner: string;
  summary: string;
  body: string[];
};

export type SecuritySnapshot = {
  score: number;
  alerts: { id: string; title: string; at: string; detail: string }[];
  policies: { title: string; href: string }[];
  checks: { id: string; label: string; state: "Met" | "Gap"; detail: string; href: string }[];
};

export type Project = {
  id: string;
  name: string;
  status: string;
  progress: number;
  owner: string;
  summary: string;
  spent: number;
  budget: number;
  milestones: { name: string; done: boolean; due: string }[];
};

export type RoadmapItem = { quarter: string; items: { name: string; state: string }[] };

export type Invoice = {
  id: string;
  date: string;
  amount: number;
  status: "Paid" | "Open";
  lines: { label: string; amount: number }[];
};

export type BillingSnapshot = {
  plan: "Essentials" | "Pro";
  monthly: number;
  hoursIncluded: number;
  hoursUsed: number;
  invoices: Invoice[];
};

export type ReportBlock = {
  heading: string;
  paragraphs: string[];
  figures?: { label: string; value: string }[];
};

export type Report = { title: string; period: string; blocks: ReportBlock[] };

export type Notice = { id: string; title: string; body: string; href: string; at: string };

export type SearchHit = {
  kind: "Person" | "Ticket" | "Article";
  id: string;
  label: string;
  detail: string;
  href: string;
};

export type PageContext = {
  section: string;
  title: string;
  hints: string[];
  subject?: string;
};

export type TicketDraft = {
  key: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  detail: string;
};

export type ChatCite = { title: string; href: string };

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  shown: string;
  cites: ChatCite[];
  pending: boolean;
};

export type AuditResult = "Applied" | "Queued" | "Blocked";

export type AuditEntry = {
  id: string;
  at: string;
  actor: string;
  action: string;
  target: string;
  detail: string;
  result: AuditResult;
};

export type ServiceRequest = {
  id: string;
  kind: "Software" | "Hardware" | "Access";
  title: string;
  detail: string;
  status: "Pending Talon" | "Approved" | "Filed";
  ticketId?: string;
};

export type CompromiseNotice = {
  id: string;
  at: string;
  personId: string;
  personName: string;
  email: string;
  subject: string;
  body: string;
  locked: boolean;
  lockNote: string;
  status: "Queued" | "Delivered";
  deliveredTo: number;
};

export type ApprovalKind = "Onboard" | "Update" | "Offboard" | "Request";

export type Approval = {
  id: string;
  at: string;
  requestedBy: string;
  status: "Pending Talon" | "Approved" | "Declined";
  kind: ApprovalKind;
  summary: string;
  target: string;
  person?: Person;
  personId?: string;
  patch?: Partial<Pick<Person, "role" | "department" | "managerId" | "groups" | "licenses">>;
  request?: Omit<ServiceRequest, "id" | "status">;
};
