import type { Metadata } from "next";
import Link from "next/link";
import SiteFrame from "@/components/SiteFrame";
import { areaHref } from "@/lib/request-site";

export const metadata: Metadata = {
  title: "Talon Software",
  description:
    "Talon Software is the practice of Kendall Tapani. Fractional CTO services from Vancouver, Washington.",
};

export default async function Home() {
  const consulting = await areaHref("consulting", "/");
  const engineering = await areaHref("engineering", "/");
  const support = await areaHref("support", "/");

  return (
    <SiteFrame>
      <section className="mx-auto max-w-3xl text-center">
        <p className="eyebrow">Vancouver, WA</p>
        <h1 className="mt-5 font-serif text-5xl font-medium leading-tight tracking-tight text-ink md:text-6xl">
          Talon Software
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink/75">
          Talon Software is the practice of Kendall Tapani, in Vancouver, Washington. All services
          are provided by him, from the first call through the monthly plan.
        </p>
      </section>

      <section className="mt-16 grid gap-4 md:grid-cols-3">
        <article className="card flex flex-col">
          <p className="eyebrow">Consulting</p>
          <h2 className="mt-3 font-serif text-2xl font-medium text-ink">
            Fractional CTO services for your business
          </h2>
          <p className="mt-3 flex-grow leading-relaxed text-ink/75">
            We give your business ongoing technology leadership without a full-time CTO.
          </p>
          <Link href={consulting} className="mt-4 text-sm font-semibold text-pine underline">
            Consulting
          </Link>
        </article>
        <article className="card flex flex-col">
          <p className="eyebrow">Coming soon</p>
          <h2 className="mt-3 font-serif text-2xl font-medium text-ink">Engineering</h2>
          <p className="mt-3 flex-grow leading-relaxed text-ink/75">This part of the practice is not open yet.</p>
          <Link href={engineering} className="mt-4 text-sm font-semibold text-pine underline">
            Engineering
          </Link>
        </article>
        <article className="card flex flex-col">
          <p className="eyebrow">Clients</p>
          <h2 className="mt-3 font-serif text-2xl font-medium text-ink">Support</h2>
          <p className="mt-3 flex-grow leading-relaxed text-ink/75">
            A portal for a company that already works with Talon Software. Sign-in is not open yet.
          </p>
          <Link href={support} className="mt-4 text-sm font-semibold text-pine underline">
            Support
          </Link>
        </article>
      </section>
    </SiteFrame>
  );
}
