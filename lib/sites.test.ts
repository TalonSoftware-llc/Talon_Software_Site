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
assert.deepEqual(route("preview.vercel.app", "/support"), {
  kind: "passthrough",
  area: "main",
  linkMode: "path",
  publicPath: "/support",
});
assert.deepEqual(route("preview.vercel.app", "/app"), {
  kind: "passthrough",
  area: "main",
  linkMode: "path",
  publicPath: "/app",
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

const engineeringPage = {
  kind: "rewrite",
  area: "engineering",
  linkMode: "domain",
  publicPath: "/",
  toPathname: "/engineering",
};
assert.deepEqual(route("talon.engineering", "/"), engineeringPage);
assert.deepEqual(route("talon.engineering", "/plans"), engineeringPage);
assert.deepEqual(route("talon.engineering", "/consulting"), engineeringPage);
assert.deepEqual(route("talon.engineering", "/engineering"), engineeringPage);
assert.equal(redirect("www.talon.engineering", "/"), "https://talon.engineering/");
assert.equal(redirect("www.talon.engineering", "/plans"), "https://talon.engineering/plans");
assert.deepEqual(route("talon.support", "/"), { kind: "notfound" });
assert.deepEqual(route("talon.support", "/app"), { kind: "notfound" });
assert.deepEqual(route("www.talon.support", "/"), { kind: "notfound" });
assert.deepEqual(route("talonsoftware.dev", "/support"), {
  kind: "passthrough",
  area: "main",
  linkMode: "domain",
  publicPath: "/support",
});
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
assert.equal(hrefFor({ area: "main", linkMode: "domain" }, "engineering", "/", main), "https://talon.engineering");

assert.deepEqual(robotsForHost("localhost", main), { index: false });
assert.deepEqual(robotsForHost("talon.consulting", main), {
  index: true,
  sitemap: "https://talon.consulting/sitemap.xml",
});
assert.deepEqual(sitemapUrls("talon.engineering", main), ["https://talon.engineering"]);
assert.deepEqual(sitemapUrls("talon.support", main), []);
assert.ok(sitemapUrls("talonsoftware.dev", main).includes("https://talonsoftware.dev/plans"));
assert.ok(sitemapUrls("talonsoftware.dev", main).includes("https://talonsoftware.dev/contact"));
assert.ok(!sitemapUrls("talon.consulting", main).some((url) => url.endsWith("/plans")));
assert.deepEqual(sitemapUrls("localhost", main), []);

console.log("host routing checks passed");
