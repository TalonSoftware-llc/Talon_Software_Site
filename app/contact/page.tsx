import type { Metadata } from "next";
import SiteFrame from "@/components/SiteFrame";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact | Talon Software",
  description: "Book a 30-minute discovery call with Talon Software.",
};

interface ContactPageProps {
  searchParams: Promise<{ interest?: string }> | { interest?: string };
}

const interestMap: Record<string, string> = {
  assessment: "Assessment",
  service: "Separate service",
  plan: "Plan",
  partner: "Partner introduction",
  call: "Discovery call",
};

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const resolved = searchParams instanceof Promise ? await searchParams : searchParams;
  const interest = resolved?.interest ? interestMap[resolved.interest] : undefined;

  return (
    <SiteFrame>
      <h1 className="font-serif text-4xl font-medium tracking-tight text-ink">Book a discovery call</h1>
      <p className="mt-3 max-w-3xl text-ink/70">
        Thirty minutes, free. The call confirms a real reason to talk, a budget, and who decides.
        You will get a reply within one business day.
      </p>
      <div className="mt-8 max-w-3xl card">
        <ContactForm key={interest ?? "general"} interest={interest} />
      </div>
    </SiteFrame>
  );
}
