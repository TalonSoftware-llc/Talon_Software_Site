import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SupportShell from "@/components/SupportShell";
import { supportSections } from "@/lib/support/sections";

interface SupportSectionPageProps {
  params: Promise<{ section: string }>;
}

function findSection(section: string) {
  return supportSections.find((item) => item.path === `/${section}`);
}

export async function generateMetadata({ params }: SupportSectionPageProps): Promise<Metadata> {
  const { section } = await params;
  const match = findSection(section);
  if (!match) return {};
  return {
    title: `${match.title} | Talon Software`,
    description: match.description,
  };
}

export default async function SupportSectionPage({ params }: SupportSectionPageProps) {
  const { section } = await params;
  const match = findSection(section);
  if (!match) notFound();

  return (
    <SupportShell>
      <h1 className="font-serif text-4xl font-medium tracking-tight text-ink">{match.title}</h1>
      <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink/75">{match.body}</p>
    </SupportShell>
  );
}
