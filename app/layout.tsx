import type { Metadata } from "next";
import { Fraunces, Source_Sans_3, Source_Serif_4 } from "next/font/google";
import { workAsyncStorage } from "next/dist/server/app-render/work-async-storage.external";
import { getRequestSite } from "@/lib/request-site";
import { absoluteUrl, type AreaId } from "@/lib/sites";
import "./globals.css";

const sans = Source_Sans_3({ subsets: ["latin"], variable: "--font-sans" });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif" });
const wordmark = Fraunces({ subsets: ["latin"], weight: "500", variable: "--font-wordmark" });

const practiceDescription =
  "Fractional technology leadership for owner-led companies in Vancouver, Washington, and remote where the company allows it.";

const shareCards: Record<AreaId, { title: string; siteName: string; openGraph: string; twitter: string }> = {
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

function areaFromRoute(route: string): AreaId {
  if (route === "/consulting" || route.startsWith("/consulting/")) return "consulting";
  if (route === "/engineering" || route.startsWith("/engineering/")) return "engineering";
  if (route === "/support" || route.startsWith("/support/")) return "support";
  return "main";
}

function publicPathFromRoute(route: string, area: AreaId): string {
  if (area === "main") return route || "/";
  const prefix = `/${area}`;
  if (route === prefix) return "/";
  if (route.startsWith(`${prefix}/`)) return route.slice(prefix.length) || "/";
  return "/";
}

function renderedRoute(): string | undefined {
  const route = workAsyncStorage.getStore()?.route;
  if (!route) return undefined;
  return route.startsWith("/") ? route : `/${route}`;
}

function metadataFor(area: AreaId, publicPath: string, index: boolean): Metadata {
  const card = shareCards[area];
  const canonical = absoluteUrl(area, publicPath || "/");
  return {
    metadataBase: new URL(absoluteUrl(area, "/")),
    title: {
      default: "Talon Software",
      template: "%s",
    },
    description: practiceDescription,
    alternates: { canonical },
    icons: {
      icon: "/Talon Software Logo.jpg",
      shortcut: "/Talon Software Logo.jpg",
      apple: "/Talon Software Logo.jpg",
    },
    openGraph: {
      title: card.title,
      description: card.openGraph,
      url: canonical,
      siteName: card.siteName,
      images: [
        {
          url: "/Talon Software Logo.jpg",
          width: 1200,
          height: 630,
          alt: "Talon Software - Professional Software Solutions",
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: card.title,
      description: card.twitter,
      images: ["/Talon Software Logo.jpg"],
    },
    robots: index ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const route = renderedRoute();
  // Reading the request opts the response out of the cache. Do that for the
  // portal, where the public path can differ from the route, and when the
  // rendered route is unavailable. Marketing pages use the route alone.
  if (!route || route.includes("[") || areaFromRoute(route) === "support") {
    const site = await getRequestSite();
    return metadataFor(site.area, site.publicPath || "/", site.linkMode !== "path");
  }
  const area = areaFromRoute(route);
  return metadataFor(area, publicPathFromRoute(route, area), true);
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${serif.variable} ${wordmark.variable} font-sans`}>{children}</body>
    </html>
  );
}
