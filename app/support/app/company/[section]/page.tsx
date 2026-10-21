import { notFound } from "next/navigation";
import { CompanyView } from "@/components/support/views/Company";

const sections = ["devices", "software", "vendors", "locations", "documents"] as const;

export default async function CompanySectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!sections.includes(section as (typeof sections)[number])) notFound();
  return <CompanyView section={section as (typeof sections)[number]} />;
}
