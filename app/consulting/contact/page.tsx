import type { Metadata } from "next";
import ConsultingFrame from "@/components/ConsultingFrame";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Book a consultation | Talon Consulting",
  description: "Book a project consultation with Talon Software.",
};

interface ConsultingContactProps {
  searchParams: Promise<{ interest?: string }> | { interest?: string };
}

const interestMap: Record<string, string> = {
  assessment: "Assessment",
  service: "Separate service",
  plan: "Plan",
  partner: "Partner introduction",
  call: "Discovery call",
};

export default async function ConsultingContactPage({ searchParams }: ConsultingContactProps) {
  const resolved = searchParams instanceof Promise ? await searchParams : searchParams;
  const interest = resolved?.interest ? interestMap[resolved.interest] : "Separate service";

  return (
    <ConsultingFrame>
      <h1 className="font-serif text-4xl font-medium tracking-tight text-ink">Book a project consultation</h1>
      <p className="mt-3 max-w-3xl text-ink/70">
        Name the outcome, the constraint, and who decides. You will get a reply within one business day. Where the
        work is a fit, a written scope follows.
      </p>
      <div className="mt-8 max-w-3xl card">
        <ContactForm key={interest} interest={interest} />
      </div>
    </ConsultingFrame>
  );
}
