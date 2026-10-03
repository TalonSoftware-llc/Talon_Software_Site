import type { Metadata } from "next";
import Link from "next/link";
import SiteFrame from "@/components/SiteFrame";

export const metadata: Metadata = {
  title: "Talon Software",
  description:
    "Fractional CTO services for your business. Talon Software is based in Vancouver, WA.",
};

export default function Home() {
  return (
    <SiteFrame>
      <section className="mx-auto max-w-3xl text-center">
        <p className="eyebrow">Vancouver, WA</p>
        <h1 className="mt-5 font-serif text-5xl font-medium leading-tight tracking-tight text-ink md:text-6xl">
          Fractional CTO services for your business
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink/75">
          We give your business ongoing technology leadership without a full-time CTO. We take
          the systems, the vendors, the security, and the decisions that come with them, and we
          keep leadership informed in plain language. We stay with the business, so the next
          question has somewhere to go.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/contact" className="btn-ink">
            Request a discovery call
          </Link>
          <Link href="/assessments" className="btn-line">
            Review the services
          </Link>
        </div>
      </section>

      <section className="mt-20 grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="eyebrow">What you are looking for</p>
          <h2 className="mt-3 font-serif text-3xl font-medium text-ink">
            Technology with a plan, a budget, and someone accountable for both
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink/75">
            The retainer is the operating picture of the company’s technology: what is in place,
            what it costs, what is at risk, and what happens next. Talon Software keeps that
            picture current and brings the decisions that need leadership, instead of leaving
            them scattered across vendors.
          </p>
          <Link href="/contact" className="btn-ink mt-6">
            Request a discovery call
          </Link>
        </div>
        <aside className="rounded-xl bg-ink px-8 py-10 text-paper shadow-sm">
          <h2 className="font-serif text-3xl font-medium text-paper">If this is you</h2>
          <ul className="mt-6 space-y-5 text-lg leading-snug">
            <li>Technology decisions keep coming back to you.</li>
            <li>A security review, a vendor problem, or a stalled system is now on your desk.</li>
            <li>A full-time CTO is more hire than the company should make.</li>
            <li>You want one person who stays, not a new advisor every quarter.</li>
          </ul>
        </aside>
      </section>

      <section className="mt-20">
        <p className="eyebrow">Retainers</p>
        <h2 className="mt-3 font-serif text-3xl font-medium text-ink">
          Two monthly plans, quoted to the organization
        </h2>
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink/75">
          There is no published rate card. Price follows headcount, locations, the condition of the
          current environment, compliance obligations, and the level of leadership involvement
          required. Essentials runs the technology. Pro is for the decisions that sit above that
          work.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <article className="card">
            <h3 className="font-serif text-2xl font-medium text-ink">Essentials</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-ink/75">
              <li>Help desk, devices, accounts, and onboarding</li>
              <li>Email, files, identity, and the other software already in use</li>
              <li>Cloud, network, and the connections between systems</li>
              <li>Licenses, renewals, vendors, and the technology budget</li>
              <li>Baseline security: MFA, backups, endpoint protection, and access</li>
              <li>A monthly review of what is in place, what it costs, and what needs a decision</li>
            </ul>
            <Link href="/plans" className="mt-4 inline-block text-sm font-semibold text-pine underline">
              Essentials scope
            </Link>
          </article>
          <article className="card">
            <h3 className="font-serif text-2xl font-medium text-ink">Pro</h3>
            <p className="mt-3 leading-relaxed text-ink/75">
              The decisions Essentials does not cover. Includes the Essentials work, and adds:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-ink/75">
              <li>Security program leadership and incident response</li>
              <li>Cyber insurance, customer questionnaires, and audit readiness</li>
              <li>Software selection, delivery oversight, and hiring</li>
              <li>AI and automation decisions</li>
              <li>A seat in leadership meetings</li>
            </ul>
            <Link href="/plans" className="mt-4 inline-block text-sm font-semibold text-pine underline">
              Pro scope
            </Link>
          </article>
        </div>
        <article className="card mt-4">
          <h3 className="font-serif text-2xl font-medium text-ink">Fixed assessments</h3>
          <p className="mt-3 max-w-3xl leading-relaxed text-ink/75">
            A technology, business, or network security assessment produces a written report and a
            readout to leadership. Where a retainer is appropriate, the proposal is the final
            section of that readout. Assessments begin at $5,000. Half of the fee is credited to
            the first retainer month when the agreement is signed within 30 days.
          </p>
          <Link href="/assessments" className="mt-4 inline-block text-sm font-semibold text-pine underline">
            Services
          </Link>
        </article>
      </section>

      <section className="mt-20 grid gap-10 md:grid-cols-2">
        <div>
          <p className="eyebrow">Not this practice</p>
          <ul className="mt-4 space-y-2 text-ink/75">
            <li>A company shopping for a help desk</li>
            <li>A founder looking for a technical cofounder</li>
            <li>A team that needs more developers, not a leader</li>
            <li>An organization that already has a technology executive</li>
          </ul>
        </div>
        <div className="rounded-xl bg-ink px-8 py-10 text-paper">
          <h2 className="font-serif text-3xl font-medium">Discovery call</h2>
          <p className="mt-3 text-paper/75">
            Thirty minutes. The conversation confirms the business event, the decision-maker, and
            whether a budget exists. Where the work is a fit, an assessment proposal follows within
            one business day.
          </p>
          <Link href="/contact" className="btn-on-dark mt-6">
            Request a discovery call
          </Link>
        </div>
      </section>
    </SiteFrame>
  );
}
