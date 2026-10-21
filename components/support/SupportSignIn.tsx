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
        <h1 className="mb-8 text-center font-wordmark text-3xl font-medium text-ink">Talon Support</h1>
        <div className="rounded-xl border border-[#d5dbe3] bg-white p-6 shadow-sm">
          {step === "credentials" ? (
            <form onSubmit={openDemo} autoComplete="off">
              <label className="block text-sm font-medium" htmlFor="support-email">Email</label>
              <input id="support-email" type="email" autoComplete="off" className="mt-1 w-full rounded-md border border-[#d5dbe3] px-3 py-2 focus:border-pine focus:outline-none focus:ring-1 focus:ring-pine" />
              <div className="mt-4 flex items-center justify-between">
                <label className="text-sm font-medium" htmlFor="support-password">Password</label>
                <button type="button" className="text-xs font-semibold text-pine" onClick={() => setStep("forgot")}>Forgot password</button>
              </div>
              <input id="support-password" type="password" autoComplete="off" className="mt-1 w-full rounded-md border border-[#d5dbe3] px-3 py-2 focus:border-pine focus:outline-none focus:ring-1 focus:ring-pine" />
              <button type="submit" className="mt-6 w-full rounded-md bg-pine px-3 py-2 text-sm font-semibold text-white">Sign in</button>
              <div className="mt-4 grid gap-2">
                <button type="button" className="rounded-md border border-[#d5dbe3] px-3 py-2 text-sm font-semibold" onClick={() => setStep("mfa")}>Continue with Microsoft</button>
                <button type="button" className="rounded-md border border-[#d5dbe3] px-3 py-2 text-sm font-semibold" onClick={() => setStep("mfa")}>Continue with Google</button>
              </div>
            </form>
          ) : null}
          {step === "forgot" ? (
            <div>
              <h2 className="text-lg font-semibold">No email is sent</h2>
              <button type="button" className="mt-4 w-full rounded-md bg-pine px-3 py-2 text-sm font-semibold text-white" onClick={() => setStep("credentials")}>Back</button>
            </div>
          ) : null}
          {step === "mfa" ? (
            <form onSubmit={enterWorkspace} autoComplete="off">
              <label className="block text-sm font-medium" htmlFor="support-code">Code</label>
              <input id="support-code" inputMode="numeric" autoComplete="off" className="mt-1 w-full rounded-md border border-[#d5dbe3] px-3 py-2 focus:border-pine focus:outline-none focus:ring-1 focus:ring-pine" />
              <button type="submit" className="mt-4 w-full rounded-md bg-pine px-3 py-2 text-sm font-semibold text-white">Continue</button>
            </form>
          ) : null}
        </div>
      </div>
    </main>
  );
}
