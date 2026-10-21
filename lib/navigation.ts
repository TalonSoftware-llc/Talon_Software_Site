import type { RequestSite } from "@/lib/request-site";
import { hrefFor, type AreaId } from "@/lib/sites";

export type ChromeLink = {
  href: string;
  label: string;
  active?: boolean;
};

export type SiteChrome = {
  homeHref: string;
  bookHref: string;
  areas: ChromeLink[];
  practice: ChromeLink[];
  footerPractice: ChromeLink[];
  footerCompany: ChromeLink[];
  footerLegal: ChromeLink[];
  footerAreas: ChromeLink[];
};

export function buildChrome(site: RequestSite): SiteChrome {
  const link = (area: AreaId, path: string) => hrefFor(site, area, path);
  return {
    homeHref: link("main", "/"),
    bookHref: link("consulting", "/contact"),
    areas: [
      { href: link("consulting", "/"), label: "Consulting", active: site.area === "consulting" },
      { href: link("engineering", "/"), label: "Engineering", active: site.area === "engineering" },
      { href: link("support", "/"), label: "Support", active: site.area === "support" },
    ],
    practice: [
      { href: link("consulting", "/plans"), label: "Plans" },
      { href: link("consulting", "/assessments"), label: "Services" },
      { href: link("consulting", "/how-we-work"), label: "How we work" },
      { href: link("main", "/about"), label: "About" },
      { href: link("consulting", "/faq"), label: "FAQ" },
    ],
    footerPractice: [
      { href: link("consulting", "/plans"), label: "Plans" },
      { href: link("consulting", "/assessments"), label: "Services" },
      { href: link("consulting", "/how-we-work"), label: "How we work" },
      { href: link("consulting", "/offer"), label: "Offer sheet" },
      { href: link("consulting", "/work"), label: "Proof" },
    ],
    footerCompany: [
      { href: link("main", "/about"), label: "About" },
      { href: link("consulting", "/faq"), label: "FAQ" },
      { href: link("consulting", "/contact"), label: "Book a call" },
      { href: link("main", "/products"), label: "Products" },
    ],
    footerLegal: [
      { href: link("main", "/privacy"), label: "Privacy" },
      { href: link("main", "/terms"), label: "Website terms" },
    ],
    footerAreas: [
      { href: link("consulting", "/"), label: "Consulting" },
      { href: link("engineering", "/"), label: "Engineering" },
      { href: link("support", "/"), label: "Support" },
    ],
  };
}
