"use client";

import Link from "next/link";
import { useState } from "react";
import { getSupportRepository } from "@/lib/support/data";
import { formatDay, money } from "@/lib/support/format";
import { useFrame } from "../frame";
import { usePageContext } from "../page-context";
import { resetDemo, setApprovalRequired, setPrefs } from "../store";
import { useDemo } from "../use-demo";
import { Badge, Card, PageHeader, primaryClass, quietClass, statusTone } from "../ui";

const repo = getSupportRepository(null);

export function SecurityView() {
  const demo = useDemo();
  const { href } = useFrame();
  const security = repo.security(demo.workspaceId);
  const people = demo.people[demo.workspaceId] ?? [];
  const missing = people.filter((person) => person.status === "Active" && !person.mfa);
  const leadership = demo.role === "leadership";
  usePageContext({ section: "security", title: "Security", hints: ["Who still needs MFA?", "What is the ThreatDown status?", "When was the last restore test?"] });
  const devices = people.flatMap((person) => person.devices.map((device) => ({ ...device, person })));
  const counts = {
    Protected: devices.filter((device) => device.threatdown === "Protected").length,
    Threats: devices.filter((device) => device.threatdown === "Threats").length,
    Isolated: devices.filter((device) => device.threatdown === "Isolated").length,
  };
  const flagged = devices.filter((device) => device.threatdown !== "Protected");
  const checks = [
    { id: "mfa", label: "MFA coverage", state: missing.length ? "Gap" as const : "Met" as const, detail: missing.length ? `${missing.length} active people still sign in with a password alone.` : "Every active person has MFA.", href: "/app/people?flag=mfa" },
    ...security.checks,
  ];
  return (
    <div className="space-y-4">
      <PageHeader title="Security" detail={`Score ${security.score}. Endpoint protection is ThreatDown EDR.`} actions={leadership ? <Link href={href("/app/people/compromised")} className={primaryClass}>Compromised account</Link> : null} />
      <div className="grid gap-3 sm:grid-cols-3">
        {(["Protected", "Threats", "Isolated"] as const).map((state) => (
          <Card key={state}>
            <p className="text-xs uppercase tracking-wide text-ink/40">ThreatDown</p>
            <p className="mt-1 text-2xl font-semibold">{counts[state]}</p>
            <Badge tone={statusTone(state)}>{state}</Badge>
          </Card>
        ))}
      </div>
      {flagged.length ? (
        <Card>
          <h2 className="font-semibold">Devices that need a look</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {flagged.map((device) => (
              <li key={device.id} className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  <Link href={href(`/app/people/${device.person.id}`)} className="font-semibold text-pine underline">{device.person.name}</Link>
                  {" · "}{device.name} · {device.primaryUser}
                </span>
                <Badge tone={statusTone(device.threatdown)}>{device.threatdown}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
      <div className="grid gap-3 md:grid-cols-2">
        {checks.map((check) => (
          <Link key={check.id} href={href(check.href)} className="rounded-xl border border-[#e1e6ec] bg-white p-4">
            <div className="flex items-center justify-between"><h2 className="font-semibold">{check.label}</h2><Badge tone={statusTone(check.state)}>{check.state}</Badge></div>
            <p className="mt-1 text-sm text-ink/70">{check.detail}</p>
          </Link>
        ))}
      </div>
      <Card>
        <h2 className="font-semibold">Recent alerts</h2>
        <ul className="mt-3 space-y-3 text-sm">
          {security.alerts.map((alert) => (
            <li key={alert.id}><span className="font-semibold">{alert.title}</span> · {formatDay(alert.at)}<span className="block text-ink/70">{alert.detail}</span></li>
          ))}
        </ul>
      </Card>
      <Card>
        <h2 className="font-semibold">Policies</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {security.policies.map((policy) => <li key={policy.title}><Link href={href(policy.href)} className="text-pine underline">{policy.title}</Link></li>)}
        </ul>
      </Card>
      {leadership && missing.length ? <p className="text-sm text-ink/60">Still open: {missing.map((person) => person.name).slice(0, 8).join(", ")}{missing.length > 8 ? "…" : ""}</p> : null}
    </div>
  );
}

export function ProjectsView() {
  const demo = useDemo();
  const leadership = demo.role === "leadership";
  const projects = repo.projects(demo.workspaceId);
  const [open, setOpen] = useState(projects[0]?.id ?? "");
  usePageContext({ section: "projects", title: "Projects", hints: ["What is in progress?", "What is next quarter?"] });
  return (
    <div className="space-y-4">
      <PageHeader title="Projects" detail="Current work and the next few quarters." />
      {projects.map((project) => (
        <Card key={project.id}>
          <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => setOpen(open === project.id ? "" : project.id)}>
            <span className="font-semibold">{project.name}</span>
            <span className="text-sm">{project.progress}%</span>
          </button>
          <div className="mt-2 h-1.5 rounded-full bg-[#e6ebf0]"><div className="h-1.5 rounded-full bg-pine" style={{ width: `${project.progress}%` }} /></div>
          {open === project.id ? (
            <div className="mt-3 text-sm">
              <p>{project.summary}</p>
              {leadership && project.budget ? <p className="mt-1 text-ink/60">{money(project.spent)} of {money(project.budget)} sample budget.</p> : null}
              <ul className="mt-2 space-y-1">
                {project.milestones.map((milestone) => <li key={milestone.name}>{milestone.done ? "Done" : "Open"} · {milestone.name} · {milestone.due}</li>)}
              </ul>
            </div>
          ) : null}
        </Card>
      ))}
      <Card>
        <h2 className="font-semibold">Roadmap</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {repo.roadmap(demo.workspaceId).map((quarter) => (
            <div key={quarter.quarter}>
              <p className="text-sm font-semibold">{quarter.quarter}</p>
              <ul className="mt-1 text-sm text-ink/70">{quarter.items.map((item) => <li key={item.name}>{item.state}: {item.name}</li>)}</ul>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function ReportsHome() {
  const { href } = useFrame();
  usePageContext({ section: "reports", title: "Reports", hints: ["What happened this month?", "What did we decide at the quarterly review?"] });
  return (
    <div className="space-y-4">
      <PageHeader title="Reports" detail="A monthly note and the quarterly review. Figures are samples." />
      <div className="grid gap-3 md:grid-cols-2">
        <Link href={href("/app/reports/monthly")} className="rounded-xl border border-[#e1e6ec] bg-white p-5"><h2 className="font-semibold">October service report</h2><p className="mt-1 text-sm text-ink/60">Hours, the urgent ticket, and what is next.</p></Link>
        <Link href={href("/app/reports/qbr")} className="rounded-xl border border-[#e1e6ec] bg-white p-5"><h2 className="font-semibold">Quarterly review</h2><p className="mt-1 text-sm text-ink/60">Year to date and the decisions on the table.</p></Link>
      </div>
    </div>
  );
}

export function ReportView({ kind }: { kind: "monthly" | "qbr" }) {
  const demo = useDemo();
  const { href } = useFrame();
  const report = repo.reports(demo.workspaceId)[kind];
  const leadership = demo.role === "leadership";
  usePageContext({ section: "reports", title: report.title, hints: ["Where is spend versus budget?", "What needs a decision?"] });
  if (!leadership) {
    return (
      <div>
        <PageHeader title={report.title} detail="Spend is hidden on the staff view." />
        <Link href={href("/app/reports")} className="text-sm text-pine underline">All reports</Link>
      </div>
    );
  }
  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <PageHeader eyebrow={report.period} title={report.title} />
      {report.blocks.map((block) => (
        <section key={block.heading}>
          <h2 className="text-lg font-semibold">{block.heading}</h2>
          {block.figures ? <div className="mt-3 grid gap-2 sm:grid-cols-3">{block.figures.map((figure) => <Card key={figure.label}><p className="text-xs uppercase tracking-wide text-ink/40">{figure.label}</p><p className="mt-1 font-semibold">{figure.value}</p></Card>)}</div> : null}
          {block.paragraphs.map((paragraph) => <p key={paragraph} className="mt-2 text-sm leading-6">{paragraph}</p>)}
        </section>
      ))}
    </article>
  );
}

export function BillingView() {
  const demo = useDemo();
  const billing = repo.billing(demo.workspaceId);
  const [invoiceId, setInvoiceId] = useState(billing.invoices[0]?.id ?? "");
  const invoice = billing.invoices.find((item) => item.id === invoiceId);
  usePageContext({ section: "billing", title: "Billing", hints: ["What plan are we on?", "How many hours are left?"] });
  if (demo.role !== "leadership") {
    return <PageHeader title="Billing" detail="Invoices and the retainer are on the leadership view." />;
  }
  return (
    <div className="space-y-4">
      <PageHeader title="Billing" detail={`${billing.plan} retainer. The amount is a sample, not a rate card.`} />
      <div className="grid gap-3 md:grid-cols-3">
        <Card><p className="text-xs uppercase tracking-wide text-ink/40">Plan</p><p className="mt-1 text-2xl font-semibold">{billing.plan}</p><p className="text-sm text-ink/60">{money(billing.monthly)} / month, sample</p></Card>
        <Card><p className="text-xs uppercase tracking-wide text-ink/40">Hours</p><p className="mt-1 text-2xl font-semibold">{billing.hoursUsed} / {billing.hoursIncluded}</p><div className="mt-2 h-1.5 rounded-full bg-[#e6ebf0]"><div className="h-1.5 rounded-full bg-pine" style={{ width: `${Math.min(100, (billing.hoursUsed / billing.hoursIncluded) * 100)}%` }} /></div></Card>
        <Card><p className="text-xs uppercase tracking-wide text-ink/40">Latest invoice</p><p className="mt-1 text-2xl font-semibold">{money(billing.invoices[0]?.amount ?? 0)}</p><Badge tone="ok">Paid</Badge></Card>
      </div>
      <div className="grid gap-3 lg:grid-cols-[1fr,1fr]">
        <div className="overflow-hidden rounded-xl border border-[#e1e6ec] bg-white">
          {billing.invoices.map((item) => (
            <button key={item.id} type="button" className="flex w-full justify-between border-b border-[#f3f5f7] px-4 py-3 text-left text-sm last:border-0" onClick={() => setInvoiceId(item.id)}>
              <span>{item.id} · {formatDay(item.date)}</span><span>{money(item.amount)}</span>
            </button>
          ))}
        </div>
        {invoice ? (
          <Card>
            <h2 className="font-semibold">{invoice.id}</h2>
            <ul className="mt-2 text-sm">{invoice.lines.map((line) => <li key={line.label} className="flex justify-between"><span>{line.label}</span><span>{money(line.amount)}</span></li>)}</ul>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

export function SettingsView() {
  const demo = useDemo();
  const workspace = repo.workspace(demo.workspaceId);
  const people = demo.people[demo.workspaceId] ?? [];
  const persona = people.find((person) => person.id === (demo.role === "staff" ? workspace.staffId : workspace.leaderId));
  const [confirmReset, setConfirmReset] = useState(false);
  usePageContext({ section: "settings", title: "Settings", hints: ["Which directory is connected?", "Who gets outage alerts?", "How do I turn on Talon approval?"] });
  const other = workspace.directory === "entra" ? "Google Workspace" : "Microsoft Entra ID";
  const prefs = demo.prefs;
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader title="Settings" detail="Profile, directory, and who hears about an outage. Nothing here is sent off this browser." />
      <Card>
        <h2 className="font-semibold">Profile</h2>
        <p className="mt-2 text-sm">{persona?.name}</p>
        <p className="text-sm text-ink/60">{persona?.email}</p>
        <p className="mt-2 text-xs text-ink/50">Profile changes are not saved in this demo.</p>
      </Card>
      <Card>
        <h2 className="font-semibold">Directory</h2>
        <p className="mt-2 text-sm">Connected: {workspace.directory === "entra" ? "Microsoft Entra ID" : "Google Workspace"}.</p>
        <p className="mt-1 text-sm text-ink/70">{other} is supported and is not connected here. Larkspur is Microsoft 365. South Ridge shows Google Workspace. Devices follow the person&apos;s email. This preview does not call either directory.</p>
      </Card>
      <Card>
        <h2 className="font-semibold">Notifications</h2>
        <div className="mt-2 space-y-2 text-sm">
          <Notify label="New tickets" checked={prefs.tickets} onChange={(tickets) => setPrefs({ ...prefs, tickets })} />
          <Notify label="Uptime changes" checked={prefs.uptime} onChange={(uptime) => setPrefs({ ...prefs, uptime })} />
          <Notify label="Renewals" checked={prefs.renewals} onChange={(renewals) => setPrefs({ ...prefs, renewals })} />
        </div>
        <p className="mt-2 text-xs text-ink/50">Kept in this browser. Nothing is sent.</p>
      </Card>
      <Card>
        <h2 className="font-semibold">Outage notifications</h2>
        <p className="mt-1 text-sm text-ink/70">Who is told when internet or a site goes down. The overview lists the events. This demo does not send SMS, email, or push.</p>
        <label className="mt-3 block text-sm font-semibold">Recipients
          <select className="mt-1 w-full rounded-md border border-[#d5dde6] px-3 py-2 text-sm" value={prefs.outageRecipients} onChange={(event) => setPrefs({ ...prefs, outageRecipients: event.target.value as typeof prefs.outageRecipients })}>
            <option>Leadership</option>
            <option>Clinic leads</option>
            <option>Everyone</option>
          </select>
        </label>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <fieldset>
            <legend className="text-sm font-semibold">Internet</legend>
            <div className="mt-1 space-y-1 text-sm">
              <Notify label="SMS" checked={prefs.internetAlerts.sms} onChange={(sms) => setPrefs({ ...prefs, internetAlerts: { ...prefs.internetAlerts, sms } })} />
              <Notify label="Email" checked={prefs.internetAlerts.email} onChange={(email) => setPrefs({ ...prefs, internetAlerts: { ...prefs.internetAlerts, email } })} />
              <Notify label="Push" checked={prefs.internetAlerts.push} onChange={(push) => setPrefs({ ...prefs, internetAlerts: { ...prefs.internetAlerts, push } })} />
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm font-semibold">Site</legend>
            <div className="mt-1 space-y-1 text-sm">
              <Notify label="SMS" checked={prefs.siteAlerts.sms} onChange={(sms) => setPrefs({ ...prefs, siteAlerts: { ...prefs.siteAlerts, sms } })} />
              <Notify label="Email" checked={prefs.siteAlerts.email} onChange={(email) => setPrefs({ ...prefs, siteAlerts: { ...prefs.siteAlerts, email } })} />
              <Notify label="Push" checked={prefs.siteAlerts.push} onChange={(push) => setPrefs({ ...prefs, siteAlerts: { ...prefs.siteAlerts, push } })} />
            </div>
          </fieldset>
        </div>
      </Card>
      {demo.role === "leadership" ? (
        <Card>
          <h2 className="font-semibold">Approval</h2>
          <label className="mt-2 flex items-start gap-2 text-sm">
            <input type="checkbox" checked={demo.approvalRequired} onChange={(event) => setApprovalRequired(event.target.checked)} />
            <span>Require Talon approval for onboard, offboard, and license changes. You can approve the queue from the audit log. That button is a demo control.</span>
          </label>
        </Card>
      ) : null}
      <Card>
        <h2 className="font-semibold">Who can do what</h2>
        <ul className="mt-2 text-sm">
          {people.filter((person) => person.privileged || person.department === "Leadership").slice(0, 6).map((person) => (
            <li key={person.id} className="flex justify-between border-b border-[#f3f5f7] py-1"><span>{person.name}</span><span className="text-ink/60">{person.privileged ? "Privileged" : "Leadership"}</span></li>
          ))}
          <li className="py-1 text-ink/60">Everyone else is staff. Staff can file tickets and use Help. They cannot change accounts.</li>
        </ul>
      </Card>
      <Card>
        <h2 className="font-semibold">Reset the demo</h2>
        {confirmReset ? (
          <div className="mt-2 flex gap-2">
            <button type="button" className={primaryClass} onClick={() => resetDemo()}>Reset</button>
            <button type="button" className={quietClass} onClick={() => setConfirmReset(false)}>Cancel</button>
          </div>
        ) : (
          <button type="button" className={`${quietClass} mt-2`} onClick={() => setConfirmReset(true)}>Reset demo data</button>
        )}
      </Card>
    </div>
  );
}

function Notify({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex items-center gap-2"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />{label}</label>;
}
