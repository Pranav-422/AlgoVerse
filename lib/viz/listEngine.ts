import type { ListFrame, ListNode, Mark, Program, Tag } from "./types";

// AlgoVerse singly-linked-list engine. Keeps a real next-pointer map and records a frame
// after every pointer read or write, so the canvas can show exactly which link changed.

let seq = 0;
const newNode = (value: number): ListNode => {
  seq += 1;
  return { id: `n${seq}`, value, addr: "0x" + (0x10 + ((seq * 0x1c) % 0xe0)).toString(16).toUpperCase() };
};

class List {
  nodes: ListNode[] = [];
  next: Record<string, string | null> = {};
  head: string | null = null;
  lifted = new Set<string>();
  frames: ListFrame[] = [];

  constructor(values: number[]) {
    const ns = values.map(newNode);
    ns.forEach((n, i) => (this.next[n.id] = ns[i + 1]?.id ?? null));
    this.nodes = ns;
    this.head = ns[0]?.id ?? null;
  }

  /** Walk order from head (what the list *is*, independent of display order). */
  order(): ListNode[] {
    const out: ListNode[] = [];
    const seen = new Set<string>();
    let c = this.head;
    while (c && !seen.has(c)) {
      seen.add(c);
      out.push(this.byId(c));
      c = this.next[c];
    }
    return out;
  }
  byId(id: string) {
    return this.nodes.find((n) => n.id === id)!;
  }
  val(id: string | null) {
    return id ? this.byId(id).value : "NULL";
  }
  addr(id: string | null) {
    return id ? this.byId(id).addr : "NULL";
  }

  snap(note: string, lines: number[], marks: Record<string, Mark> = {}, tags: Tag[] = [], changed: string[] = []) {
    this.frames.push({
      nodes: this.nodes.map((n) => ({ ...n })),
      next: { ...this.next },
      head: this.head,
      lifted: [...this.lifted],
      marks,
      tags,
      changed,
      note,
      lines,
    });
  }

  /** Re-lay the row in head → tail order (used after the structure changed). */
  relayout() {
    const ordered = this.order();
    const rest = this.nodes.filter((n) => !ordered.includes(n));
    this.nodes = [...ordered, ...rest];
  }
}

// --- operations --------------------------------------------------------------

function traverse(L: List): string[] {
  let c = L.head;
  const done: Record<string, Mark> = {};
  L.snap(`curr starts at head (${L.addr(L.head)}).`, [1], {}, c ? [{ name: "curr", at: c }] : []);
  while (c) {
    L.snap(`Visit ${L.val(c)}. Its next field holds ${L.addr(L.next[c])}.`, [2, 3], { ...done, [c]: "focus" }, [{ name: "curr", at: c }]);
    done[c] = "done";
    c = L.next[c];
  }
  L.snap(`curr is NULL — every node visited by following pointers. O(n).`, [4], done);
  return ["curr = head", "while curr != NULL:", "  visit(curr.value)", "  curr = curr.next"];
}

function search(L: List, key: number): string[] {
  const code = ["curr = head", "while curr != NULL:", "  if curr.value == key: return curr", "  curr = curr.next", "return NULL"];
  let c = L.head;
  const passed: Record<string, Mark> = {};
  let k = 0;
  L.snap(`Search for ${key}, starting at head.`, [1], {}, c ? [{ name: "curr", at: c }] : []);
  while (c) {
    k++;
    const hit = L.val(c) === key;
    L.snap(`Is ${L.val(c)} equal to ${key}? ${hit ? "Yes." : "No — follow next."}`, [2, 3], { ...passed, [c]: hit ? "found" : "compare" }, [
      { name: "curr", at: c },
    ]);
    if (hit) {
      L.snap(`Found ${key} after visiting ${k} node${k > 1 ? "s" : ""}. There is no index to jump to — O(n).`, [3], { ...passed, [c]: "found" }, [
        { name: "curr", at: c },
      ]);
      return code;
    }
    passed[c] = "out";
    c = L.next[c];
  }
  L.snap(`Reached NULL — ${key} is not in the list.`, [5], passed);
  return code;
}

function insertBegin(L: List, value: number): string[] {
  const n = newNode(value);
  L.nodes.unshift(n);
  L.next[n.id] = null;
  L.lifted.add(n.id);
  L.snap(`Create a new node ${value} at ${n.addr}. It is not linked to anything yet.`, [1], { [n.id]: "fresh" });
  L.next[n.id] = L.head;
  L.snap(`node.next = head: the new node now points at ${L.val(L.head)} (${L.addr(L.head)}).`, [2], { [n.id]: "fresh" }, [], [n.id]);
  L.head = n.id;
  L.lifted.delete(n.id);
  L.snap(`head = node: the list now starts at ${value}. Two pointer writes, nothing shifted — O(1).`, [3], { [n.id]: "fresh" }, [], ["head"]);
  return ["node = new Node(value)", "node.next = head", "head = node"];
}

function insertEnd(L: List, value: number): string[] {
  const code = ["node = new Node(value)", "if head == NULL: head = node; return", "curr = head", "while curr.next != NULL:", "  curr = curr.next", "curr.next = node"];
  const n = newNode(value);
  L.nodes.push(n);
  L.next[n.id] = null;
  L.lifted.add(n.id);
  L.snap(`Create a new node ${value} at ${n.addr}. Its next is NULL — it will be the new tail.`, [1], { [n.id]: "fresh" });
  if (!L.head) {
    L.head = n.id;
    L.lifted.delete(n.id);
    L.snap(`The list was empty, so head simply points at the new node.`, [2], { [n.id]: "fresh" }, [], ["head"]);
    return code;
  }
  let c = L.head;
  const passed: Record<string, Mark> = {};
  L.snap(`No tail pointer, so walk from head to find the last node.`, [3], { [n.id]: "fresh" }, [{ name: "curr", at: c }]);
  while (L.next[c] && L.next[c] !== n.id) {
    passed[c] = "done";
    c = L.next[c]!;
    L.snap(`curr = curr.next → ${L.val(c)}.`, [4, 5], { ...passed, [c]: "focus", [n.id]: "fresh" }, [{ name: "curr", at: c }]);
  }
  L.next[c] = n.id;
  L.lifted.delete(n.id);
  L.snap(`${L.val(c)} is the last node. Set its next to the new node. The walk made this O(n).`, [6], { ...passed, [n.id]: "fresh" }, [{ name: "curr", at: c }], [c]);
  return code;
}

function insertAt(L: List, pos: number, value: number): string[] {
  const code = ["if k == 0: insert at beginning", "prev = head", "repeat k-1 times: prev = prev.next", "node.next = prev.next", "prev.next = node"];
  const len = L.order().length;
  if (pos <= 0) return insertBegin(L, value);
  if (pos > len) {
    L.snap(`Position ${pos} is past the end (length ${len}). Nothing is inserted.`, []);
    return code;
  }
  let prev = L.head!;
  L.snap(`Insert ${value} at position ${pos}. We need the node just before it, so start at head.`, [2], {}, [{ name: "prev", at: prev }]);
  for (let s = 1; s < pos; s++) {
    prev = L.next[prev]!;
    L.snap(`prev = prev.next → ${L.val(prev)}.`, [3], { [prev]: "focus" }, [{ name: "prev", at: prev }]);
  }
  const n = newNode(value);
  const idx = L.nodes.findIndex((x) => x.id === prev);
  L.nodes.splice(idx + 1, 0, n);
  L.next[n.id] = null;
  L.lifted.add(n.id);
  L.snap(`Create node ${value} at ${n.addr}.`, [3], { [prev]: "focus", [n.id]: "fresh" }, [{ name: "prev", at: prev }]);
  L.next[n.id] = L.next[prev];
  L.snap(`node.next = prev.next: the new node points at ${L.val(L.next[n.id])}. Order matters — do this first or the rest of the list is lost.`, [4], { [prev]: "focus", [n.id]: "fresh" }, [{ name: "prev", at: prev }], [n.id]);
  L.next[prev] = n.id;
  L.lifted.delete(n.id);
  L.snap(`prev.next = node: ${L.val(prev)} now points at ${value}. Linked in with two writes after an O(n) walk.`, [5], { [n.id]: "fresh" }, [{ name: "prev", at: prev }], [prev]);
  return code;
}

function deleteBegin(L: List): string[] {
  const code = ["if head == NULL: return", "old = head", "head = head.next", "free(old)"];
  if (!L.head) {
    L.snap(`The list is empty — nothing to delete.`, [1]);
    return code;
  }
  const old = L.head;
  L.snap(`old = head (${L.val(old)}).`, [2], { [old]: "gone" }, [{ name: "old", at: old }]);
  L.head = L.next[old];
  L.lifted.add(old);
  L.snap(`head = head.next: the list now starts at ${L.val(L.head)}. One pointer write — O(1).`, [3], { [old]: "gone" }, [{ name: "old", at: old }], ["head"]);
  L.nodes = L.nodes.filter((n) => n.id !== old);
  delete L.next[old];
  L.lifted.delete(old);
  L.snap(`Free the old node. Nothing else moved.`, [4]);
  return code;
}

function deleteEnd(L: List): string[] {
  const code = ["if head == NULL: return", "if head.next == NULL: head = NULL; return", "curr = head", "while curr.next.next != NULL:", "  curr = curr.next", "free(curr.next); curr.next = NULL"];
  if (!L.head) {
    L.snap(`The list is empty — nothing to delete.`, [1]);
    return code;
  }
  if (!L.next[L.head]) {
    const only = L.head;
    L.head = null;
    L.nodes = L.nodes.filter((n) => n.id !== only);
    L.snap(`Only one node — head becomes NULL.`, [2], {}, [], ["head"]);
    return code;
  }
  let c = L.head;
  L.snap(`Walk to the second-last node.`, [3], { [c]: "focus" }, [{ name: "curr", at: c }]);
  while (L.next[L.next[c]!]) {
    c = L.next[c]!;
    L.snap(`curr = curr.next → ${L.val(c)}.`, [4, 5], { [c]: "focus" }, [{ name: "curr", at: c }]);
  }
  const last = L.next[c]!;
  L.snap(`${L.val(c)} is second-last; its next is the tail ${L.val(last)}.`, [6], { [c]: "focus", [last]: "gone" }, [{ name: "curr", at: c }]);
  L.next[c] = null;
  L.lifted.add(last);
  L.snap(`curr.next = NULL. The tail is unlinked — finding it took an O(n) walk.`, [6], { [last]: "gone" }, [{ name: "curr", at: c }], [c]);
  L.nodes = L.nodes.filter((n) => n.id !== last);
  delete L.next[last];
  L.lifted.delete(last);
  L.snap(`Free the old tail.`, [6]);
  return code;
}

function reverse(L: List): string[] {
  const code = ["prev = NULL, curr = head", "while curr != NULL:", "  next = curr.next", "  curr.next = prev", "  prev = curr", "  curr = next", "head = prev"];
  let prev: string | null = null;
  let curr = L.head;
  const tags = (): Tag[] => [
    ...(prev ? [{ name: "prev", at: prev }] : []),
    ...(curr ? [{ name: "curr", at: curr }] : []),
  ];
  L.snap(`prev = NULL, curr = head. We will turn every arrow around in one pass.`, [1], {}, tags());
  const done: Record<string, Mark> = {};
  while (curr) {
    const nxt: string | null = L.next[curr];
    L.snap(`Save next = ${L.val(nxt)} before we overwrite curr.next.`, [2, 3], { ...done, [curr]: "focus" }, [...tags(), ...(nxt ? [{ name: "next", at: nxt }] : [])]);
    L.next[curr] = prev;
    L.snap(`curr.next = prev: ${L.val(curr)} now points ${prev ? `back at ${L.val(prev)}` : "at NULL"}.`, [4], { ...done, [curr]: "swap" }, tags(), [curr]);
    done[curr] = "done";
    prev = curr;
    curr = nxt;
    L.snap(`Move both pointers one step forward.`, [5, 6], done, tags());
  }
  L.head = prev;
  L.snap(`head = prev: the old tail ${L.val(prev)} is the new head.`, [7], done, tags(), ["head"]);
  L.relayout();
  L.snap(`Redrawn from the new head. Reversed in one pass, O(n), no extra list.`, [], done);
  return code;
}

// --- dispatch ----------------------------------------------------------------

export type ListOp = "traverse" | "search" | "insertBegin" | "insertEnd" | "insertAt" | "deleteBegin" | "deleteEnd" | "reverse";

export const LIST_PARAMS: Record<ListOp, ("index" | "value")[]> = {
  traverse: [],
  search: ["value"],
  insertBegin: ["value"],
  insertEnd: ["value"],
  insertAt: ["index", "value"],
  deleteBegin: [],
  deleteEnd: [],
  reverse: [],
};

export function runList(op: ListOp, values: number[], p: { index?: number; value?: number } = {}): Program<ListFrame> {
  const L = new List(values);
  const value = p.value ?? 0;
  const run: Record<ListOp, () => string[]> = {
    traverse: () => traverse(L),
    search: () => search(L, value),
    insertBegin: () => insertBegin(L, value),
    insertEnd: () => insertEnd(L, value),
    insertAt: () => insertAt(L, p.index ?? 1, value),
    deleteBegin: () => deleteBegin(L),
    deleteEnd: () => deleteEnd(L),
    reverse: () => reverse(L),
  };
  const code = run[op]();
  return { frames: L.frames, code };
}
