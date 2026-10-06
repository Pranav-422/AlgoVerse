// Sanity checks for the visualizer engines. Run: node scripts/check-engines.mts
import { runArray, ARRAY_PARAMS, type ArrayOp } from "../lib/viz/arrayEngine.ts";
import { runList, LIST_PARAMS, type ListOp } from "../lib/viz/listEngine.ts";
import { runStack, runQueue, STACK_PARAMS, QUEUE_PARAMS, type StackOp, type QueueOp } from "../lib/viz/stackQueueEngine.ts";

let failures = 0;
const check = (cond: boolean, msg: string) => {
  if (!cond) {
    failures++;
    console.log("FAIL", msg);
  }
};

function common(name: string, prog: { frames: { note: string; lines: number[] }[]; code: string[] }) {
  check(prog.frames.length > 0, `${name}: has frames`);
  for (const [i, f] of prog.frames.entries()) {
    check(!!f.note, `${name}#${i}: note`);
    for (const l of f.lines) check(l >= 1 && l <= prog.code.length, `${name}#${i}: line ${l} within ${prog.code.length}`);
  }
}

const values = [5, 2, 9, 1, 7];
const vals = (p: { frames: { cells: { value: number | null }[] }[] }) => p.frames.at(-1)!.cells.map((c) => c.value);

for (const op of Object.keys(ARRAY_PARAMS) as ArrayOp[]) {
  for (const input of [values, [1], [3, 3, 1], []]) {
    const p = runArray(op, input, { index: 2, value: 9 });
    common(`array.${op}(${input})`, p);
  }
}
for (const op of ["bubbleSort", "selectionSort", "insertionSort"] as ArrayOp[])
  check(JSON.stringify(vals(runArray(op, values))) === "[1,2,5,7,9]", `${op} sorts`);
check(JSON.stringify(vals(runArray("reverse", values))) === "[7,1,9,2,5]", "reverse");
check(JSON.stringify(vals(runArray("insert", values, { index: 2, value: 4 }))) === "[5,2,4,9,1,7]", "insert");
check(JSON.stringify(vals(runArray("delete", values, { index: 1 }))) === "[5,9,1,7]", "delete");
check(runArray("binarySearch", values, { value: 7 }).frames.at(-1)!.note.includes("Found"), "binary search finds 7");
check(runArray("binarySearch", values, { value: 4 }).frames.at(-1)!.note.includes("not in"), "binary search misses 4");
check(runArray("bubbleSort", values).frames[0].cells.map((c) => c.value).join() === "5,2,9,1,7", "first frame is the input");

const order = (f: { head: string | null; next: Record<string, string | null>; nodes: { id: string; value: number }[] }) => {
  const out: number[] = [];
  let c = f.head;
  while (c && out.length < 50) {
    out.push(f.nodes.find((n) => n.id === c)!.value);
    c = f.next[c];
  }
  return out.join();
};
for (const op of Object.keys(LIST_PARAMS) as ListOp[])
  for (const input of [[10, 20, 30, 40], [10], []]) common(`list.${op}(${input})`, runList(op, input, { index: 2, value: 5 }));
const L = (op: ListOp, p = {}) => order(runList(op, [10, 20, 30, 40], p).frames.at(-1)!);
check(L("insertBegin", { value: 5 }) === "5,10,20,30,40", "list insertBegin");
check(L("insertEnd", { value: 5 }) === "10,20,30,40,5", "list insertEnd");
check(L("insertAt", { index: 2, value: 5 }) === "10,20,5,30,40", "list insertAt");
check(L("deleteBegin") === "20,30,40", "list deleteBegin");
check(L("deleteEnd") === "10,20,30", "list deleteEnd");
check(L("reverse") === "40,30,20,10", "list reverse");

for (const op of Object.keys(STACK_PARAMS) as StackOp[])
  for (const input of [[10, 20, 30], []]) common(`stack.${op}(${input})`, runStack(op, input, { value: 40, text: "{[()]}" }));
check(runStack("push", [10, 20, 30], { value: 40 }).frames.at(-1)!.items.map((c) => c.value).join() === "10,20,30,40", "push");
check(runStack("pop", [10, 20, 30]).frames.at(-1)!.items.length === 2, "pop");
check(runStack("push", [1, 2, 3, 4, 5], { value: 6 }).frames.at(-1)!.alert?.text === "OVERFLOW", "overflow");
check(runStack("balanced", [], { text: "{[()]}" }).frames.at(-1)!.alert?.text === "BALANCED", "balanced ok");
check(runStack("balanced", [], { text: "{[(])}" }).frames.at(-1)!.alert?.text === "NOT BALANCED", "balanced mismatch");
check(runStack("balanced", [], { text: "((" }).frames.at(-1)!.alert?.text === "NOT BALANCED", "balanced leftover");

for (const op of Object.keys(QUEUE_PARAMS) as QueueOp[])
  for (const input of [[10, 20, 30], []]) common(`queue.${op}(${input})`, runQueue(op, input, { value: 40 }));
const ce = runQueue("circularEnqueue", [10, 20, 30], { value: 40 }).frames.at(-1)!;
check(ce.rear === 0 && ce.slots[0]?.value === 40 && ce.count === 4, `circular enqueue wraps (rear=${ce.rear})`);
const cd = runQueue("circularDequeue", [10, 20, 30]).frames.at(-1)!;
check(cd.front === 4 && cd.count === 2, `circular dequeue (front=${cd.front})`);

console.log(failures ? `${failures} check(s) failed` : "all engine checks passed");
process.exit(failures ? 1 : 0);
