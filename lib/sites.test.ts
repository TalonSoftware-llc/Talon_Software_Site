import assert from "node:assert/strict";
import { hrefFor, resolveHostRoute, robotsForHost, sitemapUrls } from "./sites.ts";

const main = "talonsoftware.dev";

function route(host: string, pathname: string) {
  return resolveHostRoute({ hostHeader: host, pathname, mainHostname: main });
}

function redirect(host: string, pathname: string) {
  const decision = route(host, pathname);
  assert.equal(decision.kind, "redirect");
  if (decision.kind !== "redirect") throw new Error("expected redirect");
  return decision.to;
}

assert.deepEqual(route("localhost:3000", "/"), {
  kind: "passthrough",
  area: "main",
  linkMode: "path",
  publicPath: "/",
});
assert.deepEqual(route("localhost:3000", "/plans"), {
  kind: "passthrough",
  area: "main",
  linkMode: "path",
  publicPath: "/plans",
});
assert.deepEqual(route("localhost:3000", "/contact"), {
  kind: "passthrough",
  area: "main",
  linkMode: "path",
  publicPath: "/contact",
});
assert.deepEqual(route("localhost:3000", "/consulting"), {
  kind: "passthrough",
  area: "consulting",
  linkMode: "path",
  publicPath: "/",
});
assert.deepEqual(route("localhost:3000", "/consulting/services"), {
  kind: "passthrough",
  area: "consulting",
  linkMode: "path",
  publicPath: "/services",
});
assert.deepEqual(route("localhost:3000", "/consulting/contact"), {
  kind: "passthrough",
  area: "consulting",
  linkMode: "path",
  publicPath: "/contact",
});
assert.equal(redirect("localhost:3000", "/consulting/plans"), "/plans");
assert.equal(redirect("localhost:3000", "/services"), "/consulting/services");
assert.deepEqual(route("preview.vercel.app", "/engineering"), {
  kind: "passthrough",
  area: "engineering",
  linkMode: "path",
  publicPath: "/",
});
assert.equal(redirect("preview.vercel.app", "/app"), "/support/app");
assert.deepEqual(route("preview.vercel.app", "/support/app/tickets"), {
  kind: "passthrough",
  area: "support",
  linkMode: "path",
  publicPath: "/app/tickets",
});

assert.deepEqual(route("talon.consulting", "/"), {
  kind: "rewrite",
  area: "consulting",
  linkMode: "domain",
  publicPath: "/",
  toPathname: "/consulting",
});
assert.deepEqual(route("talon.consulting", "/services"), {
  kind: "rewrite",
  area: "consulting",
  linkMode: "domain",
  publicPath: "/services",
  toPathname: "/consulting/services",
});
assert.deepEqual(route("talon.consulting", "/contact"), {
  kind: "rewrite",
  area: "consulting",
  linkMode: "domain",
  publicPath: "/contact",
  toPathname: "/consulting/contact",
});
assert.equal(redirect("talon.consulting", "/plans"), "https://talonsoftware.dev/plans");
assert.equal(redirect("talon.consulting", "/consulting/services"), "https://talon.consulting/services");
assert.equal(redirect("talon.consulting", "/consulting/plans"), "https://talonsoftware.dev/plans");
assert.equal(redirect("talon.consulting", "/about"), "https://talonsoftware.dev/about");
assert.equal(redirect("talon.consulting", "/engineering"), "https://talon.engineering");

assert.deepEqual(route("talonsoftware.dev", "/"), {
  kind: "passthrough",
  area: "main",
  linkMode: "domain",
  publicPath: "/",
});
assert.deepEqual(route("talonsoftware.dev", "/plans"), {
  kind: "passthrough",
  area: "main",
  linkMode: "domain",
  publicPath: "/plans",
});
assert.deepEqual(route("talonsoftware.dev", "/contact"), {
  kind: "passthrough",
  area: "main",
  linkMode: "domain",
  publicPath: "/contact",
});
assert.equal(redirect("talonsoftware.dev", "/consulting"), "https://talon.consulting");
assert.equal(redirect("talonsoftware.dev", "/consulting/services"), "https://talon.consulting/services");
assert.equal(redirect("www.talonsoftware.dev", "/about"), "https://talonsoftware.dev/about");

assert.deepEqual(route("talon.engineering", "/"), {
  kind: "rewrite",
  area: "engineering",
  linkMode: "domain",
  publicPath: "/",
  toPathname: "/engineering",
});
assert.equal(redirect("talon.engineering", "/plans"), "https://talonsoftware.dev/plans");
assert.deepEqual(route("talon.support", "/"), {
  kind: "rewrite",
  area: "support",
  linkMode: "domain",
  publicPath: "/",
  toPathname: "/support",
});
assert.deepEqual(route("talon.support", "/app"), {
  kind: "rewrite",
  area: "support",
  linkMode: "domain",
  publicPath: "/app",
  toPathname: "/support/app",
});
assert.equal(redirect("talon.support", "/support/app/tickets"), "https://talon.support/app/tickets");
assert.equal(redirect("www.talon.consulting", "/services"), "https://talon.consulting/services");

assert.equal(route("talon.consulting", "/api/contact").kind, "passthrough");
assert.equal(route("talon.consulting", "/Talon Software Logo.jpg").kind, "passthrough");
assert.deepEqual(route("unknown.example", "/consulting/services"), {
  kind: "passthrough",
  area: "consulting",
  linkMode: "path",
  publicPath: "/services",
});

const laterMain = "talon.software";
assert.deepEqual(resolveHostRoute({ hostHeader: laterMain, pathname: "/plans", mainHostname: laterMain }), {
  kind: "passthrough",
  area: "main",
  linkMode: "domain",
  publicPath: "/plans",
});

assert.equal(hrefFor({ area: "main", linkMode: "path" }, "consulting", "/services", main), "/consulting/services");
assert.equal(hrefFor({ area: "consulting", linkMode: "domain" }, "consulting", "/contact", main), "/contact");
assert.equal(
  hrefFor({ area: "main", linkMode: "domain" }, "consulting", "/contact", main),
  "https://talon.consulting/contact"
);
assert.equal(hrefFor({ area: "consulting", linkMode: "domain" }, "main", "/contact", main), "https://talonsoftware.dev/contact");
assert.equal(hrefFor({ area: "engineering", linkMode: "path" }, "support", "/app", main), "/support/app");

assert.deepEqual(robotsForHost("localhost", main), { index: false });
assert.deepEqual(robotsForHost("talon.consulting", main), {
  index: true,
  sitemap: "https://talon.consulting/sitemap.xml",
});
assert.deepEqual(sitemapUrls("talon.support", main), [
  "https://talon.support",
  "https://talon.support/app",
  "https://talon.support/app/people",
  "https://talon.support/app/requests",
  "https://talon.support/app/projects",
  "https://talon.support/app/spending",
  "https://talon.support/app/report",
  "https://talon.support/app/pro",
  "https://talon.support/app/support",
  "https://talon.support/app/settings",
  "https://talon.support/website",
  "https://talon.support/network",
  "https://talon.support/systems",
  "https://talon.support/demo/pro",
  "https://talon.support/demo/essentials",
]);
assert.ok(sitemapUrls("talonsoftware.dev", main).includes("https://talonsoftware.dev/plans"));
assert.ok(sitemapUrls("talonsoftware.dev", main).includes("https://talonsoftware.dev/contact"));
assert.ok(!sitemapUrls("talon.consulting", main).some((url) => url.endsWith("/plans")));
assert.deepEqual(sitemapUrls("localhost", main), []);

console.log("host routing checks passed");
