import type { Metadata } from "next";
import Link from "next/link";
import SupportShell from "@/components/SupportShell";
import { areaHref } from "@/lib/request-site";
import { supportSections } from "@/lib/support/sections";

export const metadata: Metadata = {
  title: "Support | Talon Software",
  description: "The Talon Software client support portal. Sign-in is not open yet.",
};

export default async function SupportHomePage() {
  const signIn = await areaHref("support", "/sign-in");
  const sections = await Promise.all(
    supportSections.map(async (section) => ({
      ...section,
      href: await areaHref("support", section.path),
    }))
  );

  return (
    <SupportShell>
      <h1 className="font-serif text-4xl font-medium tracking-tight text-ink">Client support</h1>
      <div className="mt-4 max-w-3xl space-y-4 text-lg leading-relaxed text-ink/75">
        <p>
          This is the support portal for a company that already works with Talon Software. Each company will have
          its own sign-in.
        </p>
        <p>That sign-in is not open yet. The sections below are the shape of the portal, not a live system.</p>
      </div>
      <Link href={signIn} className="btn-ink mt-8">
        Sign-in page
      </Link>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <article key={section.path} className="card">
            <h2 className="font-serif text-2xl font-medium text-ink">{section.title}</h2>
            <p className="mt-3 text-ink/75">{section.body}</p>
            <Link href={section.href} className="mt-4 inline-block text-sm font-semibold text-pine underline">
              {section.label}
            </Link>
          </article>
        ))}
      </div>
    </SupportShell>
  );
}
