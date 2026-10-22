import type { Metadata } from "next";
import Link from "next/link";
import SiteFrame from "@/components/SiteFrame";

export const metadata: Metadata = {
  title: "Plans | Talon Software",
  description: "Essentials and Pro. Each plan is a custom quote.",
};

const essentials = [
  "Help desk and accounts",
  "Systems and the network",
  "Vendors and renewals",
  "A monthly review",
];

const pro = [
  "The full portal",
  "People, on and off",
  "Report and changes",
  "An assistant on the page",
];

export default function PlansPage() {
  return (
    <SiteFrame>
      <h1 className="font-serif text-4xl font-medium tracking-tight text-ink md:text-5xl">Plans</h1>
      <p className="mt-3 text-lg text-ink/70">Two ways to work together.</p>
      <div className="mt-10 grid items-stretch gap-5 md:grid-cols-2">
        <article className="flex flex-col rounded-2xl border border-[#e4ddd2] bg-white p-8">
          <h2 className="font-serif text-3xl font-medium text-ink">Essentials</h2>
          <p className="mt-3 text-sm font-semibold uppercase tracking-[0.14em] text-ink/50">Custom quote</p>
          <ul className="mt-6 space-y-3 text-ink">
            {essentials.map((item) => (
              <li key={item} className="flex gap-3"><Check />{item}</li>
            ))}
          </ul>
          <Link href="/contact" className="btn-line mt-8 w-fit">Book a discovery call</Link>
        </article>
        <article className="flex flex-col rounded-2xl border-2 border-pine bg-white p-8 shadow-[0_18px_40px_-24px_rgba(31,77,69,0.65)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-pine">Recommended</p>
          <h2 className="mt-2 font-serif text-3xl font-medium text-ink">Pro</h2>
          <p className="mt-3 text-sm font-semibold uppercase tracking-[0.14em] text-ink/50">Custom quote</p>
          <ul className="mt-6 space-y-3 text-ink">
            {pro.map((item) => (
              <li key={item} className="flex gap-3"><Check />{item}</li>
            ))}
          </ul>
          <Link href="/contact" className="btn-pine mt-8 w-fit">Book a discovery call</Link>
        </article>
      </div>
    </SiteFrame>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 16 16" className="mt-1 h-4 w-4 shrink-0 text-pine" aria-hidden="true">
      <path d="M3 8.5 6.2 12 13 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
