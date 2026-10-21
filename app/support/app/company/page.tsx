"use client";

import { useDemoCompany } from "@/components/support/SupportAppShell";

export default function SupportCompanyPage() {
  const company = useDemoCompany();
  const facts = [
    ["Company", company.name],
    ["Work", company.industry],
    ["Location", company.city],
    ["People", company.people],
    ["Primary contact", company.contact],
  ];

  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/40">Sample</p>
      <h1 className="mt-2 font-serif text-3xl font-medium">Company</h1>
      <p className="mt-2 text-ink/70">The record a signed-in company would see. This one is fictional.</p>
      <dl className="mt-6 divide-y divide-[#e4e9ef] rounded-xl border border-[#d7dee7] bg-white">
        {facts.map(([label, value]) => (
          <div key={label} className="grid gap-1 px-5 py-4 sm:grid-cols-3">
            <dt className="text-sm text-ink/50">{label}</dt>
            <dd className="text-sm sm:col-span-2">{value}</dd>
          </div>
        ))}
      </dl>
      <h2 className="mt-8 font-serif text-xl font-medium">Systems on the record</h2>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-ink/75">
        {company.systems.map((system) => (
          <li key={system}>{system}</li>
        ))}
      </ul>
    </div>
  );
}
