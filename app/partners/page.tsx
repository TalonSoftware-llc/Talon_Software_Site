import type { Metadata } from "next";
import Link from "next/link";
import SiteFrame from "@/components/SiteFrame";

export const metadata: Metadata = {
  title: "Referral partners | Talon Software",
  description:
    "Who to introduce to Talon Software: owners of established 25 to 200 person companies who need technology leadership.",
};

export default function PartnersPage() {
  return (
    <SiteFrame>
      <h1 className="font-serif text-4xl font-medium tracking-tight text-ink">For referral partners</h1>
      <p className="mt-3 max-w-3xl text-ink/70">
        Accountants, fractional CFOs, business attorneys, commercial insurance brokers, and bankers
        already sit with the buyers. This page is the one sentence to use, and what happens after
        an introduction.
      </p>

      <section className="mt-8 card">
        <h2 className="font-serif text-xl font-medium text-ink">Who to send</h2>
        <p className="mt-2 text-ink/80">
          An owner, CEO, COO, or CFO of an established local company of about 25 to 200 people that
          spends real money on technology and has nobody senior owning it.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="font-serif text-xl font-medium text-ink">Good moments to introduce</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-ink/70">
          <li>Cyber insurance renewal or a security questionnaire they cannot answer</li>
          <li>A customer or regulator asking for compliance evidence</li>
          <li>A software project that stalled, or an IT provider they no longer trust</li>
          <li>Growth, a second location, or a deal</li>
          <li>They want to &quot;do AI&quot; and nobody can say what that should mean</li>
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="font-serif text-xl font-medium text-ink">What not to send</h2>
        <p className="mt-2 text-ink/70">
          A company under about 15 people, a request for cheap help desk, a search for a full-time
          employee at a part-time price, or a need for round-the-clock coverage.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="font-serif text-xl font-medium text-ink">What happens next</h2>
        <p className="mt-2 text-ink/70">
          A 30-minute call confirms the trigger, the budget, and the decision-maker. If it is a
          fit, a fixed assessment follows. The assessment does the selling. A monthly plan is
          proposed only after leadership has seen the report.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <Link href="/offer" className="font-medium underline">
            One-page offer sheet
          </Link>
          <Link href="/contact?interest=partner" className="font-medium underline">
            Send an introduction
          </Link>
        </div>
      </section>
    </SiteFrame>
  );
}
