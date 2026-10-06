import fs from "node:fs";
import path from "node:path";
import type { Arc, Comic, DialogueBank, DialogueLine, Kit, Selection } from "./comic";
import { FEEDBACK_MAP, type FeedbackCategory } from "./feedbackMap";
import { COMIC_STYLE } from "./styleGuide";

// The comic kit: loading, the selection rules, the prompt that asks the model to pick,
// a rule-based fallback picker, and resolving a selection into a drawable comic.

const KIT_DIR = path.join(process.cwd(), "content", "comic-kit");

export function loadKit(): Kit {
  return JSON.parse(fs.readFileSync(path.join(KIT_DIR, "kit.json"), "utf8")) as Kit;
}

export function loadBank(topicId: string): DialogueBank | null {
  const file = path.join(KIT_DIR, "lines", `${topicId}.json`);
  if (!/^[a-z0-9-]+$/.test(topicId) || !fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, "utf8")) as DialogueBank;
}

function lineIndex(bank: DialogueBank) {
  const map = new Map<string, { line: DialogueLine; arc: Arc; order: number }>();
  for (const arc of bank.arcs) arc.lines.forEach((line, order) => map.set(line.id, { line, arc, order }));
  return map;
}

// --- rules ---------------------------------------------------------------------

/** The structural rules every selection must satisfy, as text (shown to the model and on screen). */
export const SELECTION_RULES = [
  "All panels use lines from ONE arc",
  "Panel 1 is a setup line, the last panel is a payoff line, the panels between are step lines",
  "Step lines keep the order they have in the bank",
  "No line is used twice",
  "Panel count equals the chosen layout's panel count",
  "Every id must exist in the kit",
];

/**
 * Check a selection against the kit, the bank, and the active feedback rule.
 * Returns a list of problems (empty = valid).
 */
export function checkSelection(
  sel: Selection,
  kit: Kit,
  bank: DialogueBank,
  feedback: FeedbackCategory | null,
  previous: Selection | null,
): string[] {
  const errs: string[] = [];
  const layout = kit.layouts.find((l) => l.id === sel.layout);
  if (!layout) errs.push(`unknown layout "${sel.layout}"`);
  if (!kit.palettes.some((p) => p.id === sel.palette)) errs.push(`unknown palette "${sel.palette}"`);
  if (!kit.designs.some((d) => d.id === sel.design)) errs.push(`unknown design "${sel.design}"`);
  if (!kit.themes.some((t) => t.id === sel.theme)) errs.push(`unknown theme "${sel.theme}"`);
  if (!Array.isArray(sel.panels) || sel.panels.length === 0) return [...errs, "panels must be a non-empty array"];
  if (layout && sel.panels.length !== layout.spans.length)
    errs.push(`layout ${layout.id} has ${layout.spans.length} panels, got ${sel.panels.length}`);

  const idx = lineIndex(bank);
  const found = sel.panels.map((p) => idx.get(p.line));
  sel.panels.forEach((p, i) => {
    if (!found[i]) errs.push(`panel ${i + 1}: unknown line "${p.line}"`);
    if (!kit.poses.some((k) => k.id === p.pose)) errs.push(`panel ${i + 1}: unknown pose "${p.pose}"`);
  });
  if (errs.length) return errs;

  const lines = found.map((f) => f!);
  if (new Set(lines.map((l) => l.arc.id)).size > 1) errs.push("lines come from more than one arc");
  if (new Set(sel.panels.map((p) => p.line)).size !== sel.panels.length) errs.push("a line is used twice");
  if (lines[0].line.role !== "setup") errs.push("panel 1 must be a setup line");
  if (lines[lines.length - 1].line.role !== "payoff") errs.push("the last panel must be a payoff line");
  const middle = lines.slice(1, -1);
  if (middle.some((l) => l.line.role !== "step")) errs.push("middle panels must be step lines");
  for (let i = 1; i < middle.length; i++) if (middle[i].order <= middle[i - 1].order) errs.push("step lines are out of order");

  if (feedback === "too complex") {
    if (sel.panels.length !== 4) errs.push("feedback 'too complex' needs exactly 4 panels");
    if (lines.some((l) => l.line.level !== "basic")) errs.push("feedback 'too complex' allows only basic lines");
  }
  if (previous) {
    if (feedback === "pacing" && sel.panels.length === previous.panels.length)
      errs.push("feedback 'pacing' needs a different panel count than before");
    if (feedback === "art style" && (sel.palette === previous.palette || sel.design === previous.design))
      errs.push("feedback 'art style' needs a different palette and design");
    if (feedback === "character") {
      const same = sel.panels.map((p) => p.pose).join() === previous.panels.map((p) => p.pose).join();
      if (same || new Set(sel.panels.map((p) => p.pose)).size < 3) errs.push("feedback 'character' needs a new pose sequence with 3+ poses");
    }
    if (!feedback && JSON.stringify(sel) === JSON.stringify(previous)) errs.push("selection is identical to the previous comic");
  }
  return errs;
}

// --- the prompt ----------------------------------------------------------------

export interface PickPrompt {
  prompt: string;
  constraints: string[];
  feedback: { category: FeedbackCategory; instruction: string } | null;
}

export function buildPickPrompt(topicName: string, kit: Kit, bank: DialogueBank, feedback: FeedbackCategory | null, previous: Selection | null): PickPrompt {
  const adj = feedback ? { category: feedback, instruction: FEEDBACK_MAP[feedback].instruction } : null;
  const constraints = [...SELECTION_RULES, ...(adj ? [`Feedback: ${adj.instruction}`] : [])];
  const list = (items: { id: string; name?: string; about: string }[]) => items.map((i) => `- ${i.id}: ${i.about}`);

  const prompt = [
    `You are assembling a short educational comic about "${topicName}" from a fixed kit.`,
    `You do not write any text. You only choose ids from the lists below.`,
    ``,
    `LAYOUTS (panel count and sizes)`,
    ...kit.layouts.map((l) => `- ${l.id}: ${l.spans.length} panels. ${l.about}`),
    ``,
    `PALETTES`,
    ...kit.palettes.map((p) => `- ${p.id}: ${p.name}`),
    ``,
    `DESIGNS`,
    ...list(kit.designs),
    ``,
    `THEMES`,
    ...list(kit.themes),
    ``,
    `POSES (one per panel)`,
    ...list(kit.poses),
    ``,
    `DIALOGUE BANK (grouped by arc; id | role | level | text)`,
    ...bank.arcs.flatMap((a) => [`Arc "${a.id}" — ${a.title}`, ...a.lines.map((l) => `  ${l.id} | ${l.role} | ${l.level} | ${l.text}`)]),
    ``,
    `RULES`,
    ...SELECTION_RULES.map((r) => `- ${r}`),
    `- Prefer poses that fit the line (cheer for payoffs, think for questions, point when showing).`,
    ...(adj ? [``, `LEARNER FEEDBACK (${adj.category})`, `- ${adj.instruction}`] : []),
    ...(previous ? [``, `PREVIOUS COMIC (your choice must differ from it)`, JSON.stringify(previous)] : []),
    ``,
    `OUTPUT — strict JSON only, no prose:`,
    `{"layout": string, "palette": string, "design": string, "theme": string, "panels": [{"line": string, "pose": string}]}`,
  ].join("\n");

  return { prompt, constraints, feedback: adj };
}

/** Coerce raw model JSON into a Selection shape (structure only; rules are checked separately). */
export function parseSelection(v: unknown): Selection {
  if (!v || typeof v !== "object") throw new Error("root must be an object");
  const o = v as Record<string, unknown>;
  const s = (k: string) => {
    if (typeof o[k] !== "string") throw new Error(`${k} must be a string`);
    return o[k] as string;
  };
  if (!Array.isArray(o.panels)) throw new Error("panels must be an array");
  return {
    layout: s("layout"),
    palette: s("palette"),
    design: s("design"),
    theme: s("theme"),
    panels: o.panels.map((p, i) => {
      const q = (p ?? {}) as Record<string, unknown>;
      if (typeof q.line !== "string" || typeof q.pose !== "string") throw new Error(`panels[${i}] needs line and pose strings`);
      return { line: q.line, pose: q.pose };
    }),
  };
}

// --- rule-based fallback -------------------------------------------------------

/** Small seeded RNG so a fallback pick is reproducible from its seed. */
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

/**
 * Pick a valid selection without a model. Used when there is no API key, the model times out,
 * or its answer breaks the rules twice. Obeys the same rules and feedback constraints.
 */
export function fallbackPick(kit: Kit, bank: DialogueBank, feedback: FeedbackCategory | null, previous: Selection | null, seed = Date.now()): Selection {
  const rand = rng(seed);
  const pick = <T,>(xs: T[]) => xs[Math.floor(rand() * xs.length)];
  for (let attempt = 0; attempt < 200; attempt++) {
    let layouts = kit.layouts;
    if (feedback === "too complex") layouts = layouts.filter((l) => l.spans.length === 4);
    if (feedback === "pacing" && previous) layouts = layouts.filter((l) => l.spans.length !== previous.panels.length);
    const layout = pick(layouts);
    const n = layout.spans.length;
    const basicOnly = feedback === "too complex";
    const arc = pick(bank.arcs);
    const ok = (l: DialogueLine) => !basicOnly || l.level === "basic";
    const setups = arc.lines.filter((l) => l.role === "setup" && ok(l));
    const steps = arc.lines.filter((l) => l.role === "step" && ok(l));
    const payoffs = arc.lines.filter((l) => l.role === "payoff" && ok(l));
    if (!setups.length || !payoffs.length || steps.length < n - 2) continue;
    // choose n-2 steps, keeping bank order
    const chosen = [...steps].sort(() => rand() - 0.5).slice(0, n - 2);
    const orderedSteps = steps.filter((s) => chosen.includes(s));
    const lines = [pick(setups), ...orderedSteps, pick(payoffs)];
    const poseFor = (l: DialogueLine, i: number) =>
      l.role === "payoff" ? (rand() < 0.7 ? "cheer" : "explain") : i === 0 ? pick(["explain", "think"]) : pick(["point", "explain", "think", "surprised"]);
    const sel: Selection = {
      layout: layout.id,
      palette: pick(kit.palettes).id,
      design: pick(kit.designs).id,
      theme: pick(kit.themes).id,
      panels: lines.map((l, i) => ({ line: l.id, pose: poseFor(l, i) })),
    };
    if (checkSelection(sel, kit, bank, feedback, previous).length === 0) return sel;
  }
  throw new Error("Fallback picker could not satisfy the rules");
}

// --- resolve -------------------------------------------------------------------

export function resolveComic(sel: Selection, kit: Kit, bank: DialogueBank, meta: { id: string; source: Comic["source"] }): Comic {
  const idx = lineIndex(bank);
  const layout = kit.layouts.find((l) => l.id === sel.layout)!;
  const first = idx.get(sel.panels[0].line)!;
  return {
    id: meta.id,
    title: first.arc.title,
    topicId: bank.topicId,
    arc: first.arc.id,
    source: meta.source,
    selection: sel,
    layout,
    palette: kit.palettes.find((p) => p.id === sel.palette)!,
    design: sel.design,
    theme: sel.theme,
    panels: sel.panels.map((p, i) => {
      const { line } = idx.get(p.line)!;
      return { n: i + 1, lineId: line.id, text: line.text, concept: line.concept, role: line.role, scene: line.scene, pose: p.pose, span: layout.spans[i] };
    }),
  };
}

/** The knowledge facts that the chosen lines rely on (for "How this was generated"). */
export function factsFor(sel: Selection, bank: DialogueBank, coreFacts: string[]): string[] {
  const idx = lineIndex(bank);
  const out = new Set<string>();
  for (const p of sel.panels) {
    const snippet = idx.get(p.line)?.line.fact;
    const fact = snippet && coreFacts.find((f) => f.includes(snippet));
    if (fact) out.add(fact);
  }
  return [...out];
}

/** Bank-level checks: run by scripts/check-comic-kit.mts. */
export function lintBank(bank: DialogueBank, kit: Kit, coreFacts: string[]): string[] {
  const errs: string[] = [];
  const ids = new Set<string>();
  for (const arc of bank.arcs) {
    for (const l of arc.lines) {
      if (ids.has(l.id)) errs.push(`${l.id}: duplicate id`);
      ids.add(l.id);
      const words = l.text.split(/\s+/).filter(Boolean).length;
      if (words > COMIC_STYLE.dialogueMaxWords) errs.push(`${l.id}: ${words} words (max ${COMIC_STYLE.dialogueMaxWords})`);
      if (l.fact && !coreFacts.some((f) => f.includes(l.fact!))) errs.push(`${l.id}: fact "${l.fact}" not found in the knowledge file`);
      if (!["row", "formula", "cinema", "complexity", "messy", "chain", "stack", "queue", "tree"].includes(l.scene.id)) errs.push(`${l.id}: unknown scene ${l.scene.id}`);
    }
    for (const role of ["setup", "payoff"] as const)
      if (!arc.lines.some((l) => l.role === role && l.level === "basic")) errs.push(`arc ${arc.id}: needs a basic ${role} line`);
    const steps = arc.lines.filter((l) => l.role === "step");
    const maxPanels = Math.max(...kit.layouts.map((l) => l.spans.length));
    if (steps.length < maxPanels - 2) errs.push(`arc ${arc.id}: only ${steps.length} steps, the largest layout needs ${maxPanels - 2}`);
    if (steps.filter((l) => l.level === "basic").length < 2) errs.push(`arc ${arc.id}: needs 2+ basic steps for 'too complex'`);
  }
  return errs;
}
