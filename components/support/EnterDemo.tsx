"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { enterTier, type Tier } from "./store";

export default function EnterDemo({ tier, href }: { tier: Tier; href: string }) {
  const router = useRouter();
  useEffect(() => {
    enterTier(tier);
    router.replace(href);
  }, [tier, href, router]);
  return (
    <main className="grid min-h-screen place-items-center bg-[#f4f4f5] px-4 text-sm text-ink">
      <p>This is a demo.</p>
    </main>
  );
}
