"use client";

import { useEffect, useMemo, useState } from "react";
import { MotionConfig } from "framer-motion";
import { runArray, type ArrayOp } from "@/lib/viz/arrayEngine";
import { ArrayCanvas } from "@/components/visualizer/Canvas";

export interface Chapter {
  start: number;
  end: number;
  title: string;
  facts: string[];
  op: { id: ArrayOp; values: number[]; index?: number; value?: number } | null;
}

declare global {
  interface Window {
    __seek?: (t: number) => void;
    __duration?: number;
  }
}

const TITLE_CARD_S = 4;

// A 1280×720 stage. Time is external: ?t= in the URL or window.__seek(t). Without either,
// it plays in real time so the page can also be watched directly.
export function VideoStage({ title, chapters }: { title: string; chapters: Chapter[] }) {
  const duration = chapters[chapters.length - 1].end;
  const [t, setT] = useState(0);
  const programs = useMemo(
    () => chapters.map((c) => (c.op ? runArray(c.op.id, c.op.values, { index: c.op.index, value: c.op.value }) : null)),
    [chapters],
  );

  useEffect(() => {
    window.__duration = duration;
    window.__seek = (s: number) => setT(Math.max(0, Math.min(duration, s)));
    if (new URLSearchParams(location.search).has("record")) return;
    const t0 = performance.now();
    const id = setInterval(() => setT(Math.min(duration, (performance.now() - t0) / 1000)), 100);
    return () => clearInterval(id);
  }, [duration]);

  const ci = Math.max(0, chapters.findIndex((c) => t >= c.start && t < c.end));
  const ch = chapters[ci === -1 ? chapters.length - 1 : ci];
  const local = t - ch.start;
  const prog = programs[chapters.indexOf(ch)];
  const showTitle = local < TITLE_CARD_S;
  const frameIdx = prog ? Math.min(prog.frames.length - 1, Math.floor(((local - TITLE_CARD_S) / (ch.end - ch.start - TITLE_CARD_S - 3)) * prog.frames.length)) : 0;
  const frame = prog?.frames[Math.max(0, frameIdx)];

  return (
    <MotionConfig reducedMotion="always">
      <div className="fixed inset-0 bg-[#18171F] flex items-center justify-center">
        <div className="relative w-[1280px] h-[720px] bg-grid overflow-hidden flex flex-col" style={{ fontSize: 16 }}>
          {/* top bar */}
          <div className="flex items-center justify-between px-8 py-4 border-b-[3px] border-ink bg-card">
            <span className="font-head font-extrabold text-2xl uppercase tracking-tight">{title}</span>
            <span className="tag !text-[12px] !bg-amber-mid">
              {String(chapters.indexOf(ch) + 1).padStart(2, "0")} · {ch.title}
            </span>
          </div>

          {showTitle ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-24">
              <span className="tag !text-[13px] !bg-ink !text-amber-mid">Chapter {chapters.indexOf(ch) + 1}</span>
              <h1 className="font-head font-extrabold text-6xl mt-6 leading-tight">{ch.title}</h1>
            </div>
          ) : prog && frame ? (
            <div className="flex-1 grid grid-cols-[1fr_380px] gap-6 p-8 min-h-0">
              <div className="box !shadow-comic-lg bg-[#FAF7F0] p-6 flex flex-col min-h-0">
                <div className="flex-1 min-h-0">
                  <ArrayCanvas frame={frame} />
                </div>
                <p className="mt-4 border-2 border-ink bg-card rounded px-4 py-3 font-mono text-[17px] leading-snug min-h-[64px]">{frame.note}</p>
              </div>
              <div className="flex flex-col gap-4">
                <div className="box p-4">
                  <p className="label !text-[11px]">Pseudocode</p>
                  <ol className="mt-2 font-mono text-[14px] leading-[1.8]">
                    {prog.code.map((l, i) => (
                      <li key={i} className={`px-2 whitespace-pre ${frame.lines.includes(i + 1) ? "bg-amber-mid font-bold" : ""}`}>
                        {l}
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="box p-4 !bg-violet-light">
                  <p className="label !text-[11px]">From the knowledge file</p>
                  <ul className="mt-2 space-y-2 font-mono text-[14px] leading-snug">
                    {ch.facts.map((f) => (
                      <li key={f}>› {f}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center px-24 gap-5">
              {ch.facts.map((f, i) => (
                <div key={f} className="box p-5 flex gap-5 items-start" style={{ opacity: local > TITLE_CARD_S + i * 3 ? 1 : 0.15 }}>
                  <span className="tag !text-[15px] !bg-amber-mid">{String(i + 1).padStart(2, "0")}</span>
                  <p className="font-mono text-[22px] leading-snug">{f}</p>
                </div>
              ))}
            </div>
          )}

          {/* progress + footer */}
          <div className="h-2 bg-cream-high">
            <div className="h-full bg-amber" style={{ width: `${(t / duration) * 100}%` }} />
          </div>
          <div className="flex justify-between px-8 py-2 font-mono text-[12px] text-muted bg-card border-t-2 border-ink">
            <span>AlgoVerse · pre-rendered from our own visualizer engine and the Arrays knowledge file</span>
            <span>
              {Math.floor(t / 60)}:{String(Math.floor(t % 60)).padStart(2, "0")} / {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}
