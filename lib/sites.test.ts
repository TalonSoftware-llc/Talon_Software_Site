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
assert.deepEqual(route("localhost:3000", "/consulting"), {
  kind: "passthrough",
  area: "consulting",
  linkMode: "path",
  publicPath: "/",
});
assert.deepEqual(route("localhost:3000", "/consulting/plans"), {
  kind: "passthrough",
  area: "consulting",
  linkMode: "path",
  publicPath: "/plans",
});
assert.equal(redirect("localhost:3000", "/plans"), "/consulting/plans");
assert.equal(redirect("localhost:3000", "/contact"), "/consulting/contact");
assert.deepEqual(route("127.0.0.1:3000", "/about"), {
  kind: "passthrough",
  area: "main",
  linkMode: "path",
  publicPath: "/about",
});
assert.deepEqual(route("preview.vercel.app", "/engineering"), {
  kind: "passthrough",
  area: "engineering",
  linkMode: "path",
  publicPath: "/",
});
assert.equal(redirect("preview.vercel.app", "/ai"), "/support/ai");
assert.deepEqual(route("preview.vercel.app", "/support/tickets"), {
  kind: "passthrough",
  area: "support",
  linkMode: "path",
  publicPath: "/tickets",
});

assert.deepEqual(route("talon.consulting", "/"), {
  kind: "rewrite",
  area: "consulting",
  linkMode: "domain",
  publicPath: "/",
  toPathname: "/consulting",
});
assert.deepEqual(route("talon.consulting", "/plans"), {
  kind: "rewrite",
  area: "consulting",
  linkMode: "domain",
  publicPath: "/plans",
  toPathname: "/consulting/plans",
});
assert.equal(redirect("talon.consulting", "/consulting/plans"), "https://talon.consulting/plans");
assert.equal(redirect("talon.consulting", "/about"), "https://talonsoftware.dev/about");
assert.equal(redirect("talon.consulting", "/engineering"), "https://talon.engineering");
assert.equal(redirect("talon.consulting", "/products/coming-soon"), "https://talonsoftware.dev/products/coming-soon");

assert.deepEqual(route("talonsoftware.dev", "/"), {
  kind: "passthrough",
  area: "main",
  linkMode: "domain",
  publicPath: "/",
});
assert.equal(redirect("talonsoftware.dev", "/plans"), "https://talon.consulting/plans");
assert.equal(redirect("talonsoftware.dev", "/consulting"), "https://talon.consulting");
assert.equal(redirect("talonsoftware.dev", "/consulting/faq"), "https://talon.consulting/faq");
assert.equal(redirect("www.talonsoftware.dev", "/about"), "https://talonsoftware.dev/about");

assert.deepEqual(route("talon.engineering", "/"), {
  kind: "rewrite",
  area: "engineering",
  linkMode: "domain",
  publicPath: "/",
  toPathname: "/engineering",
});
assert.equal(redirect("talon.engineering", "/plans"), "https://talon.consulting/plans");
assert.deepEqual(route("talon.support", "/sign-in"), {
  kind: "rewrite",
  area: "support",
  linkMode: "domain",
  publicPath: "/sign-in",
  toPathname: "/support/sign-in",
});
assert.equal(redirect("talon.support", "/support/tickets"), "https://talon.support/tickets");
assert.equal(redirect("www.talon.consulting", "/plans"), "https://talon.consulting/plans");

assert.equal(route("talon.consulting", "/api/contact").kind, "passthrough");
assert.equal(route("talon.consulting", "/Talon Software Logo.jpg").kind, "passthrough");
assert.deepEqual(route("unknown.example", "/consulting/plans"), {
  kind: "passthrough",
  area: "consulting",
  linkMode: "path",
  publicPath: "/plans",
});

const laterMain = "talon.software";
assert.deepEqual(resolveHostRoute({ hostHeader: laterMain, pathname: "/about", mainHostname: laterMain }), {
  kind: "passthrough",
  area: "main",
  linkMode: "domain",
  publicPath: "/about",
});
assert.equal(
  resolveHostRoute({ hostHeader: "talonsoftware.dev", pathname: "/", mainHostname: laterMain }).kind,
  "passthrough"
);

assert.equal(hrefFor({ area: "main", linkMode: "path" }, "consulting", "/plans", main), "/consulting/plans");
assert.equal(hrefFor({ area: "consulting", linkMode: "domain" }, "consulting", "/plans", main), "/plans");
assert.equal(
  hrefFor({ area: "main", linkMode: "domain" }, "consulting", "/contact?interest=plan", main),
  "https://talon.consulting/contact?interest=plan"
);
assert.equal(hrefFor({ area: "consulting", linkMode: "domain" }, "main", "/", main), "https://talonsoftware.dev");
assert.equal(hrefFor({ area: "engineering", linkMode: "path" }, "support", "/", main), "/support");

assert.deepEqual(robotsForHost("localhost", main), { index: false });
assert.deepEqual(robotsForHost("branch.vercel.app", main), { index: false });
assert.deepEqual(robotsForHost("talon.consulting", main), {
  index: true,
  sitemap: "https://talon.consulting/sitemap.xml",
});
assert.deepEqual(sitemapUrls("talon.support", main), [
  "https://talon.support",
  "https://talon.support/sign-in",
  "https://talon.support/ai",
  "https://talon.support/tickets",
  "https://talon.support/processes",
  "https://talon.support/information",
]);
assert.deepEqual(sitemapUrls("localhost", main), []);
assert.ok(sitemapUrls("talonsoftware.dev", main).includes("https://talonsoftware.dev/about"));
assert.ok(!sitemapUrls("talonsoftware.dev", main).some((url) => url.includes("talon.consulting")));

console.log("host routing checks passed");
