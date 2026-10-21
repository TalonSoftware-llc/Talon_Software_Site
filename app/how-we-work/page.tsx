import type { Metadata } from "next";
import Link from "next/link";
import SiteFrame from "@/components/SiteFrame";

export const metadata: Metadata = {
  title: "How we work | Talon Software",
  description:
    "Discovery call, paid assessment, readout, onboarding, and steady state.",
};

const steps = [
  {
    title: "Discovery call",
    body: "Thirty minutes, free. The point is to confirm a real trigger, a budget, and a decision-maker.",
  },
  {
    title: "Assessment",
    body: "Paid. A meeting with leadership and staff. Systems, security, vendors, and spend are reviewed.",
  },
  {
    title: "Readout",
    body: "The report and roadmap are presented to leadership. The plan proposal, priced to what the assessment found, is the last page.",
  },
  {
    title: "Onboarding",
    body: "The first two weeks cover access, introductions to vendors and staff, and a 30-60-90 day plan.",
  },
  {
    title: "Steady state",
    body: "An on-site or remote block at the agreed cadence, a monthly report, and a quarterly roadmap review with leadership.",
  },
];

export default function HowWeWorkPage() {
  return (
    <SiteFrame>
      <h1 className="font-serif text-4xl font-medium tracking-tight text-ink">How we work</h1>
      <p className="mt-3 max-w-3xl text-ink/70">
        Every client follows the same path. That is what makes a one-person practice able to serve
        a small number of companies well.
      </p>
      <ol className="mt-8 space-y-4">
        {steps.map((step, index) => (
          <li key={step.title} className="card">
            <h2 className="font-serif text-xl font-medium text-ink">
              {index + 1}. {step.title}
            </h2>
            <p className="mt-2 text-sm text-ink/70">{step.body}</p>
          </li>
        ))}
      </ol>
      <section className="mt-8 text-sm text-ink/70">
        <h2 className="font-serif text-xl font-medium text-ink">Working rules</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>Replies within one business day. Emergencies get best effort, not a guarantee.</li>
          <li>Accounts are issued in a named user. No shared passwords. Hardware-key MFA.</li>
          <li>If a client runs over the planned hours for two months, the scope is reset.</li>
        </ul>
        <Link href="/contact" className="mt-4 inline-block font-medium text-ink underline">
          Book the discovery call
        </Link>
      </section>
    </SiteFrame>
  );
}
