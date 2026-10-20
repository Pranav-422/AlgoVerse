import { ask, type Ask, type Mark, type Program, type RecursionFrame } from "./types";

export type RecursionOp = "factorial" | "fibonacci" | "sumArray" | "power" | "binarySearchRec" | "hanoi" | "isPalindrome";

export const RECURSION_PARAMS: Record<RecursionOp, ("n" | "value" | "values" | "text")[]> = {
  factorial: ["n"],
  fibonacci: ["n"],
  sumArray: ["values"],
  power: ["value", "n"],
  binarySearchRec: ["values", "value"],
  hanoi: ["n"],
  isPalindrome: ["text"],
};

class RecursionRecorder {
  frames: RecursionFrame[] = [];
  stack: { call: string; local?: string }[] = [];
  result: string | null = null;
  output: string[] = [];
  private pending?: Ask;

  askNext(a: Ask | undefined) {
    this.pending = a;
  }

  snap(note: string, lines: number[], marks: Record<string, Mark> = {}) {
    this.frames.push({
      stack: this.stack.map((s) => ({ ...s })),
      result: this.result,
      output: [...this.output],
      marks,
      note,
      lines,
      ...(this.pending && { ask: this.pending }),
    });
    this.pending = undefined;
  }
}

function runFact(r: RecursionRecorder, rawN: number): string[] {
  const code = [
    "function fact(n):",
    "  if n <= 1: return 1",
    "  sub = fact(n - 1)",
    "  return n * sub",
  ];

  const n = Math.min(6, Math.max(0, rawN));
  r.snap(`Compute factorial(${n}) using recursion.`, [1]);

  let asked = false;

  function fact(k: number): number {
    r.stack.push({ call: `fact(${k})`, local: `n = ${k}` });
    r.snap(`Call fact(${k}): push activation frame onto the call stack.`, [1], { [`f${k}`]: "focus" });

    if (k <= 1) {
      r.snap(`Base case reached: fact(${k}) returns 1 immediately.`, [2], { [`f${k}`]: "found" });
      const top = r.stack[r.stack.length - 1];
      if (top) top.local = `returns 1`;
      return 1;
    }

    const sub = fact(k - 1);

    if (!asked && k === 2) {
      r.askNext(ask("What does fact(2) return?", 2, [1, 4]));
      asked = true;
    }

    const ans = k * sub;
    const currentFrame = r.stack[r.stack.length - 1];
    if (currentFrame) currentFrame.local = `${k} * ${sub} = ${ans}`;

    r.snap(`fact(${k}) multiplies ${k} × fact(${k - 1}) = ${ans}.`, [3, 4], { [`f${k}`]: "done" });
    r.stack.pop();
    return ans;
  }

  const finalAns = fact(n);
  r.result = String(finalAns);
  r.snap(`factorial(${n}) = ${finalAns}. Recursion complete.`, [4], { res: "done" });
  return code;
}

function runFib(r: RecursionRecorder, rawN: number): string[] {
  const code = [
    "function fib(n):",
    "  if n <= 0: return 0",
    "  if n == 1: return 1",
    "  return fib(n - 1) + fib(n - 2)",
  ];

  const n = Math.min(6, Math.max(0, rawN));
  r.snap(`Compute fibonacci(${n}) using recursion.`, [1]);

  let asked = false;

  function fib(k: number): number {
    r.stack.push({ call: `fib(${k})`, local: `n = ${k}` });
    r.snap(`Call fib(${k}): push frame.`, [1], { [`f${k}`]: "focus" });

    if (k <= 0) {
      r.snap(`Base case: fib(0) returns 0.`, [2], { [`f${k}`]: "found" });
      r.stack.pop();
      return 0;
    }
    if (k === 1) {
      r.snap(`Base case: fib(1) returns 1.`, [3], { [`f${k}`]: "found" });
      r.stack.pop();
      return 1;
    }

    if (!asked && k === 2) {
      r.askNext(ask("What does fib(2) return?", 1, [0, 2]));
      asked = true;
    }

    const a = fib(k - 1);
    const b = fib(k - 2);
    const ans = a + b;

    const currentFrame = r.stack[r.stack.length - 1];
    if (currentFrame) currentFrame.local = `return ${ans}`;
    r.snap(`fib(${k}) returns fib(${k - 1}) + fib(${k - 2}) = ${ans}.`, [4], { [`f${k}`]: "done" });
    r.stack.pop();
    return ans;
  }

  const finalAns = fib(n);
  r.result = String(finalAns);
  r.snap(`fibonacci(${n}) = ${finalAns}.`, [4], { res: "done" });
  return code;
}

function runPower(r: RecursionRecorder, rawVal: number, rawN: number): string[] {
  const code = [
    "function power(base, exp):",
    "  if exp == 0: return 1",
    "  sub = power(base, exp - 1)",
    "  return base * sub",
  ];

  const base = rawVal || 2;
  const exp = Math.min(6, Math.max(0, rawN));

  r.snap(`Compute ${base}^${exp} recursively.`, [1]);

  let asked = false;

  function pow(e: number): number {
    r.stack.push({ call: `power(${base}, ${e})`, local: `exp = ${e}` });
    r.snap(`Call power(${base}, ${e}).`, [1], { [`p${e}`]: "focus" });

    if (e === 0) {
      if (!asked) {
        r.askNext(ask(`Is exp == 0 the base case for power?`, "Yes (returns 1)", ["No (calls power again)"]));
        asked = true;
      }
      r.snap(`Base case: ${base}^0 = 1.`, [2], { [`p${e}`]: "found" });
      r.stack.pop();
      return 1;
    }

    const sub = pow(e - 1);
    const ans = base * sub;

    r.snap(`power(${base}, ${e}) computes ${base} × ${sub} = ${ans}.`, [3, 4], { [`p${e}`]: "done" });
    r.stack.pop();
    return ans;
  }

  const finalAns = pow(exp);
  r.result = String(finalAns);
  r.snap(`${base}^${exp} = ${finalAns}.`, [4], { res: "done" });
  return code;
}

function runSumArray(r: RecursionRecorder, rawVals: number[]): string[] {
  const code = [
    "function sumArray(arr, idx):",
    "  if idx == arr.length: return 0",
    "  return arr[idx] + sumArray(arr, idx + 1)",
  ];

  const vals = rawVals.length > 0 ? rawVals.slice(0, 6) : [1, 2, 3, 4];
  r.snap(`Compute sum of [${vals.join(", ")}] recursively.`, [1]);

  function sumAt(idx: number): number {
    r.stack.push({ call: `sum(idx=${idx})`, local: idx < vals.length ? `val=${vals[idx]}` : "end" });
    r.snap(`Call sum(idx=${idx}).`, [1]);

    if (idx === vals.length) {
      r.snap(`Base case: reached end of array. Return 0.`, [2]);
      r.stack.pop();
      return 0;
    }

    const sub = sumAt(idx + 1);
    const ans = vals[idx] + sub;
    r.snap(`Index ${idx} adds ${vals[idx]} + ${sub} = ${ans}.`, [3]);
    r.stack.pop();
    return ans;
  }

  const finalAns = sumAt(0);
  r.result = String(finalAns);
  r.snap(`Array sum = ${finalAns}.`, [3]);
  return code;
}

function runBinarySearchRec(r: RecursionRecorder, rawVals: number[], rawTarget: number): string[] {
  const code = [
    "function bsearch(arr, target, lo, hi):",
    "  if lo > hi: return -1",
    "  mid = (lo + hi) / 2",
    "  if arr[mid] == target: return mid",
    "  if target < arr[mid]: return bsearch(arr, target, lo, mid - 1)",
    "  return bsearch(arr, target, mid + 1, hi)",
  ];

  const vals = (rawVals.length > 0 ? rawVals : [1, 3, 5, 7, 9]).slice(0, 8).sort((a, b) => a - b);
  const target = rawTarget ?? 7;

  r.snap(`Search for target ${target} in [${vals.join(", ")}] recursively.`, [1]);

  function bsearch(lo: number, hi: number): number {
    r.stack.push({ call: `bsearch(${lo}, ${hi})`, local: `lo=${lo}, hi=${hi}` });
    r.snap(`Call bsearch(lo=${lo}, hi=${hi}).`, [1]);

    if (lo > hi) {
      r.snap(`lo > hi (${lo} > ${hi}): target ${target} is not in array. Return -1.`, [2]);
      r.stack.pop();
      return -1;
    }

    const mid = Math.floor((lo + hi) / 2);
    r.snap(`Compute mid index: (${lo} + ${hi}) / 2 = ${mid} (value = ${vals[mid]}).`, [3]);

    if (vals[mid] === target) {
      r.snap(`Found target ${target} at index ${mid}!`, [4], { [String(mid)]: "found" });
      r.stack.pop();
      return mid;
    }

    if (target < vals[mid]) {
      r.snap(`${target} < ${vals[mid]}: search left subarray (lo=${lo}, hi=${mid - 1}).`, [5]);
      const res = bsearch(lo, mid - 1);
      r.stack.pop();
      return res;
    }

    r.snap(`${target} > ${vals[mid]}: search right subarray (lo=${mid + 1}, hi=${hi}).`, [6]);
    const res = bsearch(mid + 1, hi);
    r.stack.pop();
    return res;
  }

  const foundIdx = bsearch(0, vals.length - 1);
  r.result = String(foundIdx);
  r.snap(`Binary search complete. Result index: ${foundIdx}.`, [4]);
  return code;
}

function runHanoi(r: RecursionRecorder, rawN: number): string[] {
  const code = [
    "function hanoi(n, from, to, aux):",
    "  if n == 1: move(from, to); return",
    "  hanoi(n - 1, from, aux, to)",
    "  move(from, to)",
    "  hanoi(n - 1, aux, to, from)",
  ];

  const n = Math.min(4, Math.max(1, rawN));
  r.snap(`Solve Tower of Hanoi for ${n} disks from peg A to peg C.`, [1]);

  function hanoi(disks: number, from: string, to: string, aux: string) {
    r.stack.push({ call: `hanoi(${disks}, ${from}→${to})` });
    r.snap(`Call hanoi(${disks}, ${from}, ${to}, ${aux}).`, [1]);

    if (disks === 1) {
      const move = `${from}→${to}`;
      r.output.push(move);
      r.snap(`Base case: move single disk ${move}.`, [2]);
      r.stack.pop();
      return;
    }

    hanoi(disks - 1, from, aux, to);

    const move = `${from}→${to}`;
    r.output.push(move);
    r.snap(`Move disk from peg ${from} to ${to}: ${move}.`, [4]);

    hanoi(disks - 1, aux, to, from);
    r.stack.pop();
  }

  hanoi(n, "A", "C", "B");
  r.result = `${r.output.length} moves`;
  r.snap(`Tower of Hanoi complete in ${r.output.length} moves.`, [5]);
  return code;
}

function runIsPalindrome(r: RecursionRecorder, rawText: string): string[] {
  const code = [
    "function isPal(s, lo, hi):",
    "  if lo >= hi: return true",
    "  if s[lo] != s[hi]: return false",
    "  return isPal(s, lo + 1, hi - 1)",
  ];

  const s = rawText ?? "racecar";
  r.snap(`Check whether "${s}" is a palindrome recursively.`, [1]);

  function isPal(lo: number, hi: number): boolean {
    r.stack.push({ call: `isPal(${lo}, ${hi})`, local: `s[${lo}]='${s[lo]}', s[${hi}]='${s[hi]}'` });
    r.snap(`Compare s[${lo}] = '${s[lo]}' and s[${hi}] = '${s[hi]}'.`, [1]);

    if (lo >= hi) {
      r.snap(`Base case (lo >= hi): all characters matched. Return true.`, [2]);
      r.stack.pop();
      return true;
    }

    if (s[lo] !== s[hi]) {
      r.snap(`Mismatch: s[${lo}] ('${s[lo]}') != s[${hi}] ('${s[hi]}'). Return false.`, [3]);
      r.stack.pop();
      return false;
    }

    const sub = isPal(lo + 1, hi - 1);
    r.stack.pop();
    return sub;
  }

  const boolAns = isPal(0, s.length - 1);
  r.result = String(boolAns);
  r.snap(`Result: "${s}" is ${boolAns ? "" : "not "}a palindrome.`, [boolAns ? 2 : 3]);
  return code;
}

export function runRecursion(
  op: RecursionOp,
  p: { n?: number; value?: number; values?: number[]; text?: string } = {}
): Program<RecursionFrame> {
  const r = new RecursionRecorder();
  const n = p.n ?? 5;
  const value = p.value ?? 2;
  const values = p.values ?? [1, 2, 3, 4];
  const text = p.text ?? "racecar";

  const run: Record<RecursionOp, () => string[]> = {
    factorial: () => runFact(r, n),
    fibonacci: () => runFib(r, n),
    sumArray: () => runSumArray(r, values),
    power: () => runPower(r, value, n),
    binarySearchRec: () => runBinarySearchRec(r, values, value),
    hanoi: () => runHanoi(r, n),
    isPalindrome: () => runIsPalindrome(r, text),
  };

  const code = run[op]();
  return { frames: r.frames, code };
}
