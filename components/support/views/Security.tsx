"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { StepUp } from "../StepUp";
import { useFrame } from "../frame";
import { usePageContext } from "../page-context";
import { sendCompromiseAlert } from "../store";
import { useDemo } from "../use-demo";
import { cardClass, fieldClass, primaryClass, quietClass } from "../ui";

function posture(people: { status: string; mfa: boolean; devices: { id: string; name: string; threatdown: string }[]; name: string }[]) {
  const devices = people.flatMap((person) => person.devices.filter((device) => device.threatdown !== "Protected").map((device) => ({ ...device, person: person.name })));
  const missing = people.filter((person) => person.status === "Active" && !person.mfa).length;
  return { count: missing + devices.length, devices };
}

export function SecurityHome() {
  const demo = useDemo();
  const { href } = useFrame();
  const [open, setOpen] = useState(false);
  const people = demo.people[demo.workspaceId] ?? [];
  const { count, devices } = posture(people);
  const missing = people.filter((person) => person.status === "Active" && !person.mfa).length;
  const allDevices = people.flatMap((person) => person.devices);
  const protectedCount = allDevices.filter((device) => device.threatdown === "Protected").length;
  const ratio = allDevices.length ? protectedCount / allDevices.length : 1;
  const ring = 2 * Math.PI * 42;
  usePageContext({ section: "security", title: "Security", hints: ["Am I safe?", "Lock an account"] });
  if (demo.role !== "leadership") return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Security</h1>
        <Link href={href("/app/security/lock")} className={primaryClass}>Lock account & alert company</Link>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
        <section className={cardClass}>
          <div className="flex items-center gap-3">
            <span className={`h-3 w-3 rounded-full ${count ? "bg-[#c4a574]" : "bg-[#1f4d45]"}`} />
            <p className="text-2xl font-semibold">{count ? "Needs attention" : "Protected"}</p>
          </div>
          <ul className="mt-4 divide-y divide-[#eef2f5]">
            {missing ? (
              <li className="flex items-center justify-between gap-3 py-3 text-sm">
                <span>{missing} people without MFA</span>
                <Link href={href("/app/people?flag=mfa")} className={primaryClass}>Require MFA</Link>
              </li>
            ) : null}
            {devices.length ? (
              <li className="flex items-center justify-between gap-3 py-3 text-sm">
                <span>{devices.length} devices need attention</span>
                <button type="button" className={quietClass} onClick={() => setOpen(true)}>Update devices</button>
              </li>
            ) : null}
            {!count ? <li className="py-3 text-sm">Protected</li> : null}
          </ul>
        </section>
        <section className={`${cardClass} flex flex-col items-center justify-center`}>
          <svg viewBox="0 0 120 120" className="h-36 w-36" role="img" aria-label={`${protectedCount} of ${allDevices.length} protected`}>
            <circle cx="60" cy="60" r="42" fill="none" stroke="#e6ebf0" strokeWidth="10" />
            <circle cx="60" cy="60" r="42" fill="none" stroke="#1f4d45" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${ring * ratio} ${ring}`} transform="rotate(-90 60 60)" />
            <text x="60" y="58" textAnchor="middle" className="fill-ink" fontSize="16" fontWeight="700">{protectedCount}/{allDevices.length}</text>
            <text x="60" y="76" textAnchor="middle" className="fill-ink" fontSize="9" fill="#5c6b7a">Protected</text>
          </svg>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Protected devices</p>
        </section>
      </div>
      <button type="button" className={quietClass} onClick={() => setOpen((value) => !value)}>Details</button>
      {open ? (
        <ul className={`${cardClass} space-y-2 text-sm`}>
          {devices.map((device) => <li key={device.id}>{device.person} · {device.name}</li>)}
          {devices.length === 0 ? <li>None</li> : null}
        </ul>
      ) : null}
    </div>
  );
}

export function LockAccount() {
  const demo = useDemo();
  const params = useSearchParams();
  const { href } = useFrame();
  const router = useRouter();
  const people = demo.people[demo.workspaceId] ?? [];
  const initial = params.get("person") ?? people.find((person) => !person.privileged)?.id ?? people[0]?.id ?? "";
  const [personId, setPersonId] = useState(initial);
  const [lock, setLock] = useState(true);
  const [step, setStep] = useState<"pick" | "code" | "sent">("pick");
  const notice = (demo.alerts[demo.workspaceId] ?? [])[0];
  usePageContext({ section: "security", title: "Lock account", hints: ["Lock an account"] });
  if (demo.role !== "leadership") return null;

  function preview(event: FormEvent) {
    event.preventDefault();
    setStep("code");
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Lock account</h1>
      {step === "pick" ? (
        <form onSubmit={preview} className="space-y-3">
          <label className="block text-sm font-semibold">Person
            <select className={fieldClass + " mt-1"} value={personId} onChange={(event) => setPersonId(event.target.value)}>
              {people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={lock} onChange={(event) => setLock(event.target.checked)} />
            Lock account
          </label>
          <div className="flex gap-2">
            <button type="submit" className={primaryClass}>Send</button>
            <Link href={href("/app/security")} className={quietClass}>Back</Link>
          </div>
        </form>
      ) : null}
      {step === "code" ? (
        <StepUp title="Confirm" onCancel={() => setStep("pick")} onConfirm={() => {
          const result = sendCompromiseAlert(personId, lock);
          if (result.ok) setStep("sent");
        }} />
      ) : null}
      {step === "sent" ? (
        <div className="rounded-xl border border-[#e1e6ec] bg-white p-4">
          <p className="text-2xl font-semibold">{notice?.status ?? "Queued"}</p>
          <p className="mt-1 text-sm tabular-nums">{notice?.status === "Delivered" ? notice.deliveredTo : ""}</p>
          <button type="button" className={`${quietClass} mt-3`} onClick={() => router.push(href("/app/security"))}>Back</button>
        </div>
      ) : null}
    </div>
  );
}
