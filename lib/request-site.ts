import { cache } from "react";
import { headers } from "next/headers";
import { hrefFor, isAreaId, normalizeHostname, resolveHostRoute, type AreaId, type LinkMode } from "@/lib/sites";

export type RequestSite = {
  area: AreaId;
  linkMode: LinkMode;
  publicPath: string;
  hostname: string;
};

export const getRequestSite = cache(async (): Promise<RequestSite> => {
  const headerList = await headers();
  const hostHeader = headerList.get("x-forwarded-host") ?? headerList.get("host") ?? "";
  const areaHeader = headerList.get("x-talon-area");
  const modeHeader = headerList.get("x-talon-link-mode");
  const pathHeader = headerList.get("x-talon-public-path");

  if (isAreaId(areaHeader) && (modeHeader === "domain" || modeHeader === "path") && pathHeader?.startsWith("/")) {
    return {
      area: areaHeader,
      linkMode: modeHeader,
      publicPath: pathHeader,
      hostname: normalizeHostname(hostHeader),
    };
  }

  const decision = resolveHostRoute({ hostHeader, pathname: "/" });
  if (decision.kind === "redirect" || decision.kind === "notfound") {
    return { area: "main", linkMode: "path", publicPath: "/", hostname: normalizeHostname(hostHeader) };
  }
  return {
    area: decision.area,
    linkMode: decision.linkMode,
    publicPath: decision.publicPath,
    hostname: normalizeHostname(hostHeader),
  };
});

export async function areaHref(area: AreaId, path: string): Promise<string> {
  const site = await getRequestSite();
  return hrefFor(site, area, path);
}
