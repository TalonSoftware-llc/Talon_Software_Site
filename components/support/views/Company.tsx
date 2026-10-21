"use client";

import Link from "next/link";
import { useState } from "react";
import { getSupportRepository } from "@/lib/support/data";
import { networkDevices } from "@/lib/support/data/mock";
import { formatDay, money } from "@/lib/support/format";
import { useFrame } from "../frame";
import { usePageContext } from "../page-context";
import { useDemo } from "../use-demo";
import { Badge, Card, PageHeader, fieldClass, statusTone } from "../ui";

const repo = getSupportRepository(null);
const tabs = [
  ["", "Summary"],
  ["/devices", "Devices"],
  ["/software", "Software"],
  ["/vendors", "Vendors"],
  ["/locations", "Locations"],
  ["/documents", "Documents"],
] as const;

export function CompanyView({ section }: { section: "" | "devices" | "software" | "vendors" | "locations" | "documents" }) {
  const demo = useDemo();
  const { href } = useFrame();
  const workspace = repo.workspace(demo.workspaceId);
  const people = demo.people[demo.workspaceId] ?? [];
  const leadership = demo.role === "leadership";
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  usePageContext({ section: "company", title: "Company", hints: ["Which contract renews next?", "Which devices are due?", "Where are the clinics?"] });
  const devices = [
    ...people.flatMap((person) => person.devices.map((device) => ({ ...device, assignee: person.name, assigneeId: person.id, location: person.location }))),
    ...networkDevices(demo.workspaceId).map((device) => ({ ...device, assignee: "Clinic", assigneeId: "", location: device.location })),
  ].filter((device) => `${device.name} ${device.assignee} ${device.location}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="space-y-4">
      <PageHeader title={workspace.name} detail={workspace.blurb} />
      <div className="flex flex-wrap gap-2 text-sm">
        {tabs.map(([path, label]) => {
          const current = (section === "" && path === "") || path === `/${section}`;
          return <Link key={label} href={href(`/app/company${path}`)} className={`rounded-full px-3 py-1 ${current ? "bg-ink text-white" : "border border-[#d5dde6] bg-white"}`}>{label}</Link>;
        })}
      </div>
      {section === "" ? (
        <div className="grid gap-3 md:grid-cols-4">
          <Card><p className="text-xs uppercase tracking-wide text-ink/40">People</p><p className="mt-1 text-2xl font-semibold">{people.length}</p></Card>
          <Card><p className="text-xs uppercase tracking-wide text-ink/40">Clinics</p><p className="mt-1 text-2xl font-semibold">{repo.locations(demo.workspaceId).length}</p></Card>
          <Card><p className="text-xs uppercase tracking-wide text-ink/40">Devices</p><p className="mt-1 text-2xl font-semibold">{devices.length}</p></Card>
          <Card><p className="text-xs uppercase tracking-wide text-ink/40">Plan</p><p className="mt-1 text-2xl font-semibold">{workspace.plan}</p></Card>
        </div>
      ) : null}
      {section === "devices" ? (
        <div className="space-y-3">
          <input className={fieldClass + " max-w-sm"} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search devices" aria-label="Search devices" />
          <div className="overflow-x-auto rounded-xl border border-[#e1e6ec] bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-ink/45"><tr><th className="px-3 py-2">Device</th><th className="px-3 py-2">Person</th><th className="px-3 py-2">Joined as</th><th className="px-3 py-2">ThreatDown</th><th className="px-3 py-2">Refresh</th></tr></thead>
              <tbody>
                {devices.map((device) => (
                  <tr key={device.id} className="border-t border-[#f3f5f7]">
                    <td className="px-3 py-2">{device.name}</td>
                    <td className="px-3 py-2">{device.assigneeId ? <Link href={href(`/app/people/${device.assigneeId}`)} className="text-pine underline">{device.assignee}</Link> : device.assignee}</td>
                    <td className="px-3 py-2">{device.type === "Network" ? device.location : `${device.join} · ${device.primaryUser}`}</td>
                    <td className="px-3 py-2">{device.type === "Network" ? "—" : <Badge tone={statusTone(device.threatdown)}>{device.threatdown}</Badge>}</td>
                    <td className="px-3 py-2">{device.refreshDue < "2026-10-21" ? <Badge tone="warn">{device.refreshDue}</Badge> : device.refreshDue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
      {section === "software" ? (
        <div className="space-y-2">
          {repo.software(demo.workspaceId).map((item) => (
            <button key={item.name} type="button" className="block w-full rounded-xl border border-[#e1e6ec] bg-white p-4 text-left" onClick={() => setSelected(selected === item.name ? null : item.name)}>
              <div className="flex justify-between gap-3"><span className="font-semibold">{item.name}</span>{leadership ? <span>{money(item.monthly)} / mo</span> : null}</div>
              <p className="text-sm text-ink/60">{item.seats} · renews {formatDay(item.renewal)}</p>
              {selected === item.name ? <p className="mt-2 text-sm">{item.note}</p> : null}
            </button>
          ))}
        </div>
      ) : null}
      {section === "vendors" ? (
        <div className="space-y-2">
          {repo.vendors(demo.workspaceId).map((vendor) => (
            <button key={vendor.name + vendor.category} type="button" className="block w-full rounded-xl border border-[#e1e6ec] bg-white p-4 text-left" onClick={() => setSelected(selected === vendor.name ? null : vendor.name)}>
              <div className="flex justify-between"><span className="font-semibold">{vendor.name}</span><span className="text-sm text-ink/50">{vendor.category}</span></div>
              {selected === vendor.name ? <p className="mt-2 text-sm">{vendor.note} Contact {vendor.contact}.</p> : null}
            </button>
          ))}
        </div>
      ) : null}
      {section === "locations" ? (
        <div className="grid gap-3 md:grid-cols-3">
          {repo.locations(demo.workspaceId).map((location) => {
            const count = people.filter((person) => person.location === location.name).length;
            return (
              <Card key={location.id}>
                <h2 className="font-semibold">{location.name}</h2>
                <p className="text-sm text-ink/70">{location.address}</p>
                <p className="text-sm text-ink/70">{location.hours} · {count} people</p>
                <ul className="mt-2 text-sm">{location.circuits.map((circuit) => <li key={circuit.name}>{circuit.name}: {circuit.detail}</li>)}</ul>
                <p className="mt-2 text-sm">{location.note}</p>
              </Card>
            );
          })}
        </div>
      ) : null}
      {section === "documents" ? (
        <div className="grid gap-3 lg:grid-cols-[16rem,1fr]">
          <div className="space-y-2">
            {repo.documents(demo.workspaceId).map((document) => (
              <button key={document.id} type="button" className={`block w-full rounded-md border px-3 py-2 text-left text-sm ${selected === document.id ? "border-pine bg-white" : "border-[#e1e6ec] bg-white"}`} onClick={() => setSelected(document.id)}>{document.title}</button>
            ))}
          </div>
          <Card>
            {(() => {
              const document = repo.documents(demo.workspaceId).find((item) => item.id === (selected ?? repo.documents(demo.workspaceId)[0]?.id));
              if (!document) return null;
              return (
                <div>
                  <h2 className="font-semibold">{document.title}</h2>
                  <p className="text-xs text-ink/50">Updated {formatDay(document.updated)} · {document.owner}</p>
                  {document.body.map((paragraph) => <p key={paragraph} className="mt-2 text-sm leading-6">{paragraph}</p>)}
                </div>
              );
            })()}
          </Card>
        </div>
      ) : null}
    </div>
  );
}
