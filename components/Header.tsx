"use client";

import { useState } from "react";
import SiteLink from "@/components/SiteLink";
import Wordmark from "@/components/Wordmark";
import type { ChromeLink, SiteChrome } from "@/lib/navigation";

const linkClass = "text-xs font-semibold uppercase tracking-[0.14em] text-ink/70 hover:text-ink";
const activeClass = "text-xs font-semibold uppercase tracking-[0.14em] text-ink";

export default function Header({ chrome }: { chrome: SiteChrome }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#e4ddd2] bg-paper/95 backdrop-blur">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-center justify-between gap-4 py-4">
          <SiteLink href={chrome.homeHref} aria-label="Talon Software home">
            <Wordmark />
          </SiteLink>
          <button
            type="button"
            className="rounded-md border border-ink/20 px-3 py-1 text-xs uppercase tracking-wider text-ink md:hidden"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            Menu
          </button>
          <nav className="hidden items-center gap-7 md:flex" aria-label="Areas">
            {chrome.areas.map((link) => (
              <AreaLink key={link.href} link={link} />
            ))}
          </nav>
        </div>
        <div className="hidden items-center justify-between gap-4 border-t border-[#e4ddd2] py-3 md:flex">
          <nav className="flex flex-wrap items-center gap-x-7 gap-y-2" aria-label="Practice">
            {chrome.practice.map((link) => (
              <SiteLink key={link.href} href={link.href} className={linkClass}>
                {link.label}
              </SiteLink>
            ))}
          </nav>
          <SiteLink href={chrome.bookHref} className="btn-ink">
            Book a call
          </SiteLink>
        </div>
      </div>
      {open && (
        <div className="border-t border-[#e4ddd2] px-6 py-4 md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/40">Areas</p>
            {chrome.areas.map((link) => (
              <AreaLink key={link.href} link={link} onClick={close} />
            ))}
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink/40">Practice</p>
            {chrome.practice.map((link) => (
              <SiteLink key={link.href} href={link.href} className="text-sm text-ink" onClick={close}>
                {link.label}
              </SiteLink>
            ))}
            <SiteLink href={chrome.bookHref} className="btn-ink w-fit" onClick={close}>
              Book a call
            </SiteLink>
          </div>
        </div>
      )}
    </header>
  );
}

function AreaLink({ link, onClick }: { link: ChromeLink; onClick?: () => void }) {
  return (
    <SiteLink href={link.href} className={link.active ? activeClass : linkClass} onClick={onClick} aria-current={link.active ? "true" : undefined}>
      {link.label}
    </SiteLink>
  );
}
