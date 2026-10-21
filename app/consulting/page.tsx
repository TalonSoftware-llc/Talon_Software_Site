import type { Metadata } from "next";
import Link from "next/link";
import ConsultingFrame from "@/components/ConsultingFrame";
import { areaHref } from "@/lib/request-site";

export const metadata: Metadata = {
  title: "Consulting | Talon Software",
  description:
    "Project-based technology and AI consulting. A defined engagement, a written scope, and a result the company keeps.",
};

const projects = [
  {
    title: "AI adoption",
    body: "Which workflows are worth doing, which tool, a usage policy, and one pilot taken through to a result people use.",
  },
  {
    title: "Systems and infrastructure",
    body: "A network, a cloud account, identity, or a line-of-business system put right or replaced, with a cutover and a record of what changed.",
  },
  {
    title: "Assessments",
    body: "Technology, operations, or network security reviewed. A written report, findings ranked, and a readout to the people who decide.",
  },
  {
    title: "Integrations",
    body: "Two systems that should share data and do not. The connection left running, and a note on how it fails.",
  },
];

export default async function ConsultingHome() {
  const contact = await areaHref("consulting", "/contact");
  const services = await areaHref("consulting", "/services");

  return (
    <ConsultingFrame>
      <section className="mx-auto max-w-3xl text-center">
        <p className="eyebrow">Project consulting</p>
        <h1 className="mt-5 font-serif text-5xl font-medium leading-tight tracking-tight text-ink md:text-6xl">
          Technology and AI projects, carried through
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink/75">
          Defined work for a company that needs the project done. An AI adoption. A system that has to be replaced.
          An integration. An assessment with a written result. One person does the work, from the first call through
          the handoff.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href={contact} className="btn-ink">
            Book a project consultation
          </Link>
          <Link href={services} className="btn-line">
            Review the projects
          </Link>
        </div>
      </section>

      <section className="mt-20">
        <p className="eyebrow">The work</p>
        <h2 className="mt-3 font-serif text-3xl font-medium text-ink">Four kinds of project</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <article key={project.title} className="card">
              <h3 className="font-serif text-2xl font-medium text-ink">{project.title}</h3>
              <p className="mt-3 leading-relaxed text-ink/75">{project.body}</p>
            </article>
          ))}
        </div>
        <Link href={services} className="mt-6 inline-block text-sm font-semibold text-pine underline">
          Project scope
        </Link>
      </section>

      <section className="mt-20 grid gap-10 md:grid-cols-2">
        <div>
          <p className="eyebrow">A project, not a retainer</p>
          <p className="mt-4 text-lg leading-relaxed text-ink/75">
            A project has a start, an end, and a deliverable. Price and scope are set in a written proposal. The
            monthly fractional CTO plan is a different engagement.
          </p>
        </div>
        <div className="rounded-xl bg-ink px-8 py-10 text-paper">
          <h2 className="font-serif text-3xl font-medium">Project consultation</h2>
          <p className="mt-3 text-paper/75">
            The call names the outcome, the constraint, and who can decide. Where the work is a fit, a written scope
            follows within one business day.
          </p>
          <Link href={contact} className="btn-on-dark mt-6">
            Book a project consultation
          </Link>
        </div>
      </section>
    </ConsultingFrame>
  );
}
