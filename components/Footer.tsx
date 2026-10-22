import Link from "next/link";
import Wordmark from "@/components/Wordmark";
import { areaHref } from "@/lib/request-site";

export default async function Footer() {
  const portalHref = await areaHref("support", "/");

  return (
    <footer className="mt-auto bg-ink text-paper/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" aria-label="Talon Software home" className="inline-flex">
          <Wordmark tone="paper" />
        </Link>
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <Link href="/contact" className="hover:text-paper">Contact</Link>
          <Link href="/plans" className="hover:text-paper">Plans</Link>
          <a href={portalHref} className="hover:text-paper">Portal</a>
        </nav>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-paper/50">
        © {new Date().getFullYear()} Talon Software
      </div>
    </footer>
  );
}
