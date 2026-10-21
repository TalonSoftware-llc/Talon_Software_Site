import SiteLink from "@/components/SiteLink";
import Wordmark from "@/components/Wordmark";
import { hrefFor } from "@/lib/sites";
import { getRequestSite } from "@/lib/request-site";

export default async function ConsultingFrame({ children }: { children: React.ReactNode }) {
  const site = await getRequestSite();
  const to = (path: string) => hrefFor(site, "consulting", path);
  const main = (path: string) => hrefFor(site, "main", path);
  const links = [
    { href: to("/services"), label: "Projects" },
    { href: to("/process"), label: "How a project runs" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#e4ddd2] bg-paper/95 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <SiteLink href={to("/")} aria-label="Talon Consulting home" className="inline-flex items-baseline gap-3">
            <Wordmark />
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-pine">Consulting</span>
          </SiteLink>
          <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2">
            {links.map((link) => (
              <SiteLink
                key={link.href}
                href={link.href}
                className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/70 hover:text-ink"
              >
                {link.label}
              </SiteLink>
            ))}
            <SiteLink href={to("/contact")} className="btn-ink">
              Book a consultation
            </SiteLink>
          </div>
        </nav>
      </header>
      <main className="flex min-h-screen flex-col bg-paper text-ink">
        <div className="mx-auto w-full max-w-6xl flex-grow px-6 py-16">{children}</div>
        <footer className="mt-auto bg-ink text-paper/80">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-12 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <Wordmark tone="paper" />
              <p className="mt-3 max-w-sm text-sm leading-relaxed">
                Project consulting. Vancouver, Washington. The monthly fractional CTO practice is on the{" "}
                <SiteLink href={main("/")} className="underline hover:text-paper">
                  Talon Software site
                </SiteLink>
                .
              </p>
            </div>
            <ul className="space-y-2 text-sm">
              <li>
                <SiteLink href={to("/services")} className="hover:text-paper">
                  Projects
                </SiteLink>
              </li>
              <li>
                <SiteLink href={to("/process")} className="hover:text-paper">
                  How a project runs
                </SiteLink>
              </li>
              <li>
                <SiteLink href={to("/contact")} className="hover:text-paper">
                  Book a consultation
                </SiteLink>
              </li>
              <li>
                <SiteLink href={main("/privacy")} className="hover:text-paper">
                  Privacy
                </SiteLink>
              </li>
              <li>
                <SiteLink href={main("/terms")} className="hover:text-paper">
                  Website terms
                </SiteLink>
              </li>
            </ul>
          </div>
          <div className="border-t border-white/10 py-4 text-center text-xs text-paper/50">
            © {new Date().getFullYear()} Talon Software · Vancouver, Washington
          </div>
        </footer>
      </main>
    </>
  );
}
