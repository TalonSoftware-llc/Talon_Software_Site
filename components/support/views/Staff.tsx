"use client";

import { useState } from "react";
import { getSupportRepository } from "@/lib/support/data";
import { usePageContext } from "../page-context";
import { setAssistantOpen } from "../store";
import { useDemo } from "../use-demo";
import { primaryClass, quietClass } from "../ui";

const repo = getSupportRepository(null);

export function GetHelp() {
  usePageContext({ section: "help", title: "Get help", hints: ["Reset password", "New request"] });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Get help</h1>
      <button type="button" className={primaryClass} onClick={() => setAssistantOpen(true)}>Ask</button>
    </div>
  );
}

export function ResetPassword() {
  const [done, setDone] = useState("");
  usePageContext({ section: "help", title: "Reset password", hints: ["Reset password"] });
  return (
    <div className="mx-auto max-w-md space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
      <div className="flex gap-2">
        <button type="button" className={primaryClass} onClick={() => setDone("Password")}>Password</button>
        <button type="button" className={quietClass} onClick={() => setDone("New phone")}>New phone</button>
      </div>
      {done ? <p className="text-sm">Done</p> : null}
    </div>
  );
}

export function MyDevices() {
  const demo = useDemo();
  const workspace = repo.workspace(demo.workspaceId);
  const person = (demo.people[demo.workspaceId] ?? []).find((item) => item.id === workspace.staffId);
  usePageContext({ section: "devices", title: "My devices", hints: ["Where is my device?"] });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">My devices</h1>
      <ul className="divide-y divide-[#eef2f5] rounded-xl border border-[#e1e6ec] bg-white">
        {(person?.devices ?? []).map((device) => (
          <li key={device.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span>{device.name}</span>
            <span>{device.threatdown === "Protected" ? "Protected" : "Needs attention"}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
