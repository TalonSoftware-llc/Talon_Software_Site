import type { Metadata } from "next";
import { Fraunces, Source_Sans_3, Source_Serif_4 } from "next/font/google";
import { getRequestSite } from "@/lib/request-site";
import { absoluteUrl } from "@/lib/sites";
import "./globals.css";

const sans = Source_Sans_3({ subsets: ["latin"], variable: "--font-sans" });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif" });
const wordmark = Fraunces({ subsets: ["latin"], weight: "500", variable: "--font-wordmark" });

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getRequestSite();
  const canonical = absoluteUrl(site.area, site.publicPath || "/");
  const description =
    "Fractional technology leadership for owner-led companies in Vancouver, Washington, and remote where the company allows it.";

  return {
    metadataBase: new URL(absoluteUrl(site.area, "/")),
    title: {
      default: "Talon Software",
      template: "%s",
    },
    description,
    alternates: { canonical },
    icons: {
      icon: "/Talon Software Logo.jpg",
      shortcut: "/Talon Software Logo.jpg",
      apple: "/Talon Software Logo.jpg",
    },
    openGraph: {
      title: "Talon Software",
      description:
        "Fractional technology leadership for owner-led companies. Monthly plans and fixed assessments.",
      url: canonical,
      siteName: "Talon Software",
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
      title: "Talon Software",
      description: "Fractional technology leadership for owner-led companies in Vancouver, Washington.",
      images: ["/Talon Software Logo.jpg"],
    },
    robots: site.linkMode === "path" ? { index: false, follow: false } : { index: true, follow: true },
  };
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
