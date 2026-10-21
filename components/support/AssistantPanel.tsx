"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef } from "react";
import { ask, clearMessages, draftFromChat } from "./store";
import { useDemo } from "./use-demo";
import { useFrame } from "./frame";

export default function AssistantPanel({ mode = "dock", inputId = "assistant-ask" }: { mode?: "dock" | "page"; inputId?: string }) {
  const demo = useDemo();
  const { href } = useFrame();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const pending = demo.messages.some((message) => message.pending);

  useEffect(() => {
    const node = scroller.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [demo.messages]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = inputRef.current;
    if (!input || pending) return;
    const value = input.value;
    input.value = "";
    ask(value);
  }

  return (
    <section className={`flex h-full min-h-0 flex-col bg-white ${mode === "dock" ? "w-full" : ""}`} aria-label="Assistant">
      <header className="flex items-center justify-between gap-2 border-b border-[#e1e6ec] px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-ink">Ask</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold">
          {mode === "dock" ? (
            <Link href={href("/app/assistant")} className="text-pine hover:underline">
              Full view
            </Link>
          ) : (
            <Link href={href("/app")} className="text-pine hover:underline">
              Back
            </Link>
          )}
          <button type="button" className="text-ink/50 hover:text-ink" onClick={() => clearMessages()}>
            Clear
          </button>
        </div>
      </header>
      <div ref={scroller} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
        {demo.messages.map((message) => (
          <div key={message.id} className={message.role === "user" ? "ml-8" : "mr-6"}>
            <div className={message.role === "user" ? "rounded-2xl rounded-br-md bg-pine px-3 py-2 text-sm text-white" : "rounded-2xl rounded-bl-md bg-[#f3f5f7] px-3 py-2 text-sm text-ink"}>
              {message.shown}
              {message.pending ? <span className="ml-0.5 inline-block w-1.5 animate-pulse text-pine">|</span> : null}
            </div>
            {message.role === "assistant" && !message.pending && message.cites.length ? (
              <div className="mt-1 flex flex-wrap gap-2">
                {message.cites.map((cite) => (
                  <Link key={`${cite.href}-${cite.title}`} href={href(cite.href)} className="rounded-full bg-[#e7f3ef] px-2.5 py-1 text-xs font-semibold text-pine hover:underline">
                    {cite.title}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <div className="border-t border-[#e1e6ec] px-4 py-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {demo.page.hints.slice(0, 3).map((hint) => (
            <button
              key={hint}
              type="button"
              className="rounded-full border border-[#d5dde6] px-2.5 py-1 text-left text-xs text-ink/70 hover:border-pine/40 hover:text-ink"
              onClick={() => ask(hint)}
              disabled={pending}
            >
              {hint}
            </button>
          ))}
        </div>
        <form onSubmit={submit} autoComplete="off" className="flex gap-2">
          <label className="sr-only" htmlFor={inputId}>
            Ask anything
          </label>
          <input
            id={inputId}
            ref={inputRef}
            placeholder="Ask anything"
            autoComplete="off"
            className="min-w-0 flex-1 rounded-md border border-[#d5dde6] px-3 py-2 text-sm outline-none focus:border-pine focus:ring-2 focus:ring-pine/30"
          />
          <button type="submit" className="rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={pending}>
            Send
          </button>
        </form>
        <div className="mt-2 flex items-center justify-between gap-2">
          <button
            type="button"
            className="text-xs font-semibold text-pine hover:underline"
            onClick={() => {
              const draft = draftFromChat();
              if (draft) router.push(href("/app/requests/new"));
            }}
          >
            New request
          </button>
        </div>
      </div>
    </section>
  );
}
