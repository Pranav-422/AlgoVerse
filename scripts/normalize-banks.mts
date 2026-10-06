// Tidy dialogue banks after drafting. Run: npm run normalize:banks
//  1. Beats: lines sharing a beat are alternatives only when they sit next to each other.
//     A repeated beat further down the arc is a separate story step, so it gets its own
//     beat name (find-minimum → find-minimum-2) instead of blocking the step.
//  2. Scene tags whose keys are not valid indexes are dropped (they would draw nothing).
import fs from "node:fs";
import path from "node:path";
import type { DialogueBank } from "../lib/comic.ts";

const DIR = path.join("content", "comic-kit", "lines");
for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith(".json"))) {
  const file = path.join(DIR, f);
  const bank = JSON.parse(fs.readFileSync(file, "utf8")) as DialogueBank;
  let renamed = 0;
  let tagsFixed = 0;
  for (const arc of bank.arcs) {
    const seen = new Map<string, number>(); // beat → times a new run of it started
    let prevBeat: string | undefined;
    for (const l of arc.lines) {
      if (l.role === "step" && l.beat) {
        const base = l.beat;
        if (base !== prevBeat) {
          const k = (seen.get(base) ?? 0) + 1;
          seen.set(base, k);
          if (k > 1) {
            l.beat = `${base}-${k}`;
            renamed++;
          }
        } else {
          const k = seen.get(base) ?? 1;
          if (k > 1) l.beat = `${base}-${k}`;
        }
        prevBeat = base;
      } else {
        prevBeat = undefined;
      }
      const sc = l.scene as Record<string, unknown>;
      const n = Array.isArray(sc.values) ? sc.values.length : Array.isArray(sc.nodes) ? (sc.nodes as unknown[]).length : 0;
      if (sc.tags && typeof sc.tags === "object" && (sc.id === "row" || sc.id === "chain")) {
        const t = sc.tags as Record<string, string>;
        for (const key of Object.keys(t))
          if (!/^\d+$/.test(key) || Number(key) >= n) {
            delete t[key];
            tagsFixed++;
          }
        if (!Object.keys(t).length) delete sc.tags;
      }
    }
  }
  fs.writeFileSync(file, JSON.stringify(bank, null, 2) + "\n");
  console.log(`${f}: ${renamed} beat(s) split into separate steps, ${tagsFixed} invalid tag(s) dropped`);
}
