import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { hrefFor, resolveHostRoute } from "@/lib/sites";

export function proxy(request: NextRequest) {
  const hostHeader = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  const decision = resolveHostRoute({
    hostHeader,
    pathname: request.nextUrl.pathname,
  });

  if (decision.kind === "redirect") {
    const location = decision.to.startsWith("http") ? new URL(decision.to) : new URL(decision.to, request.url);
    location.search = request.nextUrl.search;
    return NextResponse.redirect(location, 308);
  }

  if (decision.publicPath === "/app/systems" || decision.publicPath.startsWith("/app/systems/")) {
    const location = new URL(
      hrefFor({ area: decision.area, linkMode: decision.linkMode }, "support", "/website"),
      request.url,
    );
    location.search = request.nextUrl.search;
    return NextResponse.redirect(location, 308);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-talon-area", decision.area);
  requestHeaders.set("x-talon-link-mode", decision.linkMode);
  requestHeaders.set("x-talon-public-path", decision.publicPath);

  const response =
    decision.kind === "rewrite"
      ? NextResponse.rewrite(rewriteUrl(request, decision.toPathname), { request: { headers: requestHeaders } })
      : NextResponse.next({ request: { headers: requestHeaders } });

  if (decision.linkMode === "path") {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return response;
}

function rewriteUrl(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  return url;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\..*).*)"],
};
