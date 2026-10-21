"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { getSupportRepository } from "@/lib/support/data";
import { onboardTemplates } from "@/lib/support/identity";
import type { Department } from "@/lib/support/types";
import { StepUp } from "../StepUp";
import { usePageContext } from "../page-context";
import { offboardPerson, onboardPerson, updatePerson } from "../store";
import { useFrame } from "../frame";
import { useDemo } from "../use-demo";
import { fieldClass, primaryClass, quietClass } from "../ui";

const repo = getSupportRepository(null);
const checks = ["Mailbox", "Practice system", "MFA", "Clinic group", "Device"];

export function PeopleDirectory() {
  const demo = useDemo();
  const params = useSearchParams();
  const { href } = useFrame();
  const [query, setQuery] = useState("");
  const flag = params.get("flag") === "mfa";
  const people = (demo.people[demo.workspaceId] ?? []).filter((person) => {
    const matches = `${person.name} ${person.role} ${person.location}`.toLowerCase().includes(query.toLowerCase());
    return matches && (!flag || (person.status === "Active" && !person.mfa));
  });
  usePageContext({ section: "people", title: "People", hints: ["Add a person", "Who needs attention?"] });
  if (demo.role !== "leadership") return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">People</h1>
        <Link href={href("/app/people/add")} className={primaryClass}>Add person</Link>
      </div>
      <div className="flex flex-wrap gap-2">
        <input className={fieldClass + " max-w-xs"} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" aria-label="Search" />
        {flag ? <Link href={href("/app/people")} className={quietClass}>All</Link> : null}
      </div>
      <div className="overflow-x-auto rounded-xl border border-[#e1e6ec] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-[0.12em] text-ink/45">
            <tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Role</th><th className="px-3 py-2">Clinic</th></tr>
          </thead>
          <tbody>
            {people.map((person) => (
              <tr key={person.id} className="border-t border-[#f3f5f7]">
                <td className="px-3 py-2"><Link href={href(`/app/people/${person.id}`)} className="font-semibold text-pine underline">{person.name}</Link></td>
                <td className="px-3 py-2">{person.role}</td>
                <td className="px-3 py-2">{person.location}{person.status === "Active" ? "" : ` · ${person.status}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {people.length === 0 ? <p className="px-3 py-6 text-sm">None</p> : null}
      </div>
    </div>
  );
}

export function PersonProfile({ id }: { id: string }) {
  const demo = useDemo();
  const { href } = useFrame();
  const router = useRouter();
  const person = (demo.people[demo.workspaceId] ?? []).find((item) => item.id === id);
  const [mode, setMode] = useState<"view" | "edit" | "remove" | "confirm">("view");
  const [role, setRole] = useState(person?.role ?? "");
  const [department, setDepartment] = useState<Department>(person?.department ?? "Clinical");
  const [details, setDetails] = useState(false);
  const [note, setNote] = useState("");
  usePageContext({ section: "person", title: person?.name ?? "Person", subject: person?.name, hints: ["Remove this person", "Edit this person"] });
  if (!person || demo.role !== "leadership") return null;

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{person.name}</h1>
        <span className="flex gap-2">
          <button type="button" className={primaryClass} onClick={() => setMode("edit")}>Edit</button>
          <button type="button" className={quietClass} onClick={() => setMode("remove")}>Remove</button>
        </span>
      </div>
      <p className="text-sm">{person.role} · {person.location}</p>
      <p className="text-sm">{person.email}</p>
      {note ? <p className="text-sm">Not allowed</p> : null}
      {mode === "edit" ? (
        <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); setMode("confirm"); }}>
          <label className="block text-sm font-semibold">Role<input className={fieldClass + " mt-1"} value={role} onChange={(event) => setRole(event.target.value)} /></label>
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
          const result = updatePerson(person.id, { role, department }, true);
          if (!result.ok) setNote("Not allowed");
          setMode("view");
        }} />
      ) : null}
      {mode === "remove" ? (
        <StepUp title={`Remove ${person.name}`} onCancel={() => setMode("view")} onConfirm={() => {
          const result = offboardPerson(person.id, true);
          if (!result.ok) {
            setNote("Not allowed");
            setMode("view");
            return;
          }
          router.push(href("/app/people"));
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
    </div>
  );
}

export function AddPerson() {
  const demo = useDemo();
  const { href } = useFrame();
  const router = useRouter();
  const workspace = repo.workspace(demo.workspaceId);
  const templates = onboardTemplates(workspace.directory, workspace.pims, workspace.directory === "google" ? 22 : 26, workspace.directory === "google" ? 70 : 80);
  const clinics = repo.locations(demo.workspaceId).map((location) => location.name);
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "tech");
  const [name, setName] = useState("");
  const [location, setLocation] = useState(clinics[0] ?? "Asheville");
  const [step, setStep] = useState<"form" | "confirm" | "code">("form");
  const [done, setDone] = useState(checks);
  usePageContext({ section: "people", title: "Add person", hints: ["Add a person"] });
  if (demo.role !== "leadership") return null;

  function review(event: FormEvent) {
    event.preventDefault();
    if (name.trim().length < 3) return;
    setStep("confirm");
  }

  const template = templates.find((item) => item.id === templateId) ?? templates[0];

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Add person</h1>
      {step === "form" ? (
        <form onSubmit={review} className="space-y-3">
          <label className="block text-sm font-semibold">Name<input className={fieldClass + " mt-1"} value={name} onChange={(event) => setName(event.target.value)} required minLength={3} /></label>
          <label className="block text-sm font-semibold">Role
            <select className={fieldClass + " mt-1"} value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
              {templates.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
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
          const result = onboardPerson({ name, templateId, location, managerId: workspace.leaderId, startDate: "2026-11-02" }, true);
          if (result.ok) router.push(href("/app/people"));
          else setStep("form");
        }} />
      ) : null}
    </div>
  );
}
