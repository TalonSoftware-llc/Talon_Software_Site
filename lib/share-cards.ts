import type { Metadata } from "next";
import { absoluteUrl, type AreaId, type LinkMode } from "@/lib/sites";

const logo = {
  url: "/Talon Software Logo.jpg",
  width: 1200,
  height: 630,
  alt: "Talon Software - Professional Software Solutions",
};

const cards: Record<AreaId, { title: string; siteName: string; openGraph: string; twitter: string }> = {
  main: {
    title: "Talon Software",
    siteName: "Talon Software",
    openGraph: "Fractional technology leadership for owner-led companies. Monthly plans and fixed assessments.",
    twitter: "Fractional technology leadership for owner-led companies in Vancouver, Washington.",
  },
  consulting: {
    title: "Talon Consulting",
    siteName: "Talon Consulting",
    openGraph:
      "Project consulting for technology and AI. A defined engagement, a written scope, and a result the company keeps.",
    twitter:
      "Project consulting for technology and AI. A defined engagement, a written scope, and a result the company keeps.",
  },
  engineering: {
    title: "Talon Engineering",
    siteName: "Talon Engineering",
    openGraph: "Talon Engineering is not open yet.",
    twitter: "Talon Engineering is not open yet.",
  },
  support: {
    title: "Talon Support",
    siteName: "Talon Support",
    openGraph: "The Talon Software client portal.",
    twitter: "The Talon Software client portal.",
  },
};

export function shareMetadata(area: AreaId, canonical: string, linkMode: LinkMode): Metadata {
  const card = cards[area];
  return {
    metadataBase: new URL(absoluteUrl(area, "/")),
    alternates: { canonical },
    openGraph: {
      title: card.title,
      description: card.openGraph,
      url: canonical,
      siteName: card.siteName,
      images: [logo],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: card.title,
      description: card.twitter,
      images: [logo.url],
    },
    robots: linkMode === "path" ? { index: false, follow: false } : { index: true, follow: true },
  };
}
