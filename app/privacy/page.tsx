import type { Metadata } from "next";
import SiteFrame from "@/components/SiteFrame";

export const metadata: Metadata = {
  title: "Privacy | Talon Software",
  description: "How Talon Software handles information submitted through this website.",
};

export default function PrivacyPage() {
  return (
    <SiteFrame>
      <h1 className="font-serif text-4xl font-medium tracking-tight text-ink">Privacy</h1>
      <div className="mt-4 max-w-3xl space-y-4 text-ink/70">
        <p>This policy describes information collected when you use this website.</p>
        <h2 className="font-serif text-xl font-medium text-ink">Information collected</h2>
        <p>The discovery form collects:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Name, email, and phone</li>
          <li>Company and role</li>
          <li>Rough headcount</li>
          <li>What you are looking for and what prompted the inquiry</li>
          <li>How you heard about Talon Software</li>
          <li>Your message</li>
        </ul>
        <h2 className="font-serif text-xl font-medium text-ink">How it is used</h2>
        <p>
          Submissions are used to reply to the inquiry. They are not sold. The message is delivered
          by email through a mail provider acting as a processor.
        </p>
        <h2 className="font-serif text-xl font-medium text-ink">Contact</h2>
        <p>Questions about this policy can be sent through the form on this website.</p>
      </div>
    </SiteFrame>
  );
}
