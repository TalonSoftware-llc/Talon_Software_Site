import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { normalizeHostname, sitemapUrls } from "@/lib/sites";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const headerList = await headers();
  const hostname = normalizeHostname(headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "");

  return sitemapUrls(hostname).map((url) => ({ url }));
}
