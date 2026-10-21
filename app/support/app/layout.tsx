import type { Metadata } from "next";
import Shell from "@/components/support/Shell";
import { areaHref, getRequestSite } from "@/lib/request-site";
import { getSupportPrincipal } from "@/lib/support/session";

const titles: [string, string][] = [
  ["/app/people/onboard", "Onboard | Talon Support"],
  ["/app/people/audit", "Audit log | Talon Support"],
  ["/app/people/compromised", "Compromised account | Talon Support"],
  ["/app/tickets/new", "New ticket | Talon Support"],
  ["/app/reports/monthly", "Monthly report | Talon Support"],
  ["/app/reports/qbr", "Quarterly review | Talon Support"],
  ["/app/help", "Password and MFA | Talon Support"],
  ["/app/people", "People | Talon Support"],
  ["/app/tickets", "Tickets | Talon Support"],
  ["/app/knowledge", "Knowledge | Talon Support"],
  ["/app/company", "Company | Talon Support"],
  ["/app/security", "Security | Talon Support"],
  ["/app/projects", "Projects | Talon Support"],
  ["/app/reports", "Reports | Talon Support"],
  ["/app/billing", "Billing | Talon Support"],
  ["/app/settings", "Settings | Talon Support"],
  ["/app/assistant", "Assistant | Talon Support"],
  ["/app", "Overview | Talon Support"],
];

function titleFor(path: string): string {
  const hit = titles.find(([prefix]) => path === prefix || path.startsWith(`${prefix}/`));
  return hit?.[1] ?? "Talon Support";
}

export async function generateMetadata(): Promise<Metadata> {
  const site = await getRequestSite();
  return {
    title: titleFor(site.publicPath),
    description: "Demo workspace for Talon Support. Sample data only. The assistant is scripted and does not call a model.",
  };
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
