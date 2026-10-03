import type { Metadata } from "next";
import Link from "next/link";
import SiteFrame from "@/components/SiteFrame";

export const metadata: Metadata = {
  title: "Plans | Talon Software",
  description:
    "Essentials and Pro monthly technology leadership plans. Scope and rhythm are fixed. Price is quoted per company.",
};

const essentials = [
  "Help desk, devices, user accounts, and new-hire onboarding. Handled directly at first, then by a partner under direction.",
  "The software in daily use: email, files, identity, and the other tools the company already pays for.",
  "Cloud, network, and the connections between systems, with unused overlap removed.",
  "License and contract review before renewal, vendor management, and the annual technology budget.",
  "Baseline security: multi-factor authentication, backups, endpoint protection, access reviews, and core policies.",
  "A monthly review of what is in place, what it costs, and what needs a decision.",
];

const pro = [
  "Security program and risk leadership, an incident response plan, and quarterly reviews.",
  "Cyber insurance applications, customer security questionnaires, and readiness for frameworks such as SOC 2, HIPAA, or CMMC. Licensed firms still sign formal audits.",
  "Software and product oversight: build versus buy, developer or agency selection, architecture and code review, and delivery oversight.",
  "AI and automation: which workflows are worth it, which tool, a usage policy, and one pilot taken to a result.",
  "Hiring support: role definitions, technical interviews, and direction for in-house IT or developers.",
  "A seat in leadership meetings, plain-language reporting, and technical due diligence for acquisitions or investors.",
];

export default function PlansPage() {
  return (
    <SiteFrame>
      <h1 className="font-serif text-4xl font-medium tracking-tight text-ink">Two monthly plans</h1>
      <p className="mt-3 max-w-3xl text-ink/70">
        Every company gets a quote, not a price list. The discovery call and, when useful, an
        assessment show where things stand. The fee buys defined responsibilities. It is not an
        hourly rate. Support is included in the monthly price.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <article className="card">
          <h2 className="font-serif text-2xl font-medium text-ink">Essentials</h2>
          <p className="mt-2 text-sm text-ink/70">
            For a company that wants the technology run: support, systems, vendors, budget, and
            baseline security. Monthly review. About ten hours a month of advisory time, tracked
            privately so the quote stays honest.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-ink/80">
            {essentials.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article className="card">
          <h2 className="font-serif text-2xl font-medium text-ink">Pro</h2>
          <p className="mt-2 text-sm text-ink/70">
            For a company that needs the decisions Essentials does not cover. Weekly presence and
            leadership meetings. Includes the Essentials work, and adds the items below. A
            full-time technology executive costs a company well over $200,000 a year loaded. Pro is
            the alternative to that hire.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-ink/80">
            {pro.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>

      <section className="mt-8 card">
        <h2 className="font-serif text-xl font-medium text-ink">How support works</h2>
        <p className="mt-2 text-sm text-ink/70">
          You have one relationship, with Talon Software. Daily support is done directly at the
          start. Once there are enough clients, a managed IT partner takes the ticket work as a
          subcontractor. If you already like your provider, they can stay and the work is directed
          and reviewed. Response is during business hours. There is no personal on-call and no
          24/7 promise.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl font-medium text-ink">What a quote depends on</h2>
        <p className="mt-2 text-sm text-ink/70">
          Headcount, number of locations, how much of the current setup needs fixing, compliance
          requirements, and how involved leadership wants the work to be. When support runs through
          this practice, the partner&apos;s per-user cost is inside the one price, not a second invoice.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-serif text-xl font-medium text-ink">Terms</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink/70">
          <li>Three-month minimum, then month to month with 30 days&apos; notice</li>
          <li>Invoiced in advance, due in 15 days</li>
          <li>Assessments and defined projects are sold separately, with or without a plan</li>
          <li>
            Fractional CTO is a working title. The engagement is as an independent advisor, not as
            an officer of the company
          </li>
        </ul>
        <Link href="/contact?interest=plan" className="mt-4 inline-block text-sm font-medium underline">
          Request a discovery call
        </Link>
      </section>
    </SiteFrame>
  );
}
