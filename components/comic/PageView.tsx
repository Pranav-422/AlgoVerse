"use client";

import { motion } from "framer-motion";
import type { Comic } from "@/lib/comic";
import { PanelCard } from "./PanelCard";

// The whole comic laid out as a page, using the chosen layout's columns and panel spans.

export function PageView({ comic, active, onPick }: { comic: Comic; active: number; onPick: (i: number) => void }) {
  return (
    <div className="grid gap-4 p-4 rounded border-2 border-ink" style={{ gridTemplateColumns: `repeat(${comic.layout.cols}, minmax(0, 1fr))`, background: comic.palette.soft }}>
      {comic.panels.map((p, i) => (
        <motion.button
          key={comic.id + p.n}
          onClick={() => onPick(i)}
          initial={{ opacity: 0, y: 16, rotate: -1 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ delay: i * 0.06, type: "spring", stiffness: 260, damping: 24 }}
          className={`text-left h-[250px] ${i === active ? "outline-3 outline-offset-4" : ""}`}
          style={{ gridColumn: `span ${p.span} / span ${p.span}`, outlineColor: comic.palette.accent }}
          aria-label={`Panel ${p.n}`}
        >
          <PanelCard panel={p} comic={comic} compact={p.span === 1 && comic.layout.cols === 3} />
        </motion.button>
      ))}
    </div>
  );
}
