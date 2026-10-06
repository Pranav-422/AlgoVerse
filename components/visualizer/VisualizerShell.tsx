"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Code2, Gauge } from "lucide-react";
import { Transport } from "./Transport";
import { PseudocodePanel } from "./PseudocodePanel";
import { OperationChips } from "./OperationChips";
import type { BaseFrame, Program } from "@/lib/viz/types";

/** An operation as described in the topic's knowledge file. */
export interface OpInfo {
  id: string;
  name: string;
  text: string;
  complexity: string;
  tags: string[];
}

// Layout + playback shared by every topic's visualizer. The topic component supplies
// the compiled program and a renderer for one frame; this shell never touches algorithm logic.

interface Props<S extends BaseFrame> {
  /** Operations from the knowledge file; `.main` ones are shown first. */
  ops: OpInfo[];
  selected: string;
  onSelect: (id: string) => void;
  program: Program<S>;
  renderStep: (step: S) => React.ReactNode;
  /** Input controls (values, index, value…) shown in the Input drawer. */
  inputs: React.ReactNode;
  /** Extra rows for the state tab. */
  inspect?: (step: S) => { label: string; value: React.ReactNode }[];
  /** Optional tabs above everything (e.g. Stack / Queue). */
  tabs?: React.ReactNode;
}

const BASE_MS = 1000;

export function VisualizerShell<S extends BaseFrame>({
  ops,
  selected,
  onSelect,
  program,
  renderStep,
  inputs,
  inspect,
  tabs,
}: Props<S>) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [side, setSide] = useState<"code" | "state">("code");
  const total = program.frames.length;
  const op = ops.find((o) => o.id === selected);

  // A new program restarts playback from frame 0.
  const [seen, setSeen] = useState(program);
  if (seen !== program) {
    setSeen(program);
    setIndex(0);
    setPlaying(false);
  }

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => {
      const next = Math.min(index + 1, total - 1);
      setIndex(next);
      if (next >= total - 1) setPlaying(false);
    }, BASE_MS / speed);
    return () => clearTimeout(t);
  }, [playing, index, total, speed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, total - 1));
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
      if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total]);

  const step = program.frames[Math.min(index, total - 1)];
  const rows = [{ label: "Frame", value: `${index + 1} / ${total}` }, ...(inspect ? inspect(step) : [])];

  return (
    <div className="space-y-4">
      {tabs}
      <OperationChips
        primary={ops.filter((o) => o.tags.includes("main"))}
        more={ops.filter((o) => !o.tags.includes("main"))}
        selected={selected}
        onSelect={onSelect}
        inputs={inputs}
      />

      <div className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
        {/* Stage: a comic panel */}
        <section className="relative bg-[#FAF7F0] border-[3px] border-ink rounded-[4px] shadow-comic-lg overflow-hidden">
          <header className="flex items-center justify-between px-4 py-2.5 border-b-2 border-ink bg-card">
            <span className="bg-ink text-[#FAF7F0] font-mono text-[11px] font-bold uppercase tracking-wider px-2 py-1">
              [{op?.name ?? selected}]
            </span>
            {op?.complexity && (
              <span className="tag !bg-amber-mid" title="Time complexity, from the knowledge file">
                <Gauge size={11} /> {op.complexity}
              </span>
            )}
          </header>

          <div className="bg-grid h-[380px] px-4 pt-8 pb-6">{renderStep(step)}</div>

          {/* Narration caption — slides in on every frame */}
          <div className="px-4 pb-4 pt-4 relative border-t-2 border-dashed border-outline-soft">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={index + "|" + step.note}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="relative border-2 border-ink bg-card rounded-sm px-4 py-3 shadow-comic-sm min-h-[64px]"
              >
                <span className="absolute -top-2.5 left-4 bg-amber-mid border-2 border-ink px-1.5 font-mono text-[9px] font-bold uppercase">
                  Step {String(index + 1).padStart(2, "0")}
                </span>
                <p className="font-mono text-[13px] leading-relaxed">{step.note}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

        {/* Side: code / state tabs */}
        <section className="box overflow-hidden">
          <div className="flex border-b-2 border-ink">
            {(["code", "state"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSide(t)}
                className={`relative flex-1 py-2.5 font-mono text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 ${
                  side === t ? "" : "bg-cream hover:bg-cream-high text-muted"
                }`}
              >
                {t === "code" ? <Code2 size={13} /> : <Gauge size={13} />} {t === "code" ? "Pseudocode" : "State"}
                {side === t && <motion.span layoutId="side-tab" className="absolute bottom-0 left-0 right-0 h-[3px] bg-amber" />}
              </button>
            ))}
          </div>
          {side === "code" ? (
            <PseudocodePanel lines={program.code} active={step.lines} bare />
          ) : (
            <dl className="p-4 grid grid-cols-[90px_1fr] gap-x-3 gap-y-3 font-mono text-[12px] items-center">
              {rows.map((r) => (
                <div key={r.label} className="contents">
                  <dt className="label !text-[10px]">{r.label}</dt>
                  <dd className="min-w-0 break-words">{r.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>
      </div>

      <Transport
        index={index}
        total={total}
        playing={playing}
        speed={speed}
        onIndex={(i) => {
          setPlaying(false);
          setIndex(i);
        }}
        onPlaying={setPlaying}
        onSpeed={setSpeed}
      />
    </div>
  );
}

// --- small shared input controls -------------------------------------------------

export function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "number";
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="label !text-[10px]">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="border-2 border-ink rounded bg-cream px-2 py-1.5 font-mono text-[12px] focus:bg-card outline-none w-full"
      />
    </label>
  );
}

/** "5, 2, 9" → [5, 2, 9]; keeps at most `max` integers. */
export function parseValues(text: string, max = 10): number[] {
  return text
    .split(/[\s,]+/)
    .map((s) => parseInt(s, 10))
    .filter((n) => Number.isFinite(n))
    .slice(0, max);
}
