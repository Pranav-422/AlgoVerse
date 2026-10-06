import type { Cell, Mark, Program, QueueFrame, StackFrame } from "./types";

// AlgoVerse stack and queue engines (array-backed, fixed capacity).

let seq = 0;
const cell = (value: number): Cell => ({ id: `s${++seq}`, value });

// --- Stack -------------------------------------------------------------------

class Stack {
  items: Cell[];
  aside: Cell | null = null;
  frames: StackFrame[] = [];
  capacity: number;
  constructor(values: number[], capacity: number) {
    this.capacity = capacity;
    this.items = values.slice(0, capacity).map(cell);
  }
  get top() {
    return this.items.length - 1;
  }
  snap(note: string, lines: number[], marks: Record<string, Mark> = {}, extra: Partial<StackFrame> = {}) {
    this.frames.push({
      items: this.items.map((c) => ({ ...c })),
      capacity: this.capacity,
      aside: this.aside ? { ...this.aside } : null,
      marks,
      note,
      lines,
      ...extra,
    });
  }
}

const PUSH_CODE = ["if top == capacity - 1: overflow", "top = top + 1", "stack[top] = value"];
const POP_CODE = ["if top == -1: underflow", "value = stack[top]", "top = top - 1", "return value"];

function push(S: Stack, value: number, lineOffset = 0) {
  const L = (n: number) => n + lineOffset;
  S.aside = cell(value);
  S.snap(`Push ${value}. Is there room? top = ${S.top}, capacity = ${S.capacity}.`, [L(1)], { [S.aside.id]: "fresh" });
  if (S.top === S.capacity - 1) {
    S.snap(`top = capacity − 1: the stack is full. Pushing ${value} would overflow, so it is refused.`, [L(1)], { [S.aside.id]: "gone" }, {
      alert: { text: "OVERFLOW", tone: "error" },
    });
    S.aside = null;
    return false;
  }
  const c = S.aside;
  S.aside = null;
  S.items.push(c);
  S.snap(`top = ${S.top}, then stack[${S.top}] = ${value}. Only the top changes — O(1).`, [L(2), L(3)], { [c.id]: "fresh" });
  return true;
}

function pop(S: Stack) {
  S.snap(`Pop. Is the stack empty? top = ${S.top}.`, [1]);
  if (S.top === -1) {
    S.snap(`top = −1: nothing to pop. This is an underflow.`, [1], {}, { alert: { text: "UNDERFLOW", tone: "error" } });
    return null;
  }
  const c = S.items[S.top];
  S.snap(`Read stack[${S.top}] = ${c.value}. Last in, first out.`, [2], { [c.id]: "gone" });
  S.items.pop();
  S.aside = c;
  S.snap(`top = ${S.top}. ${c.value} is returned. O(1).`, [3, 4], { [c.id]: "gone" });
  S.aside = null;
  return c;
}

function balanced(S: Stack, text: string): string[] {
  const code = [
    "for ch in text:",
    "  if ch is an opener: push(ch)",
    "  else:",
    "    if empty or pop() != pair(ch): fail",
    "balanced if stack is empty",
  ];
  const pairs: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
  const opens = "([{";
  const chars = [...text].filter((c) => "()[]{}".includes(c));
  const t = chars.join("");
  // Brackets are drawn as their char codes' symbols via `value`; the canvas maps them back.
  const sym = (ch: string) => ch.charCodeAt(0);
  S.snap(`Read "${t}" left to right. Openers wait on the stack for their closer.`, [1], {}, { input: { text: t, at: -1 } });
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (opens.includes(ch)) {
      const c = cell(sym(ch));
      S.items.push(c);
      S.snap(`'${ch}' opens a bracket — push it.`, [1, 2], { [c.id]: "fresh" }, { input: { text: t, at: i } });
    } else {
      const top = S.items[S.top];
      if (!top) {
        S.snap(`'${ch}' closes, but the stack is empty — nothing to match. Not balanced.`, [3, 4], {}, {
          input: { text: t, at: i, result: "fail" },
          alert: { text: "NOT BALANCED", tone: "error" },
        });
        return code;
      }
      const opener = String.fromCharCode(top.value as number);
      const ok = opener === pairs[ch];
      S.snap(`'${ch}' closes. Pop the top '${opener}' — ${ok ? "they match." : "they do not match."}`, [3, 4], { [top.id]: ok ? "found" : "gone" }, {
        input: { text: t, at: i, result: ok ? undefined : "fail" },
      });
      S.items.pop();
      if (!ok) {
        S.snap(`Mismatch — not balanced.`, [4], {}, { input: { text: t, at: i, result: "fail" }, alert: { text: "NOT BALANCED", tone: "error" } });
        return code;
      }
    }
  }
  const ok = S.items.length === 0;
  S.snap(ok ? `Input finished and the stack is empty: balanced.` : `Input finished but ${S.items.length} opener(s) never closed: not balanced.`, [5], {}, {
    input: { text: t, at: chars.length, result: ok ? "ok" : "fail" },
    alert: { text: ok ? "BALANCED" : "NOT BALANCED", tone: ok ? "ok" : "error" },
  });
  return code;
}

export type StackOp = "push" | "pop" | "peek" | "overflow" | "balanced";

export const STACK_PARAMS: Record<StackOp, ("value" | "text")[]> = {
  push: ["value"],
  pop: [],
  peek: [],
  overflow: ["value"],
  balanced: ["text"],
};

export function runStack(op: StackOp, values: number[], p: { value?: number; text?: string } = {}, capacity = 5): Program<StackFrame> {
  const S = new Stack(op === "balanced" ? [] : values, capacity);
  const value = p.value ?? 0;
  let code: string[];
  switch (op) {
    case "push":
      push(S, value);
      code = PUSH_CODE;
      break;
    case "pop":
      pop(S);
      code = POP_CODE;
      break;
    case "peek": {
      code = ["if top == -1: underflow", "return stack[top]"];
      if (S.top === -1) S.snap(`The stack is empty — there is no top to read.`, [1], {}, { alert: { text: "EMPTY", tone: "error" } });
      else {
        const c = S.items[S.top];
        S.snap(`Read stack[${S.top}] = ${c.value} without removing it. top does not change. O(1).`, [2], { [c.id]: "found" });
      }
      break;
    }
    case "overflow": {
      code = [...PUSH_CODE, "— then pop until empty —", ...POP_CODE];
      S.snap(`Keep pushing until the stack (capacity ${capacity}) is full, then push once more.`, []);
      let v = value;
      while (push(S, v)) v += 1;
      S.snap(`Now pop everything, then pop once more.`, []);
      while (S.items.length) {
        const c = S.items[S.top];
        S.items.pop();
        S.aside = c;
        S.snap(`Pop ${c.value}. top = ${S.top}.`, [6, 7, 8], { [c.id]: "gone" });
        S.aside = null;
      }
      S.snap(`Pop on an empty stack: top = −1. This is an underflow.`, [5], {}, { alert: { text: "UNDERFLOW", tone: "error" } });
      break;
    }
    case "balanced":
      code = balanced(S, p.text || "{[()]}");
      break;
  }
  return { frames: S.frames, code };
}

// --- Queue -------------------------------------------------------------------

class Queue {
  slots: (Cell | null)[];
  front = 0;
  rear = -1;
  count = 0;
  frames: QueueFrame[] = [];
  capacity: number;
  circular: boolean;
  constructor(values: number[], capacity: number, circular: boolean, start = 0) {
    this.capacity = capacity;
    this.circular = circular;
    this.slots = Array(capacity).fill(null);
    this.front = start;
    this.rear = start - 1;
    for (const v of values.slice(0, capacity - (circular ? 0 : start))) {
      this.rear = circular ? (this.rear + 1 + capacity) % capacity : this.rear + 1;
      this.slots[this.rear] = cell(v);
      this.count++;
    }
    if (circular && this.rear < 0) this.rear = (this.rear + capacity) % capacity;
  }
  snap(note: string, lines: number[], marks: Record<string, Mark> = {}, moved: ("front" | "rear")[] = [], alert?: QueueFrame["alert"]) {
    this.frames.push({
      slots: this.slots.map((c) => (c ? { ...c } : null)),
      front: this.front,
      rear: this.rear,
      count: this.count,
      circular: this.circular,
      marks,
      moved,
      alert,
      note,
      lines,
    });
  }
}

export type QueueOp = "enqueue" | "dequeue" | "peekFront" | "circularEnqueue" | "circularDequeue";

export const QUEUE_PARAMS: Record<QueueOp, ("value")[]> = {
  enqueue: ["value"],
  dequeue: [],
  peekFront: [],
  circularEnqueue: ["value"],
  circularDequeue: [],
};

export function runQueue(op: QueueOp, values: number[], p: { value?: number } = {}, capacity = 6): Program<QueueFrame> {
  const value = p.value ?? 0;
  const circular = op === "circularEnqueue" || op === "circularDequeue";
  // Circular demos start part-way round the ring so the wrap-around is visible.
  const Q = new Queue(values, capacity, circular, circular ? 3 : 0);
  let code: string[];

  if (op === "enqueue") {
    code = ["if rear == capacity - 1: full", "rear = rear + 1", "queue[rear] = value"];
    Q.snap(`Enqueue ${value}. New items join at the rear (rear = ${Q.rear}).`, [1]);
    if (Q.rear === capacity - 1) {
      Q.snap(`rear is already at the last slot. A simple queue cannot go further — even if slots at the front are free.`, [1], {}, [], {
        text: "FULL",
        tone: "error",
      });
    } else {
      Q.rear++;
      Q.snap(`rear = ${Q.rear}.`, [2], {}, ["rear"]);
      const c = cell(value);
      Q.slots[Q.rear] = c;
      Q.count++;
      Q.snap(`queue[${Q.rear}] = ${value}. It waits behind ${Q.count - 1} other item${Q.count === 2 ? "" : "s"}. O(1).`, [3], { [c.id]: "fresh" });
    }
  } else if (op === "dequeue" || op === "peekFront") {
    const isPeek = op === "peekFront";
    code = isPeek ? ["if queue is empty: error", "return queue[front]"] : ["if queue is empty: underflow", "value = queue[front]", "front = front + 1", "return value"];
    if (Q.count === 0) {
      Q.snap(`The queue is empty.`, [1], {}, [], { text: "EMPTY", tone: "error" });
    } else {
      const c = Q.slots[Q.front]!;
      Q.snap(`The front item is ${c.value} at index ${Q.front}. First in, first out.`, [1, 2], { [c.id]: isPeek ? "found" : "gone" });
      if (!isPeek) {
        Q.slots[Q.front] = null;
        Q.front++;
        Q.count--;
        Q.snap(`front = ${Q.front}. ${c.value} leaves. Nothing shifts — O(1). The slot it left is not reused by a simple queue.`, [3, 4], {}, ["front"]);
      }
    }
  } else {
    const enq = op === "circularEnqueue";
    code = enq
      ? ["if count == capacity: full", "rear = (rear + 1) mod capacity", "queue[rear] = value", "count = count + 1"]
      : ["if count == 0: empty", "value = queue[front]", "front = (front + 1) mod capacity", "count = count - 1"];
    Q.snap(`Circular queue, capacity ${capacity}: front = ${Q.front}, rear = ${Q.rear}, count = ${Q.count}.`, [1]);
    if (enq) {
      if (Q.count === capacity) {
        Q.snap(`count = capacity: every slot is used. Full.`, [1], {}, [], { text: "FULL", tone: "error" });
      } else {
        const next = (Q.rear + 1) % capacity;
        const old = Q.rear;
        Q.rear = next;
        Q.snap(`rear = (${old} + 1) mod ${capacity} = ${next}.${next < old ? " It wraps round to the start — freed slots get reused." : ""}`, [2], {}, ["rear"]);
        const c = cell(value);
        Q.slots[next] = c;
        Q.count++;
        Q.snap(`queue[${next}] = ${value}. count = ${Q.count}. O(1).`, [3, 4], { [c.id]: "fresh" });
      }
    } else if (Q.count === 0) {
      Q.snap(`count = 0: empty.`, [1], {}, [], { text: "EMPTY", tone: "error" });
    } else {
      const c = Q.slots[Q.front]!;
      Q.snap(`Read queue[${Q.front}] = ${c.value}.`, [2], { [c.id]: "gone" });
      Q.slots[Q.front] = null;
      const old = Q.front;
      Q.front = (old + 1) % capacity;
      Q.count--;
      Q.snap(
        `front = (${old} + 1) mod ${capacity} = ${Q.front}. count = ${Q.count}. ${c.value} has left; its slot is free for a later enqueue to reuse.`,
        [3, 4],
        {},
        ["front"],
      );
    }
  }
  return { frames: Q.frames, code };
}
