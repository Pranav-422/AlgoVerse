"use client";

import { useMemo, useState } from "react";
import { runArray, ARRAY_PARAMS, type ArrayOp } from "@/lib/viz/arrayEngine";
import { VisualizerShell, Field, parseValues, type OpInfo } from "./VisualizerShell";
import { ArrayCanvas } from "./Canvas";

export function ArrayVisualizer({ ops }: { ops: OpInfo[] }) {
  const known = ops.filter((o) => o.id in ARRAY_PARAMS);
  const [op, setOp] = useState<ArrayOp>("bubbleSort");
  const [valuesText, setValuesText] = useState("5, 2, 9, 1, 7");
  const [indexText, setIndexText] = useState("2");
  const [valueText, setValueText] = useState("7");
  const [applied, setApplied] = useState({ values: [5, 2, 9, 1, 7], index: 2, value: 7 });
  const params = ARRAY_PARAMS[op];

  const program = useMemo(() => runArray(op, applied.values.length ? applied.values : [5, 2, 9, 1, 7], applied), [op, applied]);

  return (
    <VisualizerShell
      ops={known}
      selected={op}
      onSelect={(id) => setOp(id as ArrayOp)}
      program={program}
      renderStep={(f) => <ArrayCanvas frame={f} />}
      inspect={(f) => [
        { label: "Length", value: f.cells.filter((c) => c.value !== null).length },
        { label: "Array", value: `[${f.cells.map((c) => c.value ?? "_").join(", ")}]` },
        { label: "Pointers", value: f.tags.length ? f.tags.map((t) => `${t.name}=${t.at}`).join("  ") : "—" },
      ]}
      inputs={
        <form
          className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-end"
          onSubmit={(e) => {
            e.preventDefault();
            setApplied({ values: parseValues(valuesText, 10), index: parseInt(indexText, 10) || 0, value: parseInt(valueText, 10) || 0 });
          }}
        >
          <Field label="Array (max 10)" value={valuesText} onChange={setValuesText} placeholder="5, 2, 9, 1, 7" />
          {params.includes("index") ? <Field label="Index" type="number" value={indexText} onChange={setIndexText} /> : <span />}
          {params.includes("value") ? <Field label={op.includes("Search") ? "Target" : "Value"} type="number" value={valueText} onChange={setValueText} /> : <span />}
          <button type="submit" className="btn btn-ink !py-1.5">
            Load
          </button>
          {op === "binarySearch" && <p className="col-span-4 font-mono text-[10px] text-outline">Binary search needs sorted input, so the array is sorted first.</p>}
        </form>
      }
    />
  );
}
