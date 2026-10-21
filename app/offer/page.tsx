import type { Metadata } from "next";
import Link from "next/link";
import SiteFrame from "@/components/SiteFrame";

export const metadata: Metadata = {
  title: "Offer sheet | Talon Software",
  description:
    "One-page description of Talon Software technology leadership: who it is for, two plans, and assessments.",
};

export default function OfferPage() {
  return (
    <SiteFrame>
      <div className="mb-6 flex items-center justify-between gap-4 print:hidden">
        <p className="text-sm text-ink/50">One page to forward.</p>
        <Link href="/contact" className="text-sm font-medium underline">
          Book a call
        </Link>
      </div>
      <article className="card">
        <h1 className="font-serif text-3xl font-medium text-ink">Talon Software</h1>
        <p className="mt-1 text-sm text-ink/50">Technology leadership · Vancouver, Washington</p>
        <p className="mt-4 text-ink/80">
          Senior technology judgment for an owner-led company of about 25 to 200 people that cannot
          justify a full-time technology executive. One accountable person. A plan. Technology that
          is actually run.
        </p>
        <h2 className="mt-6 font-serif text-xl font-medium text-ink">Essentials</h2>
        <p className="mt-1 text-sm text-ink/70">
          Help desk and accounts, software and network, licenses and vendors, the technology budget,
          and baseline security. Monthly review. Support included. Quoted per company.
        </p>
        <h2 className="mt-4 font-serif text-xl font-medium text-ink">Pro</h2>
        <p className="mt-1 text-sm text-ink/70">
          Everything in Essentials, plus security leadership, insurance and customer questionnaires,
          software oversight, AI decisions, hiring, and leadership meetings.
        </p>
        <h2 className="mt-4 font-serif text-xl font-medium text-ink">Services</h2>
        <p className="mt-1 text-sm text-ink/70">
          Technology, business, or network security assessments. Fixed fee from $5,000. Written
          report and readout. Half credited to the first plan month if they sign within 30 days.
          Also quoted on their own: website management, an application security audit, a backup
          recovery test, and a security questionnaire.
        </p>
        <h2 className="mt-4 font-serif text-xl font-medium text-ink">Send someone if</h2>
        <p className="mt-1 text-sm text-ink/70">
          They are staring at a cyber insurance form, a stalled system, a bad IT relationship,
          growth, or an AI mandate, and nobody senior owns the answer.
        </p>
        <p className="mt-6 text-sm text-ink/80">
          Start with a 30-minute call:{" "}
          <Link href="/contact" className="underline">
            talonsoftware.com/contact
          </Link>
        </p>
      </article>
    </SiteFrame>
  );
}
