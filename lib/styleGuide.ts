// Comic style constraints as data, not prose buried in a prompt string (SPEC §7).
// Changing the style means changing this object.

export const COMIC_STYLE = {
  panelCount: { min: 4, max: 6 },
  dialogueMaxWords: 18,
  tone: "clear and direct; never childish, never silly, never padded",
  character: { refImage: "/comics/characters/mentor-ref.png", name: "Mentor" },
  forbid: ["jargon without explanation", "more than one idea per panel"],
  examples: {
    good: ["I don't search the shelf. I compute which box to open."],
    bad: ["Wow!!! Arrays are SO cool and amazing, let's learn them together!!!"],
  },
  art: "Clean black ink line art on cream paper, flat colour accents, no text inside the image.",
} as const;

/** Human-readable constraint list — shown in "How this was generated" and injected into prompts. */
export function styleConstraints(): string[] {
  return [
    `Between ${COMIC_STYLE.panelCount.min} and ${COMIC_STYLE.panelCount.max} panels`,
    `At most ${COMIC_STYLE.dialogueMaxWords} words of dialogue per panel`,
    `Tone: ${COMIC_STYLE.tone}`,
    `Single character, named "${COMIC_STYLE.character.name}"`,
    ...COMIC_STYLE.forbid.map((f) => `Forbidden: ${f}`),
  ];
}
