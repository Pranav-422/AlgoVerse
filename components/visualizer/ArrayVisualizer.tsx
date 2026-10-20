"use client";

import { useMemo, useState } from "react";
import { runArray, ARRAY_PARAMS, type ArrayOp } from "@/lib/viz/arrayEngine";
import { REAL_CODE } from "@/lib/viz/realCode";
import { VisualizerShell, Field, parseValues, type OpInfo } from "./VisualizerShell";
import { ArrayCanvas } from "./Canvas";

// Edge cases are where most bugs hide, so each is one click away.
const PRESETS = [
  { label: "Already sorted", values: [1, 2, 5, 7, 9] },
  { label: "Reverse sorted", values: [9, 7, 5, 2, 1] },
  { label: "Duplicates", values: [4, 2, 4, 1, 2] },
  { label: "One element", values: [7] },
  { label: "Empty", values: [] },
];
const COUNTED: ArrayOp[] = ["linearSearch", "binarySearch", "bubbleSort", "selectionSort", "insertionSort", "mergeSort", "quickSort"];

export function ArrayVisualizer({ ops, initialOp }: { ops: OpInfo[]; initialOp?: string }) {
  const known = ops.filter((o) => o.id in ARRAY_PARAMS);
  const [op, setOp] = useState<ArrayOp>(known.some((o) => o.id === initialOp) ? (initialOp as ArrayOp) : "bubbleSort");
  const [valuesText, setValuesText] = useState("5, 2, 9, 1, 7");
  const [indexText, setIndexText] = useState("2");
  const [valueText, setValueText] = useState("7");
  const [applied, setApplied] = useState({ values: [5, 2, 9, 1, 7], index: 2, value: 7 });
  const params = ARRAY_PARAMS[op];
  const isSearch = op === "linearSearch" || op === "binarySearch";

  const program = useMemo(() => runArray(op, applied.values, applied), [op, applied]);
  // Same input, both searches: the gap between O(n) and O(log n) as two numbers.
  const race = useMemo(
    () =>
      isSearch && {
        linear: runArray("linearSearch", applied.values, applied).frames.at(-1)!.compares,
        binary: runArray("binarySearch", applied.values, applied).frames.at(-1)!.compares,
      },
    [isSearch, applied],
  );

  const load = (values: number[], value = applied.value) => {
    setValuesText(values.join(", "));
    setValueText(String(value));
    setApplied({ ...applied, values, value });
  };

  return (
    <div className="space-y-4">
      <VisualizerShell
        ops={known}
        selected={op}
        onSelect={(id) => setOp(id as ArrayOp)}
        program={program}
        renderStep={(f) => <ArrayCanvas frame={f} />}
        realCode={REAL_CODE[op]}
        badge={(f) =>
          COUNTED.includes(op) && (
            <span className="tag" title="Element comparisons made so far">
              {f.compares} comparison{f.compares === 1 ? "" : "s"}
            </span>
          )
        }
        inspect={(f) => [
          { label: "Length", value: f.cells.filter((c) => c.value !== null).length },
          { label: "Array", value: `[${f.cells.map((c) => c.value ?? "_").join(", ")}]` },
          { label: "Pointers", value: f.tags.length ? f.tags.map((t) => `${t.name}=${t.at}`).join("  ") : "—" },
          { label: "Compares", value: f.compares },
        ]}
        inputs={
          <div className="space-y-3">
            <form
              className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-end"
              onSubmit={(e) => {
                e.preventDefault();
                setApplied({ values: parseValues(valuesText, 10), index: parseInt(indexText, 10) || 0, value: parseInt(valueText, 10) || 0 });
              }}
            >
              <Field label="Array (max 10)" value={valuesText} onChange={setValuesText} placeholder="5, 2, 9, 1, 7" />
              {params.includes("index") ? <Field label="Index" type="number" value={indexText} onChange={setIndexText} /> : <span />}
              {params.includes("value") ? <Field label={isSearch ? "Target" : "Value"} type="number" value={valueText} onChange={setValueText} /> : <span />}
              <button type="submit" className="btn btn-ink !py-1.5">
                Load
              </button>
              {op === "binarySearch" && <p className="col-span-4 font-mono text-[10px] text-outline">Binary search needs sorted input, so the array is sorted first.</p>}
            </form>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="label !text-[10px] mr-1">Edge cases:</span>
              {PRESETS.map((p) => (
                <button key={p.label} type="button" className="tag cursor-pointer hover:!bg-amber-light" onClick={() => load(p.values)}>
                  {p.label}
                </button>
              ))}
              {isSearch && (
                <button type="button" className="tag cursor-pointer hover:!bg-amber-light" onClick={() => load(applied.values, Math.max(0, ...applied.values) + 1)}>
                  Target missing
                </button>
              )}
            </div>
          </div>
        }
      />
      {race && (
        <section className="box p-4 flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[12px]" aria-label="Linear vs binary search">
          <span className="label !text-ink font-bold">Same array, target {applied.value}</span>
          <span>
            Linear search: <b>{race.linear}</b> comparison{race.linear === 1 ? "" : "s"}
          </span>
          <span>
            Binary search: <b>{race.binary}</b> comparison{race.binary === 1 ? "" : "s"}
          </span>
          <span className="text-outline">With 1,000 sorted elements: up to 1,000 vs 10.</span>
        </section>
      )}
    </div>
  );
}
