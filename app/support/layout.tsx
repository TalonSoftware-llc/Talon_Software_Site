import type { Metadata } from "next";
import { getRequestSite } from "@/lib/request-site";
import { shareMetadata } from "@/lib/share-cards";
import { getSupportPrincipal } from "@/lib/support/session";
import { absoluteUrl } from "@/lib/sites";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getRequestSite();
  return shareMetadata(site.area, absoluteUrl(site.area, site.publicPath || "/"), site.linkMode);
}

/**
 * Authentication seam for Talon Support.
 * getSupportPrincipal() returns null until a real session provider is added.
 * The sign-in screen does not collect credentials. The app routes are a demo.
 * When a principal exists, enforce access here.
 */
export default async function SupportLayout({ children }: { children: React.ReactNode }) {
  await getSupportPrincipal();
  return children;
}
