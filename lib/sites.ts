/**
 * One website, several hosts.
 *
 * The main domain comes from NEXT_PUBLIC_SITE_URL (default https://talonsoftware.dev).
 * Change that single value when talon.software replaces talonsoftware.dev.
 * Area hosts live in this file so they are not repeated through the app.
 *
 * On a real area host, public URLs have no prefix: https://talon.consulting/services.
 * On localhost and *.vercel.app, the same page is /consulting/services.
 * The main site keeps its original paths (/plans, /contact, and the rest).
 */

export type AreaId = "main" | "consulting" | "engineering" | "support";
export type LinkMode = "domain" | "path";

export type AreaDef = {
  id: AreaId;
  host: string;
  /** Empty for the main site. Used on localhost and preview hosts. */
  prefix: string;
  /** Paths as they appear on this area's own domain. "/" is the area home. */
  paths: readonly string[];
};

export type RouteDecision =
  | { kind: "passthrough"; area: AreaId; linkMode: LinkMode; publicPath: string }
  | { kind: "rewrite"; area: AreaId; linkMode: LinkMode; publicPath: string; toPathname: string }
  | { kind: "redirect"; to: string };

const AREA_IDS: readonly AreaId[] = ["main", "consulting", "engineering", "support"];
const PREFIXED_AREAS: readonly AreaId[] = ["consulting", "engineering", "support"];

export const DEFAULT_MAIN_ORIGIN = "https://talonsoftware.dev";

export function isAreaId(value: string | null | undefined): value is AreaId {
  return !!value && (AREA_IDS as readonly string[]).includes(value);
}

export function mainOrigin(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_MAIN_ORIGIN).trim().replace(/\/+$/, "");
  if (!raw) return DEFAULT_MAIN_ORIGIN;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

export function defaultMainHostname(): string {
  try {
    return new URL(mainOrigin()).hostname.toLowerCase();
  } catch {
    return "talonsoftware.dev";
  }
}

export function areaCatalog(mainHostname = defaultMainHostname()): Record<AreaId, AreaDef> {
  return {
    main: {
      id: "main",
      host: mainHostname,
      prefix: "",
      paths: [
        "/",
        "/about",
        "/plans",
        "/assessments",
        "/how-we-work",
        "/faq",
        "/contact",
        "/offer",
        "/work",
        "/partners",
        "/products",
        "/products/coming-soon",
        "/privacy",
        "/terms",
      ],
    },
    consulting: {
      id: "consulting",
      host: "talon.consulting",
      prefix: "/consulting",
      paths: ["/", "/services", "/process", "/contact"],
    },
    engineering: {
      id: "engineering",
      host: "talon.engineering",
      prefix: "/engineering",
      paths: ["/"],
    },
    support: {
      id: "support",
      host: "talon.support",
      prefix: "/support",
      paths: ["/", "/app", "/app/assistant", "/app/tickets", "/app/knowledge", "/app/company"],
    },
  };
}

export function normalizeHostname(hostHeader: string): string {
  return splitHost(hostHeader).hostname;
}

export function splitHost(hostHeader: string): { hostname: string; www: boolean } {
  const first = hostHeader.split(",")[0]?.trim().toLowerCase() ?? "";
  const withoutPort = first.replace(/:\d+$/, "").replace(/\.$/, "");
  const www = withoutPort.startsWith("www.");
  return { hostname: www ? withoutPort.slice(4) : withoutPort, www };
}

export function isPathModeHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname.endsWith(".vercel.app") ||
    hostname.endsWith(".localhost")
  );
}

export function absoluteUrl(area: AreaId, publicPath: string, mainHostname = defaultMainHostname()): string {
  const host = areaCatalog(mainHostname)[area].host;
  const path = normalizePublicPath(publicPath);
  return path === "/" ? `https://${host}` : `https://${host}${path}`;
}

export function hrefFor(
  site: { area: AreaId; linkMode: LinkMode },
  area: AreaId,
  path: string,
  mainHostname = defaultMainHostname()
): string {
  const { pathname, search, hash } = splitPath(path);
  let href: string;
  if (site.linkMode === "path") {
    href = prefixedPath(area, pathname);
  } else if (site.area === area) {
    href = pathname;
  } else {
    href = absoluteUrl(area, pathname, mainHostname);
  }
  return `${href}${search}${hash}`;
}

export function resolveHostRoute(input: {
  hostHeader: string;
  pathname: string;
  mainHostname?: string;
}): RouteDecision {
  const mainHostname = (input.mainHostname ?? defaultMainHostname()).toLowerCase();
  const catalog = areaCatalog(mainHostname);
  const { hostname, www } = splitHost(input.hostHeader);
  const pathname = normalizePublicPath(input.pathname.split("?")[0] || "/");

  if (!hostname) {
    return passthrough("main", "path", pathname);
  }

  if (www && knownHost(hostname, catalog)) {
    return { kind: "redirect", to: `https://${hostname}${pathname === "/" ? "/" : pathname}` };
  }

  const linkMode = modeForHost(hostname, catalog);
  const hostArea = areaForHost(hostname, catalog);

  if (isSkippablePath(pathname)) {
    return passthrough(hostArea ?? "main", linkMode, pathname);
  }

  if (linkMode === "domain" && hostArea) {
    return resolveDomain(hostArea, pathname, catalog);
  }

  return resolvePath(pathname, catalog);
}

export function areaForHostname(hostname: string, mainHostname = defaultMainHostname()): AreaId | null {
  return areaForHost(hostname, areaCatalog(mainHostname));
}

export function robotsForHost(hostname: string, mainHostname = defaultMainHostname()): { index: boolean; sitemap?: string } {
  const area = areaForHostname(hostname, mainHostname);
  if (!area || isPathModeHost(hostname)) {
    return { index: false };
  }
  return { index: true, sitemap: absoluteUrl(area, "/sitemap.xml", mainHostname) };
}

export function sitemapUrls(hostname: string, mainHostname = defaultMainHostname()): string[] {
  const area = areaForHostname(hostname, mainHostname);
  if (!area || isPathModeHost(hostname)) return [];
  return areaCatalog(mainHostname)[area].paths.map((path) => absoluteUrl(area, path, mainHostname));
}

function resolveDomain(area: AreaId, pathname: string, catalog: Record<AreaId, AreaDef>): RouteDecision {
  const own = catalog[area];
  const ownStripped = stripPrefix(pathname, own.prefix);
  if (own.prefix && ownStripped !== null) {
    const target = areaForPublicPath(ownStripped, catalog, area);
    return { kind: "redirect", to: absoluteUrl(target, ownStripped, catalog.main.host) };
  }

  for (const otherId of PREFIXED_AREAS) {
    if (otherId === area) continue;
    const stripped = stripPrefix(pathname, catalog[otherId].prefix);
    if (stripped !== null) {
      const target = areaForPublicPath(stripped, catalog, otherId);
      return { kind: "redirect", to: absoluteUrl(target, stripped, catalog.main.host) };
    }
  }

  if (pathname === "/" || ownsPublicPath(own, pathname)) {
    return serve(area, pathname, "domain", own.prefix);
  }

  for (const otherId of AREA_IDS) {
    if (otherId === area) continue;
    if (ownsPublicPath(catalog[otherId], pathname)) {
      return { kind: "redirect", to: absoluteUrl(otherId, pathname, catalog.main.host) };
    }
  }

  return serve(area, pathname, "domain", own.prefix);
}

function resolvePath(pathname: string, catalog: Record<AreaId, AreaDef>): RouteDecision {
  for (const id of PREFIXED_AREAS) {
    const stripped = stripPrefix(pathname, catalog[id].prefix);
    if (stripped === null) continue;
    const target = areaForPublicPath(stripped, catalog, id);
    if (target !== id) {
      return { kind: "redirect", to: prefixedPath(target, stripped) };
    }
    return passthrough(id, "path", stripped);
  }

  if (pathname === "/" || ownsPublicPath(catalog.main, pathname)) {
    return passthrough("main", "path", pathname);
  }

  for (const id of PREFIXED_AREAS) {
    if (ownsPublicPath(catalog[id], pathname)) {
      return { kind: "redirect", to: prefixedPath(id, pathname) };
    }
  }

  return passthrough("main", "path", pathname);
}

function serve(area: AreaId, pathname: string, linkMode: LinkMode, prefix: string): RouteDecision {
  if (area === "main") return passthrough("main", linkMode, pathname);
  return {
    kind: "rewrite",
    area,
    linkMode,
    publicPath: pathname,
    toPathname: pathname === "/" ? prefix : `${prefix}${pathname}`,
  };
}

/** Current area wins when two areas publish the same public path, such as /contact. */
function areaForPublicPath(pathname: string, catalog: Record<AreaId, AreaDef>, preferred: AreaId): AreaId {
  if (pathname === "/" || ownsPublicPath(catalog[preferred], pathname)) return preferred;
  for (const id of AREA_IDS) {
    if (ownsPublicPath(catalog[id], pathname)) return id;
  }
  return preferred;
}

function modeForHost(hostname: string, catalog: Record<AreaId, AreaDef>): LinkMode {
  if (isPathModeHost(hostname)) return "path";
  if (areaForHost(hostname, catalog)) return "domain";
  return "path";
}

function areaForHost(hostname: string, catalog: Record<AreaId, AreaDef>): AreaId | null {
  for (const id of AREA_IDS) {
    if (catalog[id].host === hostname) return id;
  }
  return null;
}

function knownHost(hostname: string, catalog: Record<AreaId, AreaDef>): boolean {
  return areaForHost(hostname, catalog) !== null;
}

function ownsPublicPath(area: AreaDef, pathname: string): boolean {
  return area.paths.some((path) => path !== "/" && (pathname === path || pathname.startsWith(`${path}/`)));
}

function stripPrefix(pathname: string, prefix: string): string | null {
  if (!prefix) return null;
  if (pathname === prefix) return "/";
  if (pathname.startsWith(`${prefix}/`)) return pathname.slice(prefix.length) || "/";
  return null;
}

function prefixedPath(area: AreaId, pathname: string): string {
  if (area === "main") return pathname;
  if (pathname === "/") return `/${area}`;
  return `/${area}${pathname}`;
}

function passthrough(area: AreaId, linkMode: LinkMode, publicPath: string): RouteDecision {
  return { kind: "passthrough", area, linkMode, publicPath };
}

function normalizePublicPath(path: string): string {
  if (!path || path === "/") return "/";
  const withSlash = path.startsWith("/") ? path : `/${path}`;
  return withSlash.length > 1 && withSlash.endsWith("/") ? withSlash.slice(0, -1) : withSlash;
}

function splitPath(path: string): { pathname: string; search: string; hash: string } {
  const hashAt = path.indexOf("#");
  const hash = hashAt >= 0 ? path.slice(hashAt) : "";
  const withoutHash = hashAt >= 0 ? path.slice(0, hashAt) : path;
  const queryAt = withoutHash.indexOf("?");
  const search = queryAt >= 0 ? withoutHash.slice(queryAt) : "";
  const pathname = normalizePublicPath(queryAt >= 0 ? withoutHash.slice(0, queryAt) : withoutHash);
  return { pathname, search, hash };
}

function isSkippablePath(pathname: string): boolean {
  if (pathname === "/sitemap.xml" || pathname === "/robots.txt") return true;
  if (pathname === "/api" || pathname.startsWith("/api/")) return true;
  if (pathname.startsWith("/_next/")) return true;
  const last = pathname.split("/").pop() ?? "";
  return last.includes(".");
}
