import type { Metadata } from "next";
import { Fraunces, Source_Sans_3, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const sans = Source_Sans_3({ subsets: ["latin"], variable: "--font-sans" });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif" });
const wordmark = Fraunces({ subsets: ["latin"], weight: "500", variable: "--font-wordmark" });

export const metadata: Metadata = {
  title: {
    default: "Talon Software",
    template: "%s",
  },
  description:
    "Fractional technology leadership for owner-led companies in Vancouver, Washington, and remote where the company allows it.",
  icons: {
    icon: "/Talon Software Logo.jpg",
    shortcut: "/Talon Software Logo.jpg",
    apple: "/Talon Software Logo.jpg",
  },
  openGraph: {
    title: "Talon Software",
    description:
      "Fractional technology leadership for owner-led companies. Monthly plans and fixed assessments.",
    url: "https://talonsoftware.com",
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
    description:
      "Fractional technology leadership for owner-led companies in Vancouver, Washington.",
    images: ["/Talon Software Logo.jpg"],
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://talonsoftware.com"),
};

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
