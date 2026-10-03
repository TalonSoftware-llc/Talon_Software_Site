import type { Metadata } from "next";
import Link from "next/link";
import SiteFrame from "@/components/SiteFrame";

export const metadata: Metadata = {
  title: "About | Talon Software",
  description:
    "Talon Software is the practice of Kendall Tapani. Fractional CTO services from Vancouver, Washington.",
};

export default function AboutPage() {
  return (
    <SiteFrame>
      <h1 className="font-serif text-4xl font-medium tracking-tight text-ink">About</h1>
      <div className="mt-4 max-w-3xl space-y-4 text-lg leading-relaxed text-ink/75">
        <p>
          Talon Software is the practice of Kendall Tapani, in Vancouver, Washington. All services
          are provided by him, from the first call through the monthly plan.
        </p>
        <p>
          We give a company ongoing technology leadership without a full-time CTO. That covers the
          systems, the vendors, the security, and the decisions that come with them, with leadership
          kept informed in plain language.
        </p>
        <p>
          Fractional CTO is a working title. Kendall is an independent advisor. The role does not
          make him an officer of the client company and does not include authority to bind that
          company.
        </p>
        <p>
          Support is part of the work. At the start, daily support is handled directly. Later, a
          managed IT partner can take the ticket work under the same relationship.
        </p>
        <p>
          He also built this website. A few tools, separate from client work, are on the{" "}
          <Link href="/products" className="underline">
            products
          </Link>{" "}
          page.
        </p>
      </div>
      <Link href="/contact" className="btn-ink mt-8">
        Request a discovery call
      </Link>
    </SiteFrame>
  );
}
