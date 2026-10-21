"use client";

import { useDemoCompany } from "@/components/support/SupportAppShell";

export default function SupportTicketsPage() {
  const company = useDemoCompany();

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/40">Sample</p>
          <h1 className="mt-2 font-serif text-3xl font-medium">Tickets</h1>
          <p className="mt-2 text-ink/70">Requests for {company.name}. Nothing on this page can be filed.</p>
        </div>
        <button
          type="button"
          disabled
          className="rounded-md bg-ink/30 px-4 py-2 text-sm font-semibold text-white"
        >
          New ticket
        </button>
      </div>
      <div className="mt-6 overflow-hidden rounded-xl border border-[#d7dee7] bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[#e4e9ef] text-xs uppercase tracking-[0.12em] text-ink/40">
            <tr>
              <th className="px-4 py-3 font-semibold">Number</th>
              <th className="px-4 py-3 font-semibold">Request</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Opened</th>
            </tr>
          </thead>
          <tbody>
            {company.tickets.map((ticket) => (
              <tr key={ticket.id} className="border-b border-[#eef1f5] last:border-0">
                <td className="px-4 py-3 text-ink/50">{ticket.id}</td>
                <td className="px-4 py-3">{ticket.title}</td>
                <td className="px-4 py-3">{ticket.status}</td>
                <td className="px-4 py-3 text-ink/50">{ticket.opened}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
