import type { Metadata } from "next";
import { mainOrigin } from "@/lib/sites";

export const metadata: Metadata = {
  title: "Talon Software",
  description: "Coming soon.",
  openGraph: {
    title: "Talon Software",
    description: "Coming soon.",
    url: "https://talon.engineering",
    siteName: "Talon Software",
  },
  twitter: {
    card: "summary",
    title: "Talon Software",
    description: "Coming soon.",
  },
};

export default function EngineeringPage() {
  const home = mainOrigin();
  const label = new URL(home).hostname;

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6 text-ink">
      <div className="w-full max-w-lg text-center">
        <h1 className="font-wordmark text-5xl font-medium tracking-tight text-ink md:text-6xl">Talon Software</h1>
        <p className="mt-5 text-lg text-ink/70">Coming soon.</p>
        <a
          href={home}
          className="mt-8 inline-block text-sm font-semibold text-pine underline decoration-pine/40 underline-offset-4 hover:decoration-pine"
        >
          {label}
        </a>
      </div>
    </main>
  );
}
