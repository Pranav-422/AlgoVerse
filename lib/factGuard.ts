// Fact guard for model rewrites of a brief.
// A rewrite may change wording, never claims. We check the two kinds of claim that are
// mechanically checkable — Big-O expressions and numbers — against what the knowledge
// file already contains. Anything new is reported, and the rewrite is rejected.

export interface GuardResult {
  ok: boolean;
  /** Claims in the rewrite that do not appear in the source text or core facts. */
  newClaims: string[];
  /** How many claims in the rewrite were checked. */
  checked: number;
}

const normBigO = (s: string) =>
  s
    .toLowerCase()
    .replace(/\\[,;! ]?/g, "") // LaTeX-style \log, \cdot, \, spacing
    .replace(/cdot/g, "")
    .replace(/\s+/g, "")
    .replace(/\^2|²/g, "²")
    .replace(/\*/g, "")
    .replace(/×/g, "");

function bigOs(text: string): string[] {
  return (text.match(/O\s*\([^)]*\)/g) ?? []).map(normBigO);
}

function numbers(text: string): string[] {
  // Standalone digit groups, ignoring the "2" inside n² / log2-style tokens already covered by Big-O.
  const withoutBigO = text.replace(/O\s*\([^)]*\)/g, " ");
  return withoutBigO.match(/(?<![\w.])\d+(?:\.\d+)?(?![\w])/g) ?? [];
}

export function guardRewrite(rewrite: string, sources: string[]): GuardResult {
  const allowedO = new Set(sources.flatMap(bigOs));
  const allowedN = new Set(sources.flatMap(numbers));
  const foundO = bigOs(rewrite);
  const foundN = numbers(rewrite);
  const newClaims = [
    ...foundO.filter((o) => !allowedO.has(o)).map((o) => `complexity ${o}`),
    ...foundN.filter((n) => !allowedN.has(n)).map((n) => `number ${n}`),
  ];
  return { ok: newClaims.length === 0, newClaims: [...new Set(newClaims)], checked: foundO.length + foundN.length };
}
