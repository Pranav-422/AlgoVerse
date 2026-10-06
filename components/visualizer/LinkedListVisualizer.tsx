"use client";

import { useMemo, useState } from "react";
import { runList, LIST_PARAMS, type ListOp } from "@/lib/viz/listEngine";
import { VisualizerShell, Field, parseValues, type OpInfo } from "./VisualizerShell";
import { LinkedListCanvas } from "./LinkedListCanvas";

export function LinkedListVisualizer({ ops }: { ops: OpInfo[] }) {
  const known = ops.filter((o) => o.id in LIST_PARAMS);
  const [op, setOp] = useState<ListOp>("insertBegin");
  const [valuesText, setValuesText] = useState("10, 20, 30, 40");
  const [indexText, setIndexText] = useState("2");
  const [valueText, setValueText] = useState("5");
  const [applied, setApplied] = useState({ values: [10, 20, 30, 40], index: 2, value: 5 });
  const params = LIST_PARAMS[op];

  const program = useMemo(() => runList(op, applied.values, applied), [op, applied]);

  return (
    <VisualizerShell
      ops={known}
      selected={op}
      onSelect={(id) => setOp(id as ListOp)}
      program={program}
      renderStep={(f) => <LinkedListCanvas frame={f} />}
      inspect={(f) => [
        { label: "Nodes", value: f.nodes.length },
        { label: "Head", value: f.head ? f.nodes.find((n) => n.id === f.head)?.addr : "NULL" },
        { label: "Pointers", value: f.tags.map((t) => `${t.name} → ${f.nodes.find((n) => n.id === t.at)?.value}`).join(", ") || "—" },
      ]}
      inputs={
        <form
          className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-end"
          onSubmit={(e) => {
            e.preventDefault();
            setApplied({ values: parseValues(valuesText, 7), index: parseInt(indexText, 10) || 0, value: parseInt(valueText, 10) || 0 });
          }}
        >
          <Field label="Node values (max 7)" value={valuesText} onChange={setValuesText} />
          {params.includes("index") ? <Field label="Position" type="number" value={indexText} onChange={setIndexText} /> : <span />}
          {params.includes("value") ? <Field label={op === "search" ? "Key" : "Value"} type="number" value={valueText} onChange={setValueText} /> : <span />}
          <button type="submit" className="btn btn-ink !py-1.5">
            Load
          </button>
        </form>
      }
    />
  );
}
