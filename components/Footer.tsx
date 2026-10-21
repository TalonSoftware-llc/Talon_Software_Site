import Link from "next/link";
import Wordmark from "@/components/Wordmark";

export default function Footer() {
  return (
    <footer className="mt-auto bg-ink text-paper/80">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-4">
        <div className="md:col-span-1">
          <Link href="/" aria-label="Talon Software home" className="inline-flex">
            <Wordmark tone="paper" />
          </Link>
          <p className="mt-3 text-sm leading-relaxed">
            Fractional CTO services. Vancouver, Washington.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-paper/50">Practice</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/plans" className="hover:text-paper">Plans</Link></li>
            <li><Link href="/assessments" className="hover:text-paper">Services</Link></li>
            <li><Link href="/how-we-work" className="hover:text-paper">How we work</Link></li>
            <li><Link href="/offer" className="hover:text-paper">Offer sheet</Link></li>
            <li><Link href="/work" className="hover:text-paper">Proof</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-paper/50">Company</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/about" className="hover:text-paper">About</Link></li>
            <li><Link href="/faq" className="hover:text-paper">FAQ</Link></li>
            <li><Link href="/contact" className="hover:text-paper">Book a call</Link></li>
            <li><Link href="/products" className="hover:text-paper">Products</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-paper/50">Legal</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/privacy" className="hover:text-paper">Privacy</Link></li>
            <li><Link href="/terms" className="hover:text-paper">Website terms</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-paper/50">
        © {new Date().getFullYear()} Talon Software · Vancouver, Washington
      </div>
    </footer>
  );
}
