import type { Metadata } from "next";
import { Fraunces, Source_Sans_3, Source_Serif_4 } from "next/font/google";
import { shareMetadata } from "@/lib/share-cards";
import "./globals.css";

const sans = Source_Sans_3({ subsets: ["latin"], variable: "--font-sans" });
const serif = Source_Serif_4({ subsets: ["latin"], variable: "--font-serif" });
const wordmark = Fraunces({ subsets: ["latin"], weight: "500", variable: "--font-wordmark" });

// Cached with the production host. `./` resolves against each page path.
// Path-mode previews of these pages are noindex from the proxy response header.
// Consulting, engineering, and support apply linkMode === "path" themselves.
export const metadata: Metadata = {
  ...shareMetadata("main", "./", "domain"),
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
