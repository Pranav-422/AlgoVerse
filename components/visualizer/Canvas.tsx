"use client";

import { motion } from "framer-motion";
import { markColor } from "@/lib/theme";
import type { ArrayFrame } from "@/lib/viz/types";

// Draws one array frame as bars. Keyed on cell id with layout animation,
// so a swap or shift is seen as movement, not a redraw.

export function ArrayCanvas({ frame }: { frame: ArrayFrame }) {
  const max = Math.max(1, ...frame.cells.map((c) => Math.abs(c.value ?? 0)));
  const tagsAt = new Map<number, string[]>();
  for (const t of frame.tags) tagsAt.set(t.at as number, [...(tagsAt.get(t.at as number) ?? []), t.name]);

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="flex-1 flex items-end justify-center gap-2 px-4 pt-10 min-h-0">
        {frame.cells.map((cell, i) => {
          const c = markColor(frame.marks[cell.id]);
          const tags = tagsAt.get(i);
          const empty = cell.value === null;
          return (
            <motion.div
              key={cell.id}
              layout
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              className="relative flex flex-col items-center justify-end flex-1 max-w-[64px] h-full"
            >
              {tags && (
                <motion.div layout className="absolute -top-1 flex flex-col items-center gap-0.5 z-10">
                  {tags.map((t) => (
                    <span key={t} className="font-mono text-[10px] font-bold bg-ink text-amber-mid px-1.5 py-0.5 rounded-sm">
                      {t}
                    </span>
                  ))}
                  <span className="w-0 h-0 border-x-[5px] border-x-transparent border-t-[6px] border-t-ink" />
                </motion.div>
              )}
              {empty ? (
                <div className="w-full h-[22%] border-2 border-dashed border-ink/50 rounded-t-sm flex items-center justify-center font-mono text-[10px] text-outline">
                  empty
                </div>
              ) : (
                <motion.div
                  className="w-full border-2 border-ink rounded-t-sm flex items-start justify-center pt-1 font-mono text-[12px] font-bold"
                  animate={{
                    backgroundColor: c.fill,
                    color: c.text,
                    height: `${18 + (Math.abs(cell.value!) / max) * 78}%`,
                    scale: frame.marks[cell.id] === "found" ? [1, 1.08, 1] : 1,
                  }}
                  transition={{ duration: 0.25 }}
                >
                  {cell.value}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
      <div className="flex justify-center gap-2 px-4 pt-2 border-t-2 border-ink mx-4">
        {frame.cells.map((cell, i) => (
          <span key={cell.id} className="flex-1 max-w-[64px] text-center font-mono text-[10px] text-outline">
            [{i}]
          </span>
        ))}
      </div>
    </div>
  );
}
