"use client";

import { useRouter } from "next/navigation";
import { FormEvent } from "react";

export default function SupportSignIn({ demoHref }: { demoHref: string }) {
  const router = useRouter();

  function openDemo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(demoHref);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#e6ebf1] px-4 py-16 text-ink">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="font-wordmark text-3xl font-medium text-ink">Talon Support</h1>
          <p className="mt-2 text-sm text-ink/60">Sign in to a company workspace</p>
        </div>
        <form
          onSubmit={openDemo}
          autoComplete="off"
          className="rounded-xl border border-[#d5dbe3] bg-white p-6 shadow-sm"
        >
          <label className="block text-sm font-medium text-ink/80" htmlFor="support-email">
            Email
          </label>
          <input
            id="support-email"
            type="email"
            autoComplete="off"
            className="mt-1 w-full rounded-md border border-[#d5dbe3] px-3 py-2 text-ink focus:border-pine focus:outline-none focus:ring-1 focus:ring-pine"
          />
          <label className="mt-4 block text-sm font-medium text-ink/80" htmlFor="support-password">
            Password
          </label>
          <input
            id="support-password"
            type="password"
            autoComplete="off"
            className="mt-1 w-full rounded-md border border-[#d5dbe3] px-3 py-2 text-ink focus:border-pine focus:outline-none focus:ring-1 focus:ring-pine"
          />
          <button type="submit" className="btn-ink mt-6 w-full">
            Sign in
          </button>
          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-ink/40">
            <span className="h-px flex-1 bg-[#d5dbe3]" />
            or
            <span className="h-px flex-1 bg-[#d5dbe3]" />
          </div>
          <div className="grid gap-2">
            <button type="button" className="rounded-md border border-[#d5dbe3] px-3 py-2 text-sm font-semibold text-ink hover:bg-[#f4f6f8]" onClick={() => router.push(demoHref)}>
              Continue with Google
            </button>
            <button type="button" className="rounded-md border border-[#d5dbe3] px-3 py-2 text-sm font-semibold text-ink hover:bg-[#f4f6f8]" onClick={() => router.push(demoHref)}>
              Continue with Microsoft
            </button>
          </div>
        </form>
        <p className="mt-4 text-center text-sm leading-relaxed text-ink/60">
          Preview. Sign-in does not send or store an email or a password. Every button opens a demo workspace with
          sample data.
        </p>
      </div>
    </main>
  );
}
