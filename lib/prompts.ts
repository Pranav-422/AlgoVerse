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

export type RewriteMode = "expressive" | "hinglish";

export function buildRewritePrompt(topic: Topic, mode: RewriteMode): BuiltPrompt {
  const facts = topic.coreFacts;
  const constraints =
    mode === "hinglish"
      ? [
          "Write in Hinglish: Hindi in Roman script, mixed naturally with English",
          "Keep every technical term in English (array, index, pointer, O(n)…)",
          "Keep every fact exactly as given; add no new facts, numbers or claims",
          "Plain text, no markdown, no headings",
        ]
      : [
          "Keep every fact exactly as given; add no new facts, numbers or claims",
          "Same length as the original, give or take 20%",
          "Richer, more vivid language; concrete imagery",
          "Plain text, no markdown, no headings",
        ];
  const prompt = [
    mode === "hinglish"
      ? `Explain the following summary of "${topic.name}" in friendly Hinglish for an Indian first-year CSE student.`
      : `Rewrite the following summary of "${topic.name}" in more expressive, vivid language.`,
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
