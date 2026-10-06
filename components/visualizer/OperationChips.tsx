"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Minus, SlidersHorizontal } from "lucide-react";
import type { OpInfo } from "./VisualizerShell";

// Operations as a chip rail. Primary chips always visible; the rest unfold below.

interface Props {
  primary: OpInfo[];
  more: OpInfo[];
  selected: string;
  onSelect: (id: string) => void;
  inputs: React.ReactNode;
}

export function OperationChips({ primary, more, selected, onSelect, inputs }: Props) {
  const [showMore, setShowMore] = useState(more.some((o) => o.id === selected));
  const [showInput, setShowInput] = useState(false);
  const current = [...primary, ...more].find((o) => o.id === selected);

  const chip = (op: OpInfo) => {
    const on = op.id === selected;
    return (
      <button
        key={op.id}
        onClick={() => onSelect(op.id)}
        title={op.text}
        className={`relative px-3.5 py-2 border-2 border-ink rounded-full font-mono text-[12px] font-bold whitespace-nowrap transition-colors ${
          on ? "text-ink" : "bg-card hover:bg-cream"
        }`}
      >
        {on && (
          <motion.span
            layoutId="op-chip"
            className="absolute inset-0 rounded-full bg-amber-mid -z-0"
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
          />
        )}
        <span className="relative">{op.name}</span>
      </button>
    );
  };

  return (
    <div className="box p-3 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {primary.map(chip)}
        {more.length > 0 && (
          <button
            onClick={() => setShowMore((s) => !s)}
            className="px-3 py-2 border-2 border-dashed border-ink rounded-full font-mono text-[11px] font-bold uppercase flex items-center gap-1"
          >
            {showMore ? <Minus size={12} /> : <Plus size={12} />} {more.length} more
          </button>
        )}
        <button
          onClick={() => setShowInput((s) => !s)}
          className={`ml-auto px-3 py-2 border-2 border-ink rounded font-mono text-[11px] font-bold uppercase flex items-center gap-1.5 ${
            showInput ? "bg-ink text-amber-mid" : "bg-card hover:bg-cream"
          }`}
        >
          <SlidersHorizontal size={13} /> Input
        </button>
      </div>

      <AnimatePresence initial={false}>
        {showMore && (
          <motion.div
            key="more"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-2 pt-1 border-t-2 border-dashed border-outline-soft mt-1 pt-3">{more.map(chip)}</div>
          </motion.div>
        )}
        {showInput && (
          <motion.div
            key="input"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t-2 border-dashed border-outline-soft pt-3 max-w-[560px]">{inputs}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {current && <p className="font-mono text-[11px] text-muted px-1">↳ {current.text}</p>}
    </div>
  );
}
