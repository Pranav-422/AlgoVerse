// Constrained vs free generation — the experiment behind the comic-kit design.
//
//   npm run experiment            (needs GEMINI_API_KEY in .env.local)
//   npm run experiment -- 4       (4 runs per arm per topic; default 2)
//
// For every topic that has a dialogue bank, it runs two arms with the same model:
//   FREE  — the earlier design: Gemini writes a 5-panel comic script itself from the facts.
//   KIT   — the current design: Gemini only picks ids from the prepared kit.
// Both arms are scored the same way on the text a learner would read:
//   • schema / rule failure of the raw answer (before any retry or fallback)
//   • lines over the 18-word limit
//   • Big-O claims that are not in the knowledge file
//   • lines a separate Gemini "judge" call flags as unsupported by the facts
// Results are written to content/experiments/constrained-vs-free.json and shown on /insights.
// Nothing is estimated or filled in: if a call fails it is counted as a failure.

import fs from "node:fs";
import path from "node:path";
import { GoogleGenAI } from "@google/genai";
import { getTopic } from "../lib/knowledge.ts";
import { loadKit, loadBank, buildPickPrompt, parseSelection, checkSelection, resolveComic } from "../lib/comicKit.ts";

const RUNS = Number(process.argv[2] ?? 2);
// Free tier is ~5 requests/minute and ~20/day per model. Each run uses ONE model for both arms
// (so every FREE-vs-KIT pair is compared on the same model); runs rotate across models.
const MODELS = (process.env.EXPERIMENT_MODELS || "gemini-3.6-flash,gemini-3.5-flash-lite,gemini-3.8-flash,gemini-3.7-flash,gemini-3.1-flash-lite")
  .split(",")
  .map((m) => m.trim());
const dead = new Set<string>();
let MODEL = MODELS[0];
const DELAY_MS = 6500;
const key = process.env.GEMINI_API_KEY;
if (!key) {
  console.error("GEMINI_API_KEY is not set. Put it in .env.local and run `npm run experiment`.");
  process.exit(1);
}
const ai = new GoogleGenAI({ apiKey: key });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

class Busy extends Error {}
async function ask(prompt: string, json: boolean): Promise<string> {
  await sleep(DELAY_MS);
  try {
    const res = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: { temperature: 0.9, ...(json ? { responseMimeType: "application/json" } : {}) },
    });
    return res.text?.trim() ?? "";
  } catch (e) {
    const msg = String(e);
    if (/429|503|RESOURCE_EXHAUSTED|UNAVAILABLE/.test(msg)) {
      dead.add(MODEL);
      throw new Busy(MODEL);
    }
    throw e;
  }
}
const modelsUsed = new Set<string>();

const bigOs = (t: string) => (t.match(/O\s*\([^)]*\)/g) ?? []).map((s) => s.toLowerCase().replace(/\s+/g, "").replace(/\^2/g, "²"));
const words = (t: string) => t.split(/\s+/).filter(Boolean).length;

function freePrompt(name: string, facts: string[]) {
  return [
    `You are writing the script for a short educational comic about the data-structures topic "${name}".`,
    ``,
    `FACTS — use only these. Do not state any fact that is not in this list.`,
    ...facts.map((f) => `- ${f}`),
    ``,
    `STYLE: exactly 5 panels, at most 18 words of dialogue per panel, clear and direct, one idea per panel.`,
    ``,
    `OUTPUT — strict JSON only: {"panels": [{"scene": string, "dialogue": string}]}`,
  ].join("\n");
}

function judgePrompt(facts: string[], lines: string[]) {
  return [
    `You are checking an educational comic for factual grounding.`,
    `FACTS (the only allowed source of truth):`,
    ...facts.map((f) => `- ${f}`),
    ``,
    `LINES:`,
    ...lines.map((l, i) => `${i + 1}. ${l}`),
    ``,
    `For each line, decide if it states anything (a complexity, a number, a rule, a property) that is NOT supported by the FACTS.`,
    `Narration with no factual claim counts as supported.`,
    `OUTPUT — strict JSON only: {"unsupported": [line numbers]}`,
  ].join("\n");
}

interface Arm {
  runs: number;
  schemaFailures: number;
  lines: number;
  overLimit: number;
  unsupportedBigO: number;
  judgeFlagged: number;
  judgeFailures: number;
}
const emptyArm = (): Arm => ({ runs: 0, schemaFailures: 0, lines: 0, overLimit: 0, unsupportedBigO: 0, judgeFlagged: 0, judgeFailures: 0 });

const arms = { free: emptyArm(), kit: emptyArm() };
const examples: { arm: string; topic: string; line: string; why: string }[] = [];

async function score(arm: Arm, armName: string, topicId: string, facts: string[], lines: string[]) {
  const allowed = new Set(facts.flatMap(bigOs));
  arm.lines += lines.length;
  for (const l of lines) {
    if (words(l) > 18) arm.overLimit++;
    const bad = bigOs(l).filter((o) => !allowed.has(o));
    if (bad.length) {
      arm.unsupportedBigO++;
      if (examples.length < 12) examples.push({ arm: armName, topic: topicId, line: l, why: `complexity not in facts: ${bad.join(", ")}` });
    }
  }
  try {
    const j = JSON.parse(await ask(judgePrompt(facts, lines), true)) as { unsupported?: number[] };
    const flagged = (j.unsupported ?? []).filter((n) => Number.isInteger(n) && n >= 1 && n <= lines.length);
    arm.judgeFlagged += flagged.length;
    for (const n of flagged.slice(0, 2)) if (examples.length < 12) examples.push({ arm: armName, topic: topicId, line: lines[n - 1], why: "judge: not supported by the facts" });
  } catch {
    arm.judgeFailures++;
  }
}

const kit = loadKit();
const topics = fs
  .readdirSync(path.join("content", "comic-kit", "lines"))
  .map((f) => f.replace(/\.json$/, ""));

for (const topicId of topics) {
  const topic = getTopic(topicId)!;
  const bank = loadBank(topicId)!;
  for (let i = 0; i < RUNS; i++) {
    const live = MODELS.filter((m) => !dead.has(m));
    if (!live.length) {
      console.log("every model is busy or rate-limited — stopping early; results so far are kept");
      break;
    }
    MODEL = live[0];
    const snapshot = JSON.stringify(arms);
    const exLen = examples.length;
    try {
    // FREE arm
    arms.free.runs++;
    try {
      const raw = JSON.parse(await ask(freePrompt(topic.name, topic.coreFacts), true)) as { panels?: { dialogue?: string }[] };
      const lines = (raw.panels ?? []).map((p) => String(p.dialogue ?? "")).filter(Boolean);
      if (lines.length !== 5) arms.free.schemaFailures++;
      if (lines.length) await score(arms.free, "free", topicId, topic.coreFacts, lines);
    } catch {
      arms.free.schemaFailures++;
    }
    // KIT arm
    arms.kit.runs++;
    try {
      const sel = parseSelection(JSON.parse(await ask(buildPickPrompt(topic.name, kit, bank, null, null).prompt, true)));
      const errs = checkSelection(sel, kit, bank, null, null);
      if (errs.length) {
        arms.kit.schemaFailures++;
      } else {
        const comic = resolveComic(sel, kit, bank, { id: "exp", source: "generated" });
        await score(arms.kit, "kit", topicId, topic.coreFacts, comic.panels.map((p) => p.text));
      }
    } catch {
      arms.kit.schemaFailures++;
    }
    modelsUsed.add(MODEL);
    console.log(`${topicId} run ${i + 1}/${RUNS} done (${MODEL})`);
    } catch (e) {
      if (!(e instanceof Busy)) throw e;
      Object.assign(arms, JSON.parse(snapshot)); // a run cut off by rate limits is discarded, not half-counted
      examples.length = exLen;
      console.log(`${topicId} run ${i + 1}: ${MODEL} busy — retrying this run on another model`);
      i--;
    }
  }
}

const out = { runAt: new Date().toISOString(), model: [...modelsUsed].join(", "), runsPerArmPerTopic: RUNS, topics, arms, examples };
fs.mkdirSync(path.join("content", "experiments"), { recursive: true });
fs.writeFileSync(path.join("content", "experiments", "constrained-vs-free.json"), JSON.stringify(out, null, 2));
console.log(JSON.stringify(arms, null, 2));
console.log("written content/experiments/constrained-vs-free.json");
