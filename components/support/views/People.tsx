"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { getSupportRepository } from "@/lib/support/data";
import { formatDay, money } from "@/lib/support/format";
import { compromiseTemplate, directoryLabel, groupCatalog, licenseCatalog, offboardSteps, onboardTemplates } from "@/lib/support/identity";
import { ageLabel, personCost, personFlags, ticketStats } from "@/lib/support/stats";
import type { Department } from "@/lib/support/types";
import { useFrame } from "../frame";
import { usePageContext } from "../page-context";
import { decideApproval, offboardPerson, onboardPerson, sendCompromiseAlert, updatePerson } from "../store";
import { StepUp } from "../StepUp";
import { useDemo } from "../use-demo";
import { Avatar, Badge, Card, Empty, PageHeader, fieldClass, primaryClass, quietClass, statusTone } from "../ui";

const repo = getSupportRepository(null);

export function PeopleDirectory() {
  const demo = useDemo();
  const { href } = useFrame();
  const params = useSearchParams();
  const router = useRouter();
  const [text, setText] = useState("");
  const [sort, setSort] = useState<"name" | "tickets" | "cost">("name");
  const [direction, setDirection] = useState<"asc" | "desc">("asc");
  const people = demo.people[demo.workspaceId] ?? [];
  const tickets = demo.tickets[demo.workspaceId] ?? [];
  const flag = params.get("flag");
  const department = params.get("department");
  usePageContext({
    section: "people",
    title: "People",
    hints: ["Who still needs MFA?", "What does a person cost?", "How does onboarding work?"],
  });
  let rows = people.filter((person) => {
    if (department && person.department !== department) return false;
    if (flag === "mfa" && (person.mfa || person.status !== "Active")) return false;
    if (flag === "licensed" && !personFlags(person).includes("Still licensed")) return false;
    if (flag === "refresh" && !personFlags(person).includes("Refresh due")) return false;
    if (text.trim() && !`${person.name} ${person.role} ${person.location}`.toLowerCase().includes(text.toLowerCase())) return false;
    return true;
  });
  rows = [...rows].sort((a, b) => {
    const left = sort === "name" ? a.name : sort === "cost" ? personCost(a).total : ticketStats(a.id, tickets).opened;
    const right = sort === "name" ? b.name : sort === "cost" ? personCost(b).total : ticketStats(b.id, tickets).opened;
    const compared = left < right ? -1 : left > right ? 1 : 0;
    return direction === "asc" ? compared : -compared;
  });
  const departments = ["Leadership", "Clinical", "Client care", "Operations", "Finance"] as const;
  const byDepartment = departments.map((name) => ({
    name,
    count: tickets.filter((ticket) => people.find((person) => person.id === ticket.requesterId)?.department === name).length,
  }));

  function toggleSort(next: typeof sort) {
    if (sort === next) setDirection(direction === "asc" ? "desc" : "asc");
    else {
      setSort(next);
      setDirection(next === "name" ? "asc" : "desc");
    }
  }

  function setFlag(value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set("flag", value);
    else next.delete("flag");
    router.replace(`${href("/app/people")}?${next.toString()}`);
  }

  const leadership = demo.role === "leadership";
  return (
    <div className="space-y-4">
      <PageHeader
        title="People"
        detail={leadership ? `Directory actions run as ${demo.role === "leadership" ? "a user administrator" : "staff"}. They stay in this browser and do not call ${directoryLabel(repo.workspace(demo.workspaceId).directory)}.` : "Directory, devices, and your coworkers. Cost is on the leadership view."}
        actions={leadership ? (
          <>
            <Link href={href("/app/people/compromised")} className={quietClass}>Compromised account</Link>
            <Link href={href("/app/people/onboard")} className={primaryClass}>Onboard</Link>
          </>
        ) : null}
      />
      {leadership ? (
        <div className="flex flex-wrap gap-2 text-sm">
          <FilterChip label={`${people.filter((person) => person.status === "Active" && !person.mfa).length} without MFA`} onClick={() => setFlag(flag === "mfa" ? null : "mfa")} pressed={flag === "mfa"} />
          <FilterChip label={`${people.filter((person) => personFlags(person).includes("Still licensed")).length} offboarding, still licensed`} onClick={() => setFlag(flag === "licensed" ? null : "licensed")} pressed={flag === "licensed"} />
          <FilterChip label={`${people.filter((person) => personFlags(person).includes("Refresh due")).length} devices due`} onClick={() => setFlag(flag === "refresh" ? null : "refresh")} pressed={flag === "refresh"} />
          <Link href={href("/app/people/audit")} className={quietClass}>Audit log</Link>
        </div>
      ) : null}
      <div className="grid gap-3 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-3">
          <input className={fieldClass} value={text} onChange={(event) => setText(event.target.value)} placeholder="Search by name, role, or clinic" aria-label="Search people" />
          {rows.length === 0 ? <Empty title="No one matches" detail="Try another name or clear the flag." /> : (
            <div className="overflow-x-auto rounded-xl border border-[#e1e6ec] bg-white">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.12em] text-ink/45">
                  <tr>
                    <th className="px-3 py-2"><button type="button" onClick={() => toggleSort("name")}>Name</button></th>
                    <th className="px-3 py-2">Clinic</th>
                    <th className="px-3 py-2"><button type="button" onClick={() => toggleSort("tickets")}>Tickets</button></th>
                    {leadership ? <th className="px-3 py-2"><button type="button" onClick={() => toggleSort("cost")}>Monthly cost</button></th> : null}
                    <th className="px-3 py-2">Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((person) => {
                    const stats = ticketStats(person.id, tickets);
                    return (
                      <tr key={person.id} className="border-t border-[#f3f5f7]">
                        <td className="px-3 py-2">
                          <Link href={href(`/app/people/${person.id}`)} className="flex items-center gap-2 font-semibold hover:underline">
                            <Avatar name={person.name} size="sm" />
                            <span>{person.name}<span className="block font-normal text-ink/60">{person.role}</span></span>
                          </Link>
                        </td>
                        <td className="px-3 py-2">{person.location}</td>
                        <td className="px-3 py-2 tabular-nums">{stats.openNow} open · {stats.opened} total</td>
                        {leadership ? <td className="px-3 py-2 tabular-nums">{money(personCost(person).total)}</td> : null}
                        <td className="px-3 py-2">{personFlags(person).map((item) => <Badge key={item} tone="warn">{item}</Badge>)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        {leadership ? (
          <Card>
            <h2 className="font-semibold">Tickets by department</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {byDepartment.map((item) => (
                <li key={item.name}>
                  <button type="button" className="flex w-full justify-between hover:underline" onClick={() => {
                    const next = new URLSearchParams(params.toString());
                    next.set("department", item.name);
                    router.replace(`${href("/app/people")}?${next.toString()}`);
                  }}>
                    <span>{item.name}</span><span>{item.count}</span>
                  </button>
                  <div className="mt-1 h-1.5 rounded-full bg-[#e6ebf0]"><div className="h-1.5 rounded-full bg-pine" style={{ width: `${Math.min(100, item.count * 12)}%` }} /></div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink/50">Pipeline: {people.filter((person) => person.status === "Onboarding").length} onboarding, {people.filter((person) => person.status === "Offboarding").length} offboarding.</p>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function FilterChip({ label, onClick, pressed }: { label: string; onClick: () => void; pressed: boolean }) {
  return <button type="button" aria-pressed={pressed} onClick={onClick} className={`rounded-full px-3 py-1 ${pressed ? "bg-ink text-white" : "border border-[#d5dde6] bg-white"}`}>{label}</button>;
}

export function PersonProfile({ id }: { id: string }) {
  const demo = useDemo();
  const { href } = useFrame();
  const people = demo.people[demo.workspaceId] ?? [];
  const person = people.find((item) => item.id === id);
  const tickets = (demo.tickets[demo.workspaceId] ?? []).filter((ticket) => ticket.requesterId === id);
  const leadership = demo.role === "leadership";
  usePageContext({
    section: "person",
    title: person?.name ?? "Person",
    subject: person?.name,
    hints: ["What does this person cost?", "Do they have MFA?", "Which tickets did they open?"],
  });
  if (!person) return <Empty title="Person not in this workspace" detail="They may be on the other workspace, or the demo was reset." />;
  const manager = people.find((item) => item.id === person.managerId);
  const cost = personCost(person);
  const stats = ticketStats(person.id, demo.tickets[demo.workspaceId] ?? []);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={person.name} size="lg" />
          <div>
            <h1 className="text-2xl font-semibold">{person.name}</h1>
            <p className="text-sm text-ink/70">{person.role} · {person.department} · {person.location}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              <Badge tone={statusTone(person.status)}>{person.accountEnabled ? person.status : "Disabled"}</Badge>
              {person.privileged ? <Badge tone="mute">Privileged role</Badge> : null}
              {personFlags(person).map((flag) => <Badge key={flag} tone="warn">{flag}</Badge>)}
            </div>
          </div>
        </div>
        {leadership ? (
          <div className="flex gap-2">
            <Link href={href(`/app/people/compromised?person=${person.id}`)} className={quietClass}>Compromised account</Link>
            <Link href={href(`/app/people/${person.id}/update`)} className={quietClass}>Update</Link>
            <Link href={href(`/app/people/${person.id}/offboard`)} className={quietClass}>Offboard</Link>
          </div>
        ) : null}
      </div>
      {person.privileged && leadership ? <p className="rounded-md bg-[#f8f1de] px-3 py-2 text-sm">This account holds a privileged role. Update and offboard are blocked.</p> : null}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="font-semibold">Contact</h2>
          <p className="mt-2 text-sm">{person.email}</p>
          <p className="text-sm">{person.phone}</p>
          <p className="mt-2 text-sm text-ink/70">Manager: {manager ? <Link href={href(`/app/people/${manager.id}`)} className="text-pine underline">{manager.name}</Link> : "None"}</p>
          <p className="text-sm text-ink/70">Started {formatDay(person.startDate)} · {ageLabel(person.startDate)}</p>
          <p className="text-sm text-ink/70">MFA {person.mfa ? "on" : "off"} · training {person.training.toLowerCase()}</p>
        </Card>
        <Card>
          <h2 className="font-semibold">Device health</h2>
          <p className="mt-2 text-sm">Patches: {person.health.patch} · last check-in {person.health.checkIn}</p>
          <p className="text-sm">Disk encryption: {person.health.encryption ? "On" : "Off"}</p>
          <ul className="mt-2 space-y-2 text-sm">
            {person.devices.length ? person.devices.map((device) => (
              <li key={device.id}>
                <span className="font-semibold">{device.name}</span>
                <span className="block text-ink/70">{device.join === "Entra" ? "Intune, Entra joined" : "Google enrolled"} as {device.primaryUser}</span>
                <span className="mt-1 inline-flex items-center gap-2">Patches {person.health.patch} <Badge tone={statusTone(device.threatdown)}>ThreatDown {device.threatdown}</Badge></span>
              </li>
            )) : <li className="text-ink/70">No device assigned.</li>}
          </ul>
        </Card>
        <Card>
          <h2 className="font-semibold">{leadership ? "Licenses and groups" : "Groups"}</h2>
          <ul className="mt-2 text-sm">
            {(leadership ? person.licenses : []).map((license) => <li key={license.name}>{license.name} · {money(license.monthly)}</li>)}
            {person.groups.map((group) => <li key={group} className="text-ink/70">{group}</li>)}
          </ul>
          {leadership ? <p className="mt-2 text-sm font-semibold">About {money(cost.total)} a month</p> : null}
        </Card>
      </div>
      <Card>
        <h2 className="font-semibold">Tickets</h2>
        <p className="text-sm text-ink/60">{stats.opened} opened · {stats.openNow} open · average close {stats.avgHours === null ? "n/a" : `${stats.avgHours}h`}</p>
        <ul className="mt-2 space-y-1 text-sm">
          {tickets.map((ticket) => (
            <li key={ticket.id}><Link href={href(`/app/tickets/${ticket.id}`)} className="font-semibold text-pine underline">{ticket.id}</Link> {ticket.subject}</li>
          ))}
          {tickets.length === 0 ? <li className="text-ink/60">No tickets in this sample.</li> : null}
        </ul>
      </Card>
      <Card>
        <h2 className="font-semibold">Activity</h2>
        <ul className="mt-2 space-y-1 text-sm text-ink/70">
          <li>Started {formatDay(person.startDate)}.</li>
          <li>{person.mfa ? "MFA is enrolled." : "MFA is not enrolled."}</li>
          <li>Security training is {person.training.toLowerCase()}.</li>
          <li>Patch status is {person.health.patch.toLowerCase()} as of {person.health.checkIn}.</li>
        </ul>
      </Card>
    </div>
  );
}

export function OnboardFlow() {
  const demo = useDemo();
  const { href } = useFrame();
  const router = useRouter();
  const workspace = repo.workspace(demo.workspaceId);
  const templates = onboardTemplates(workspace.directory, workspace.pims, workspace.directory === "google" ? 22 : 26, workspace.directory === "google" ? 70 : 80);
  const people = demo.people[demo.workspaceId] ?? [];
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "tech");
  const [name, setName] = useState("");
  const [location, setLocation] = useState(people[0]?.location ?? "Asheville");
  const [managerId, setManagerId] = useState(workspace.leaderId);
  const [startDate, setStartDate] = useState("2026-11-02");
  const [step, setStep] = useState<"form" | "confirm" | "mfa">("form");
  const [error, setError] = useState("");
  const [checks, setChecks] = useState<string[]>([]);
  const checklist = ["Mailbox created", "Practice system seat", "MFA enrolled", "Clinic group added", "Device handed over"];
  const template = templates.find((item) => item.id === templateId) ?? templates[0];
  usePageContext({ section: "onboard", title: "Onboard", hints: ["What does a template include?", "Who approves a new hire?"] });
  if (demo.role !== "leadership") return <Empty title="Leadership only" detail="Switch the view to leadership to onboard someone." />;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (name.trim().length < 3) {
      setError("Enter the hire's name.");
      return;
    }
    setError("");
    setStep("confirm");
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <PageHeader title="Onboard" detail={`Template for ${directoryLabel(workspace.directory)}. ${demo.approvalRequired ? "Talon approval is on, so this waits in the queue." : "This applies in the browser only."}`} />
      {step === "form" ? (
        <form onSubmit={submit} className="space-y-3">
          {error ? <p className="text-sm text-[#7a3030]">{error}</p> : null}
          <label className="block text-sm font-semibold">Role template
            <select className={fieldClass + " mt-1"} value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
              {templates.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          {template ? (
            <Card>
              <p className="text-sm">Groups: {template.groups.join(", ")}</p>
              <p className="text-sm">Licenses: {template.licenses.map((item) => item.name).join(", ")}</p>
              <p className="text-sm">Devices: {template.devices.map((item) => item.name).join(", ")}</p>
            </Card>
          ) : null}
          <label className="block text-sm font-semibold">Name<input className={fieldClass + " mt-1"} value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label className="block text-sm font-semibold">Clinic<input className={fieldClass + " mt-1"} value={location} onChange={(event) => setLocation(event.target.value)} /></label>
          <label className="block text-sm font-semibold">Manager
            <select className={fieldClass + " mt-1"} value={managerId} onChange={(event) => setManagerId(event.target.value)}>
              {people.filter((person) => person.department === "Leadership" || person.role.toLowerCase().includes("lead") || person.role.toLowerCase().includes("manager")).slice(0, 12).map((person) => (
                <option key={person.id} value={person.id}>{person.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold">Start date<input type="date" className={fieldClass + " mt-1"} value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
          <button type="submit" className={primaryClass}>Review</button>
        </form>
      ) : null}
      {step === "confirm" && template ? (
        <Card>
          <h2 className="font-semibold">Confirm {name}</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            <li>{template.title} in {template.department}, {location}</li>
            <li>Groups: {template.groups.join(", ")}</li>
            <li>Licenses: {template.licenses.map((item) => `${item.name} (${money(item.monthly)})`).join(", ")}</li>
            <li>Devices: {template.devices.map((item) => item.name).join(", ")}</li>
          </ul>
          <h3 className="mt-3 text-sm font-semibold">New-hire checklist</h3>
          <ul className="mt-1 space-y-1 text-sm">
            {checklist.map((item) => (
              <li key={item}>
                <label className="flex gap-2">
                  <input type="checkbox" checked={checks.includes(item)} onChange={() => setChecks(checks.includes(item) ? checks.filter((entry) => entry !== item) : [...checks, item])} />
                  {item}
                </label>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-ink/50">{checks.length} of {checklist.length} for this hire. The list stays on this screen.</p>
          <div className="mt-3 flex gap-2">
            <button type="button" className={primaryClass} onClick={() => setStep("mfa")}>Continue to step-up</button>
            <button type="button" className={quietClass} onClick={() => setStep("form")}>Back</button>
          </div>
        </Card>
      ) : null}
      {step === "mfa" ? (
        <StepUp
          title="MFA step-up"
          detail="You are acting as a user administrator. Confirm to apply this onboard in the demo."
          onCancel={() => setStep("confirm")}
          onConfirm={() => {
            const result = onboardPerson({ name, templateId, location, managerId, startDate }, true);
            if (!result.ok) {
              setError(result.reason ?? "Could not onboard.");
              setStep("form");
              return;
            }
            router.push(href("/app/people"));
          }}
        />
      ) : null}
    </div>
  );
}

export function UpdateFlow({ id }: { id: string }) {
  const demo = useDemo();
  const { href } = useFrame();
  const router = useRouter();
  const workspace = repo.workspace(demo.workspaceId);
  const people = demo.people[demo.workspaceId] ?? [];
  const person = people.find((item) => item.id === id);
  const [role, setRole] = useState(person?.role ?? "");
  const [department, setDepartment] = useState<Department>(person?.department ?? "Clinical");
  const [managerId, setManagerId] = useState(person?.managerId ?? "");
  const [groups, setGroups] = useState<string[]>(person?.groups ?? []);
  const [licenses, setLicenses] = useState(person?.licenses.map((item) => item.name) ?? []);
  const [step, setStep] = useState<"form" | "confirm" | "mfa">("form");
  const [error, setError] = useState("");
  usePageContext({ section: "person", title: person ? `Update ${person.name}` : "Update", subject: person?.name, hints: ["Can I change an admin?", "What needs MFA?"] });
  if (demo.role !== "leadership") return <Empty title="Leadership only" detail="Switch the view to update an account." />;
  if (!person) return <Empty title="Person not found" detail="Return to the directory." />;
  if (person.privileged) return <Empty title="Privileged role" detail={`${person.name} cannot be modified from this screen. The audit log records the block if you had a way past this page.`} action={<Link className={quietClass} href={href(`/app/people/${person.id}`)}>Back</Link>} />;
  const catalog = licenseCatalog(workspace.directory, workspace.pims);
  const risky = department !== person.department || groups.join() !== person.groups.join() || licenses.join() !== person.licenses.map((item) => item.name).join();

  function toggle(list: string[], value: string, set: (next: string[]) => void) {
    set(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <PageHeader title={`Update ${person.name}`} detail="Title and manager apply directly. Groups, department, and licenses ask for step-up." />
      {error ? <p className="text-sm text-[#7a3030]">{error}</p> : null}
      {step === "form" ? (
        <form className="space-y-3" onSubmit={(event: FormEvent) => { event.preventDefault(); setStep("confirm"); }}>
          <label className="block text-sm font-semibold">Title<input className={fieldClass + " mt-1"} value={role} onChange={(event) => setRole(event.target.value)} /></label>
          <label className="block text-sm font-semibold">Department
            <select className={fieldClass + " mt-1"} value={department} onChange={(event) => setDepartment(event.target.value as Department)}>
              {(["Leadership", "Clinical", "Client care", "Operations", "Finance"] as const).map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold">Manager
            <select className={fieldClass + " mt-1"} value={managerId ?? ""} onChange={(event) => setManagerId(event.target.value)}>
              {people.filter((item) => item.id !== person.id).slice(0, 20).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <fieldset>
            <legend className="text-sm font-semibold">Groups</legend>
            <div className="mt-1 space-y-1 text-sm">
              {groupCatalog(workspace.directory).map((group) => (
                <label key={group} className="flex gap-2"><input type="checkbox" checked={groups.includes(group)} onChange={() => toggle(groups, group, setGroups)} />{group}</label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm font-semibold">Licenses</legend>
            <div className="mt-1 space-y-1 text-sm">
              {catalog.map((license) => (
                <label key={license.name} className="flex gap-2"><input type="checkbox" checked={licenses.includes(license.name)} onChange={() => toggle(licenses, license.name, setLicenses)} />{license.name} · {money(license.monthly)}</label>
              ))}
            </div>
          </fieldset>
          <button className={primaryClass} type="submit">Review</button>
        </form>
      ) : null}
      {step === "confirm" ? (
        <Card>
          <p className="text-sm">{role}, {department}. Groups: {groups.join(", ") || "none"}.</p>
          <div className="mt-3 flex gap-2">
            <button type="button" className={primaryClass} onClick={() => (risky ? setStep("mfa") : finish(false))}>Confirm</button>
            <button type="button" className={quietClass} onClick={() => setStep("form")}>Back</button>
          </div>
        </Card>
      ) : null}
      {step === "mfa" ? (
        <StepUp title="MFA step-up" detail="Required because groups, licenses, or department changed." onCancel={() => setStep("confirm")} onConfirm={() => finish(true)} />
      ) : null}
    </div>
  );

  function finish(stepUp: boolean) {
    const result = updatePerson(person!.id, {
      role,
      department,
      managerId,
      groups,
      licenses: catalog.filter((item) => licenses.includes(item.name)),
    }, stepUp);
    if (!result.ok) {
      setError(result.reason ?? "Could not update.");
      setStep("form");
      return;
    }
    router.push(href(`/app/people/${person!.id}`));
  }
}

export function OffboardFlow({ id }: { id: string }) {
  const demo = useDemo();
  const { href } = useFrame();
  const router = useRouter();
  const workspace = repo.workspace(demo.workspaceId);
  const person = (demo.people[demo.workspaceId] ?? []).find((item) => item.id === id);
  const [step, setStep] = useState<"confirm" | "mfa">("confirm");
  const [error, setError] = useState("");
  usePageContext({ section: "person", title: person ? `Offboard ${person.name}` : "Offboard", subject: person?.name, hints: ["What does offboarding change?", "Can I offboard an admin?"] });
  if (demo.role !== "leadership") return <Empty title="Leadership only" detail="Switch the view to offboard someone." />;
  if (!person) return <Empty title="Person not found" detail="Return to the directory." />;
  if (person.privileged) {
    return <Empty title="Privileged role" detail={`${person.name} is a privileged account. This flow will not disable it.`} action={<Link href={href(`/app/people/${person.id}`)} className={quietClass}>Back</Link>} />;
  }
  const steps = offboardSteps(workspace.directory);
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <PageHeader title={`Offboard ${person.name}`} detail="One flow. All of these happen together. Nothing is sent to the directory." />
      {error ? <p className="text-sm text-[#7a3030]">{error}</p> : null}
      {step === "confirm" ? (
        <Card>
          <ul className="space-y-2 text-sm">
            {steps.map((item) => <li key={item.id}><span className="font-semibold">{item.label}. </span>{item.detail}</li>)}
          </ul>
          <button type="button" className={`${primaryClass} mt-4`} onClick={() => setStep("mfa")}>Continue to step-up</button>
        </Card>
      ) : (
        <StepUp
          title="MFA step-up"
          detail="Offboarding closes the account. Confirm to apply it in this demo."
          onCancel={() => setStep("confirm")}
          onConfirm={() => {
            const result = offboardPerson(person.id, true);
            if (!result.ok) {
              setError(result.reason ?? "Could not offboard.");
              setStep("confirm");
              return;
            }
            router.push(href(`/app/people/${person.id}`));
          }}
        />
      )}
    </div>
  );
}

export function AuditLog() {
  const demo = useDemo();
  const { href } = useFrame();
  const entries = demo.audit[demo.workspaceId] ?? [];
  const queue = (demo.approvals[demo.workspaceId] ?? []).filter((item) => item.status === "Pending Talon");
  usePageContext({ section: "audit", title: "Audit log", hints: ["Who changed an account?", "What is waiting for Talon?"] });
  if (demo.role !== "leadership") return <Empty title="Leadership only" detail="The audit log is hidden on the staff view." />;
  return (
    <div className="space-y-4">
      <PageHeader title="Audit log" detail="Every onboard, update, and offboard in this browser. Approving the queue is a demo control, not a call to Talon." />
      <Card>
        <h2 className="font-semibold">Talon approval queue</h2>
        {queue.length === 0 ? <p className="mt-2 text-sm text-ink/60">Nothing waiting. Turn the queue on in Settings to require it.</p> : (
          <ul className="mt-3 space-y-3 text-sm">
            {queue.map((item) => (
              <li key={item.id} className="rounded-md border border-[#e1e6ec] p-3">
                <p className="font-semibold">{item.kind}: {item.target}</p>
                <p className="text-ink/70">{item.summary}</p>
                <div className="mt-2 flex gap-2">
                  <button type="button" className={primaryClass} onClick={() => decideApproval(item.id, true)}>Approve as Talon</button>
                  <button type="button" className={quietClass} onClick={() => decideApproval(item.id, false)}>Decline</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {entries.length === 0 ? <Empty title="No changes yet" detail="Onboard, update, or offboard someone and the row will show here." /> : (
        <div className="overflow-x-auto rounded-xl border border-[#e1e6ec] bg-white">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-ink/45"><tr><th className="px-3 py-2">When</th><th className="px-3 py-2">Who</th><th className="px-3 py-2">Action</th><th className="px-3 py-2">Result</th></tr></thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-t border-[#f3f5f7]">
                  <td className="px-3 py-2 whitespace-nowrap">{formatDay(entry.at)}</td>
                  <td className="px-3 py-2">{entry.actor}</td>
                  <td className="px-3 py-2"><span className="font-semibold">{entry.action}</span> · {entry.target}<span className="block text-ink/60">{entry.detail}</span></td>
                  <td className="px-3 py-2"><Badge tone={entry.result === "Blocked" ? "bad" : entry.result === "Queued" ? "warn" : "ok"}>{entry.result}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Link href={href("/app/settings")} className="text-sm font-semibold text-pine underline">Directory and approval settings</Link>
    </div>
  );
}

export function CompromiseFlow() {
  const demo = useDemo();
  const params = useSearchParams();
  const people = demo.people[demo.workspaceId] ?? [];
  const workspace = repo.workspace(demo.workspaceId);
  const [personId, setPersonId] = useState(params.get("person") ?? people.find((person) => !person.privileged)?.id ?? people[0]?.id ?? "");
  const [lock, setLock] = useState(true);
  const [step, setStep] = useState<"pick" | "preview" | "mfa" | "sent">("pick");
  const [error, setError] = useState("");
  const person = people.find((item) => item.id === personId);
  const template = person ? compromiseTemplate(workspace.name, person) : null;
  const notices = demo.alerts[demo.workspaceId] ?? [];
  usePageContext({
    section: "people",
    title: "Compromised account",
    hints: ["How do I warn the company?", "Does this lock the account?", "Was the notice delivered?"],
  });
  if (demo.role !== "leadership") return <Empty title="Leadership only" detail="Staff cannot send a company-wide notice." />;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <PageHeader title="Compromised account" detail="One notice to the company. Delivery is simulated. No email leaves this browser." />
      {error ? <p className="text-sm text-[#7a3030]">{error}</p> : null}
      {step === "pick" ? (
        <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); if (!person) { setError("Pick a person."); return; } setError(""); setStep("preview"); }}>
          <label className="block text-sm font-semibold">Affected account
            <select className={fieldClass + " mt-1"} value={personId} onChange={(event) => setPersonId(event.target.value)}>
              {people.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.email}</option>)}
            </select>
          </label>
          <button type="submit" className={primaryClass}>Preview the notice</button>
        </form>
      ) : null}
      {step === "preview" && person && template ? (
        <Card>
          <p className="text-xs uppercase tracking-wide text-ink/40">To the company</p>
          <p className="mt-2 font-semibold">{template.subject}</p>
          <p className="mt-2 text-sm">{template.body}</p>
          <label className="mt-3 flex items-start gap-2 text-sm">
            <input type="checkbox" checked={lock} onChange={(event) => setLock(event.target.checked)} />
            <span>Also disable the account and revoke sessions. A privileged role is named in the notice and is not disabled.</span>
          </label>
          {person.privileged ? <p className="mt-2 text-sm text-ink/70">{person.name} holds a privileged role. The notice can go out. The lock will not.</p> : null}
          <div className="mt-3 flex gap-2">
            <button type="button" className={primaryClass} onClick={() => setStep("mfa")}>Continue to step-up</button>
            <button type="button" className={quietClass} onClick={() => setStep("pick")}>Back</button>
          </div>
        </Card>
      ) : null}
      {step === "mfa" ? (
        <StepUp
          title="MFA step-up"
          detail="Confirm to queue the company notice in this demo."
          onCancel={() => setStep("preview")}
          onConfirm={() => {
            const result = sendCompromiseAlert(personId, lock);
            if (!result.ok) {
              setError(result.reason ?? "Could not send.");
              setStep("pick");
              return;
            }
            setStep("sent");
          }}
        />
      ) : null}
      {step === "sent" ? (
        <Card>
          <h2 className="font-semibold">Delivery</h2>
          {notices[0] ? (
            <div className="mt-2 text-sm">
              <p><Badge tone={statusTone(notices[0].status)}>{notices[0].status}</Badge></p>
              <p className="mt-2">{notices[0].status === "Delivered" ? `Delivered to ${notices[0].deliveredTo} mailboxes.` : "Queued. Status updates on this page."}</p>
              <p className="mt-1 text-ink/70">{notices[0].lockNote}</p>
              <p className="mt-2 font-semibold">{notices[0].subject}</p>
              <p>{notices[0].body}</p>
            </div>
          ) : <p className="mt-2 text-sm">Waiting for the notice.</p>}
        </Card>
      ) : null}
      {notices.length > 0 && step !== "sent" ? (
        <Card>
          <h2 className="font-semibold">Earlier notices</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {notices.slice(0, 3).map((notice) => (
              <li key={notice.id}>{notice.personName} · {notice.status}{notice.status === "Delivered" ? ` · ${notice.deliveredTo} mailboxes` : ""}</li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
