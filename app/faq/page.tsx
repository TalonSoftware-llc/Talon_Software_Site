import type { Metadata } from "next";
import Link from "next/link";
import SiteFrame from "@/components/SiteFrame";

export const metadata: Metadata = {
  title: "FAQ | Talon Software",
  description:
    "Answers about fractional CTO services from Talon Software: plans, assessments, support, and how an engagement works.",
};

const groups: { title: string; items: { q: string; a: string }[] }[] = [
  {
    title: "The role",
    items: [
      {
        q: "What is a fractional CTO?",
        a: "A fractional CTO is the technology leader a company keeps on a monthly plan instead of hiring a full-time executive. The work is strategy, security, vendors, budget, and the systems the business runs on.",
      },
      {
        q: "Is a fractional CTO an officer of our company?",
        a: "No. Fractional CTO is a working title. Talon Software is an independent advisor. The role does not make anyone an officer of the client company and does not include authority to bind that company.",
      },
      {
        q: "How is this different from a managed IT provider?",
        a: "A managed IT provider keeps devices, accounts, and tickets moving. A fractional CTO decides what the technology should be, what it should cost, and what happens next. Support can sit inside the monthly plan, but the leadership work is the point of the engagement.",
      },
      {
        q: "How is this different from a project consultant?",
        a: "A project has a start and an end. A monthly plan stays with the company: a roadmap, a budget, vendor decisions, and someone leadership can ask when the next question comes up. Defined projects can still be sold on their own.",
      },
      {
        q: "Who will I be working with?",
        a: "Talon Software is the practice of Kendall Tapani. All services are provided by him, from the first call through the monthly plan. He also built this website, and he sends his best wishes.",
      },
    ],
  },
  {
    title: "Fit",
    items: [
      {
        q: "Who is this for?",
        a: "A company that needs technology leadership and does not need a full-time CTO. The conversation is usually with the owner, CEO, COO, or CFO. A strong fit is a business where technology decisions keep coming back to leadership, and a full-time hire is more than the role requires.",
      },
      {
        q: "Who is this not for?",
        a: "A company shopping for a help desk, a founder looking for a technical cofounder, a team that needs more developers rather than a leader, and an organization that already has a technology executive.",
      },
      {
        q: "How do we start?",
        a: "Request a discovery call. Thirty minutes is enough to tell whether an assessment is the right next step.",
      },
    ],
  },
  {
    title: "How an engagement runs",
    items: [
      {
        q: "What happens on the first call?",
        a: "Thirty minutes, at no charge. The call confirms a real reason to talk, a budget, and who can decide. Where the work is a fit, an assessment proposal follows within one business day.",
      },
      {
        q: "What are the steps after that?",
        a: "A paid assessment, a readout to leadership, onboarding over the first two weeks, then steady state. Onboarding covers access, introductions to vendors and staff, and a 30-60-90 day plan. Steady state is the agreed cadence, a monthly report, and a quarterly roadmap review.",
      },
      {
        q: "Where do you work?",
        a: "Talon Software is based in Vancouver, WA. Client work can be on site or remote, at the cadence agreed in the plan.",
      },
      {
        q: "How do you handle access to our systems?",
        a: "Accounts are issued in a named user. Shared passwords are not used. Hardware-key multi-factor authentication is required.",
      },
      {
        q: "What if the work runs larger than expected?",
        a: "Hours are tracked privately against the quote. If a client runs over the planned hours for two months, the scope is reset rather than quietly absorbing the extra work.",
      },
      {
        q: "Can you help with cyber insurance, HIPAA, SOC 2, or CMMC?",
        a: "On Pro, yes, as readiness and paperwork: insurance applications, customer security questionnaires, and preparation for frameworks such as SOC 2, HIPAA, or CMMC. A licensed firm still performs any formal audit.",
      },
      {
        q: "Can you help us decide what to do with AI?",
        a: "On Pro. The work is a short list of workflows worth automating, a tool choice, a usage policy, and one pilot carried through to a result. It is not a mandate to adopt a tool for its own sake.",
      },
    ],
  },
  {
    title: "Plans and price",
    items: [
      {
        q: "What are the two plans?",
        a: "Essentials runs the technology: help desk and accounts, the software and network, licenses and vendors, the technology budget, and baseline security, with a monthly review. Pro includes that work and adds the decisions Essentials does not cover: security leadership, compliance questionnaires, software oversight, hiring support, AI decisions, and a seat in leadership meetings.",
      },
      {
        q: "Why is there no price list?",
        a: "Every company gets a quote. Price follows headcount, locations, the condition of the current setup, compliance requirements, and how involved leadership wants the work to be. The fee buys defined responsibilities. It is not an hourly rate.",
      },
      {
        q: "Is support included?",
        a: "Yes. Support is part of the monthly price, not a second invoice. At the start, daily support is handled directly. Later, a managed IT partner can take the ticket work under the same relationship. A company that already likes its provider can keep that provider, with the work directed and reviewed.",
      },
      {
        q: "Are you available around the clock?",
        a: "No. Response is during business hours. Messages are answered within one business day. Emergencies get best effort, not a guarantee. There is no personal on-call.",
      },
      {
        q: "What are the contract terms?",
        a: "Three months minimum, then month to month with 30 days' notice. Invoices go out in advance and are due in 15 days. Assessments and defined projects are priced separately, with or without a monthly plan.",
      },
      {
        q: "What does a plan client receive each month?",
        a: "Essentials includes a monthly review of what is in place, what it costs, and what needs a decision. Pro includes weekly presence and a seat in leadership meetings.",
      },
    ],
  },
  {
    title: "Services",
    items: [
      {
        q: "What is an assessment?",
        a: "A paid review before a monthly plan. It includes a meeting with leadership and staff, a look at the relevant systems, a written report, and a readout. If a plan makes sense, the proposal is the last page of that readout.",
      },
      {
        q: "What kinds of assessments are there?",
        a: "Three. A technology assessment covers systems, vendors, and spend, and produces a twelve-month roadmap. A business assessment looks at how technology supports operations. A network security assessment reviews network, access, backups, and exposure, with findings ranked by risk.",
      },
      {
        q: "Does the assessment count toward a plan?",
        a: "If a plan is signed within 30 days, half of the assessment fee is credited toward the first month.",
      },
      {
        q: "What other services are there?",
        a: "Custom website management, an application security audit, a backup and recovery test, and a security questionnaire for an insurer or a customer. Each is quoted on its own and does not require a monthly plan. An application security audit ranks findings. It is not a certification.",
      },
      {
        q: "Can you lead a project without a monthly plan?",
        a: "Yes. A project is a defined piece of work with a start, an end, and a deliverable, such as a migration, an ERP or CRM selection, or an office move. Projects are taken when there is room to finish them.",
      },
      {
        q: "Do you write production code or sign audits?",
        a: "Staff-augmentation coding is not the default. Software oversight on Pro covers build-versus-buy, selecting a developer or agency, architecture and code review, and delivery. Formal audit attestation and legal advice stay with licensed firms. The practice prepares the client. Those firms sign.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <SiteFrame>
      <h1 className="font-serif text-4xl font-medium tracking-tight text-ink">FAQ</h1>
      <p className="mt-3 max-w-3xl text-lg text-ink/70">
        Straight answers about fractional CTO services, the two monthly plans, and how an
        engagement starts.
      </p>

      <div className="mt-12 space-y-12">
        {groups.map((group) => (
          <section key={group.title}>
            <h2 className="font-serif text-2xl font-medium text-ink">{group.title}</h2>
            <div className="mt-4 divide-y divide-[#e4ddd2] border-y border-[#e4ddd2]">
              {group.items.map((item) => (
                <details key={item.q} className="group py-4">
                  <summary className="cursor-pointer list-none font-medium text-ink [&::-webkit-details-marker]:hidden">
                    <span className="flex items-start justify-between gap-6">
                      {item.q}
                      <span className="mt-1 text-ink/40 group-open:hidden" aria-hidden="true">
                        +
                      </span>
                      <span className="mt-1 hidden text-ink/40 group-open:inline" aria-hidden="true">
                        –
                      </span>
                    </span>
                  </summary>
                  <p className="mt-3 max-w-3xl leading-relaxed text-ink/75">{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>

      <Link href="/contact" className="btn-ink mt-12">
        Request a discovery call
      </Link>
    </SiteFrame>
  );
}
