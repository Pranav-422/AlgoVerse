// Grow a comic dialogue bank with Gemini — offline authoring, gated by our checks.
//
//   npm run expand:bank -- arrays            (variants for every arc + 2 new arcs)
//   npm run expand:bank -- trees --arcs 3    (3 new arcs)
//   npm run expand:bank -- all
//
// Gemini drafts lines; nothing reaches the bank unless it passes: ≤ 18 words, valid role/level,
// fact snippet found verbatim in the knowledge file (or null), a valid scene, every number in
// the text present in the scene, unique beats per arc, then lintBank + a fallback fuzz on the
// whole bank. Rejected drafts are listed with the reason. A backup goes to data/bank-backups/.

import fs from "node:fs";
import path from "node:path";
import { getTopic } from "../lib/knowledge.ts";
import { loadKit, lintBank, checkSelection, fallbackPick } from "../lib/comicKit.ts";
import { runJson } from "../lib/gemini.ts";
import { SCENE_DOCS, validateScene, numbersMatchScene } from "../lib/sceneSchema.ts";
import { COMIC_STYLE } from "../lib/styleGuide.ts";
import type { Arc, DialogueBank, DialogueLine, Selection } from "../lib/comic.ts";
import { FEEDBACK_CATEGORIES } from "../lib/feedbackMap.ts";

const args = process.argv.slice(2);
const target = args[0];
const NEW_ARCS = Number(args[args.indexOf("--arcs") + 1] || 2) || 2;
if (!target) {
  console.error("usage: npm run expand:bank -- <topic|all> [--arcs N]");
  process.exit(1);
}
if (!process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is not set in .env.local");
  process.exit(1);
}

const LINES_DIR = path.join("content", "comic-kit", "lines");
const topics = target === "all" ? fs.readdirSync(LINES_DIR).filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", "")) : [target];
const kit = loadKit();
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
// Free tier: ~5 requests/minute and ~20/day per model, so drafts rotate across models
// and calls are paced. Busy (503) or rate-limited (429) models are skipped for the rest of the run.
const MODELS = (process.env.EXPAND_MODELS || "gemini-3.6-flash,gemini-3.5-flash-lite,gemini-3.8-flash,gemini-3.7-flash,gemini-3.5-flash,gemini-3.1-flash-lite")
  .split(",")
  .map((m) => m.trim());
const dead = new Set<string>();
let turn = 0;
async function draft<T>(prompt: string, validate: (v: unknown) => T): Promise<{ value: T; model: string }> {
  const alive = MODELS.filter((m) => !dead.has(m));
  if (!alive.length) throw new Error("every model is rate-limited or busy right now — try again later");
  const order = [...alive.slice(turn % alive.length), ...alive.slice(0, turn % alive.length)];
  turn++;
  await sleep(6500);
  try {
    const r = await runJson(prompt, validate, undefined, "draft", { models: order, maxAttempts: Math.min(4, order.length) });
    return { value: r.value, model: r.model };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/429|RESOURCE_EXHAUSTED/.test(msg)) for (const m of order.slice(0, 4)) if (msg.includes(m)) dead.add(m);
    throw e;
  }
}
const words = (t: string) => t.split(/\s+/).filter(Boolean).length;

type Draft = Partial<DialogueLine> & Record<string, unknown>;

function checkLine(d: Draft, facts: string[], needBeat: boolean): string[] {
  const errs: string[] = [];
  if (typeof d.text !== "string" || !d.text.trim()) errs.push("missing text");
  else if (words(d.text) > COMIC_STYLE.dialogueMaxWords) errs.push(`${words(d.text)} words`);
  if (!["setup", "step", "payoff"].includes(d.role as string)) errs.push("bad role");
  if (!["basic", "detail"].includes(d.level as string)) errs.push("bad level");
  if (typeof d.concept !== "string" || !d.concept) errs.push("missing concept");
  if (d.fact !== null && (typeof d.fact !== "string" || !facts.some((f) => f.includes(d.fact as string)))) errs.push(`fact "${d.fact}" not found verbatim`);
  if (needBeat && d.role === "step" && (typeof d.beat !== "string" || !d.beat)) errs.push("step line needs a beat");
  errs.push(...validateScene(d.scene));
  if (typeof d.text === "string") errs.push(...numbersMatchScene(d.text, d.scene));
  return errs;
}

function clean(d: Draft, id: string): DialogueLine {
  return {
    id,
    role: d.role as DialogueLine["role"],
    level: d.level as DialogueLine["level"],
    concept: String(d.concept).toLowerCase().replace(/\s+/g, "-").slice(0, 40),
    fact: (d.fact as string | null) ?? null,
    text: String(d.text).trim(),
    scene: d.scene as DialogueLine["scene"],
    ...(d.role === "step" && d.beat ? { beat: String(d.beat).toLowerCase().replace(/\s+/g, "-").slice(0, 40) } : {}),
  };
}

function fuzzOk(bank: DialogueBank): string[] {
  const errs: string[] = [];
  let prev: Selection | null = null;
  for (let i = 0; i < 40; i++) {
    const fb = i % 5 === 4 ? null : FEEDBACK_CATEGORIES[i % 4];
    try {
      const sel = fallbackPick(kit, bank, fb, prev, 7000 + i);
      const e = checkSelection(sel, kit, bank, fb, prev);
      if (e.length) errs.push(`fallback(${fb}): ${e[0]}`);
      prev = sel;
    } catch (e) {
      errs.push(`fallback(${fb}) threw: ${e}`);
    }
  }
  return errs;
}

const common = (topicName: string, facts: string[]) => [
  `You write dialogue lines for an educational comic about "${topicName}" for first/second-year CSE students.`,
  `The only character is the Mentor. Tone: ${COMIC_STYLE.tone}. One idea per line. At most ${COMIC_STYLE.dialogueMaxWords} words per line.`,
  ``,
  `FACTS — a line may only claim what is in this list. Put the exact snippet it relies on in "fact" (copied verbatim from one bullet), or null if the line makes no factual claim.`,
  ...facts.map((f) => `- ${f}`),
  ``,
  `SCENES — every line has exactly one scene; use only these shapes, and make the scene show exactly what the line says (every number written in the line must appear in the scene):`,
  ...Object.values(SCENE_DOCS).map((d) => `- ${d}`),
  ``,
  `LINE SHAPE: {"role":"setup"|"step"|"payoff","level":"basic"|"detail","concept":"kebab-case","beat":"kebab-case (steps only)","fact":"verbatim snippet"|null,"text":"...","scene":{...}}`,
];

for (const topicId of topics) {
  const topic = getTopic(topicId);
  const file = path.join(LINES_DIR, `${topicId}.json`);
  if (!topic || !fs.existsSync(file)) {
    console.log(`skip ${topicId}: no topic or bank`);
    continue;
  }
  const bank = JSON.parse(fs.readFileSync(file, "utf8")) as DialogueBank;
  const before = bank.arcs.reduce((n, a) => n + a.lines.length, 0);
  const prefix = topicId.split("-").map((w) => w[0]).join("") + "x";
  let counter = 0;
  const usedIds = new Set(bank.arcs.flatMap((a) => a.lines.map((l) => l.id)));
  const nextId = () => {
    let id: string;
    do id = `${prefix}-${++counter}`;
    while (usedIds.has(id));
    usedIds.add(id);
    return id;
  };
  const rejected: string[] = [];
  console.log(`\n== ${topicId}: ${bank.arcs.length} arcs, ${before} lines`);

  // --- 1. beats + variants for every existing arc ---
  for (const arc of bank.arcs) {
    const steps = arc.lines.filter((l) => l.role === "step");
    const prompt = [
      ...common(topic.name, topic.coreFacts),
      ``,
      `EXISTING ARC "${arc.id}" — ${arc.title} (id | role | level | text):`,
      ...arc.lines.map((l) => `  ${l.id} | ${l.role} | ${l.level} | ${l.text}`),
      ``,
      `TASK:`,
      `1. Give every STEP line above a short beat name describing its story moment (kebab-case).`,
      `2. For at least 4 of those beats, write 1–2 ALTERNATIVE step lines with the same beat: the same moment told differently (new wording, different example values, matching scene).`,
      `3. Write 2 more setup lines and 2 more payoff lines for this arc (at least one of each with level "basic").`,
      ``,
      `OUTPUT — strict JSON only: {"beats": {"<existing step line id>": "beat-name"}, "lines": [LINE, ...]}`,
    ].join("\n");
    try {
      const { value, model } = await draft(prompt, (v) => {
        const o = v as { beats?: Record<string, string>; lines?: Draft[] };
        if (!o || typeof o !== "object" || !Array.isArray(o.lines)) throw new Error("need {beats, lines}");
        return o;
      });
      console.log(`  ${arc.id}: drafted by ${model}`);
      for (const s of steps) {
        const b = value.beats?.[s.id];
        if (typeof b === "string" && b.trim()) s.beat = b.toLowerCase().replace(/\s+/g, "-").slice(0, 40);
      }
      const knownBeats = new Set(steps.map((s) => s.beat).filter(Boolean));
      for (const d of value.lines ?? []) {
        const errs = checkLine(d, topic.coreFacts, true);
        if (d.role === "step" && !knownBeats.has(String(d.beat ?? "").toLowerCase().replace(/\s+/g, "-"))) errs.push(`beat "${d.beat}" is not one of this arc's beats`);
        if (errs.length) {
          rejected.push(`${arc.id}: "${d.text}" — ${errs.join("; ")}`);
          continue;
        }
        const line = clean(d, nextId());
        if (line.role === "setup") arc.lines.splice(arc.lines.filter((l) => l.role === "setup").length, 0, line);
        else if (line.role === "payoff") arc.lines.push(line);
        else {
          const lastSame = arc.lines.map((l) => l.beat).lastIndexOf(line.beat);
          arc.lines.splice(lastSame + 1, 0, line);
        }
      }
      console.log(`  ${arc.id}: beats set, now ${arc.lines.length} lines`);
    } catch (e) {
      console.log(`  ${arc.id}: variants failed — ${(e instanceof Error ? e.message : String(e)).slice(0, 140)}`);
    }
  }

  // --- 2. new arcs ---
  for (let k = 0; k < NEW_ARCS; k++) {
    const existing = bank.arcs.map((a) => `"${a.id}" — ${a.title}`).join("; ");
    const basePrompt = [
      ...common(topic.name, topic.coreFacts),
      ``,
      `EXISTING ARCS (do not repeat their scenario, analogy or example data): ${existing}`,
      ``,
      `TASK: write ONE new arc — a short story with a fresh everyday analogy and fresh example values:`,
      `- 2–3 setup lines (at least one basic), 6–8 step lines in story order (each with a beat; give 2 beats an alternative line with the same beat, placed right after it), 2–3 payoff lines (at least one basic)`,
      `- at least 4 step lines must be level "basic"`,
      `- a quiz: {"q": "≤ 25 words", "options": [three answers], "answer": 0|1|2, "fact": "one Core-facts bullet copied exactly"}`,
      ``,
      `OUTPUT — strict JSON only: {"id": "kebab-case", "title": "Short Title", "lines": [LINE, ...], "quiz": {...}}`,
    ].join("\n");
    let added = false;
    let feedbackNote = "";
    for (let attempt = 0; attempt < 2 && !added; attempt++) {
      try {
        const { value } = await draft(basePrompt + feedbackNote, (v) => {
          const o = v as { id?: string; title?: string; lines?: Draft[]; quiz?: Arc["quiz"] };
          if (!o || typeof o.title !== "string" || !Array.isArray(o.lines)) throw new Error("need {id, title, lines, quiz}");
          return o;
        });
        const lines: DialogueLine[] = [];
        for (const d of value.lines ?? []) {
          const errs = checkLine(d, topic.coreFacts, true);
          if (errs.length) rejected.push(`new arc "${value.title}": "${d.text}" — ${errs.join("; ")}`);
          else lines.push(clean(d, nextId()));
        }
        const q = value.quiz;
        const quizOk =
          q && typeof q.q === "string" && words(q.q) <= 25 && Array.isArray(q.options) && q.options.length === 3 && [0, 1, 2].includes(q.answer) && topic.coreFacts.some((f) => f.trim() === String(q.fact).trim());
        let arcId = String(value.id || value.title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 30) || `arc-${k}`;
        while (bank.arcs.some((a) => a.id === arcId)) arcId += "-2";
        const arc: Arc = { id: arcId, title: value.title.slice(0, 40), lines, ...(quizOk ? { quiz: q } : {}) } as Arc;
        const probs = [...lintBank({ topicId, arcs: [arc] }, kit, topic.coreFacts), ...(quizOk ? [] : ["quiz invalid (fact must match a Core-facts bullet exactly)"])];
        if (probs.length) {
          feedbackNote = `\n\nYOUR PREVIOUS ARC WAS REJECTED FOR: ${probs.join("; ")}. Fix these.`;
          rejected.push(`new arc "${value.title}" rejected: ${probs.join("; ")}`);
          continue;
        }
        bank.arcs.push(arc);
        added = true;
        console.log(`  + arc "${arc.title}" (${arc.lines.length} lines)`);
      } catch (e) {
        console.log(`  new arc attempt failed — ${(e instanceof Error ? e.message : String(e)).slice(0, 140)}`);
      }
    }
  }

  // --- 3. whole-bank gate ---
  const problems = [...lintBank(bank, kit, topic.coreFacts), ...fuzzOk(bank)];
  if (problems.length) {
    console.log(`  NOT saved — the expanded bank fails checks:\n   ${problems.slice(0, 8).join("\n   ")}`);
    continue;
  }
  const backupDir = path.join("data", "bank-backups");
  fs.mkdirSync(backupDir, { recursive: true });
  fs.copyFileSync(file, path.join(backupDir, `${topicId}-${Date.now()}.json`));
  fs.writeFileSync(file, JSON.stringify(bank, null, 2) + "\n");
  const after = bank.arcs.reduce((n, a) => n + a.lines.length, 0);
  console.log(`  saved: ${before} → ${after} lines, ${bank.arcs.length} arcs`);
  if (rejected.length) console.log(`  rejected drafts (${rejected.length}):\n   ${rejected.slice(0, 12).join("\n   ")}`);
}
