// Theme tokens. Mirrored as CSS variables in app/globals.css.
// One palette seeds the comic, video and visualizer so the formats read as one product.

export const THEME = {
  ink: "#18171F",
  paper: "#FFF8F3",
  card: "#FFFFFF",
  cream: "#FEF2E3",
  creamHigh: "#F5EADF",
  text: "#201B12",
  muted: "#504534",
  outline: "#837562",
  outlineSoft: "#D5C4AE",
  primary: "#7E5700",
  amber: "#D09201",
  amberMid: "#FFBA38",
  amberLight: "#FFDEAC",
  violet: "#7C5CFF",
  violetLight: "#EDE8FF",
} as const;

/** Per-topic palette seeds. The comic "art style" feedback reseeds from these. */
export const TOPIC_PALETTES: Record<string, string[]> = {
  amber: ["#D09201", "#FFBA38", "#FFDEAC", "#7E5700"],
  violet: ["#7C5CFF", "#B9A8FF", "#EDE8FF", "#3B2A99"],
  teal: ["#1F8A84", "#6CCBC4", "#D5F2EF", "#0E4744"],
};

/** Visualizer element marks → fill colours. */
export const MARK_COLORS: Record<string, { fill: string; text: string }> = {
  focus: { fill: THEME.amberMid, text: THEME.ink },
  compare: { fill: THEME.violetLight, text: THEME.ink },
  swap: { fill: THEME.violet, text: "#FFFFFF" },
  found: { fill: "#2F7D4F", text: "#FFFFFF" },
  done: { fill: THEME.amberLight, text: THEME.ink },
  fresh: { fill: THEME.amber, text: "#FFFFFF" },
  gone: { fill: "#B3261E", text: "#FFFFFF" },
  out: { fill: THEME.creamHigh, text: THEME.outline },
};

export const markColor = (mark: string | undefined) => (mark && MARK_COLORS[mark]) || { fill: THEME.card, text: THEME.ink };
