// The four fixed feedback categories. Free text is never sent to the model:
// the learner picks a category and we send a known instruction. Each category also
// has a hard rule that the returned selection is checked against (lib/comicKit.ts).

export const FEEDBACK_CATEGORIES = ["character", "too complex", "pacing", "art style"] as const;
export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];

export const FEEDBACK_MAP: Record<FeedbackCategory, { instruction: string }> = {
  character: {
    instruction: "Keep the same Mentor, but change the poses: use at least three different poses and do not repeat the previous pose sequence.",
  },
  "too complex": {
    instruction: "Use a 4-panel layout and only lines marked level=basic. One idea per panel.",
  },
  pacing: {
    instruction: "Change the rhythm: pick a layout with a different number of panels than the previous comic.",
  },
  "art style": {
    instruction: "Change the look: pick a different palette AND a different design than the previous comic.",
  },
};

export function isFeedbackCategory(v: unknown): v is FeedbackCategory {
  return typeof v === "string" && (FEEDBACK_CATEGORIES as readonly string[]).includes(v);
}
