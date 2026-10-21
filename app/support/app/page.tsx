"use client";

import Link from "next/link";
import { useDemoCompany } from "@/components/support/SupportAppShell";

export default function SupportOverviewPage() {
  const company = useDemoCompany();
  const open = company.tickets.filter((ticket) => ticket.status !== "Closed").length;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/40">Sample</p>
      <h1 className="mt-2 font-serif text-3xl font-medium text-ink">{company.name}</h1>
      <p className="mt-2 text-ink/70">
        {company.industry} · {company.city} · {company.people} people
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <article className="rounded-xl border border-[#d7dee7] bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">Open tickets</p>
          <p className="mt-2 font-serif text-4xl text-ink">{open}</p>
        </article>
        <article className="rounded-xl border border-[#d7dee7] bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">Documents</p>
          <p className="mt-2 font-serif text-4xl text-ink">{company.articles.length}</p>
        </article>
        <article className="rounded-xl border border-[#d7dee7] bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/40">Primary contact</p>
          <p className="mt-3 text-sm text-ink">{company.contact}</p>
        </article>
      </div>
      <section className="mt-8 rounded-xl border border-[#d7dee7] bg-white p-5">
        <h2 className="font-serif text-xl font-medium">Recent tickets</h2>
        <ul className="mt-4 divide-y divide-[#e4e9ef] text-sm">
          {company.tickets.map((ticket) => (
            <li key={ticket.id} className="flex items-center justify-between gap-4 py-3">
              <span>
                <span className="text-ink/40">{ticket.id}</span> {ticket.title}
              </span>
              <span className="text-ink/50">{ticket.status}</span>
            </li>
          ))}
        </ul>
        <Link href="tickets" className="mt-2 inline-block text-sm font-semibold text-pine underline">
          Ticket list
        </Link>
      </section>
    </div>
  );
}
