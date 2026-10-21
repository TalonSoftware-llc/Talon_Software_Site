"use client";

import { useDemoCompany } from "@/components/support/SupportAppShell";

export default function SupportAssistantPage() {
  const company = useDemoCompany();

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/40">Sample</p>
      <h1 className="mt-2 font-serif text-3xl font-medium">AI assistant</h1>
      <p className="mt-2 text-ink/70">
        Answers for {company.name}, drawn from that company&apos;s documents. This transcript is sample text. The
        assistant is not connected.
      </p>
      <ol className="mt-6 space-y-3">
        {company.assistant.map((message) => (
          <li
            key={message.text}
            className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
              message.from === "Assistant" ? "bg-white border border-[#d7dee7]" : "bg-[#1b2430] text-[#f4f0e8]"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-60">{message.from}</p>
            <p className="mt-1">{message.text}</p>
          </li>
        ))}
      </ol>
      <div className="mt-4">
        <label className="text-sm text-ink/60" htmlFor="assistant-draft">
          Message
        </label>
        <textarea
          id="assistant-draft"
          disabled
          rows={3}
          placeholder="Not available in the demo."
          className="mt-1 w-full rounded-md border border-[#d7dee7] bg-[#f4f6f8] px-3 py-2 text-sm text-ink/50"
        />
      </div>
    </div>
  );
}
