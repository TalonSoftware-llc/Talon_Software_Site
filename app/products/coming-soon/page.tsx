import type { Metadata } from "next";
import Link from "next/link";
import SiteFrame from "@/components/SiteFrame";

export const metadata: Metadata = {
  title: "Products in development | Talon Software",
  description:
    "Office Assistant and other tools Talon Software is building.",
};

export default function ProductsComingSoonPage() {
  return (
    <SiteFrame>
      <h1 className="font-serif text-4xl font-medium tracking-tight text-ink">Products in development</h1>
      <p className="mt-3 max-w-3xl text-ink/70">
        Additional products are in progress. This list is separate from client work.
      </p>
      <article className="mt-8 card">
        <h2 className="font-serif text-2xl font-medium text-ink">Office Assistant</h2>
        <p className="mt-3 text-ink/70">
          Office Assistant is a fully autonomous office assistant you download and run on your own
          computer. You text it to carry out work across the apps and files you already use.
        </p>
        <p className="mt-3 text-ink/70">
          It is tools and integrations first. Anyone should be able to build or plug in a capability
          quickly, without waiting on a vendor roadmap.
        </p>
        <p className="mt-3 text-ink/70">
          Early use cases include checking email, looking up information, reading or changing files,
          and consolidating information from different places.
        </p>
      </article>
      <Link href="/contact?interest=call" className="mt-6 inline-block text-sm font-medium underline">
        Get in touch
      </Link>
    </SiteFrame>
  );
}
