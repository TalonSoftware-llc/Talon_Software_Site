import SiteLink from "@/components/SiteLink";
import SiteFrame from "@/components/SiteFrame";
import { hrefFor } from "@/lib/sites";
import { getRequestSite } from "@/lib/request-site";
import { supportSections } from "@/lib/support/sections";
import { getSupportPrincipal } from "@/lib/support/session";

export default async function SupportShell({ children }: { children: React.ReactNode }) {
  const site = await getRequestSite();
  const principal = await getSupportPrincipal();
  const links = [
    { href: hrefFor(site, "support", "/"), label: "Overview", path: "/" },
    { href: hrefFor(site, "support", "/sign-in"), label: "Sign in", path: "/sign-in" },
    ...supportSections.map((section) => ({
      href: hrefFor(site, "support", section.path),
      label: section.label,
      path: section.path,
    })),
  ];

  return (
    <SiteFrame>
      <p className="eyebrow">Placeholder</p>
      {principal ? (
        <p className="mt-4 text-lg text-ink/75">Signed in for {principal.companyName}.</p>
      ) : (
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink/75">
          Sign-in coming soon. These pages do not ask for a password or an email address, and they do not store
          an account.
        </p>
      )}
      <nav className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label="Support portal">
        {links.map((link) => {
          const current = site.area === "support" && site.publicPath === link.path;
          return (
            <SiteLink
              key={link.path}
              href={link.href}
              className={current ? "font-semibold text-ink" : "text-ink/70 hover:text-ink"}
              aria-current={current ? "page" : undefined}
            >
              {link.label}
            </SiteLink>
          );
        })}
      </nav>
      <div className="mt-10">{children}</div>
    </SiteFrame>
  );
}
