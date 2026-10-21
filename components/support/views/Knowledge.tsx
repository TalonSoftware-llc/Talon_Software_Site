"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { getSupportRepository } from "@/lib/support/data";
import { formatDay } from "@/lib/support/format";
import { useFrame } from "../frame";
import { usePageContext } from "../page-context";
import { Card, Empty, PageHeader, fieldClass } from "../ui";

const repo = getSupportRepository(null);

export function KnowledgeList() {
  const { href } = useFrame();
  const [text, setText] = useState("");
  const [category, setCategory] = useState("All");
  const articles = repo.articles();
  const categories = ["All", ...new Set(articles.map((article) => article.category))];
  const rows = articles.filter((article) => {
    if (category !== "All" && article.category !== category) return false;
    if (text.trim() && !`${article.title} ${article.summary}`.toLowerCase().includes(text.toLowerCase())) return false;
    return true;
  });
  usePageContext({ section: "knowledge", title: "Knowledge", hints: ["How do I reset a password?", "How do I onboard a new hire?", "What does incident response say?"] });
  return (
    <div className="space-y-4">
      <PageHeader title="Knowledge" detail="The articles the assistant cites. Last reviewed date is on each one." />
      <div className="flex flex-wrap gap-2">
        <input className={fieldClass + " max-w-sm"} value={text} onChange={(event) => setText(event.target.value)} placeholder="Search articles" aria-label="Search articles" />
        {categories.map((item) => (
          <button key={item} type="button" className={`rounded-full px-3 py-1 text-sm ${category === item ? "bg-ink text-white" : "border border-[#d5dde6] bg-white"}`} onClick={() => setCategory(item)}>{item}</button>
        ))}
      </div>
      {rows.length === 0 ? <Empty title="No article matches" detail="Try password, MFA, or onboarding." /> : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((article) => (
            <Link key={article.slug} href={href(`/app/knowledge/${article.slug}`)} className="rounded-xl border border-[#e1e6ec] bg-white p-4 hover:border-pine/40">
              <p className="text-xs uppercase tracking-[0.12em] text-ink/40">{article.category}</p>
              <h2 className="mt-1 font-semibold">{article.title}</h2>
              <p className="mt-1 text-sm text-ink/70">{article.summary}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function ArticleView({ slug }: { slug: string }) {
  const { href } = useFrame();
  const article = repo.article(slug);
  const related = useMemo(() => article?.related.map((item) => repo.article(item)).filter((item) => item !== undefined) ?? [], [article]);
  usePageContext({ section: "knowledge", title: article?.title ?? "Article", subject: article?.title, hints: ["How do I reset a password?", "What is the offboarding order?"] });
  if (!article) return <Empty title="Article not found" detail="It is not in this knowledge base." />;
  return (
    <article className="mx-auto max-w-2xl space-y-4">
      <PageHeader eyebrow={article.category} title={article.title} detail={`Reviewed ${formatDay(article.reviewed)} · ${article.owner}`} />
      {article.body.map((paragraph) => <p key={paragraph} className="text-sm leading-6 text-ink/80">{paragraph}</p>)}
      {related.length ? (
        <Card>
          <h2 className="font-semibold">Related</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {related.map((item) => <li key={item.slug}><Link href={href(`/app/knowledge/${item.slug}`)} className="text-pine underline">{item.title}</Link></li>)}
          </ul>
        </Card>
      ) : null}
    </article>
  );
}
