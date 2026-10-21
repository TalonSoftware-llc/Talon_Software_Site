import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { normalizeHostname, robotsForHost } from "@/lib/sites";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headerList = await headers();
  const hostname = normalizeHostname(headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "");
  const policy = robotsForHost(hostname);

  if (!policy.index) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: policy.sitemap,
  };
}
