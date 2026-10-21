"use client";

import Link from "next/link";
import { useState } from "react";
import Wordmark from "@/components/Wordmark";

const links = [
  { href: "/plans", label: "Plans" },
  { href: "/assessments", label: "Services" },
  { href: "/how-we-work", label: "How we work" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#e4ddd2] bg-paper/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" aria-label="Talon Software home">
          <Wordmark />
        </Link>
        <button
          type="button"
          className="rounded-md border border-ink/20 px-3 py-1 text-xs uppercase tracking-wider text-ink md:hidden"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          Menu
        </button>
        <div className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/70 hover:text-ink"
            >
              {link.label}
            </Link>
          ))}
          <Link href="/contact" className="btn-ink">
            Book a call
          </Link>
        </div>
      </nav>
      {open && (
        <div className="border-t border-[#e4ddd2] px-6 py-4 md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-ink"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link href="/contact" className="btn-ink w-fit" onClick={() => setOpen(false)}>
              Book a call
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
