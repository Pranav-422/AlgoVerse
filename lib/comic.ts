// Comic shapes. Client-safe: no server imports.
//
// A comic is never free-form. It is a *selection* from the prepared kit
// (content/comic-kit): a layout, a palette, a design, a theme, and one dialogue
// line + pose per panel. The model (or the rule-based fallback) only makes that
// selection; everything drawn comes from the kit.

import type { TraceStep } from "./trace";

// --- the kit -------------------------------------------------------------------

export interface KitLayout {
  id: string;
  name: string;
  about: string;
  cols: number;
  /** Column span of each panel; length = panel count. */
  spans: number[];
}

export interface KitPalette {
  id: string;
  name: string;
  paper: string;
  ink: string;
  accent: string;
  accent2: string;
  soft: string;
}

export interface KitOption {
  id: string;
  name?: string;
  about: string;
}

export interface Kit {
  layouts: KitLayout[];
  palettes: KitPalette[];
  designs: KitOption[];
  themes: KitOption[];
  poses: KitOption[];
}

/** Scene drawn behind the Mentor. `id` picks the scene component; the rest are its props. */
export interface SceneSpec {
  id: "row" | "formula" | "cinema" | "complexity" | "messy" | "chain" | "stack" | "queue" | "tree";
  [key: string]: unknown;
}

export interface DialogueLine {
  id: string;
  role: "setup" | "step" | "payoff";
  level: "basic" | "detail";
  concept: string;
  /** Snippet that must appear in one of the topic's core facts (null = no factual claim). */
  fact: string | null;
  text: string;
  scene: SceneSpec;
}

export interface ComicQuiz {
  q: string;
  options: [string, string, string];
  answer: 0 | 1 | 2;
  fact: string;
}

export interface Arc {
  id: string;
  title: string;
  lines: DialogueLine[];
  quiz?: ComicQuiz;
}

export interface DialogueBank {
  topicId: string;
  arcs: Arc[];
}

// --- a selection (what the model returns) ---------------------------------------

export interface Selection {
  layout: string;
  palette: string;
  design: string;
  theme: string;
  panels: { line: string; pose: string }[];
}

// --- a resolved comic (what the viewer draws) -----------------------------------

export interface Panel {
  n: number;
  lineId: string;
  text: string;
  concept: string;
  role: DialogueLine["role"];
  scene: SceneSpec;
  pose: string;
  /** Column span in the page layout. */
  span: number;
}

export interface Comic {
  id: string;
  title: string;
  topicId: string;
  arc: string;
  source: "pregenerated" | "generated";
  selection: Selection;
  layout: KitLayout;
  palette: KitPalette;
  design: string;
  theme: string;
  panels: Panel[];
  quiz?: ComicQuiz;
}

/** Everything "How this was generated" needs for the content on screen. */
export interface Provenance {
  source: "pregenerated" | "generated" | "handwritten" | "deterministic";
  model: string | null;
  /** The exact string sent to the model, or null if there was no prompt. */
  prompt: string | null;
  injectedFacts: string[];
  constraints: string[];
  feedback: { category: string; instruction: string } | null;
  /** The raw picks (layout/palette/design/theme/lines/poses). */
  selection?: Selection;
  note?: string;
  createdAt?: number;
  /** Ordered pipeline steps with timings (prompt built → model → rule check → …). */
  trace?: TraceStep[];
  /** Fact-guard result for rewrites of the brief. */
  guard?: { ok: boolean; newClaims: string[]; checked: number };
  /** Learner preferences that shaped this generation, if any. */
  preferences?: { length: string; style: string; pace: string } | null;
}

export interface ComicWithProvenance {
  comic: Comic;
  provenance: Provenance;
}
