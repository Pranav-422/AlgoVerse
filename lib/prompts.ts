import "server-only";
import type { Topic } from "./knowledge";
import type { FeedbackCategory } from "./feedbackMap";

// Fixed prompt templates. Each builder returns the exact prompt string plus the
// pieces that went into it, so "How this was generated" can show them faithfully.

export interface BuiltPrompt {
  prompt: string;
  injectedFacts: string[];
  constraints: string[];
  feedback: { category: FeedbackCategory; instruction: string } | null;
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
