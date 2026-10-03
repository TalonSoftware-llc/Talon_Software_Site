import type { Metadata } from "next";
import SiteFrame from "@/components/SiteFrame";

export const metadata: Metadata = {
  title: "Products | Talon Software",
  description:
    "Tools published by Talon Software, separate from client technology leadership.",
};

export default function ProductsPage() {
  return (
    <SiteFrame>
      <h1 className="font-serif text-4xl font-medium tracking-tight text-ink">Products</h1>
      <p className="mt-3 max-w-3xl text-ink/70">
        These are tools published alongside the practice. They are not the monthly plans.
      </p>
      <article className="mt-8 card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-serif text-2xl font-medium text-ink">Talon Obsidian Setup</h2>
          <a
            href="https://github.com/TalonSoftware-llc/Talon-Obsidian-Setup"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ink w-fit"
          >
            View on GitHub
          </a>
        </div>
        <p className="mt-4 text-ink/70">
          A ready-to-use{" "}
          <a
            href="https://obsidian.md/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Obsidian
          </a>{" "}
          vault template built to tie together daily planning, active projects, and reference notes
          for serious personal productivity: three dashboards—Agenda, Projects, and
          Repository—powered by Dataview and Templater.
        </p>
      </article>
    </SiteFrame>
  );
}
