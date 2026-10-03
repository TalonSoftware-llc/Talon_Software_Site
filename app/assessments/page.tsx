import type { Metadata } from "next";
import Link from "next/link";
import SiteFrame from "@/components/SiteFrame";

export const metadata: Metadata = {
  title: "Services | Talon Software",
  description:
    "Assessments and other fixed work from Talon Software: website management, application security, backups, and security questionnaires.",
};

const assessments = [
  {
    title: "Technology assessment",
    body: "Systems, vendors, and spend reviewed. You get a written report and a 12-month roadmap.",
  },
  {
    title: "Business assessment",
    body: "How well technology supports operations: workflows, bottlenecks, and wasted spend.",
  },
  {
    title: "Network security assessment",
    body: "Network, access, backups, and exposure reviewed. Findings are ranked by risk.",
  },
];

const services = [
  {
    title: "Custom website management",
    body: "Hosting, updates, the domain and certificate, content changes, and a person to call when the site breaks. Quoted on its own, separate from a monthly plan.",
  },
  {
    title: "Application security audit",
    body: "A review of a web application: who can get in, whether it is kept up to date, how data is handled, and the weaknesses that show from the outside and from an admin account. Findings are ranked. This is not a certification. A licensed firm still signs any formal audit.",
  },
  {
    title: "Backup and recovery test",
    body: "Backups are restored on purpose, not assumed. You get a record of what came back, what failed, and what to fix.",
  },
  {
    title: "Security questionnaire",
    body: "One cyber insurance application or customer security form, completed with the evidence behind each answer.",
  },
];

export default function AssessmentsPage() {
  return (
    <SiteFrame>
      <h1 className="font-serif text-4xl font-medium tracking-tight text-ink">Services</h1>
      <p className="mt-3 max-w-3xl text-ink/70">
        Work sold on its own, with or without a monthly plan. Assessments are the reviews that
        lead into a plan. The other services are quoted separately.
      </p>

      <h2 className="mt-10 font-serif text-2xl font-medium text-ink">Assessments</h2>
      <p className="mt-3 max-w-3xl text-ink/70">
        Each assessment includes a written report and a readout to leadership. The plan proposal
        is the last page of that readout. If you sign a plan within 30 days, half of the assessment
        fee is credited toward the first month.
      </p>
      <div className="mt-6 grid gap-4">
        {assessments.map((item) => (
          <article key={item.title} className="card">
            <h3 className="font-serif text-xl font-medium text-ink">{item.title}</h3>
            <p className="mt-2 text-sm text-ink/70">{item.body}</p>
          </article>
        ))}
      </div>

      <h2 className="mt-10 font-serif text-2xl font-medium text-ink">Other services</h2>
      <p className="mt-3 max-w-3xl text-ink/70">
        Defined work with a result you can hand to someone else. These do not require a monthly
        plan.
      </p>
      <div className="mt-6 grid gap-4">
        {services.map((item) => (
          <article key={item.title} className="card">
            <h3 className="font-serif text-xl font-medium text-ink">{item.title}</h3>
            <p className="mt-2 text-sm text-ink/70">{item.body}</p>
          </article>
        ))}
      </div>

      <section className="mt-8 card">
        <h2 className="font-serif text-xl font-medium text-ink">Projects</h2>
        <p className="mt-2 text-sm text-ink/70">
          A defined initiative with a start, an end, and a deliverable is quoted on its own. Typical
          work is a migration, an ERP or CRM selection, or an office move. Projects are taken when
          there is room to finish them.
        </p>
      </section>

      <Link href="/contact?interest=service" className="btn-ink mt-8">
        Ask about a service
      </Link>
    </SiteFrame>
  );
}
