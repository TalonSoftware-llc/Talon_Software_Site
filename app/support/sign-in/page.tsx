import type { Metadata } from "next";
import SupportShell from "@/components/SupportShell";
import { getSupportPrincipal } from "@/lib/support/session";

export const metadata: Metadata = {
  title: "Sign in | Talon Software",
  description: "Client sign-in for the Talon Software support portal. Not open yet.",
};

export default async function SupportSignInPage() {
  const principal = await getSupportPrincipal();

  return (
    <SupportShell>
      <p className="eyebrow">Sign-in coming soon</p>
      <h1 className="mt-5 font-serif text-4xl font-medium tracking-tight text-ink">Sign in</h1>
      {principal ? (
        <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink/75">
          Signed in for {principal.companyName}.
        </p>
      ) : (
        <div className="mt-4 max-w-3xl space-y-4 text-lg leading-relaxed text-ink/75">
          <p>Client sign-in is not available yet. This page does not ask for a password, an email address, or any other credential.</p>
          <p>When sign-in exists, it will live on this page, and the portal sections will sit behind it.</p>
        </div>
      )}
    </SupportShell>
  );
}
