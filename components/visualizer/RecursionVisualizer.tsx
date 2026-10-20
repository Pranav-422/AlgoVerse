"use client";

import { useMemo, useState } from "react";
import { runRecursion, RECURSION_PARAMS, type RecursionOp } from "@/lib/viz/recursionEngine";
import { VisualizerShell, Field, parseValues, type OpInfo } from "./VisualizerShell";
import { RecursionCanvas } from "./RecursionCanvas";

export function RecursionVisualizer({ ops, initialOp }: { ops: OpInfo[]; initialOp?: string }) {
  const known = ops.filter((o) => o.id in RECURSION_PARAMS);
  const [op, setOp] = useState<RecursionOp>(known.some((o) => o.id === initialOp) ? (initialOp as RecursionOp) : "factorial");
  const [nText, setNText] = useState("5");
  const [valueText, setValueText] = useState("2");
  const [valuesText, setValuesText] = useState("1, 2, 3, 4");
  const [textVal, setTextVal] = useState("racecar");
  const [applied, setApplied] = useState({
    n: 5,
    value: 2,
    values: [1, 2, 3, 4],
    text: "racecar",
  });
  const params = RECURSION_PARAMS[op];

  const program = useMemo(() => runRecursion(op, applied), [op, applied]);

  return (
    <VisualizerShell
      ops={known}
      selected={op}
      onSelect={(id) => setOp(id as RecursionOp)}
      program={program}
      renderStep={(f) => <RecursionCanvas frame={f} />}
      inspect={(f) => [
        { label: "Stack depth", value: f.stack.length },
        { label: "Active call", value: f.stack.at(-1)?.call ?? "—" },
        { label: "Result", value: f.result ?? "computing…" },
        ...(f.output.length > 0 ? [{ label: "Output moves", value: f.output.length }] : []),
      ]}
      inputs={
        <form
          className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-end"
          onSubmit={(e) => {
            e.preventDefault();
            setApplied({
              n: parseInt(nText, 10) || 0,
              value: parseInt(valueText, 10) || 0,
              values: parseValues(valuesText, 6),
              text: textVal,
            });
          }}
        >
          {params.includes("values") ? (
            <Field label="Array values (max 6)" value={valuesText} onChange={setValuesText} />
          ) : params.includes("text") ? (
            <Field label="Text string" value={textVal} onChange={setTextVal} />
          ) : (
            <Field label="Input n (clamped)" type="number" value={nText} onChange={setNText} />
          )}
          {params.includes("value") ? (
            <Field label={op === "power" ? "Base" : "Target"} type="number" value={valueText} onChange={setValueText} />
          ) : (
            <span />
          )}
          {params.includes("n") && (params.includes("values") || params.includes("value")) ? (
            <Field label="Exponent n" type="number" value={nText} onChange={setNText} />
          ) : (
            <span />
          )}
          <button type="submit" className="btn btn-ink !py-1.5">
            Load
          </button>
        </form>
      }
    />
  );
}
