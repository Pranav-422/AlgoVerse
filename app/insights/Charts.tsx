"use client";

import { useState } from "react";
import { motion } from "framer-motion";

// Small HTML charts for the insights page. Thin marks, 2px gaps between segments,
// direct labels + a legend so identity never relies on colour alone, hover tooltips.

export interface Segment {
  key: string;
  label: string;
  color: string;
  value: number;
}

export function OutcomeBar({ segments, total }: { segments: Segment[]; total: number }) {
  const [hover, setHover] = useState<string | null>(null);
  const shown = segments.filter((s) => s.value > 0);
  return (
    <div>
      <div className="flex h-10 gap-[2px] rounded-[4px] overflow-hidden bg-card" role="img" aria-label="Outcome share">
        {shown.map((s) => {
          const pct = (s.value / total) * 100;
          return (
            <motion.div
              key={s.key}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="relative h-full flex items-center justify-center font-mono text-[11px] font-bold text-white cursor-default"
              style={{ background: s.color, opacity: hover && hover !== s.key ? 0.45 : 1 }}
              onMouseEnter={() => setHover(s.key)}
              onMouseLeave={() => setHover(null)}
            >
              {pct >= 8 ? `${Math.round(pct)}%` : ""}
              {hover === s.key && (
                <span className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-ink text-white px-2 py-1 rounded text-[11px] font-normal z-10">
                  {s.label}: {s.value} of {total} ({Math.round(pct)}%)
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-[11px]">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ background: s.color }} />
            {s.label} <span className="text-outline">· {s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function CountBars({ items, unit }: { items: { label: string; value: number }[]; unit: string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  const [hover, setHover] = useState<string | null>(null);
  return (
    <ul className="space-y-2.5">
      {items.map((it) => (
        <li
          key={it.label}
          className="grid grid-cols-[140px_1fr_40px] items-center gap-3 font-mono text-[12px]"
          onMouseEnter={() => setHover(it.label)}
          onMouseLeave={() => setHover(null)}
          title={`${it.label}: ${it.value} ${unit}`}
        >
          <span className="truncate">{it.label}</span>
          <span className="h-4 bg-cream-high rounded-r-[4px] overflow-hidden">
            <motion.span
              className="block h-full rounded-r-[4px]"
              style={{ background: "#B07A00", opacity: hover && hover !== it.label ? 0.5 : 1 }}
              initial={{ width: 0 }}
              animate={{ width: `${(it.value / max) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </span>
          <span className="text-right font-bold">{it.value}</span>
        </li>
      ))}
    </ul>
  );
}
