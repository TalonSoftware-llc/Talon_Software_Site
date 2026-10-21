"use client";

import Link from "next/link";
import { useState } from "react";
import { useFrame } from "../frame";
import { usePageContext } from "../page-context";
import { Card, PageHeader, primaryClass, quietClass } from "../ui";

export function PasswordHelp() {
  const { href } = useFrame();
  const [mode, setMode] = useState<"password" | "mfa">("password");
  usePageContext({
    section: "help",
    title: "Password and MFA",
    hints: ["How do I reset a password?", "How do I register a new phone?", "Where is the MFA article?"],
  });
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <PageHeader
        title="Password and MFA"
        detail="Reset a password or register a new phone. This screen does not change either one."
      />
      <Card>
        <div className="flex gap-2">
          <button type="button" className={mode === "password" ? primaryClass : quietClass} onClick={() => setMode("password")}>
            Password
          </button>
          <button type="button" className={mode === "mfa" ? primaryClass : quietClass} onClick={() => setMode("mfa")}>
            New phone
          </button>
        </div>
        {mode === "password" ? (
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
            <li>Be at the clinic desk. The temporary password is not emailed to the locked mailbox.</li>
            <li>Sign in once with the temporary password.</li>
            <li>Confirm MFA is still on the account before you leave.</li>
          </ol>
        ) : (
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
            <li>Come into the clinic. A chat message is not enough to drop the old phone.</li>
            <li>Remove the old authenticator while you are signed in on the clinic PC.</li>
            <li>Scan the new code. Add text backup only after the app works.</li>
          </ol>
        )}
        <p className="mt-3 text-xs text-ink/50">Nothing on this page is sent or stored.</p>
      </Card>
      <p className="text-sm">
        <Link href={href("/app/knowledge/password-reset")} className="text-pine underline">
          Password reset article
        </Link>
        {" · "}
        <Link href={href("/app/knowledge/mfa-setup")} className="text-pine underline">
          MFA setup article
        </Link>
      </p>
    </div>
  );
}
