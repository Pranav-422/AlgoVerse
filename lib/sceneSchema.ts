// What each comic scene accepts. Used to describe scenes to the model when drafting dialogue
// lines, and to validate drafted lines before they are allowed into a bank.

import type { SceneSpec } from "./comic";

export const SCENE_DOCS: Record<SceneSpec["id"], string> = {
  row: `{"id":"row","values":[numbers or null for an empty slot],"hi"?:[indexes],"found"?:[indexes],"fresh"?:[indexes],"grey"?:[[from,to],...],"swap"?:[i,j],"shift"?:{"from":index,"dir":"right"|"left"},"tags"?:{"index":"short label"},"note"?:"short note"} — a row of array boxes`,
  chain: `{"id":"chain","values":[numbers],"head"?:true,"nullEnd"?:true,"hi"?:[indexes],"found"?:[indexes],"fresh"?:[indexes],"reversed"?:k (first k links point left),"tags"?:{"index":"label"},"note"?:"note"} — linked-list nodes`,
  stack: `{"id":"stack","values":[bottom→top numbers or short strings],"top"?:true,"hi"?:[indexes],"incoming"?:value,"outgoing"?:value,"capacity"?:number,"note"?:"note"} — a vertical stack`,
  queue: `{"id":"queue","values":[numbers or null],"front":index,"rear":index,"hi"?:[indexes],"incoming"?:number,"outgoing"?:number,"ring"?:true (circular),"note"?:"note"} — a queue with FRONT/REAR`,
  tree: `{"id":"tree","nodes":[level-order numbers or null],"hi"?:[indexes],"found"?:[indexes],"path"?:[indexes],"order"?:{"index":visitNumber},"note"?:"note"} — a binary tree`,
  formula: `{"id":"formula","base":number,"i":number,"size":number,"solved":boolean} — the address formula card (arrays only)`,
  cinema: `{"id":"cinema","seats":number,"latecomer":seatIndex or null} — a cinema row with people`,
  complexity: `{"id":"complexity","label":"short label","big":"O(...)","vs"?:"short phrase"} — a big complexity badge`,
  messy: `{"id":"messy"} — unsorted vs sorted shelves (arrays only)`,
};

const isNum = (v: unknown) => typeof v === "number" && Number.isFinite(v);
const isIdxList = (v: unknown, n: number) => Array.isArray(v) && v.every((x) => Number.isInteger(x) && x >= 0 && x < n);

/** Structural check of a scene spec. Returns problems (empty = valid). */
export function validateScene(spec: unknown): string[] {
  if (!spec || typeof spec !== "object") return ["scene must be an object"];
  const s = spec as Record<string, unknown>;
  const errs: string[] = [];
  const id = s.id as string;
  if (!(id in SCENE_DOCS)) return [`unknown scene "${id}"`];
  const values = s.values as unknown[] | undefined;
  const n = Array.isArray(values) ? values.length : 0;
  switch (id) {
    case "row":
    case "chain":
      if (!Array.isArray(values) || !values.length || !values.every((v) => isNum(v) || (id === "row" && v === null))) errs.push(`${id}.values must be a non-empty number list`);
      if (n > 9) errs.push(`${id}.values has ${n} items (max 9 fit)`);
      for (const k of ["hi", "found", "fresh"]) if (s[k] !== undefined && !isIdxList(s[k], n)) errs.push(`${id}.${k} has an index out of range`);
      if (s.swap !== undefined && !isIdxList(s.swap, n)) errs.push("row.swap out of range");
      if (s.tags !== undefined && (typeof s.tags !== "object" || Object.keys(s.tags as object).some((k) => !/^\d+$/.test(k) || Number(k) >= n)))
        errs.push(`${id}.tags keys must be indexes 0…${n - 1}`);
      break;
    case "stack":
      if (s.values !== undefined && (!Array.isArray(values) || n > 8)) errs.push("stack.values must be a list of at most 8");
      if (s.capacity !== undefined && (!Number.isInteger(s.capacity) || (s.capacity as number) < n)) errs.push("stack.capacity must be ≥ number of values");
      break;
    case "queue":
      if (!Array.isArray(values) || !n || n > 8) errs.push("queue.values must be a list of 1–8");
      if (!Number.isInteger(s.front) || (s.front as number) >= n || !Number.isInteger(s.rear) || (s.rear as number) >= n) errs.push("queue.front/rear must be valid indexes");
      break;
    case "tree": {
      const nodes = s.nodes as unknown[] | undefined;
      if (!Array.isArray(nodes) || !nodes.length || nodes.length > 15 || !nodes.every((v) => isNum(v) || v === null)) errs.push("tree.nodes must be 1–15 numbers/null in level order");
      const m = nodes?.length ?? 0;
      for (const k of ["hi", "found", "path"]) if (s[k] !== undefined && !isIdxList(s[k], m)) errs.push(`tree.${k} has an index out of range`);
      break;
    }
    case "formula":
      if (![s.base, s.i, s.size].every(isNum) || typeof s.solved !== "boolean") errs.push("formula needs numeric base, i, size and boolean solved");
      break;
    case "cinema":
      if (!Number.isInteger(s.seats) || (s.seats as number) < 2 || (s.seats as number) > 8) errs.push("cinema.seats must be 2–8");
      break;
    case "complexity":
      if (typeof s.label !== "string" || typeof s.big !== "string") errs.push("complexity needs label and big strings");
      break;
  }
  return errs;
}

/**
 * Every number written as digits in a line must appear somewhere in its scene, so the
 * picture and the words agree. Complexity expressions are ignored.
 */
export function numbersMatchScene(text: string, scene: unknown): string[] {
  const nums = text.replace(/O\s*\([^)]*\)/g, " ").match(/(?<![\w.])\d+(?![\w])/g) ?? [];
  const s = (scene ?? {}) as Record<string, unknown>;
  // The formula scene draws the computed address itself.
  const derived = s.id === "formula" && [s.base, s.i, s.size].every((v) => typeof v === "number") ? ` ${(s.base as number) + (s.i as number) * (s.size as number)}` : "";
  const blob = JSON.stringify(scene) + derived;
  return nums.filter((n) => !new RegExp(`(?<![\\d.])${n}(?![\\d])`).test(blob)).map((n) => `number ${n} is not in the scene`);
}
