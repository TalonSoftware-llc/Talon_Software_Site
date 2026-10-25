import type { Metadata } from "next";
import { getRequestSite } from "@/lib/request-site";
import { shareMetadata } from "@/lib/share-cards";
import { absoluteUrl } from "@/lib/sites";

export async function generateMetadata(): Promise<Metadata> {
  const site = await getRequestSite();
  return shareMetadata(site.area, absoluteUrl(site.area, site.publicPath || "/"), site.linkMode);
}

export default function ConsultingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
