// Comic style constraints as data (SPEC §7). The dialogue bank is written to these
// and scripts/check-comic-kit.mts enforces them.

export const COMIC_STYLE = {
  panelCount: { min: 4, max: 6 },
  dialogueMaxWords: 18,
  tone: "clear and direct; never childish, never silly, never padded",
  character: { name: "Mentor" },
  forbid: ["jargon without explanation", "more than one idea per panel"],
  examples: {
    good: ["I don't search the shelf. I compute which box to open."],
    bad: ["Wow!!! Arrays are SO cool and amazing, let's learn them together!!!"],
  },
} as const;

/** Human-readable constraint list for "How this was generated". */
export function styleConstraints(): string[] {
  return [
    `Between ${COMIC_STYLE.panelCount.min} and ${COMIC_STYLE.panelCount.max} panels`,
    `At most ${COMIC_STYLE.dialogueMaxWords} words per line (checked when the bank is written)`,
    `Tone: ${COMIC_STYLE.tone}`,
    `Single character: ${COMIC_STYLE.character.name}`,
    ...COMIC_STYLE.forbid.map((f) => `Forbidden: ${f}`),
  ];
}
