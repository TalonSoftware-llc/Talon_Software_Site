import type { Metadata } from "next";
import Link from "next/link";
import SiteFrame from "@/components/SiteFrame";
import { areaHref } from "@/lib/request-site";

export const metadata: Metadata = {
  title: "Engineering | Talon Software",
  description: "Talon Software engineering is not open yet.",
};

export default async function EngineeringPage() {
  const consulting = await areaHref("consulting", "/");

  return (
    <SiteFrame>
      <p className="eyebrow">Coming soon</p>
      <h1 className="mt-5 font-serif text-4xl font-medium tracking-tight text-ink">Engineering</h1>
      <div className="mt-4 max-w-3xl space-y-4 text-lg leading-relaxed text-ink/75">
        <p>This part of the practice is not open yet.</p>
        <p>
          Technology leadership for an owner-led company stays with the consulting practice until this page has
          something to show.
        </p>
      </div>
      <Link href={consulting} className="btn-ink mt-8">
        Consulting
      </Link>
    </SiteFrame>
  );
}
