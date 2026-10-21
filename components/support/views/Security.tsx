"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { getSupportRepository } from "@/lib/support/data";
import { StepUp } from "../StepUp";
import { useFrame } from "../frame";
import { usePageContext } from "../page-context";
import { sendCompromiseAlert } from "../store";
import { useDemo } from "../use-demo";
import { fieldClass, primaryClass, quietClass } from "../ui";

const repo = getSupportRepository(null);

function posture(workspaceId: string, people: { status: string; mfa: boolean; devices: { id: string; name: string; threatdown: string }[]; name: string }[], serviceUp: boolean) {
  const services = repo.executive(workspaceId, "30d").services.map((service) =>
    service.id === "aviary" && serviceUp ? { ...service, status: "Operational" as const } : service,
  );
  const down = services.filter((service) => service.status !== "Operational").length;
  const devices = people.flatMap((person) => person.devices.filter((device) => device.threatdown !== "Protected").map((device) => ({ ...device, person: person.name })));
  const missing = people.filter((person) => person.status === "Active" && !person.mfa).length;
  return { count: missing + devices.length + down, devices };
}

export function SecurityHome() {
  const demo = useDemo();
  const { href } = useFrame();
  const [open, setOpen] = useState(false);
  const people = demo.people[demo.workspaceId] ?? [];
  const { count, devices } = posture(demo.workspaceId, people, demo.serviceUp);
  usePageContext({ section: "security", title: "Security", hints: ["Am I safe?", "Lock an account"] });
  if (demo.role !== "leadership") return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Security</h1>
        <Link href={href("/app/security/lock")} className={primaryClass}>Lock account & alert company</Link>
      </div>
      <div className="rounded-xl border border-[#e1e6ec] bg-white p-4 shadow-sm">
        <p className="text-3xl font-semibold">{count ? "Needs attention" : "Protected"}</p>
        <p className="mt-1 text-sm tabular-nums">{count} to review</p>
      </div>
      <button type="button" className={quietClass} onClick={() => setOpen((value) => !value)}>Details</button>
      {open ? (
        <ul className="space-y-1 text-sm">
          {devices.map((device) => <li key={device.id}>{device.person} · {device.name} · Needs attention</li>)}
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
