"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SupportSignIn({ proHref, essentialsHref }: { proHref: string; essentialsHref: string }) {
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);

  function signIn() {
    if (redirecting) return;
    setRedirecting(true);
    window.setTimeout(() => router.push(proHref), 900);
  }

  return (
    <main className="min-h-screen bg-[#f4f4f5] px-4 py-12 text-ink">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-10">
        <div className="w-full max-w-[400px] rounded-xl border border-[#e4e4e7] bg-white px-8 py-8 shadow-[0_1px_2px_rgba(16,24,40,0.06)]">
          <p className="text-center font-wordmark text-3xl leading-none text-ink">Talon</p>
          <h1 className="mt-6 text-center text-xl font-semibold">Sign in</h1>
          {redirecting ? (
            <div className="mt-8 text-center text-sm">
              <p>{"Redirecting to your organization's sign-in..."}</p>
              <p className="mt-2 text-ink/60">This is a demo.</p>
            </div>
          ) : (
            <div className="mt-8 grid gap-3">
              <button type="button" className="flex h-11 w-full items-center justify-center gap-3 rounded-md border border-[#e4e4e7] bg-white text-sm font-medium hover:bg-[#f4f4f5]" onClick={signIn}>
                <MicrosoftMark />
                Sign in with Microsoft
              </button>
              <button type="button" className="flex h-11 w-full items-center justify-center gap-3 rounded-md border border-[#e4e4e7] bg-white text-sm font-medium hover:bg-[#f4f4f5]" onClick={signIn}>
                <GoogleMark />
                Sign in with Google
              </button>
            </div>
          )}
        </div>
        <section id="demo" className="w-full scroll-mt-6" aria-label="Try the demo">
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-ink/45">Try the demo</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Link href={proHref} className="flex min-h-36 flex-col justify-between rounded-xl border-2 border-pine bg-white p-5 shadow-sm hover:bg-[#f3faf7]">
              <span className="w-fit rounded-full bg-[#e7f3ef] px-2 py-0.5 text-xs font-semibold text-pine">Most clients choose Pro</span>
              <span className="mt-6 text-2xl font-semibold tracking-tight">Pro demo</span>
            </Link>
            <Link href={essentialsHref} className="flex min-h-36 flex-col justify-end rounded-xl border border-[#e4e4e7] bg-white p-5 hover:border-[#c5ced6]">
              <span className="text-2xl font-semibold tracking-tight text-ink/80">Essentials demo</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function MicrosoftMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <rect width="7" height="7" fill="#f25022" />
      <rect x="9" width="7" height="7" fill="#7fba00" />
      <rect y="9" width="7" height="7" fill="#00a4ef" />
      <rect x="9" y="9" width="7" height="7" fill="#ffb900" />
    </svg>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path fill="#4285f4" d="M15.2 8.2c0-.5-.1-1-.2-1.5H8v2.8h4.1c-.2 1-.7 1.8-1.5 2.4v2h2.4c1.4-1.3 2.2-3.2 2.2-5.7z" />
      <path fill="#34a853" d="M8 15.5c2 0 3.7-.7 4.9-1.8l-2.4-2c-.7.4-1.5.7-2.5.7-1.9 0-3.6-1.3-4.2-3.1H1.3v2c1.2 2.4 3.7 4.2 6.7 4.2z" />
      <path fill="#fbbc04" d="M3.8 9.3A4.6 4.6 0 0 1 3.5 8c0-.4.1-.9.3-1.3v-2H1.3A7.5 7.5 0 0 0 .5 8c0 1.2.3 2.3.8 3.3l2.5-2z" />
      <path fill="#ea4335" d="M8 3.6c1.1 0 2.1.4 2.8 1.1l2.1-2.1C11.7 1.4 10 0.5 8 0.5 5 0.5 2.5 2.3 1.3 4.7l2.5 2C4.4 4.9 6.1 3.6 8 3.6z" />
    </svg>
  );
}
