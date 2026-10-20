"use client";

import { useMemo, useState } from "react";
import { runGraph, GRAPH_PARAMS, type GraphOp } from "@/lib/viz/graphEngine";
import { VisualizerShell, Field, type OpInfo } from "./VisualizerShell";
import { GraphCanvas } from "./GraphCanvas";

export function GraphVisualizer({ ops, initialOp }: { ops: OpInfo[]; initialOp?: string }) {
  const known = ops.filter((o) => o.id in GRAPH_PARAMS);
  const [op, setOp] = useState<GraphOp>(known.some((o) => o.id === initialOp) ? (initialOp as GraphOp) : "bfs");
  const [fromText, setFromText] = useState("0");
  const [toText, setToText] = useState("4");
  const [applied, setApplied] = useState({ from: 0, to: 4 });
  const params = GRAPH_PARAMS[op];

  const program = useMemo(() => runGraph(op, applied), [op, applied]);

  return (
    <VisualizerShell
      ops={known}
      selected={op}
      onSelect={(id) => setOp(id as GraphOp)}
      program={program}
      renderStep={(f) => <GraphCanvas frame={f} />}
      inspect={(f) => [
        { label: "Vertices", value: f.vertices.length },
        { label: "Edges", value: f.edges.length },
        { label: "Frontier", value: f.frontier.length ? f.frontier.join(", ") : "—" },
        { label: "Visited", value: f.output.length ? f.output.join(", ") : "—" },
      ]}
      inputs={
        <form
          className="grid grid-cols-[auto_auto_auto] gap-2 items-end"
          onSubmit={(e) => {
            e.preventDefault();
            setApplied({ from: parseInt(fromText, 10) || 0, to: parseInt(toText, 10) || 0 });
          }}
        >
          {params.includes("from") ? (
            <Field label="Start / From" type="number" value={fromText} onChange={setFromText} />
          ) : (
            <span />
          )}
          {params.includes("to") ? (
            <Field label="Target / To" type="number" value={toText} onChange={setToText} />
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
