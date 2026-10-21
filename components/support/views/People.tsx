"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { getSupportRepository } from "@/lib/support/data";
import { licenseCatalog, onboardTemplates } from "@/lib/support/identity";
import type { Department, Person, PersonStatus } from "@/lib/support/types";
import { StepUp } from "../StepUp";
import { usePageContext } from "../page-context";
import { freezePerson, offboardPerson, onboardPerson, updatePerson } from "../store";
import { useFrame } from "../frame";
import { useDemo } from "../use-demo";
import { Avatar, Badge, dangerClass, fieldClass, primaryClass, quietClass, statusTone } from "../ui";

const repo = getSupportRepository(null);
const checks = ["Mailbox", "Practice system", "MFA", "Clinic group", "Device"];

function displayStatus(person: Person): PersonStatus | "Frozen" {
  if (person.status === "Offboarding") return "Offboarding";
  if (person.frozen) return "Frozen";
  return person.status;
}

function Confirm({ title, blocked, onCancel, onConfirm }: { title: string; blocked: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
        <p className="text-lg font-semibold">{title}</p>
        {blocked ? <p className="mt-2 text-sm">Not allowed</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className={quietClass} onClick={onCancel}>Cancel</button>
          <button type="button" className={dangerClass} onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

function PersonActions({ person, onEdit, onOffboard, onFreeze }: { person: Person; onEdit: () => void; onOffboard: () => void; onFreeze: () => void }) {
  return (
    <span className="flex flex-wrap justify-end gap-2">
      <button type="button" className={quietClass} onClick={onEdit}>Edit user</button>
      <button type="button" className={dangerClass} onClick={onOffboard}>Offboard user</button>
      {person.frozen ? (
        <button type="button" className={quietClass} onClick={() => freezePerson(person.id, false)}>Unfreeze</button>
      ) : (
        <button type="button" className={dangerClass} onClick={onFreeze}>Freeze account</button>
      )}
    </span>
  );
}

export function PeopleDirectory() {
  const demo = useDemo();
  const params = useSearchParams();
  const { href } = useFrame();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<{ kind: "freeze" | "offboard"; id: string } | null>(null);
  const [blocked, setBlocked] = useState(false);
  const flag = params.get("flag") === "mfa";
  const tickets = demo.tickets[demo.workspaceId] ?? [];
  const roster = demo.people[demo.workspaceId] ?? [];
  const people = roster.filter((person) => {
    const matches = `${person.name} ${person.role} ${person.location}`.toLowerCase().includes(query.toLowerCase());
    return matches && (!flag || (person.status === "Active" && !person.mfa));
  });
  const target = roster.find((person) => person.id === pending?.id);
  usePageContext({ section: "people", title: "People", hints: ["Onboard user", "Freeze account"] });
  if (demo.role !== "leadership") return null;

  function confirm() {
    if (!pending) return;
    const result = pending.kind === "freeze" ? freezePerson(pending.id, true) : offboardPerson(pending.id, true);
    if (!result.ok) {
      setBlocked(true);
      return;
    }
    setPending(null);
    setBlocked(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">People</h1>
        <Link href={href("/app/people/add")} className={primaryClass}>Onboard user</Link>
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
              <th className="px-3 py-3">Clinic</th>
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
                    <PersonActions
                      person={person}
                      onEdit={() => router.push(href(`/app/people/${person.id}?edit=1`))}
                      onOffboard={() => { setBlocked(false); setPending({ kind: "offboard", id: person.id }); }}
                      onFreeze={() => { setBlocked(false); setPending({ kind: "freeze", id: person.id }); }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {people.length === 0 ? <p className="px-4 py-6 text-sm">None</p> : null}
      </div>
      {pending && target ? (
        <Confirm
          title={pending.kind === "freeze" ? `Freeze ${target.name}?` : `Offboard ${target.name}?`}
          blocked={blocked}
          onCancel={() => { setPending(null); setBlocked(false); }}
          onConfirm={confirm}
        />
      ) : null}
    </div>
  );
}

export function PersonProfile({ id }: { id: string }) {
  const demo = useDemo();
  const params = useSearchParams();
  const roster = demo.people[demo.workspaceId] ?? [];
  const person = roster.find((item) => item.id === id);
  const [mode, setMode] = useState<"view" | "edit" | "confirm">(params.get("edit") === "1" ? "edit" : "view");
  const [pending, setPending] = useState<"freeze" | "offboard" | null>(params.get("remove") === "1" ? "offboard" : null);
  const [blocked, setBlocked] = useState(false);
  const [role, setRole] = useState(person?.role ?? "");
  const [department, setDepartment] = useState<Department>(person?.department ?? "Clinical");
  const [managerId, setManagerId] = useState(person?.managerId ?? "");
  const [details, setDetails] = useState(false);
  const [note, setNote] = useState("");
  usePageContext({ section: "person", title: person?.name ?? "Person", subject: person?.name, hints: ["Edit user", "Freeze account"] });
  if (!person || demo.role !== "leadership") return null;
  const status = displayStatus(person);

  function confirmPending() {
    if (!pending) return;
    const result = pending === "freeze" ? freezePerson(person!.id, true) : offboardPerson(person!.id, true);
    if (!result.ok) {
      setBlocked(true);
      return;
    }
    setPending(null);
    setBlocked(false);
  }

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
        <PersonActions
          person={person}
          onEdit={() => setMode("edit")}
          onOffboard={() => { setBlocked(false); setPending("offboard"); }}
          onFreeze={() => { setBlocked(false); setPending("freeze"); }}
        />
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
              {(["Leadership", "Clinical", "Client care", "Operations", "Finance"] as const).map((item) => <option key={item}>{item}</option>)}
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
      <button type="button" className={quietClass} onClick={() => setDetails((value) => !value)}>Details</button>
      {details ? (
        <ul className="space-y-1 text-sm">
          {person.devices.map((device) => (
            <li key={device.id}>{device.name} · {device.threatdown === "Protected" ? "Protected" : "Needs attention"}</li>
          ))}
          <li>{person.mfa ? "Code on" : "Code off"}</li>
        </ul>
      ) : null}
      {pending ? (
        <Confirm
          title={pending === "freeze" ? `Freeze ${person.name}?` : `Offboard ${person.name}?`}
          blocked={blocked}
          onCancel={() => { setPending(null); setBlocked(false); }}
          onConfirm={confirmPending}
        />
      ) : null}
    </div>
  );
}

export function AddPerson() {
  const demo = useDemo();
  const { href } = useFrame();
  const router = useRouter();
  const workspace = repo.workspace(demo.workspaceId);
  const roster = demo.people[demo.workspaceId] ?? [];
  const templates = onboardTemplates(workspace.directory, workspace.pims, workspace.directory === "google" ? 22 : 26, workspace.directory === "google" ? 70 : 80);
  const catalog = licenseCatalog(workspace.directory, workspace.pims);
  const clinics = repo.locations(demo.workspaceId).map((location) => location.name);
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "tech");
  const [name, setName] = useState("");
  const [location, setLocation] = useState(clinics[0] ?? "Asheville");
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
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Onboard user</h1>
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
          <label className="block text-sm font-semibold">Clinic
            <select className={fieldClass + " mt-1"} value={location} onChange={(event) => setLocation(event.target.value)}>
              {clinics.map((item) => <option key={item}>{item}</option>)}
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
          if (result.ok) router.push(href("/app/people"));
          else setStep("form");
        }} />
      ) : null}
    </div>
  );
}
