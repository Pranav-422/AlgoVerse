// The four fixed feedback categories. Free text is never sent to the model:
// the learner picks a category and we send a known string (SPEC §7).

export const FEEDBACK_CATEGORIES = ["character", "too complex", "pacing", "art style"] as const;
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export const FEEDBACK_MAP: Record<FeedbackCategory, { instruction: string; regenerateImages: boolean }> = {
  character: {
    instruction: "Keep the same character reference. Vary pose and expression only.",
    regenerateImages: true,
  },
  "too complex": {
    instruction: "Use 4 panels. One idea per panel. Sentences under 12 words.",
    regenerateImages: true,
  },
  pacing: {
    instruction: "Restructure as one setup panel, three step panels, one payoff panel.",
    regenerateImages: true,
  },
  "art style": {
    instruction: "Reseed the palette from the topic theme. Keep character identity fixed.",
    regenerateImages: true,
  },
};

export function isFeedbackCategory(v: unknown): v is FeedbackCategory {
  return typeof v === "string" && (FEEDBACK_CATEGORIES as readonly string[]).includes(v);
}
