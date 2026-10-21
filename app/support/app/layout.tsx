import type { Metadata } from "next";
import SupportAppShell from "@/components/support/SupportAppShell";
import { getRequestSite } from "@/lib/request-site";
import { hrefFor } from "@/lib/sites";

const titles: Record<string, string> = {
  "/app": "Overview | Talon Support",
  "/app/assistant": "AI assistant | Talon Support",
  "/app/tickets": "Tickets | Talon Support",
  "/app/knowledge": "Knowledge base | Talon Support",
  "/app/company": "Company | Talon Support",
};

export async function generateMetadata(): Promise<Metadata> {
  const site = await getRequestSite();
  return {
    title: titles[site.publicPath] ?? "Talon Support",
    description: "Demo workspace for Talon Support. Sample data only.",
  };
}

const items = [
  { path: "/app", label: "Overview" },
  { path: "/app/assistant", label: "AI assistant" },
  { path: "/app/tickets", label: "Tickets" },
  { path: "/app/knowledge", label: "Knowledge base" },
  { path: "/app/company", label: "Company" },
];

export default async function SupportAppLayout({ children }: { children: React.ReactNode }) {
  const site = await getRequestSite();
  const nav = items.map((item) => ({ ...item, href: hrefFor(site, "support", item.path) }));

  return (
    <SupportAppShell nav={nav} currentPath={site.publicPath} signInHref={hrefFor(site, "support", "/")}>
      {children}
    </SupportAppShell>
  );
}
