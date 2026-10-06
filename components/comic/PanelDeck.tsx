"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Panel } from "@/lib/comic";
import { PanelCard } from "./PanelCard";

// The card-shuffle stage (SPEC §10). Active panel at rest; the next two sit offset
// and rotated behind it so the stack reads as a deck.

const STACK = [
  { x: 0, y: 0, rotate: 0, scale: 1 },
  { x: 12, y: 6, rotate: 2, scale: 0.98 },
  { x: 24, y: 12, rotate: 4, scale: 0.96 },
];

interface Props {
  panels: Panel[];
  index: number;
  /** +1 forward, -1 back — controls which way the active card leaves. */
  direction: 1 | -1;
  title: string;
  shuffling?: boolean;
}

export function PanelDeck({ panels, index, direction, title, shuffling = false }: Props) {
  const reduce = useReducedMotion();
  const visible = [0, 1, 2]
    .map((o) => ({ offset: o, panel: panels[(index + o) % panels.length], real: index + o < panels.length }))
    .filter((v, i) => v.real || shuffling || i === 0)
    .filter((v, i, arr) => arr.findIndex((w) => w.panel.n === v.panel.n) === i);

  if (reduce) {
    const p = panels[index];
    return (
      <div className="relative w-full aspect-[16/10]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={p.n}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: shuffling ? 0.6 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <PanelCard panel={p} total={panels.length} title={title} />
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-[16/10]">
      <AnimatePresence initial={false} custom={direction}>
        {visible
          .slice()
          .reverse()
          .map(({ offset, panel }) => (
            <motion.div
              key={panel.n}
              className="absolute inset-0"
              style={{ zIndex: 10 - offset }}
              custom={direction}
              initial={
                direction === 1
                  ? { ...STACK[2], x: STACK[2].x + 12, opacity: 0 }
                  : { x: -420, y: 20, rotate: -9, scale: 1, opacity: 0 }
              }
              animate={{ ...STACK[offset], opacity: 1 }}
              exit={
                direction === 1
                  ? { x: -460, y: 30, rotate: -10, opacity: 0, transition: { duration: shuffling ? 0.22 : 0.38 } }
                  : { ...STACK[2], x: STACK[2].x + 12, opacity: 0, transition: { duration: 0.25 } }
              }
              transition={{ type: "spring", stiffness: shuffling ? 520 : 300, damping: shuffling ? 34 : 30 }}
            >
              <PanelCard panel={panel} total={panels.length} title={title} />
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  );
}
