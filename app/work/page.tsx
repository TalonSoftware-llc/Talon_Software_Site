import type { Metadata } from "next";
import Link from "next/link";
import SiteFrame from "@/components/SiteFrame";

export const metadata: Metadata = {
  title: "Proof | Talon Software",
  description:
    "What a Talon Software engagement produces, and how references are shared.",
};

export default function WorkPage() {
  return (
    <SiteFrame>
      <h1 className="font-serif text-4xl font-medium tracking-tight text-ink">Proof</h1>
      <div className="mt-4 max-w-3xl space-y-4 text-ink/70">
        <p>
          Public case studies will be posted only after a client has approved the numbers and the
          wording. Until then, a sample assessment readout and references are shared on a discovery
          call.
        </p>
        <p>Every plan client receives the same visible record of the work:</p>
      </div>
      <ul className="mt-4 list-disc space-y-1 pl-5 text-ink/80">
        <li>A one-page monthly status report</li>
        <li>A roadmap with owners, costs, and sequence</li>
        <li>A risk register</li>
        <li>A decision log</li>
      </ul>
      <p className="mt-4 max-w-3xl text-ink/70">
        The assessment is the first piece of proof. Leadership sees the thinking on their own
        company before they commit to a monthly plan.
      </p>
      <Link href="/contact" className="mt-6 inline-block text-sm font-medium underline">
        Request a discovery call
      </Link>
    </SiteFrame>
  );
}
