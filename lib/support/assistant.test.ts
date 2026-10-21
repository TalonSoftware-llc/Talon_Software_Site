import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import type { AssistantFacts } from "./assistant.ts";

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(ts|tsx)$/.test(name) && !name.endsWith(".test.ts")) out.push(path);
  }
  return out;
}

const banned = /openai|anthropic|@ai-sdk|generateText|streamText|OPENAI_|ANTHROPIC_|fetch\s*\(/;
for (const file of [...walk("lib/support"), ...walk("components/support"), ...walk("app/support")]) {
  const source = readFileSync(file, "utf8");
  assert.equal(banned.test(source), false, `${file} should not call a model or the network`);
}

function emit(file: string, outDir: string) {
  const source = readFileSync(file, "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    fileName: file,
  }).outputText.replaceAll(/from "(\.[^"]+)"/g, 'from "$1.js"');
  const dest = join(outDir, file.replace(/\.tsx?$/, ".js"));
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, js);
}

const outDir = mkdtempSync(join(tmpdir(), "talon-assistant-"));
for (const file of ["lib/support/format.ts", "lib/support/types.ts", "lib/support/assistant.ts"]) emit(file, outDir);

const assistant = await import(pathToFileURL(join(outDir, "lib/support/assistant.js")).href);
const draftAssistantReply = assistant.draftAssistantReply as (turn: {
  question: string;
  pageTitle: string;
  pageSection: string;
  hints: string[];
  facts: AssistantFacts;
}) => { text: string; cites: { href: string }[] };

const facts: AssistantFacts = {
  workspaceName: "Larkspur Veterinary Group",
  plan: "Pro",
  role: "leadership",
  directory: "Microsoft Entra ID",
  monthlySpend: 28400,
  monthlyBudget: 27000,
  openTickets: 4,
  mfaMissing: 2,
  headcount: 86,
  degraded: [],
};

const spend = draftAssistantReply({
  question: "Where is spend versus budget?",
  pageTitle: "Overview",
  pageSection: "overview",
  hints: [],
  facts,
});
assert.match(spend.text, /\$28,400/);
assert.ok(spend.cites.some((cite) => cite.href === "/app/spending"));

const staff = draftAssistantReply({
  question: "Where is spend versus budget?",
  pageTitle: "Overview",
  pageSection: "overview",
  hints: [],
  facts: { ...facts, role: "staff" },
});
assert.equal(staff.text.includes("28400"), false);
assert.equal(staff.text.includes("$"), false);

const onboard = draftAssistantReply({
  question: "How do I onboard a new hire?",
  pageTitle: "People",
  pageSection: "people",
  hints: [],
  facts,
});
assert.ok(onboard.cites.some((cite) => cite.href === "/app/people/add"));

const contained = draftAssistantReply({
  question: "Do you train on our data?",
  pageTitle: "Overview",
  pageSection: "overview",
  hints: [],
  facts,
});
assert.match(contained.text, /not used to train/);

console.log("assistant checks passed");
