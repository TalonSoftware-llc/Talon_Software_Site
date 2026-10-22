import type { Metadata } from "next";
import Shell from "@/components/support/Shell";
import { areaHref, getRequestSite } from "@/lib/request-site";
import { getSupportPrincipal } from "@/lib/support/session";

const titles: [string, string][] = [
  ["/app/people/add", "Onboard user | Talon Support"],
  ["/app/requests/new", "New request | Talon Support"],
  ["/app/projects", "Projects | Talon Support"],
  ["/app/people", "People | Talon Support"],
  ["/app/requests", "Requests | Talon Support"],
  ["/app/support", "Support | Talon Support"],
  ["/app/spending", "Spending | Talon Support"],
  ["/app/report", "Report | Talon Support"],
  ["/app/pro", "Pro | Talon Support"],
  ["/app/settings", "Settings | Talon Support"],
  ["/app/password", "Reset password | Talon Support"],
  ["/app/devices", "My devices | Talon Support"],
  ["/app/assistant", "Ask | Talon Support"],
  ["/website", "Website | Talon Support"],
  ["/network", "Network | Talon Support"],
  ["/systems", "Systems | Talon Support"],
  ["/app", "Home | Talon Support"],
];

function titleFor(path: string): string {
  const hit = titles.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`));
  return hit?.[1] ?? "Talon Support";
}

export async function generateMetadata(): Promise<Metadata> {
  const site = await getRequestSite();
  return { title: titleFor(site.publicPath) };
}

export default async function SupportAppLayout({ children }: { children: React.ReactNode }) {
  const site = await getRequestSite();
  const principal = await getSupportPrincipal();
  const contactHref = await areaHref("main", "/contact");
  const prefix = site.linkMode === "path" ? "/support" : "";
  return (
    <Shell demo={principal === null} prefix={prefix} contactHref={contactHref}>
      {children}
    </Shell>
  );
}
