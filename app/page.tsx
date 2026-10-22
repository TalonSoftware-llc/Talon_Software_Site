import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import PortalStage from "@/components/home/PortalStage";
import Reveal from "@/components/home/Reveal";
import { AskThread, ChangesSnippet, OnboardSnippet, RenewalList, ReportSnippet, SpendDonut, StatusCluster } from "@/components/home/snippets";
import SiteFrame from "@/components/SiteFrame";
import { areaHref } from "@/lib/request-site";

export const metadata: Metadata = {
  title: "Talon Software",
  description: "Your IT, handled. Your leadership, informed. Serving Clark County and Portland.",
};

const pains = [
  { title: "Vendor mess", line: "Too many logins", icon: "boxes" },
  { title: "Security worries", line: "Nothing is watched", icon: "shield" },
  { title: "No one owns IT", line: "Decisions land on you", icon: "user" },
  { title: "Surprise bills", line: "Renewals you missed", icon: "bill" },
] as const;

const rows: { title: string; line: string; visual: ReactNode }[] = [
  {
    title: "Systems and network watched",
    line: "Up, slow, or down, in one place.",
    visual: <div className="mock-lift rounded-2xl bg-[#f3f5f7] p-3"><StatusCluster /></div>,
  },
  {
    title: "Spending and renewals",
    line: "The month, and what comes due.",
    visual: (
      <div className="mock-lift rounded-xl border border-[#e1e6ec] bg-white p-5 shadow-sm">
        <SpendDonut />
        <RenewalList />
      </div>
    ),
  },
  {
    title: "People on and off",
    line: "Onboard, offboard, or freeze.",
    visual: <OnboardSnippet />,
  },
  {
    title: "A log of changes",
    line: "Date, what changed, and who did it.",
    visual: <ChangesSnippet />,
  },
  {
    title: "An assistant that stays",
    line: "Ask what is up, or what is next.",
    visual: <div className="mock-lift"><AskThread long /></div>,
  },
  {
    title: "A monthly report",
    line: "The picture leadership needs.",
    visual: <ReportSnippet />,
  },
];

const steps = [
  { n: "1", title: "Discovery call", line: "Thirty minutes" },
  { n: "2", title: "Audit", line: "What is in place" },
  { n: "3", title: "Monthly retainer + portal", line: "The work, and the picture" },
];

export default async function Home() {
  const demoHref = await areaHref("support", "/#demo");

  return (
    <SiteFrame bare>
      <section className="bg-paper">
        <div className="mx-auto max-w-3xl px-6 pb-16 pt-20 text-center md:pb-20 md:pt-28">
          <p className="eyebrow">{"Serving Clark County & Portland"}</p>
          <h1 className="mt-5 font-serif text-5xl font-medium leading-[1.05] tracking-tight text-ink md:text-6xl">
            Your IT, handled. Your leadership, informed.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-ink/70">
            The systems stay watched. Leadership gets the picture.
          </p>
          <Link href="/contact" className="btn-pine mt-8">Book a discovery call</Link>
        </div>
      </section>

      <section className="bg-[#e7eeeb] pb-20">
        <div className="mx-auto max-w-5xl px-6">
          <PortalStage demoHref={demoHref} />
        </div>
      </section>

      <section className="bg-ink text-paper">
        <ul className="mx-auto grid max-w-6xl gap-3 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
          {pains.map((pain) => (
            <li key={pain.title} className="rounded-xl border border-white/10 bg-white/5 px-4 py-4">
              <PainIcon name={pain.icon} />
              <p className="mt-3 font-semibold">{pain.title}</p>
              <p className="mt-1 text-sm text-paper/65">{pain.line}</p>
            </li>
          ))}
        </ul>
      </section>

      {rows.map((row, index) => (
        <section key={row.title} className={index % 2 === 0 ? "bg-paper" : "bg-white"}>
          <Reveal className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-16 md:grid-cols-2 md:py-20">
            <div className={index % 2 === 1 ? "md:order-2" : ""}>{row.visual}</div>
            <div className={index % 2 === 1 ? "md:order-1" : ""}>
              <h2 className="font-serif text-3xl font-medium tracking-tight text-ink md:text-4xl">{row.title}</h2>
              <p className="mt-3 text-lg text-ink/70">{row.line}</p>
            </div>
          </Reveal>
        </section>
      ))}

      <section className="bg-[#e7f3ef]">
        <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
          <h2 className="font-serif text-3xl font-medium tracking-tight text-ink">How it works</h2>
          <ol className="relative mt-10 grid gap-8 md:grid-cols-3">
            <div className="absolute left-[8%] right-[8%] top-6 hidden h-px bg-pine/30 md:block" aria-hidden="true" />
            {steps.map((step) => (
              <li key={step.n} className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-pine/30 bg-white font-serif text-lg text-pine">{step.n}</div>
                <p className="mt-4 font-semibold text-ink">{step.title}</p>
                <p className="mt-1 text-sm text-ink/65">{step.line}</p>
              </li>
            ))}
          </ol>
          <Link href="/contact" className="btn-pine mt-10">Book a discovery call</Link>
        </div>
      </section>
    </SiteFrame>
  );
}

function PainIcon({ name }: { name: (typeof pains)[number]["icon"] }) {
  const common = "h-5 w-5 text-[#c4a574]";
  if (name === "shield") {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3 5 6v6c0 4.5 3 7 7 9 4-2 7-4.5 7-9V6l-7-3Z" />
      </svg>
    );
  }
  if (name === "user") {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="3" />
        <path d="M5 19c1.5-3 3.8-4.5 7-4.5S17.5 16 19 19" />
      </svg>
    );
  }
  if (name === "bill") {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 3h12v18l-2-1.5L14 21l-2-1.5L10 21l-2-1.5L6 21V3Z" />
        <path d="M9 8h6M9 12h6" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={common} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M3 8h7v12H3zM14 4h7v16h-7z" />
    </svg>
  );
}
