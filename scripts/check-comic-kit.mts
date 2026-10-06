// Checks the comic kit and dialogue banks. Run: node scripts/check-comic-kit.mts
// - every line ≤ 18 words, unique ids, known scenes
// - every line's `fact` snippet exists in the topic's knowledge file
// - every arc can fill every layout, and the 'too complex' path
// - the rule-based fallback produces valid selections for every feedback category
// - the pre-made pool selections are valid
import fs from "node:fs";
import path from "node:path";
import { loadKit, loadBank, lintBank, checkSelection, fallbackPick } from "../lib/comicKit.ts";
import { FEEDBACK_CATEGORIES } from "../lib/feedbackMap.ts";
import type { Selection } from "../lib/comic.ts";

let failures = 0;
const fail = (m: string) => {
  failures++;
  console.log("FAIL", m);
};

const kit = loadKit();
const banks = fs.readdirSync(path.join("content", "comic-kit", "lines")).map((f) => f.replace(/\.json$/, ""));

for (const topicId of banks) {
  const bank = loadBank(topicId)!;
  const md = fs.readFileSync(path.join("content", "knowledge", `${topicId}.md`), "utf8");
  const facts = (md.split("## Core facts")[1] ?? "").split("\n## ")[0].split("\n").filter((l) => l.startsWith("- ")).map((l) => l.slice(2));
  for (const e of lintBank(bank, kit, facts)) fail(`${topicId}: ${e}`);

  let prev: Selection | null = null;
  for (let i = 0; i < 60; i++) {
    const fb = i % 5 === 4 ? null : FEEDBACK_CATEGORIES[i % 4];
    try {
      const sel = fallbackPick(kit, bank, fb, prev, 1000 + i);
      const errs = checkSelection(sel, kit, bank, fb, prev);
      if (errs.length) fail(`${topicId}: fallback(${fb}) invalid: ${errs.join("; ")}`);
      prev = sel;
    } catch (e) {
      fail(`${topicId}: fallback(${fb}) threw ${e}`);
    }
  }

  const poolDir = path.join("content", "comics", topicId);
  if (fs.existsSync(poolDir))
    for (const f of fs.readdirSync(poolDir).filter((f) => f.endsWith(".json"))) {
      const sel = JSON.parse(fs.readFileSync(path.join(poolDir, f), "utf8")).selection as Selection;
      const errs = checkSelection(sel, kit, bank, null, null);
      if (errs.length) fail(`${topicId}/${f}: ${errs.join("; ")}`);
    }
  console.log(`${topicId}: ${bank.arcs.length} arcs, ${bank.arcs.reduce((n, a) => n + a.lines.length, 0)} lines checked`);
}

console.log(failures ? `${failures} problem(s)` : "comic kit OK");
process.exit(failures ? 1 : 0);
