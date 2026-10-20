"use client";

import { useMemo, useState } from "react";
import { runTree, TREE_PARAMS, type TreeOp } from "@/lib/viz/treeEngine";
import { VisualizerShell, Field, parseValues, type OpInfo } from "./VisualizerShell";
import { TreeCanvas } from "./TreeCanvas";

export function TreeVisualizer({ ops, initialOp }: { ops: OpInfo[]; initialOp?: string }) {
  const known = ops.filter((o) => o.id in TREE_PARAMS);
  const [op, setOp] = useState<TreeOp>(known.some((o) => o.id === initialOp) ? (initialOp as TreeOp) : "search");
  const [valuesText, setValuesText] = useState("50, 30, 70, 20, 40, 60, 80");
  const [valueText, setValueText] = useState("60");
  const [applied, setApplied] = useState({ values: [50, 30, 70, 20, 40, 60, 80], value: 60 });
  const params = TREE_PARAMS[op];

  const program = useMemo(() => runTree(op, applied.values, applied), [op, applied]);

  return (
    <VisualizerShell
      ops={known}
      selected={op}
      onSelect={(id) => setOp(id as TreeOp)}
      program={program}
      renderStep={(f) => <TreeCanvas frame={f} />}
      inspect={(f) => [
        { label: "Nodes", value: f.nodes.length },
        { label: "Root", value: f.root ? (f.nodes.find((n) => n.id === f.root)?.value ?? "none") : "null" },
        { label: "Output", value: f.output.length ? f.output.join(", ") : "—" },
      ]}
      inputs={
        <form
          className="grid grid-cols-[1fr_auto_auto] gap-2 items-end"
          onSubmit={(e) => {
            e.preventDefault();
            setApplied({ values: parseValues(valuesText, 10), value: parseInt(valueText, 10) || 0 });
          }}
        >
          <Field label="BST values (max 10)" value={valuesText} onChange={setValuesText} />
          {params.includes("value") ? (
            <Field label={op === "search" ? "Target" : "Value"} type="number" value={valueText} onChange={setValueText} />
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
