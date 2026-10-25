"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState, type ReactNode } from "react";
import { getSupportRepository } from "@/lib/support/data";
import { formatDay } from "@/lib/support/format";
import { licenseCatalog, offboardSteps, onboardTemplates } from "@/lib/support/identity";
import type { Department, Person, PersonStatus } from "@/lib/support/types";
import { StepUp } from "../StepUp";
import { usePageContext } from "../page-context";
import { freezePerson, offboardPerson, onboardPerson, updatePerson } from "../store";
import { useFrame } from "../frame";
import { useDemo } from "../use-demo";
import { Avatar, Badge, cardClass, dangerClass, fieldClass, primaryClass, quietClass, statusTone } from "../ui";

const repo = getSupportRepository(null);
const departments: Department[] = ["Leadership", "Field", "Office", "Operations", "Finance"];

function displayStatus(person: Person): PersonStatus | "Frozen" {
  if (person.status === "Offboarding") return "Offboarding";
  if (person.frozen) return "Frozen";
  return person.status;
}

function uniqueGroups(groups: string[]): string[] {
  return groups.filter((group, index) => groups.indexOf(group) === index);
}

function RecordItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-t border-[#f3f5f7] py-3 first:border-t-0">
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-ink/45">{label}</dt>
      <dd className="mt-1 text-sm">{children}</dd>
    </div>
  );
}

function EmployeeRecord({ person, manager }: { person: Person; manager: string }) {
  const groups = uniqueGroups(person.groups);
  return (
    <section className={cardClass}>
      <dl>
        <RecordItem label="Department">{person.department}</RecordItem>
        <RecordItem label="Manager">{manager}</RecordItem>
        <RecordItem label="Start date">{formatDay(person.startDate)}</RecordItem>
        <RecordItem label="Devices">
          {person.devices.length === 0 ? "None" : (
            <ul className="space-y-2">
              {person.devices.map((device) => (
                <li key={device.id} className="flex flex-wrap items-center gap-2">
                  <span>{device.name}</span>
                  <Badge tone={statusTone(device.threatdown)}>{device.threatdown}</Badge>
                </li>
              ))}
            </ul>
          )}
        </RecordItem>
        <RecordItem label="Licenses">
          {person.licenses.length === 0 ? "None" : (
            <ul className="space-y-1">
              {person.licenses.map((license) => <li key={license.name}>{license.name}</li>)}
            </ul>
          )}
        </RecordItem>
        <RecordItem label="Access">
          <ul className="space-y-2">
            {groups.length === 0 ? <li>No groups</li> : groups.map((group) => <li key={group}>{group}</li>)}
            <li><Badge tone={person.mfa ? "ok" : "warn"}>{person.mfa ? "MFA on" : "MFA off"}</Badge></li>
            <li><Badge tone={person.accountEnabled ? "ok" : "bad"}>{person.accountEnabled ? "Sign-in on" : "Sign-in blocked"}</Badge></li>
          </ul>
        </RecordItem>
      </dl>
    </section>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="my-6 w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button type="button" className={quietClass} onClick={onClose}>Close</button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function Confirm({ title, blocked, onCancel, onConfirm }: { title: string; blocked: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
        <p className="text-lg font-semibold">{title}</p>
        {blocked ? <p className="mt-2 text-sm">Not allowed</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className={quietClass} onClick={onCancel}>Cancel</button>
          <button type="button" className={dangerClass} onClick={onConfirm} disabled={blocked}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

function PersonPicker({ people, value, onChange }: { people: Person[]; value: string; onChange: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const shown = people.filter((person) => `${person.name} ${person.role} ${person.location}`.toLowerCase().includes(query.toLowerCase())).slice(0, 8);
  return (
    <div>
      <input className={fieldClass} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" aria-label="Search people" />
      <ul className="mt-2 max-h-48 overflow-y-auto rounded-md border border-[#e1e6ec]">
        {shown.map((person) => (
          <li key={person.id}>
            <button type="button" className={`block w-full px-3 py-2 text-left text-sm ${person.id === value ? "bg-[#e7f3ef] font-semibold" : "hover:bg-[#f3f5f7]"}`} onClick={() => onChange(person.id)}>
              {person.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PeopleDirectory() {
  const demo = useDemo();
  const params = useSearchParams();
  const { href } = useFrame();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState<"onboard" | "offboard" | "freeze" | null>(null);
  const flag = params.get("flag") === "mfa";
  const tickets = demo.tickets[demo.workspaceId] ?? [];
  const roster = demo.people[demo.workspaceId] ?? [];
  const people = roster.filter((person) => {
    const matches = `${person.name} ${person.role} ${person.location}`.toLowerCase().includes(query.toLowerCase());
    return matches && (!flag || (person.status === "Active" && !person.mfa));
  });
  usePageContext({ section: "people", title: "People", hints: ["Onboard user", "Freeze account"] });
  if (demo.role !== "leadership") return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">People</h1>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={primaryClass} onClick={() => setModal("onboard")}>Onboard user</button>
          <button type="button" className={dangerClass} onClick={() => setModal("offboard")}>Offboard user</button>
          <button type="button" className={dangerClass} onClick={() => setModal("freeze")}>Freeze account</button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <input className={fieldClass + " max-w-xs"} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" aria-label="Search" />
        {flag ? <Link href={href("/app/people")} className={quietClass}>All</Link> : null}
      </div>
      <div className="overflow-x-auto rounded-xl border border-[#e1e6ec] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.12em] text-ink/45">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-3 py-3">Role</th>
              <th className="px-3 py-3">Location</th>
              <th className="px-3 py-3">Requests</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {people.map((person) => {
              const requests = tickets.filter((ticket) => ticket.requesterId === person.id && ticket.status !== "Resolved").length;
              const status = displayStatus(person);
              return (
                <tr key={person.id} className="border-t border-[#f3f5f7]">
                  <td className="px-4 py-3">
                    <Link href={href(`/app/people/${person.id}`)} className="flex items-center gap-2 font-semibold text-ink">
                      <Avatar name={person.name} size="sm" />
                      {person.name}
                    </Link>
                  </td>
                  <td className="px-3 py-3">{person.role}</td>
                  <td className="px-3 py-3">{person.location}</td>
                  <td className="px-3 py-3 tabular-nums">{requests}</td>
                  <td className="px-3 py-3"><Badge tone={statusTone(status)}>{status}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" className={quietClass} onClick={() => router.push(href(`/app/people/${person.id}?edit=1`))}>Edit</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {people.length === 0 ? <p className="px-4 py-6 text-sm">None</p> : null}
      </div>
      {modal === "onboard" ? (
        <Modal title="Onboard user" onClose={() => setModal(null)}>
          <AddPerson embedded onDone={() => setModal(null)} />
        </Modal>
      ) : null}
      {modal === "offboard" ? <OffboardModal people={roster} onClose={() => setModal(null)} /> : null}
      {modal === "freeze" ? <FreezeModal people={roster} onClose={() => setModal(null)} /> : null}
    </div>
  );
}

function OffboardModal({ people, onClose }: { people: Person[]; onClose: () => void }) {
  const demo = useDemo();
  const workspace = repo.workspace(demo.workspaceId);
  const steps = offboardSteps(workspace.directory);
  const [personId, setPersonId] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const person = people.find((item) => item.id === personId);

  function confirm() {
    if (!person) return;
    const result = offboardPerson(person.id, true);
    if (!result.ok) {
      setBlocked(true);
      return;
    }
    onClose();
  }

  return (
    <Modal title="Offboard user" onClose={onClose}>
      <PersonPicker people={people} value={personId} onChange={(id) => { setPersonId(id); setBlocked(false); setConfirming(false); }} />
      {person ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-semibold">{person.name}</p>
          {person.privileged ? <p className="text-sm">Not allowed</p> : (
            <>
              <ul className="space-y-1 text-sm">
                {steps.map((step) => <li key={step.id}>{step.label}</li>)}
              </ul>
              <button type="button" className={dangerClass} onClick={() => setConfirming(true)}>Confirm</button>
            </>
          )}
        </div>
      ) : null}
      {confirming && person ? (
        <Confirm title={`Offboard ${person.name}?`} blocked={blocked || person.privileged} onCancel={() => setConfirming(false)} onConfirm={confirm} />
      ) : null}
    </Modal>
  );
}

function FreezeModal({ people, onClose }: { people: Person[]; onClose: () => void }) {
  const [personId, setPersonId] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const person = people.find((item) => item.id === personId);

  function confirm() {
    if (!person) return;
    const result = freezePerson(person.id, true);
    if (!result.ok) {
      setBlocked(true);
      return;
    }
    onClose();
  }

  return (
    <Modal title="Freeze account" onClose={onClose}>
      <PersonPicker people={people} value={personId} onChange={(id) => { setPersonId(id); setBlocked(false); setConfirming(false); }} />
      {person ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-semibold">{person.name}</p>
          {person.privileged ? <p className="text-sm">Not allowed</p> : person.frozen ? (
            <button type="button" className={quietClass} onClick={() => { freezePerson(person.id, false); onClose(); }}>Unfreeze</button>
          ) : (
            <button type="button" className={dangerClass} onClick={() => setConfirming(true)}>Confirm</button>
          )}
        </div>
      ) : null}
      {confirming && person ? (
        <Confirm title={`Freeze ${person.name}?`} blocked={blocked || person.privileged} onCancel={() => setConfirming(false)} onConfirm={confirm} />
      ) : null}
    </Modal>
  );
}

export function PersonProfile({ id }: { id: string }) {
  const demo = useDemo();
  const params = useSearchParams();
  const roster = demo.people[demo.workspaceId] ?? [];
  const person = roster.find((item) => item.id === id);
  const [mode, setMode] = useState<"view" | "edit" | "confirm">(params.get("edit") === "1" ? "edit" : "view");
  const [role, setRole] = useState(person?.role ?? "");
  const [department, setDepartment] = useState<Department>(person?.department ?? "Office");
  const [managerId, setManagerId] = useState(person?.managerId ?? "");
  const [note, setNote] = useState("");
  usePageContext({ section: "person", title: person?.name ?? "Person", subject: person?.name, hints: ["Edit user"] });
  if (!person || demo.role !== "leadership") return null;
  const status = displayStatus(person);
  const manager = person.managerId ? roster.find((item) => item.id === person.managerId)?.name ?? "None" : "None";

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={person.name} size="lg" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{person.name}</h1>
            <Badge tone={statusTone(status)}>{status}</Badge>
          </div>
        </div>
        <button type="button" className={quietClass} onClick={() => setMode("edit")}>Edit</button>
      </div>
      <p className="text-sm">{person.role} · {person.location}</p>
      <p className="text-sm">{person.email}</p>
      {note ? <p className="text-sm">Not allowed</p> : null}
      {mode === "edit" ? (
        <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); setMode("confirm"); }}>
          <label className="block text-sm font-semibold">Title<input className={fieldClass + " mt-1"} value={role} onChange={(event) => setRole(event.target.value)} /></label>
          <label className="block text-sm font-semibold">Manager
            <select className={fieldClass + " mt-1"} value={managerId} onChange={(event) => setManagerId(event.target.value)}>
              <option value="">None</option>
              {roster.filter((item) => item.id !== person.id).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold">Department
            <select className={fieldClass + " mt-1"} value={department} onChange={(event) => setDepartment(event.target.value as Department)}>
              {departments.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <button type="submit" className={primaryClass}>Save</button>
        </form>
      ) : null}
      {mode === "confirm" ? (
        <StepUp title="Confirm" onCancel={() => setMode("edit")} onConfirm={() => {
          const result = updatePerson(person.id, { role, department, managerId: managerId || null }, true);
          if (!result.ok) setNote("Not allowed");
          setMode("view");
        }} />
      ) : null}
      <EmployeeRecord person={person} manager={manager} />
    </div>
  );
}

export function AddPerson({ embedded = false, onDone }: { embedded?: boolean; onDone?: () => void }) {
  const demo = useDemo();
  const { href } = useFrame();
  const router = useRouter();
  const workspace = repo.workspace(demo.workspaceId);
  const roster = demo.people[demo.workspaceId] ?? [];
  const templates = onboardTemplates(workspace.directory, workspace.pims, workspace.directory === "google" ? 22 : 26, workspace.directory === "google" ? 70 : 80);
  const catalog = licenseCatalog(workspace.directory, workspace.pims);
  const locations = repo.locations(demo.workspaceId).map((location) => location.name);
  const checks = ["Mailbox", workspace.pims, "MFA", "Project group", "Device"];
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "pm");
  const [name, setName] = useState("");
  const [location, setLocation] = useState(locations[0] ?? "Main office");
  const [managerId, setManagerId] = useState(workspace.leaderId);
  const [startDate, setStartDate] = useState("2026-11-02");
  const [licenseName, setLicenseName] = useState(catalog[0]?.name ?? "");
  const [step, setStep] = useState<"form" | "confirm" | "code">("form");
  const [done, setDone] = useState(checks);
  usePageContext({ section: "people", title: "Onboard user", hints: ["Onboard user"] });
  if (demo.role !== "leadership") return null;

  function review(event: FormEvent) {
    event.preventDefault();
    if (name.trim().length < 3) return;
    setStep("confirm");
  }

  const template = templates.find((item) => item.id === templateId) ?? templates[0];

  return (
    <div className={embedded ? "space-y-4" : "mx-auto max-w-xl space-y-4"}>
      {embedded ? null : <h1 className="text-2xl font-semibold tracking-tight">Onboard user</h1>}
      {step === "form" ? (
        <form onSubmit={review} className="space-y-3">
          <label className="block text-sm font-semibold">Name<input className={fieldClass + " mt-1"} value={name} onChange={(event) => setName(event.target.value)} required minLength={3} /></label>
          <label className="block text-sm font-semibold">Title
            <select className={fieldClass + " mt-1"} value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
              {templates.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold">Manager
            <select className={fieldClass + " mt-1"} value={managerId} onChange={(event) => setManagerId(event.target.value)}>
              {roster.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold">Start date<input className={fieldClass + " mt-1"} type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
          <label className="block text-sm font-semibold">License
            <select className={fieldClass + " mt-1"} value={licenseName} onChange={(event) => setLicenseName(event.target.value)}>
              {catalog.map((item) => <option key={item.name}>{item.name}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold">Location
            <select className={fieldClass + " mt-1"} value={location} onChange={(event) => setLocation(event.target.value)}>
              {locations.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <button type="submit" className={primaryClass}>Continue</button>
        </form>
      ) : null}
      {step === "confirm" && template ? (
        <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); setStep("code"); }}>
          <p className="font-semibold">{name}</p>
          <p className="text-sm">{template.label} · {location}</p>
          <ul className="space-y-1 text-sm">
            {checks.map((item) => (
              <li key={item}>
                <label className="flex gap-2">
                  <input type="checkbox" checked={done.includes(item)} onChange={() => setDone(done.includes(item) ? done.filter((entry) => entry !== item) : [...done, item])} />
                  {item}
                </label>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <button type="submit" className={primaryClass}>Add</button>
            <button type="button" className={quietClass} onClick={() => setStep("form")}>Back</button>
          </div>
        </form>
      ) : null}
      {step === "code" ? (
        <StepUp title="Confirm" onCancel={() => setStep("confirm")} onConfirm={() => {
          const result = onboardPerson({ name, templateId, location, managerId, startDate, licenseName }, true);
          if (!result.ok) {
            setStep("form");
            return;
          }
          if (onDone) onDone();
          else router.push(href("/app/people"));
        }} />
      ) : null}
    </div>
  );
}
