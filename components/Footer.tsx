import SiteLink from "@/components/SiteLink";
import Wordmark from "@/components/Wordmark";
import type { ChromeLink, SiteChrome } from "@/lib/navigation";

export default function Footer({ chrome }: { chrome: SiteChrome }) {
  return (
    <footer className="mt-auto bg-ink text-paper/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-4">
        <div className="md:col-span-1">
          <SiteLink href={chrome.homeHref} aria-label="Talon Software home" className="inline-flex">
            <Wordmark tone="paper" />
          </SiteLink>
          <p className="mt-3 text-sm leading-relaxed">Fractional CTO services. Vancouver, Washington.</p>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-paper/50">Areas</p>
          <ul className="mt-3 space-y-2 text-sm">
            {chrome.footerAreas.map((link) => (
              <li key={link.href}>
                <FooterLink link={link} />
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-paper/50">Practice</p>
          <ul className="mt-3 space-y-2 text-sm">
            {chrome.footerPractice.map((link) => (
              <li key={link.href}>
                <FooterLink link={link} />
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-paper/50">Company</p>
          <ul className="mt-3 space-y-2 text-sm">
            {chrome.footerCompany.map((link) => (
              <li key={link.href}>
                <FooterLink link={link} />
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-paper/50">Legal</p>
          <ul className="mt-3 space-y-2 text-sm">
            {chrome.footerLegal.map((link) => (
              <li key={link.href}>
                <FooterLink link={link} />
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-paper/50">
        © {new Date().getFullYear()} Talon Software · Vancouver, Washington
      </div>
    </footer>
  );
}

function FooterLink({ link }: { link: ChromeLink }) {
  return (
    <SiteLink href={link.href} className="hover:text-paper">
      {link.label}
    </SiteLink>
  );
}
