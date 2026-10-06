import type { ArrayFrame, Cell, Mark, Program, Tag } from "./types";

// AlgoVerse array engine. Each operation records frames as it runs the real algorithm.

let seq = 0;
const cell = (value: number | null): Cell => ({ id: `a${++seq}`, value });
export const makeArray = (values: number[]) => values.map(cell);

class Recorder {
  frames: ArrayFrame[] = [];
  cells: Cell[];
  constructor(cells: Cell[]) {
    this.cells = cells;
  }
  snap(note: string, lines: number[], marks: Record<string, Mark> = {}, tags: Tag[] = []) {
    this.frames.push({ cells: this.cells.map((c) => ({ ...c })), marks, tags, note, lines });
  }
  id(i: number) {
    return this.cells[i].id;
  }
  /** marks helper: index → mark */
  m(entries: [number, Mark][], base: Record<string, Mark> = {}) {
    const out = { ...base };
    for (const [i, mark] of entries) if (this.cells[i]) out[this.cells[i].id] = mark;
    return out;
  }
}

const v = (c: Cell) => c.value as number;

// --- operations --------------------------------------------------------------

function traverse(r: Recorder): string[] {
  const n = r.cells.length;
  r.snap(`Start at index 0. We will visit all ${n} elements once.`, [1]);
  const done: [number, Mark][] = [];
  for (let i = 0; i < n; i++) {
    r.snap(`Visit index ${i}: the value is ${v(r.cells[i])}.`, [1, 2], r.m([...done, [i, "focus"]]), [{ name: "i", at: i }]);
    done.push([i, "done"]);
  }
  r.snap(`Reached the end after ${n} visits. Traversal is O(n).`, [], r.m(done));
  return ["for i = 0 to n-1:", "  visit(a[i])"];
}

function access(r: Recorder, i: number): string[] {
  const n = r.cells.length;
  if (i < 0 || i >= n) {
    r.snap(`Index ${i} is outside 0 … ${n - 1}. Access is refused — no element lives there.`, [1]);
    return ["if i < 0 or i >= n: error", "addr = base + i * size", "return memory[addr]"];
  }
  r.snap(`We want a[${i}]. First check that ${i} is a valid index (0 … ${n - 1}).`, [1]);
  r.snap(`Compute the address: base + ${i} × size. No searching — one multiplication, one addition.`, [2], r.m([[i, "focus"]]), [
    { name: "i", at: i },
  ]);
  r.snap(`Read the value directly: a[${i}] = ${v(r.cells[i])}. Same cost for any index, so access is O(1).`, [3], r.m([[i, "found"]]), [
    { name: "i", at: i },
  ]);
  return ["if i < 0 or i >= n: error", "addr = base + i * size", "return memory[addr]"];
}

function linearSearch(r: Recorder, target: number): string[] {
  const n = r.cells.length;
  r.snap(`Look for ${target} by checking each element from the left.`, [1]);
  const seen: [number, Mark][] = [];
  for (let i = 0; i < n; i++) {
    const hit = v(r.cells[i]) === target;
    r.snap(`Is a[${i}] = ${v(r.cells[i])} equal to ${target}? ${hit ? "Yes." : "No."}`, [1, 2], r.m([...seen, [i, hit ? "found" : "compare"]]), [
      { name: "i", at: i },
    ]);
    if (hit) {
      r.snap(`Found ${target} at index ${i} after ${i + 1} comparison${i ? "s" : ""}.`, [3], r.m([...seen, [i, "found"]]), [{ name: "i", at: i }]);
      return code();
    }
    seen.push([i, "out"]);
  }
  r.snap(`Checked all ${n} elements — ${target} is not in the array. Worst case: n comparisons, O(n).`, [4], r.m(seen));
  return code();
  function code() {
    return ["for i = 0 to n-1:", "  if a[i] == target:", "    return i", "return -1"];
  }
}

function binarySearch(r: Recorder, target: number): string[] {
  const code = [
    "lo = 0, hi = n-1",
    "while lo <= hi:",
    "  mid = (lo + hi) / 2",
    "  if a[mid] == target: return mid",
    "  if a[mid] < target: lo = mid + 1",
    "  else: hi = mid - 1",
    "return -1",
  ];
  const n = r.cells.length;
  let lo = 0;
  let hi = n - 1;
  let looks = 0;
  const outside = (): [number, Mark][] => r.cells.map((_, k) => [k, "out"] as [number, Mark]).filter(([k]) => k < lo || k > hi);
  r.snap(`The array is sorted, so we can search for ${target} by halving. Range: ${lo} … ${hi}.`, [1], {}, [
    { name: "lo", at: lo },
    { name: "hi", at: hi },
  ]);
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    looks++;
    const tags = [
      { name: "lo", at: lo },
      { name: "mid", at: mid },
      { name: "hi", at: hi },
    ];
    r.snap(`Middle of ${lo} … ${hi} is index ${mid}, holding ${v(r.cells[mid])}.`, [2, 3], r.m([...outside(), [mid, "compare"]]), tags);
    if (v(r.cells[mid]) === target) {
      r.snap(`${v(r.cells[mid])} = ${target}. Found at index ${mid} in ${looks} look${looks > 1 ? "s" : ""} — O(log n).`, [4], r.m([...outside(), [mid, "found"]]), tags);
      return code;
    }
    if (v(r.cells[mid]) < target) {
      r.snap(`${v(r.cells[mid])} < ${target}, so everything left of index ${mid + 1} is too small. Discard it.`, [5], r.m([...outside(), [mid, "out"]]), tags);
      lo = mid + 1;
    } else {
      r.snap(`${v(r.cells[mid])} > ${target}, so everything from index ${mid} rightwards is too big. Discard it.`, [6], r.m([...outside(), [mid, "out"]]), tags);
      hi = mid - 1;
    }
  }
  r.snap(`The range is empty: ${target} is not in the array. ${looks} looks for ${n} elements.`, [7], r.m(outside()));
  return code;
}

function insert(r: Recorder, at: number, value: number): string[] {
  const code = ["n = n + 1", "for k = n-1 down to i+1:", "  a[k] = a[k-1]", "a[i] = value"];
  const n = r.cells.length;
  if (at < 0 || at > n) {
    r.snap(`Position ${at} is outside 0 … ${n}. Nothing is inserted.`, []);
    return code;
  }
  const gap = cell(null);
  r.cells.push(gap);
  r.snap(`Insert ${value} at index ${at}. First open one empty slot at the end.`, [1], { [gap.id]: "fresh" });
  let moved = 0;
  for (let k = r.cells.length - 1; k > at; k--) {
    [r.cells[k - 1], r.cells[k]] = [r.cells[k], r.cells[k - 1]];
    moved++;
    r.snap(`Shift ${v(r.cells[k])} from index ${k - 1} to ${k}.`, [2, 3], r.m([[k, "swap"]]), [{ name: "k", at: k }]);
  }
  const placed = cell(value);
  r.cells[at] = placed;
  r.snap(
    `Write ${value} into index ${at}. ${moved} element${moved === 1 ? "" : "s"} had to move — that shifting is why insertion is O(n).`,
    [4],
    { [placed.id]: "fresh" },
    [{ name: "i", at }],
  );
  return code;
}

function remove(r: Recorder, at: number): string[] {
  const code = ["for k = i to n-2:", "  a[k] = a[k+1]", "n = n - 1"];
  const n = r.cells.length;
  if (at < 0 || at >= n) {
    r.snap(`Index ${at} is outside 0 … ${n - 1}. Nothing is deleted.`, []);
    return code;
  }
  r.snap(`Delete a[${at}] = ${v(r.cells[at])}.`, [1], r.m([[at, "gone"]]), [{ name: "i", at }]);
  const gap = cell(null);
  r.cells[at] = gap;
  r.snap(`Its slot is now empty. Everything to the right must shift left to close the gap.`, [1], {}, [{ name: "i", at }]);
  let moved = 0;
  for (let k = at; k < r.cells.length - 1; k++) {
    [r.cells[k], r.cells[k + 1]] = [r.cells[k + 1], r.cells[k]];
    moved++;
    r.snap(`Shift ${v(r.cells[k])} from index ${k + 1} to ${k}.`, [1, 2], r.m([[k, "swap"]]), [{ name: "k", at: k }]);
  }
  r.cells.pop();
  r.snap(`Drop the empty last slot. ${moved} element${moved === 1 ? "" : "s"} moved — deletion is O(n).`, [3]);
  return code;
}

function bubbleSort(r: Recorder): string[] {
  const code = [
    "for pass = 0 to n-2:",
    "  swapped = false",
    "  for j = 0 to n-2-pass:",
    "    if a[j] > a[j+1]:",
    "      swap a[j], a[j+1]; swapped = true",
    "  if not swapped: stop",
  ];
  const n = r.cells.length;
  const settled: [number, Mark][] = [];
  r.snap(`Bubble sort ${n} elements: compare neighbours and swap any pair that is out of order.`, [1]);
  for (let pass = 0; pass < n - 1; pass++) {
    let swapped = false;
    r.snap(`Pass ${pass + 1} begins.`, [1, 2], r.m(settled));
    for (let j = 0; j < n - 1 - pass; j++) {
      const tags = [
        { name: "j", at: j },
        { name: "j+1", at: j + 1 },
      ];
      const a = v(r.cells[j]);
      const b = v(r.cells[j + 1]);
      r.snap(`Compare a[${j}] = ${a} with a[${j + 1}] = ${b}.`, [3, 4], r.m([...settled, [j, "compare"], [j + 1, "compare"]]), tags);
      if (a > b) {
        [r.cells[j], r.cells[j + 1]] = [r.cells[j + 1], r.cells[j]];
        swapped = true;
        r.snap(`${a} > ${b}, so swap them.`, [5], r.m([...settled, [j, "swap"], [j + 1, "swap"]]), tags);
      }
    }
    settled.push([n - 1 - pass, "done"]);
    r.snap(`End of pass ${pass + 1}: ${v(r.cells[n - 1 - pass])} has settled at index ${n - 1 - pass}.`, [3], r.m(settled));
    if (!swapped) {
      r.snap(`No swaps in this pass — the array is already sorted. Stop early.`, [6], r.m(r.cells.map((_, k) => [k, "done"])));
      return code;
    }
  }
  r.snap(`Sorted. Worst case is about n²/2 comparisons — O(n²).`, [], r.m(r.cells.map((_, k) => [k, "done"])));
  return code;
}

function selectionSort(r: Recorder): string[] {
  const code = ["for i = 0 to n-2:", "  min = i", "  for j = i+1 to n-1:", "    if a[j] < a[min]: min = j", "  swap a[i], a[min]"];
  const n = r.cells.length;
  const done: [number, Mark][] = [];
  for (let i = 0; i < n - 1; i++) {
    let min = i;
    r.snap(`Find the smallest element from index ${i} onward. Start with min = ${i} (${v(r.cells[i])}).`, [1, 2], r.m([...done, [i, "focus"]]), [
      { name: "i", at: i },
      { name: "min", at: min },
    ]);
    for (let j = i + 1; j < n; j++) {
      const smaller = v(r.cells[j]) < v(r.cells[min]);
      r.snap(
        `Is ${v(r.cells[j])} smaller than the current min ${v(r.cells[min])}? ${smaller ? "Yes — new min." : "No."}`,
        [3, 4],
        r.m([...done, [min, "focus"], [j, "compare"]]),
        [
          { name: "i", at: i },
          { name: "j", at: j },
          { name: "min", at: min },
        ],
      );
      if (smaller) min = j;
    }
    if (min !== i) [r.cells[i], r.cells[min]] = [r.cells[min], r.cells[i]];
    done.push([i, "done"]);
    r.snap(min !== i ? `Swap the min into index ${i}.` : `a[${i}] is already the smallest — no swap needed.`, [5], r.m(done), [{ name: "i", at: i }]);
  }
  r.snap(`Sorted. Every pass scans the rest of the array — O(n²).`, [], r.m(r.cells.map((_, k) => [k, "done"])));
  return code;
}

function insertionSort(r: Recorder): string[] {
  const code = ["for i = 1 to n-1:", "  j = i", "  while j > 0 and a[j-1] > a[j]:", "    swap a[j-1], a[j]; j = j - 1"];
  const n = r.cells.length;
  const prefix = (upto: number): [number, Mark][] => r.cells.slice(0, upto).map((_, k) => [k, "done"]);
  r.snap(`Index 0 alone is a sorted prefix. Grow it one element at a time.`, [1], r.m(prefix(1)));
  for (let i = 1; i < n; i++) {
    let j = i;
    r.snap(`Take a[${i}] = ${v(r.cells[i])} and slide it left into place.`, [1, 2], r.m([...prefix(i), [i, "focus"]]), [{ name: "i", at: i }]);
    while (j > 0 && v(r.cells[j - 1]) > v(r.cells[j])) {
      r.snap(`${v(r.cells[j - 1])} > ${v(r.cells[j])}: swap them.`, [3, 4], r.m([...prefix(i + 1), [j - 1, "compare"], [j, "swap"]]), [{ name: "j", at: j }]);
      [r.cells[j - 1], r.cells[j]] = [r.cells[j], r.cells[j - 1]];
      j--;
    }
    r.snap(`${v(r.cells[j])} is in place. Sorted prefix is now indices 0 … ${i}.`, [3], r.m(prefix(i + 1)), [{ name: "j", at: j }]);
  }
  r.snap(`Sorted. Worst case (reverse order) shifts every element — O(n²).`, [], r.m(prefix(n)));
  return code;
}

function reverse(r: Recorder): string[] {
  const code = ["l = 0, r = n-1", "while l < r:", "  swap a[l], a[r]", "  l = l + 1; r = r - 1"];
  let l = 0;
  let h = r.cells.length - 1;
  const done: [number, Mark][] = [];
  r.snap(`Two pointers start at both ends.`, [1], {}, [
    { name: "l", at: l },
    { name: "r", at: h },
  ]);
  while (l < h) {
    const tags = [
      { name: "l", at: l },
      { name: "r", at: h },
    ];
    [r.cells[l], r.cells[h]] = [r.cells[h], r.cells[l]];
    r.snap(`Swap a[${l}] and a[${h}].`, [2, 3], r.m([...done, [l, "swap"], [h, "swap"]]), tags);
    done.push([l, "done"], [h, "done"]);
    l++;
    h--;
  }
  r.snap(`The pointers met — reversed in place with O(1) extra space, O(n) time.`, [], r.m(r.cells.map((_, k) => [k, "done"])));
  return code;
}

// --- dispatch ----------------------------------------------------------------

export type ArrayOp =
  | "access"
  | "linearSearch"
  | "binarySearch"
  | "insert"
  | "delete"
  | "bubbleSort"
  | "traverse"
  | "reverse"
  | "selectionSort"
  | "insertionSort";

/** Which inputs each operation asks for (the UI shows only these fields). */
export const ARRAY_PARAMS: Record<ArrayOp, ("index" | "value")[]> = {
  access: ["index"],
  linearSearch: ["value"],
  binarySearch: ["value"],
  insert: ["index", "value"],
  delete: ["index"],
  bubbleSort: [],
  traverse: [],
  reverse: [],
  selectionSort: [],
  insertionSort: [],
};

export function runArray(op: ArrayOp, values: number[], p: { index?: number; value?: number } = {}): Program<ArrayFrame> {
  const r = new Recorder(makeArray(op === "binarySearch" ? [...values].sort((a, b) => a - b) : values));
  const index = p.index ?? 0;
  const value = p.value ?? 0;
  const run: Record<ArrayOp, () => string[]> = {
    access: () => access(r, index),
    linearSearch: () => linearSearch(r, value),
    binarySearch: () => binarySearch(r, value),
    insert: () => insert(r, index, value),
    delete: () => remove(r, index),
    bubbleSort: () => bubbleSort(r),
    traverse: () => traverse(r),
    reverse: () => reverse(r),
    selectionSort: () => selectionSort(r),
    insertionSort: () => insertionSort(r),
  };
  const code = run[op]();
  return { frames: r.frames, code };
}
