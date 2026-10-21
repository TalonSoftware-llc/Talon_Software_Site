"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type Step = "credentials" | "forgot" | "mfa";

export default function SupportSignIn({ demoHref }: { demoHref: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("credentials");

  function openDemo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStep("mfa");
  }

  function enterWorkspace(event: FormEvent<HTMLFormElement>) {
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
        <div className="rounded-xl border border-[#d5dbe3] bg-white p-6 shadow-sm">
          {step === "credentials" ? (
            <form onSubmit={openDemo} autoComplete="off">
              <label className="block text-sm font-medium text-ink/80" htmlFor="support-email">
                Email
              </label>
              <input
                id="support-email"
                type="email"
                autoComplete="off"
                className="mt-1 w-full rounded-md border border-[#d5dbe3] px-3 py-2 text-ink focus:border-pine focus:outline-none focus:ring-1 focus:ring-pine"
              />
              <div className="mt-4 flex items-center justify-between">
                <label className="block text-sm font-medium text-ink/80" htmlFor="support-password">
                  Password
                </label>
                <button type="button" className="text-xs font-semibold text-pine hover:underline" onClick={() => setStep("forgot")}>
                  Forgot password
                </button>
              </div>
              <input
                id="support-password"
                type="password"
                autoComplete="off"
                className="mt-1 w-full rounded-md border border-[#d5dbe3] px-3 py-2 text-ink focus:border-pine focus:outline-none focus:ring-1 focus:ring-pine"
              />
              <button type="submit" className="mt-6 w-full rounded-md bg-pine px-3 py-2 text-sm font-semibold text-white">
                Sign in
              </button>
              <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.14em] text-ink/40">
                <span className="h-px flex-1 bg-[#d5dbe3]" />
                or
                <span className="h-px flex-1 bg-[#d5dbe3]" />
              </div>
              <div className="grid gap-2">
                <button type="button" className="rounded-md border border-[#d5dbe3] px-3 py-2 text-sm font-semibold text-ink hover:bg-[#f4f6f8]" onClick={() => setStep("mfa")}>
                  Continue with Microsoft
                </button>
                <button type="button" className="rounded-md border border-[#d5dbe3] px-3 py-2 text-sm font-semibold text-ink hover:bg-[#f4f6f8]" onClick={() => setStep("mfa")}>
                  Continue with Google
                </button>
              </div>
            </form>
          ) : null}
          {step === "forgot" ? (
            <form
              autoComplete="off"
              onSubmit={(event) => {
                event.preventDefault();
                setStep("credentials");
              }}
            >
              <h2 className="text-lg font-semibold">Reset link</h2>
              <p className="mt-2 text-sm text-ink/70">No email is sent from this preview. A reset for a real workspace is done at the clinic desk.</p>
              <label className="mt-4 block text-sm font-medium text-ink/80" htmlFor="support-forgot">
                Work email
              </label>
              <input
                id="support-forgot"
                type="email"
                autoComplete="off"
                className="mt-1 w-full rounded-md border border-[#d5dbe3] px-3 py-2 text-ink focus:border-pine focus:outline-none focus:ring-1 focus:ring-pine"
              />
              <button type="submit" className="mt-4 w-full rounded-md bg-pine px-3 py-2 text-sm font-semibold text-white">
                Back to sign in
              </button>
            </form>
          ) : null}
          {step === "mfa" ? (
            <form onSubmit={enterWorkspace} autoComplete="off">
              <h2 className="text-lg font-semibold">Check your authenticator</h2>
              <p className="mt-2 text-sm text-ink/70">Enter the 6-digit code from the app. This preview does not read or store it.</p>
              <label className="sr-only" htmlFor="support-mfa">
                Authenticator code
              </label>
              <input
                id="support-mfa"
                inputMode="numeric"
                autoComplete="off"
                className="mt-4 w-full rounded-md border border-[#d5dbe3] px-3 py-2 tracking-[0.3em] text-ink focus:border-pine focus:outline-none focus:ring-1 focus:ring-pine"
              />
              <button type="submit" className="mt-4 w-full rounded-md bg-pine px-3 py-2 text-sm font-semibold text-white">
                Continue
              </button>
              <button type="button" className="mt-3 w-full text-sm font-semibold text-ink/60 hover:text-ink" onClick={() => setStep("credentials")}>
                Use a different account
              </button>
            </form>
          ) : null}
        </div>
        <p className="mt-4 text-center text-sm leading-relaxed text-ink/60">
          Preview. Sign-in does not send or store an email, a password, or a code. Continuing opens a demo workspace with sample data.
        </p>
      </div>
    </main>
  );
}
