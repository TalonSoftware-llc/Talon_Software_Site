"use client";

import Link from "next/link";
import { useState } from "react";
import { getSupportRepository } from "@/lib/support/data";
import { formatDay, money } from "@/lib/support/format";
import { useFrame } from "../frame";
import { usePageContext } from "../page-context";
import { useDemo } from "../use-demo";
import { Badge, cardClass, statusTone } from "../ui";

const repo = getSupportRepository(null);

export function ProjectsList() {
  const demo = useDemo();
  const { href } = useFrame();
  const projects = repo.projects(demo.workspaceId);
  usePageContext({ section: "projects", title: "Projects", hints: ["How is the Procore integration going?"] });
  if (demo.role !== "leadership") return null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
      <ul className="space-y-3">
        {projects.map((project) => (
          <li key={project.id}>
            <Link href={href(`/app/projects/${project.id}`)} className={`${cardClass} block`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold">{project.name}</h2>
                <Badge tone={statusTone(project.status)}>{project.status}</Badge>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-[#d5dde6]" role="progressbar" aria-valuenow={project.progress} aria-valuemin={0} aria-valuemax={100} aria-label={project.name}>
                  <div className="h-full rounded-full bg-pine" style={{ width: `${project.progress}%` }} />
                </div>
                <span className="w-12 text-right text-base font-semibold tabular-nums">{project.progress}%</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                <span>{formatDay(project.target)}</span>
                <span className="tabular-nums">{money(project.spent)} / {money(project.budget)}</span>
              </div>
              <p className="mt-2 text-sm">{project.summary}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ProjectDetail({ id }: { id: string }) {
  const demo = useDemo();
  const project = repo.projects(demo.workspaceId).find((item) => item.id === id);
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  usePageContext({
    section: "project",
    title: project?.name ?? "Project",
    subject: project?.name,
    hints: ["What is next?", "What changed?"],
  });
  if (demo.role !== "leadership" || !project) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
        <Badge tone={statusTone(project.status)}>{project.status}</Badge>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-[#d5dde6]" role="progressbar" aria-valuenow={project.progress} aria-valuemin={0} aria-valuemax={100}>
          <div className="h-full rounded-full bg-pine" style={{ width: `${project.progress}%` }} />
        </div>
        <span className="text-base font-semibold tabular-nums">{project.progress}%</span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span>{formatDay(project.target)}</span>
        <span className="tabular-nums">{money(project.spent)} / {money(project.budget)}</span>
      </div>
      <p className="text-sm">{project.summary}</p>
      <section className={cardClass}>
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Milestones</h2>
        <ul className="mt-3 space-y-2">
          {project.milestones.map((milestone) => {
            const checked = checks[milestone.name] ?? milestone.done;
            return (
              <li key={milestone.name}>
                <label className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => setChecks((current) => ({ ...current, [milestone.name]: !checked }))}
                    />
                    {milestone.name}
                  </span>
                  <span className="text-ink/60">{milestone.due}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </section>
      <section className={cardClass}>
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Next</h2>
        <p className="mt-2 text-sm">{project.next}</p>
      </section>
      <section className={cardClass}>
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/45">Updates</h2>
        <ul className="mt-3 divide-y divide-[#eef2f5]">
          {project.updates.map((update) => (
            <li key={`${update.at}-${update.text}`} className="flex flex-wrap items-baseline justify-between gap-3 py-2 text-sm">
              <span className="text-ink/60">{update.at}</span>
              <span className="min-w-0 flex-1">{update.text}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
