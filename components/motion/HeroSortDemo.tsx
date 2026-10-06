"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

// Decorative hero loop: a small array bubble-sorts itself, then shuffles and starts again.
// Self-contained — not the visualizer engine.

const START = [6, 2, 8, 3, 9, 1, 5, 7, 4];

interface Bar {
  id: number;
  v: number;
}

function* bubble(bars: Bar[]): Generator<{ bars: Bar[]; a: number; b: number; swapped: boolean }> {
  const arr = bars.slice();
  for (let i = 0; i < arr.length - 1; i++)
    for (let j = 0; j < arr.length - 1 - i; j++) {
      const swap = arr[j].v > arr[j + 1].v;
      if (swap) [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      yield { bars: arr.slice(), a: j, b: j + 1, swapped: swap };
    }
}

const shuffle = (vals: number[]) => vals.map((v) => ({ v, r: Math.random() })).sort((x, y) => x.r - y.r).map((x) => x.v);

export function HeroSortDemo() {
  const [bars, setBars] = useState<Bar[]>(START.map((v, id) => ({ id, v })));
  const [cmp, setCmp] = useState<[number, number] | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let gen = bubble(bars);
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const n = gen.next();
      if (n.done) {
        setCmp(null);
        setDone(true);
        timer = setTimeout(() => {
          const next = shuffle(START).map((v, id) => ({ id, v }));
          setDone(false);
          setBars(next);
          gen = bubble(next);
          timer = setTimeout(tick, 500);
        }, 1600);
        return;
      }
      setBars(n.value.bars);
      setCmp([n.value.a, n.value.b]);
      timer = setTimeout(tick, n.value.swapped ? 420 : 220);
    };
    timer = setTimeout(tick, 900);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="box p-5 bg-card w-full max-w-[520px] mx-auto rotate-[-1.5deg]">
      <div className="flex justify-between items-center mb-3">
        <span className="tag !bg-ink !text-amber-mid">live · bubble sort</span>
        <span className={`tag ${done ? "!bg-ok !text-white" : ""}`}>{done ? "sorted ✓" : "sorting…"}</span>
      </div>
      <div className="h-40 flex items-end gap-2 border-b-2 border-ink pb-0.5">
        {bars.map((b, i) => {
          const active = cmp && (i === cmp[0] || i === cmp[1]);
          return (
            <motion.div
              key={b.id}
              layout
              transition={{ type: "spring", stiffness: 420, damping: 30 }}
              className={`flex-1 border-2 border-ink rounded-t-sm flex items-start justify-center pt-1 font-mono text-[11px] font-bold ${
                done ? "bg-amber-light" : active ? "bg-amber-mid" : "bg-cream"
              }`}
              style={{ height: `${(b.v / 9) * 100}%` }}
            >
              {b.v}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
