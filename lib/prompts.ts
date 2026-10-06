import "server-only";
import type { Topic } from "./knowledge";
import { COMIC_STYLE, styleConstraints } from "./styleGuide";
import { FEEDBACK_MAP, type FeedbackCategory } from "./feedbackMap";
import { TOPIC_PALETTES } from "./theme";

// Fixed prompt templates. Each builder returns the exact prompt string plus the
// pieces that went into it, so "How this was generated" can show them faithfully.

export interface BuiltPrompt {
  prompt: string;
  injectedFacts: string[];
  constraints: string[];
  feedback: { category: FeedbackCategory; instruction: string } | null;
}

export function buildComicScriptPrompt(topic: Topic, feedback: FeedbackCategory | null): BuiltPrompt {
  const facts = topic.coreFacts;
  const constraints = styleConstraints();
  const adj = feedback ? { category: feedback, instruction: FEEDBACK_MAP[feedback].instruction } : null;
  const palette = TOPIC_PALETTES[topic.palette] ?? TOPIC_PALETTES.amber;

  const prompt = [
    `You are writing the script for a short educational comic about the data-structures topic "${topic.name}".`,
    ``,
    `FACTS — use only these. Do not state any fact that is not in this list.`,
    ...facts.map((f) => `- ${f}`),
    ``,
    `STYLE CONSTRAINTS`,
    ...constraints.map((c) => `- ${c}`),
    `- Good dialogue example: "${COMIC_STYLE.examples.good[0]}"`,
    `- Bad dialogue example (never write like this): "${COMIC_STYLE.examples.bad[0]}"`,
    `- Scene descriptions describe setting and action only. Never describe the character's appearance.`,
    `- Visual palette for scenes: ${palette.join(", ")}`,
    ...(adj ? [``, `LEARNER FEEDBACK ADJUSTMENT (${adj.category})`, `- ${adj.instruction}`] : []),
    ``,
    `OUTPUT — strict JSON only, no prose, matching exactly:`,
    `{"title": string, "conceptId": string, "panels": [{"scene": string, "dialogue": string, "concept": string}]}`,
  ].join("\n");

  return { prompt, injectedFacts: facts, constraints, feedback: adj };
}

export function buildExpressivePrompt(topic: Topic): BuiltPrompt {
  const facts = topic.coreFacts;
  const constraints = [
    "Keep every fact exactly as given; add no new facts, numbers or claims",
    "Same length as the original, give or take 20%",
    "Richer, more vivid language; concrete imagery",
    "Plain text, no markdown, no headings",
  ];
  const prompt = [
    `Rewrite the following summary of "${topic.name}" in more expressive, vivid language.`,
    ``,
    `ORIGINAL SUMMARY`,
    topic.summary,
    ``,
    `ALLOWED FACTS — the rewrite may only state facts from this list:`,
    ...facts.map((f) => `- ${f}`),
    ``,
    `RULES`,
    ...constraints.map((c) => `- ${c}`),
  ].join("\n");
  return { prompt, injectedFacts: facts, constraints, feedback: null };
}
