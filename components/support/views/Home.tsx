"use client";

import { usePageContext } from "../page-context";
import { useDemo } from "../use-demo";
import { SupportHomeCard } from "./Support";
import { NetworkHomeCard, SystemsHomeCard, WebsiteHomeCard } from "./Systems";

export default function Home() {
  const demo = useDemo();
  usePageContext({ section: "home", title: "Home", hints: ["Is the website up?", "What is open?"] });
  if (demo.role !== "leadership") return null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Home</h1>
      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-2">
        <WebsiteHomeCard />
        <NetworkHomeCard />
        <SystemsHomeCard />
        <SupportHomeCard />
      </div>
    </div>
  );
}
