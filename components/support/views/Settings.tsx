"use client";

import { getSupportRepository } from "@/lib/support/data";
import { usePageContext } from "../page-context";
import { resetDemo, setApprovalRequired, setPrefs, setWorkspace } from "../store";
import { useDemo } from "../use-demo";
import { fieldClass, quietClass } from "../ui";

const repo = getSupportRepository(null);

export function SettingsView() {
  const demo = useDemo();
  const workspace = repo.workspace(demo.workspaceId);
  const people = demo.people[demo.workspaceId] ?? [];
  const person = people.find((item) => item.id === (demo.role === "staff" ? workspace.staffId : workspace.leaderId));
  const prefs = demo.prefs;
  usePageContext({ section: "settings", title: "Settings", hints: ["Who is told about an outage?"] });

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <label className="block text-sm font-semibold">Workspace
        <select className={fieldClass + " mt-1"} value={demo.workspaceId} onChange={(event) => setWorkspace(event.target.value)}>
          {repo.workspaces().map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>
      <p className="text-sm">{person?.name}</p>
      <p className="text-sm">{workspace.directory === "entra" ? "Microsoft" : "Google"}</p>
      <fieldset className="space-y-2 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={prefs.tickets} onChange={(event) => setPrefs({ ...prefs, tickets: event.target.checked })} /> New requests</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={prefs.uptime} onChange={(event) => setPrefs({ ...prefs, uptime: event.target.checked })} /> Uptime</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={prefs.renewals} onChange={(event) => setPrefs({ ...prefs, renewals: event.target.checked })} /> Renewals</label>
      </fieldset>
      {demo.role === "leadership" ? (
        <>
          <label className="block text-sm font-semibold">Outage recipients
            <select className={fieldClass + " mt-1"} value={prefs.outageRecipients} onChange={(event) => setPrefs({ ...prefs, outageRecipients: event.target.value as typeof prefs.outageRecipients })}>
              <option>Leadership</option>
              <option>Project leads</option>
              <option>Everyone</option>
            </select>
          </label>
          <fieldset className="space-y-2 text-sm">
            <legend className="text-sm font-semibold">Internet</legend>
            <label className="flex items-center gap-2"><input type="checkbox" checked={prefs.internetAlerts.sms} onChange={(event) => setPrefs({ ...prefs, internetAlerts: { ...prefs.internetAlerts, sms: event.target.checked } })} /> SMS</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={prefs.internetAlerts.email} onChange={(event) => setPrefs({ ...prefs, internetAlerts: { ...prefs.internetAlerts, email: event.target.checked } })} /> Email</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={prefs.internetAlerts.push} onChange={(event) => setPrefs({ ...prefs, internetAlerts: { ...prefs.internetAlerts, push: event.target.checked } })} /> Push</label>
          </fieldset>
          <fieldset className="space-y-2 text-sm">
            <legend className="text-sm font-semibold">Site</legend>
            <label className="flex items-center gap-2"><input type="checkbox" checked={prefs.siteAlerts.sms} onChange={(event) => setPrefs({ ...prefs, siteAlerts: { ...prefs.siteAlerts, sms: event.target.checked } })} /> SMS</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={prefs.siteAlerts.email} onChange={(event) => setPrefs({ ...prefs, siteAlerts: { ...prefs.siteAlerts, email: event.target.checked } })} /> Email</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={prefs.siteAlerts.push} onChange={(event) => setPrefs({ ...prefs, siteAlerts: { ...prefs.siteAlerts, push: event.target.checked } })} /> Push</label>
          </fieldset>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={demo.approvalRequired} onChange={(event) => setApprovalRequired(event.target.checked)} />
            Ask Talon first
          </label>
        </>
      ) : null}
      <button type="button" className={quietClass} onClick={() => resetDemo()}>Reset</button>
    </div>
  );
}
