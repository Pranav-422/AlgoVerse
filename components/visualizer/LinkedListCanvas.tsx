"use client";

import { motion } from "framer-motion";
import { markColor } from "@/lib/theme";
import type { ListFrame } from "@/lib/viz/types";

// Draws one linked-list frame: the head box, then nodes as [value | next] cells.
// Connectors are drawn from the real next map: → when a node points right, ← when it points left.

export function LinkedListCanvas({ frame }: { frame: ListFrame }) {
  const byId = new Map(frame.nodes.map((n) => [n.id, n]));
  const addr = (id: string | null | undefined) => (id ? (byId.get(id)?.addr ?? "??") : "NULL");
  const changed = new Set(frame.changed);
  const lifted = new Set(frame.lifted);
  const tagsFor = (id: string) => frame.tags.filter((t) => t.at === id).map((t) => t.name);

  return (
    <div className="w-full h-full flex items-center overflow-x-auto px-2">
      <div className="flex items-center min-w-max pt-20 pb-6 mx-auto">
        <div className="flex items-center">
          <motion.div
            animate={{ backgroundColor: changed.has("head") ? "#FFBA38" : "#FFFFFF" }}
            className="border-2 border-ink rounded px-2 py-1.5 font-mono text-[11px] font-bold"
          >
            <div className="label !text-[9px]">head</div>
            {addr(frame.head)}
          </motion.div>
          <Connector dir={frame.head && frame.head === frame.nodes[0]?.id && !lifted.has(frame.head) ? "right" : "none"} hot={changed.has("head")} />
        </div>

        {frame.nodes.map((n, i) => {
          const c = markColor(frame.marks[n.id]);
          const right = frame.nodes[i + 1];
          const dir =
            right && frame.next[n.id] === right.id && !lifted.has(right.id)
              ? "right"
              : right && frame.next[right.id] === n.id && !lifted.has(n.id)
                ? "left"
                : "none";
          const hot = changed.has(n.id) || (right ? changed.has(right.id) && frame.next[right.id] === n.id : false);
          const tags = tagsFor(n.id);
          return (
            <motion.div key={n.id} layout className="flex items-center" transition={{ type: "spring", stiffness: 300, damping: 30 }}>
              <motion.div
                className="relative flex flex-col items-center"
                initial={{ opacity: 0, y: -60 }}
                animate={{ opacity: 1, y: lifted.has(n.id) ? -58 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 26 }}
              >
                {tags.length > 0 && (
                  <div className="absolute -top-12 flex gap-1">
                    {tags.map((t) => (
                      <span key={t} className="font-mono text-[10px] font-bold bg-ink text-amber-mid px-1.5 py-0.5 rounded-sm">
                        {t}↓
                      </span>
                    ))}
                  </div>
                )}
                <span className="font-mono text-[9px] text-outline mb-0.5">{n.addr}</span>
                <motion.div
                  className="flex border-2 border-ink rounded-sm overflow-hidden shadow-comic-sm font-mono"
                  animate={{ backgroundColor: c.fill, color: c.text }}
                >
                  <span className="px-3 py-2 font-bold text-[15px] min-w-[44px] text-center">{n.value}</span>
                  <motion.span
                    className="px-1.5 py-2 border-l-2 border-ink text-[10px] text-ink min-w-[42px] text-center"
                    animate={{ backgroundColor: changed.has(n.id) ? "#FFBA38" : "#FEF2E3" }}
                  >
                    {addr(frame.next[n.id])}
                  </motion.span>
                </motion.div>
              </motion.div>
              {i < frame.nodes.length - 1 ? <Connector dir={dir} hot={hot} /> : null}
            </motion.div>
          );
        })}
        {frame.nodes.length === 0 && <span className="font-mono text-[12px] text-outline ml-3">empty list</span>}
      </div>
    </div>
  );
}

function Connector({ dir, hot }: { dir: "right" | "left" | "none"; hot?: boolean }) {
  const stroke = hot ? "#D09201" : "#18171F";
  if (dir === "none") return <span className="w-9" />;
  return (
    <svg width="36" height="14" viewBox="0 0 36 14" className="shrink-0" aria-hidden>
      <line x1="4" y1="7" x2="32" y2="7" stroke={stroke} strokeWidth={hot ? 3 : 2} />
      {dir === "right" ? <path d="M26 2 L34 7 L26 12 Z" fill={stroke} /> : <path d="M10 2 L2 7 L10 12 Z" fill={stroke} />}
    </svg>
  );
}
