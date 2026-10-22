import type { Metadata } from "next";
import Link from "next/link";
import DayInLife from "@/components/home/DayInLife";
import HeroDevices from "@/components/home/HeroDevices";
import SiteFrame from "@/components/SiteFrame";
import { areaHref } from "@/lib/request-site";

export const metadata: Metadata = {
  title: "Talon Software",
  description: "Your IT, handled. Your leadership, informed. Serving Clark County and Portland.",
};

const steps = ["Discovery call", "Audit", "Monthly retainer + portal"];

export default async function Home() {
  const demoHref = await areaHref("support", "/#demo");

  return (
    <SiteFrame bare>
      <section className="relative overflow-hidden bg-[#0e141c] text-paper">
        <div className="pointer-events-none absolute right-[-8%] top-[12%] h-[520px] w-[680px] bg-[radial-gradient(ellipse_at_center,rgba(31,77,69,0.5),transparent_68%)] blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl lg:min-h-[760px] lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]">
          <div className="relative z-10 px-6 pb-8 pt-16 sm:pt-20 lg:py-32">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8fcec2]">{"Serving Clark County & Portland"}</p>
            <h1 className="mt-6 max-w-xl font-serif text-5xl font-medium leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Your IT, handled. Your leadership, informed.
            </h1>
            <p className="mt-6 max-w-md text-lg text-paper/70">
              The systems stay watched. Leadership gets the picture.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link href="/contact" className="btn-pine">Book a discovery call</Link>
              <a href={demoHref} className="text-sm font-semibold text-paper underline decoration-white/30 underline-offset-4 hover:decoration-white">Try the live demo</a>
            </div>
          </div>
          <div className="relative h-[420px] sm:h-[500px] lg:h-auto">
            <HeroDevices />
          </div>
        </div>
      </section>

      <DayInLife />

      <section className="bg-ink text-paper">
        <div className="mx-auto max-w-5xl px-6 py-28 md:py-40">
          <p className="max-w-4xl font-serif text-4xl font-medium leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
            One person who stays. One place to see it all.
          </p>
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <h2 className="font-serif text-4xl font-medium tracking-tight text-ink md:text-5xl">How it works</h2>
          <ol className="relative mt-14 border-l border-ink/15 md:grid md:grid-cols-3 md:border-l-0 md:gap-10">
            <div className="absolute left-0 right-0 top-[5px] hidden h-px bg-ink/15 md:block" aria-hidden="true" />
            {steps.map((step) => (
              <li key={step} className="relative pb-10 pl-8 last:pb-0 md:pb-0 md:pl-0">
                <span className="absolute left-[-5px] top-1.5 h-2.5 w-2.5 rounded-full bg-pine md:static md:mb-8 md:block" />
                <p className="font-serif text-2xl text-ink md:text-3xl">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-ink/10 bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-24 text-center md:py-32">
          <Link href="/contact" className="btn-pine">Book a discovery call</Link>
        </div>
      </section>
    </SiteFrame>
  );
}
