"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Code2, Gauge, Brain, Check, X } from "lucide-react";
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
  /** The same program in real languages, line for line with the pseudocode (language → lines). */
  realCode?: Record<string, string[]>;
  /** A live counter shown on the stage, e.g. comparisons so far. */
  badge?: (step: S) => React.ReactNode;
}

const BASE_MS = 1000;
const PSEUDO = "Pseudocode";

export function VisualizerShell<S extends BaseFrame>({
  ops,
  selected,
  onSelect,
  program,
  renderStep,
  inputs,
  inspect,
  tabs,
  realCode,
  badge,
}: Props<S>) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [side, setSide] = useState<"code" | "state">("code");
  const [lang, setLang] = useState(PSEUDO);
  // Predict mode: before a frame that carries a question, stop and let the learner guess first.
  const [predict, setPredict] = useState(true);
  const [pending, setPending] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const total = program.frames.length;
  const op = ops.find((o) => o.id === selected);

  // A new program restarts playback from frame 0.
  const [seen, setSeen] = useState(program);
  if (seen !== program) {
    setSeen(program);
    setIndex(0);
    setPlaying(false);
    setPending(null);
    setAnswers({});
  }

  function goTo(i: number) {
    const next = Math.max(0, Math.min(i, total - 1));
    if (predict && next === index + 1 && program.frames[next].ask && !(next in answers)) {
      setPending(next);
      setPlaying(false);
      return;
    }
    setPending(null);
    setIndex(next);
  }

  function answer(choice: number) {
    if (pending === null || choice >= program.frames[pending].ask!.options.length) return;
    setAnswers((a) => ({ ...a, [pending]: choice }));
    setIndex(pending);
    setPending(null);
  }

  const onTick = useEffectEvent(() => {
    goTo(index + 1);
    if (index + 1 >= total - 1) setPlaying(false);
  });
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(onTick, BASE_MS / speed);
    return () => clearTimeout(t);
  }, [playing, index, speed]);

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
    if (pending !== null && /^[1-9]$/.test(e.key)) answer(Number(e.key) - 1);
    if (e.key === "ArrowRight") goTo(index + 1);
    if (e.key === "ArrowLeft") goTo(index - 1);
    if (e.key === " ") {
      e.preventDefault();
      setPlaying((p) => !p);
    }
  });
  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const step = program.frames[Math.min(index, total - 1)];
  const rows = [{ label: "Frame", value: `${index + 1} / ${total}` }, ...(inspect ? inspect(step) : [])];
  const asked = Object.entries(answers);
  const right = asked.filter(([k, v]) => program.frames[Number(k)].ask?.answer === v).length;
  const question = pending !== null ? program.frames[pending].ask! : null;
  const mine = answers[index];
  const langs = realCode ? [PSEUDO, ...Object.keys(realCode)] : [];
  const code = lang !== PSEUDO && realCode?.[lang] ? realCode[lang] : program.code;

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
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                aria-pressed={predict}
                onClick={() => {
                  setPredict((p) => !p);
                  setPending(null);
                }}
                className={`tag cursor-pointer ${predict ? "!bg-violet-light" : "!text-outline"}`}
                title="Stop before key steps and guess what happens next"
              >
                <Brain size={11} /> Predict {predict ? "on" : "off"}
                {asked.length > 0 && ` · ${right}/${asked.length}`}
              </button>
              {badge?.(step)}
              {op?.complexity && (
                <span className="tag !bg-amber-mid" title="Time complexity, from the knowledge file">
                  <Gauge size={11} /> {op.complexity}
                </span>
              )}
            </div>
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
                {step.ask && mine !== undefined && (
                  <p className={`mt-2 flex items-center gap-1.5 font-mono text-[12px] font-bold ${mine === step.ask.answer ? "text-ok" : "text-err"}`}>
                    {mine === step.ask.answer ? <Check size={14} /> : <X size={14} />}
                    {mine === step.ask.answer
                      ? `You predicted it: ${step.ask.options[mine]}.`
                      : `You said ${step.ask.options[mine]} — it was ${step.ask.options[step.ask.answer]}.`}
                  </p>
                )}
              </motion.div>
            </AnimatePresence>

            {question && (
              <div role="group" aria-label="Predict the next step" className="mt-4 border-2 border-violet bg-violet-light rounded-sm px-4 py-3 shadow-comic-sm">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-violet flex items-center gap-1.5">
                  <Brain size={12} /> Predict before you see it
                </p>
                <p className="font-mono text-[13px] font-semibold mt-1.5">{question.q}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {question.options.map((o, i) => (
                    <button key={o} type="button" onClick={() => answer(i)} className="btn btn-light !py-1.5 !normal-case !tracking-normal">
                      <span className="text-outline">{i + 1}</span> {o}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
                {t === "code" ? <Code2 size={13} /> : <Gauge size={13} />} {t === "code" ? "Code" : "State"}
                {side === t && <motion.span layoutId="side-tab" className="absolute bottom-0 left-0 right-0 h-[3px] bg-amber" />}
              </button>
            ))}
          </div>
          {side === "code" ? (
            <>
              {langs.length > 0 && (
                <div className="flex gap-1.5 px-3 pt-3" role="group" aria-label="Code language">
                  {langs.map((l) => (
                    <button
                      key={l}
                      type="button"
                      aria-pressed={lang === l}
                      onClick={() => setLang(l)}
                      className={`tag cursor-pointer ${lang === l ? "!bg-amber-mid" : "!text-muted"}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              )}
              <PseudocodePanel lines={code} active={step.lines} bare />
            </>
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
          goTo(i);
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
