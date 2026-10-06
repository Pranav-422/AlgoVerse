"use client";

import { motion } from "framer-motion";

// Highlights the active pseudocode lines from step.codeLines (1-based).
// The highlight bar glides between lines instead of jumping.

export function PseudocodePanel({ lines, active = [], bare = false }: { lines: string[]; active?: number[]; bare?: boolean }) {
  const list = (
    <ol className="relative py-2 font-mono text-[12px] leading-[1.9]">
      {lines.map((l, i) => {
        const on = active.includes(i + 1);
        return (
          <li key={i} className="relative flex gap-3 px-3">
            {on && (
              <motion.span
                layoutId={active[0] === i + 1 ? "code-hl" : undefined}
                className="absolute inset-0 bg-amber-mid/70 border-l-4 border-ink"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative w-5 text-right text-outline shrink-0">{String(i + 1).padStart(2, "0")}</span>
            <span className={`relative whitespace-pre ${on ? "font-bold" : ""}`}>{l}</span>
          </li>
        );
      })}
    </ol>
  );
  if (bare) return list;
  return (
    <section className="box overflow-hidden">
      <div className="px-4 py-2.5 border-b-2 border-ink bg-cream label !text-ink font-bold">Pseudocode</div>
      {list}
    </section>
  );
}
