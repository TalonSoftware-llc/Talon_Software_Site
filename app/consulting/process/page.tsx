import type { Metadata } from "next";
import Link from "next/link";
import ConsultingFrame from "@/components/ConsultingFrame";
import { areaHref } from "@/lib/request-site";

export const metadata: Metadata = {
  title: "How a project runs | Talon Consulting",
  description: "Consultation, written scope, the work, and a handoff. Every Talon consulting project follows the same path.",
};

const steps = [
  {
    title: "Project consultation",
    body: "A call to name the outcome, the constraint, and who can decide. Thirty minutes is usually enough to tell whether a written scope is the next step.",
  },
  {
    title: "Written scope",
    body: "What will be done, what will not, the fee, and the date. Nothing starts until that page is signed. The fee buys the defined work. It is not an hourly blank check.",
  },
  {
    title: "The work",
    body: "One person does it. You get a status when something needs a decision, and a reply within one business day. Emergencies get best effort, not a guarantee.",
  },
  {
    title: "Handoff",
    body: "The result, the documentation, and what the company owns when the project ends. Access that was issued for the work is removed.",
  },
];

export default async function ConsultingProcessPage() {
  const contact = await areaHref("consulting", "/contact");

  return (
    <ConsultingFrame>
      <h1 className="font-serif text-4xl font-medium tracking-tight text-ink">How a project runs</h1>
      <p className="mt-3 max-w-3xl text-lg text-ink/70">
        Every project follows the same path. That is what makes a one-person practice able to finish the work.
      </p>
      <ol className="mt-8 space-y-4">
        {steps.map((step, index) => (
          <li key={step.title} className="card">
            <h2 className="font-serif text-xl font-medium text-ink">
              {index + 1}. {step.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/70">{step.body}</p>
          </li>
        ))}
      </ol>
      <Link href={contact} className="btn-ink mt-8">
        Book a project consultation
      </Link>
    </ConsultingFrame>
  );
}
