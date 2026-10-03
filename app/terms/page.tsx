import type { Metadata } from "next";
import SiteFrame from "@/components/SiteFrame";

export const metadata: Metadata = {
  title: "Website terms | Talon Software",
  description: "Terms for using the Talon Software website.",
};

export default function TermsPage() {
  return (
    <SiteFrame>
      <h1 className="font-serif text-4xl font-medium tracking-tight text-ink">Website terms</h1>
      <div className="mt-4 max-w-3xl space-y-4 text-ink/70">
        <p>
          These terms cover use of this website. A client engagement is covered by a separate
          services agreement, not by this page.
        </p>
        <h2 className="font-serif text-xl font-medium text-ink">Use of the site</h2>
        <p>
          The site is informational. You may use it for lawful purposes that do not interfere with
          anyone else&apos;s use of it.
        </p>
        <h2 className="font-serif text-xl font-medium text-ink">No guarantee from the website</h2>
        <p>
          Pages describe the practice in general. They are not a quote, a security guarantee, or
          legal advice. Price and scope are set in a written proposal.
        </p>
        <h2 className="font-serif text-xl font-medium text-ink">Contact</h2>
        <p>Questions about these terms can be sent through the form on this website.</p>
      </div>
    </SiteFrame>
  );
}
