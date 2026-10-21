"use client";

import { useDemoCompany } from "@/components/support/SupportAppShell";

export default function SupportKnowledgePage() {
  const company = useDemoCompany();

  return (
    <div className="max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/40">Sample</p>
      <h1 className="mt-2 font-serif text-3xl font-medium">Knowledge base</h1>
      <p className="mt-2 text-ink/70">Process notes for {company.name}. These pages are sample text, not a live library.</p>
      <div className="mt-6 space-y-3">
        {company.articles.map((article) => (
          <article key={article.title} className="rounded-xl border border-[#d7dee7] bg-white p-5">
            <h2 className="font-serif text-xl font-medium">{article.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/75">{article.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
