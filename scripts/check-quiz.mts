// Checks the quiz bank of every topic. Run: npx tsx scripts/check-quiz.mts
// - at least 10 questions per topic (comic-arc quizzes + content/quiz/<topic>.json)
// - every question passes the same lint as the comic quizzes (3 options, verbatim core fact, a "why" per option)
// - no question text is repeated, and the right answer is not always in the same slot
import fs from "node:fs";
import { loadQuizBank, lintQuiz } from "../lib/comicKit.ts";

let failures = 0;
const fail = (m: string) => {
  failures++;
  console.log("FAIL", m);
};

for (const f of fs.readdirSync("content/knowledge").filter((f) => f.endsWith(".md"))) {
  const topicId = f.replace(/\.md$/, "");
  const md = fs.readFileSync(`content/knowledge/${f}`, "utf8");
  const core = md.split(/^## /m).find((s) => s.startsWith("Core facts")) ?? "";
  const coreFacts = core.split("\n").filter((l) => l.startsWith("- ")).map((l) => l.slice(2).trim());
  const bank = loadQuizBank(topicId);
  if (bank.length < 10) fail(`${topicId}: ${bank.length} questions, need at least 10`);
  for (const q of bank) for (const e of lintQuiz(q, `${topicId}/${q.id}`, coreFacts)) fail(e);
  const texts = bank.map((q) => q.q.trim().toLowerCase());
  if (new Set(texts).size !== texts.length) fail(`${topicId}: a question text is repeated`);
  if (bank.length >= 10 && new Set(bank.map((q) => q.answer)).size < 3) fail(`${topicId}: answers should use all three slots`);
  console.log(`${topicId}: ${bank.length} questions`);
}

if (failures) {
  console.log(`\n${failures} failure(s)`);
  process.exit(1);
}
console.log("\nquiz bank OK");
