"use client";

import { useMemo, useState } from "react";
import { runStack, runQueue, STACK_PARAMS, QUEUE_PARAMS, type StackOp, type QueueOp } from "@/lib/viz/stackQueueEngine";
import { VisualizerShell, Field, parseValues, type OpInfo } from "./VisualizerShell";
import { StackCanvas, QueueCanvas } from "./StackQueueCanvas";

type Mode = "stack" | "queue";

export function StackQueueVisualizer({ ops }: { ops: OpInfo[] }) {
  const stackOps = ops.filter((o) => o.tags.includes("stack") && o.id in STACK_PARAMS);
  const queueOps = ops.filter((o) => o.tags.includes("queue") && o.id in QUEUE_PARAMS);
  const [mode, setMode] = useState<Mode>("stack");
  const [stackOp, setStackOp] = useState<StackOp>("push");
  const [queueOp, setQueueOp] = useState<QueueOp>("enqueue");
  const [valuesText, setValuesText] = useState("10, 20, 30");
  const [valueText, setValueText] = useState("40");
  const [text, setText] = useState("{[()()]}");
  const [applied, setApplied] = useState({ values: [10, 20, 30], value: 40, text: "{[()()]}" });

  const stackProgram = useMemo(() => runStack(stackOp, applied.values, applied), [stackOp, applied]);
  const queueProgram = useMemo(() => runQueue(queueOp, applied.values, applied), [queueOp, applied]);

  const params: string[] = mode === "stack" ? STACK_PARAMS[stackOp] : QUEUE_PARAMS[queueOp];

  const tabs = (
    <div className="flex gap-2">
      {(["stack", "queue"] as Mode[]).map((m) => (
        <button
          key={m}
          onClick={() => setMode(m)}
          className={`px-4 py-2 border-2 rounded font-mono text-[12px] font-bold uppercase tracking-wider ${
            mode === m ? "bg-amber border-ink text-white shadow-comic-sm" : "bg-card border-outline-soft hover:border-ink"
          }`}
        >
          {m === "stack" ? "Stack · LIFO" : "Queue · FIFO"}
        </button>
      ))}
    </div>
  );

  const inputs = (
    <form
      className="grid grid-cols-[1fr_auto_auto] gap-2 items-end"
      onSubmit={(e) => {
        e.preventDefault();
        setApplied({ values: parseValues(valuesText, 6), value: parseInt(valueText, 10) || 0, text: text.slice(0, 16) });
      }}
    >
      {params.includes("text") ? (
        <Field label="Brackets (max 16)" value={text} onChange={setText} />
      ) : (
        <Field label="Starting values (max 6)" value={valuesText} onChange={setValuesText} />
      )}
      {params.includes("value") ? <Field label="Value" type="number" value={valueText} onChange={setValueText} /> : <span />}
      <button type="submit" className="btn btn-ink !py-1.5">
        Load
      </button>
    </form>
  );

  return mode === "stack" ? (
    <VisualizerShell
      key="stack"
      tabs={tabs}
      ops={stackOps}
      selected={stackOp}
      onSelect={(id) => setStackOp(id as StackOp)}
      program={stackProgram}
      renderStep={(f) => <StackCanvas frame={f} />}
      inspect={(f) => [
        { label: "Top", value: f.items.length - 1 },
        { label: "Capacity", value: f.input ? "grows" : f.capacity },
        { label: "Size", value: f.items.length },
      ]}
      inputs={inputs}
    />
  ) : (
    <VisualizerShell
      key="queue"
      tabs={tabs}
      ops={queueOps}
      selected={queueOp}
      onSelect={(id) => setQueueOp(id as QueueOp)}
      program={queueProgram}
      renderStep={(f) => <QueueCanvas frame={f} />}
      inspect={(f) => [
        { label: "Front", value: f.front },
        { label: "Rear", value: f.rear },
        { label: "Count", value: `${f.count} / ${f.slots.length}` },
        { label: "Kind", value: f.circular ? "circular" : "simple" },
      ]}
      inputs={inputs}
    />
  );
}
