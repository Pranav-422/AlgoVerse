"use client";

import { motion } from "framer-motion";
import { markColor } from "@/lib/theme";
import type { StackFrame, QueueFrame, Cell } from "@/lib/viz/types";

// Stack and queue frame renderers. Pure drawing: everything comes from the frame.

function Alert({ a }: { a?: { text: string; tone: "ok" | "error" } }) {
  if (!a) return null;
  return (
    <motion.span
      key={a.text}
      initial={{ scale: 0.6, rotate: -8, opacity: 0 }}
      animate={{ scale: 1, rotate: -3, opacity: 1 }}
      className={`absolute top-0 right-0 z-20 border-2 border-ink px-3 py-1 font-head font-extrabold text-lg shadow-comic ${
        a.tone === "ok" ? "bg-ok text-white" : "bg-err text-white"
      }`}
    >
      {a.text}!
    </motion.span>
  );
}

// --- Stack ---------------------------------------------------------------------

/** Balanced-parentheses frames store brackets as char codes. */
const label = (c: Cell, brackets: boolean) => (brackets ? String.fromCharCode(c.value as number) : String(c.value));

export function StackCanvas({ frame }: { frame: StackFrame }) {
  const brackets = !!frame.input;
  const slots = brackets ? Math.max(frame.items.length, 4) : frame.capacity;
  const top = frame.items.length - 1;

  return (
    <div className="relative w-full h-full flex flex-col gap-3">
      <Alert a={frame.alert} />
      {frame.input && (
        <div className="flex items-center gap-1 justify-center">
          {[...frame.input.text].map((ch, i) => (
            <span
              key={i}
              className={`w-8 h-9 border-2 rounded flex items-center justify-center font-mono text-[16px] font-bold ${
                i === frame.input!.at
                  ? frame.input!.result === "fail"
                    ? "bg-err text-white border-ink"
                    : "bg-amber-mid border-ink -translate-y-1"
                  : i < frame.input!.at
                    ? "bg-cream-high text-outline border-outline-soft"
                    : "bg-card border-ink"
              }`}
            >
              {ch}
            </span>
          ))}
        </div>
      )}
      <div className="flex-1 flex items-end justify-center gap-6 min-h-0">
        <motion.div layout className="border-2 border-ink rounded px-2 py-1.5 font-mono text-[11px] font-bold mb-2 bg-card">
          <div className="label !text-[9px]">top</div>
          {top}
        </motion.div>

        <div className="flex flex-col-reverse border-2 border-t-0 border-ink rounded-b px-2 pb-2 pt-1 gap-1 min-w-[160px] bg-card/60">
          {Array.from({ length: slots }).map((_, i) => {
            const cell = frame.items[i];
            const c = markColor(cell ? frame.marks[cell.id] : undefined);
            return (
              <div key={cell?.id ?? `empty-${i}`} className="flex items-center gap-2">
                <span className="font-mono text-[9px] text-outline w-4 text-right">{i}</span>
                {cell ? (
                  <motion.div
                    layoutId={cell.id}
                    initial={{ opacity: 0, y: -40 }}
                    animate={{ opacity: 1, y: 0, backgroundColor: c.fill, color: c.text }}
                    className={`flex-1 border-2 border-ink rounded-sm h-8 flex items-center justify-center font-mono text-[14px] font-bold ${
                      i === top ? "shadow-comic-sm" : ""
                    }`}
                  >
                    {label(cell, brackets)}
                  </motion.div>
                ) : (
                  <div className="flex-1 border-2 border-dashed border-outline-soft rounded-sm h-8" />
                )}
              </div>
            );
          })}
        </div>

        <div className="w-[110px] mb-2">
          {frame.aside && (
            <motion.div
              layoutId={frame.aside.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0, ...(() => {
                const c = markColor(frame.marks[frame.aside!.id]);
                return { backgroundColor: c.fill, color: c.text };
              })() }}
              className="border-2 border-ink rounded-sm h-8 flex items-center justify-center font-mono text-[14px] font-bold shadow-comic-sm"
            >
              {label(frame.aside, brackets)}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Queue ---------------------------------------------------------------------

export function QueueCanvas({ frame }: { frame: QueueFrame }) {
  const moved = new Set(frame.moved);
  const n = frame.slots.length;

  const box = (cell: Cell | null, i: number) => {
    const c = markColor(cell ? frame.marks[cell.id] : undefined);
    return cell ? (
      <motion.div
        key={cell.id}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1, backgroundColor: c.fill, color: c.text }}
        className="w-14 h-14 border-2 border-ink rounded-sm flex items-center justify-center font-mono font-bold text-[15px] shadow-comic-sm"
      >
        {cell.value}
      </motion.div>
    ) : (
      <div key={`e${i}`} className="w-14 h-14 border-2 border-dashed border-outline-soft rounded-sm" />
    );
  };

  const pointer = (name: "front" | "rear") => (
    <motion.span
      layoutId={`q-${name}`}
      className={`px-1.5 rounded-sm font-mono text-[9px] font-bold uppercase ${moved.has(name) ? "bg-amber-mid text-ink" : "bg-ink text-amber-mid"}`}
    >
      {name}
    </motion.span>
  );

  if (frame.circular) {
    const R = 118;
    const size = R * 2 + 90;
    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <Alert a={frame.alert} />
        <div className="relative" style={{ width: size, height: size }}>
          <div className="absolute rounded-full border-2 border-dashed border-outline-soft" style={{ inset: 45 }} />
          <div className="absolute inset-0 flex items-center justify-center font-mono text-[11px] text-muted text-center leading-relaxed">
            front = {frame.front}
            <br />
            rear = {frame.rear}
            <br />
            count = {frame.count}/{n}
          </div>
          {frame.slots.map((cell, i) => {
            const a = (2 * Math.PI * i) / n - Math.PI / 2;
            return (
              <div key={i} className="absolute flex flex-col items-center" style={{ left: size / 2 + R * Math.cos(a) - 28, top: size / 2 + R * Math.sin(a) - 28 }}>
                {box(cell, i)}
                <span className="font-mono text-[9px] text-outline">[{i}]</span>
                <div className="flex gap-0.5 h-4">
                  {i === frame.front && frame.count > 0 && pointer("front")}
                  {i === frame.rear && frame.count > 0 && pointer("rear")}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      <Alert a={frame.alert} />
      <div className="flex gap-2 items-start">
        {frame.slots.map((cell, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            {box(cell, i)}
            <span className="font-mono text-[9px] text-outline">[{i}]</span>
            <div className="flex flex-col items-center gap-0.5 h-10">
              {i === frame.front && frame.count > 0 && pointer("front")}
              {i === frame.rear && frame.rear >= 0 && pointer("rear")}
            </div>
          </div>
        ))}
      </div>
      <p className="font-mono text-[10px] text-outline mt-3">← leaves from the front · joins at the rear ←</p>
    </div>
  );
}
