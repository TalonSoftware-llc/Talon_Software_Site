import type { Metadata } from "next";
import Link from "next/link";
import ConsultingFrame from "@/components/ConsultingFrame";
import { areaHref } from "@/lib/request-site";

export const metadata: Metadata = {
  title: "Projects | Talon Consulting",
  description:
    "AI adoption, systems and infrastructure, assessments, and integrations. Each is a defined project with a written result.",
};

const offerings = [
  {
    id: "ai",
    title: "AI adoption",
    situation:
      "A company has been told to do something with AI. Nobody has named the workflow, the tool, or what a useful result would be.",
    work: "The project lists the workflows worth doing, chooses a tool, writes a usage policy, and takes one pilot through until people are using it.",
    result: "A working pilot, a short policy, and a record of what was tried and what was left alone.",
  },
  {
    id: "systems",
    title: "Systems and infrastructure",
    situation:
      "The network, the cloud accounts, identity, or a line-of-business system is in the way. It needs to be put right, or replaced.",
    work: "The project has a start, a cutover, and a finish. Unused overlap comes out. What stays is documented, including who administers it.",
    result: "The system in its new state, and a record of what changed, what it costs, and what to watch.",
  },
  {
    id: "assessments",
    title: "Assessments",
    situation:
      "Leadership needs a clear picture before it spends more: systems and spend, how technology supports the operation, or the exposure on the network.",
    work: "A technology, business, or network security assessment. Findings are ranked. This is not a certification. A licensed firm still signs any formal audit.",
    result: "A written report and a readout to the people who decide. The recommendation is the last part of that readout.",
  },
  {
    id: "integrations",
    title: "Integrations",
    situation: "Two systems the company already pays for should share data. Staff are moving it by hand, or the last attempt stalled.",
    work: "The project maps the data, chooses the path, builds the connection, and checks it against a real week of work.",
    result: "The connection running, and a note on how it fails and who fixes it.",
  },
];

export default async function ConsultingServicesPage() {
  const contact = await areaHref("consulting", "/contact");

  return (
    <ConsultingFrame>
      <h1 className="font-serif text-4xl font-medium tracking-tight text-ink">Projects</h1>
      <p className="mt-3 max-w-3xl text-lg text-ink/70">
        Each engagement is a project with a start, an end, and something you can hand to someone else. Scope and fee
        are in a written proposal. These do not require a monthly plan.
      </p>
      <div className="mt-10 space-y-4">
        {offerings.map((item) => (
          <article key={item.id} id={item.id} className="card">
            <h2 className="font-serif text-2xl font-medium text-ink">{item.title}</h2>
            <dl className="mt-4 space-y-3 text-sm leading-relaxed text-ink/75">
              <div>
                <dt className="font-semibold text-ink">The situation</dt>
                <dd className="mt-1">{item.situation}</dd>
              </div>
              <div>
                <dt className="font-semibold text-ink">The work</dt>
                <dd className="mt-1">{item.work}</dd>
              </div>
              <div>
                <dt className="font-semibold text-ink">What you keep</dt>
                <dd className="mt-1">{item.result}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
      <Link href={contact} className="btn-ink mt-8">
        Book a project consultation
      </Link>
    </ConsultingFrame>
  );
}
