// Sanity checks for the spaced-review schedule and the learning-map layout. Run: node scripts/check-learning.mts
import { nextReview, layoutMap, REVIEW_GAPS } from "../lib/learning.ts";

let failures = 0;
const check = (cond: boolean, msg: string) => {
  if (!cond) {
    failures++;
    console.log("FAIL", msg);
  }
};

const DAY = 86_400_000;
const t0 = 1_000 * DAY;

// --- review schedule ---
check(nextReview(null, true, t0) === null, "a first right answer schedules nothing");
const missed = nextReview(null, false, t0)!;
check(missed.box === 0 && missed.due_at === t0 + DAY, "a wrong answer is due tomorrow");
check(nextReview(missed, true, t0 + 60_000) === missed, "a right answer before it is due changes nothing");
let s = missed;
let now = t0;
for (let box = 1; box < REVIEW_GAPS.length; box++) {
  now = s.due_at;
  s = nextReview(s, true, now)!;
  check(s.box === box && s.due_at === now + REVIEW_GAPS[box] * DAY, `right when due moves to box ${box}`);
}
check(nextReview(s, true, s.due_at) === null, "right on the last box retires the question");
check(nextReview(s, false, s.due_at)!.box === 0, "wrong at any box starts over");

// --- learning map ---
const map = layoutMap([
  { id: "c", index: 3, related: ["a", "b"] },
  { id: "a", index: 1, related: ["b", "c", "x"] },
  { id: "b", index: 2, related: ["a"] },
  { id: "d", index: 4, related: [] },
]);
const node = (id: string) => map.nodes.find((n) => n.id === id)!;
check(map.edges.length === 3, `edges are deduplicated (${map.edges.length})`);
check(map.edges.every((e) => e.from < e.to), "edges point to the higher-numbered topic");
check(node("a").col === 0 && node("b").col === 1 && node("c").col === 2, "column = longest chain of earlier topics");
check(node("d").col === 0 && node("d").row === 1 && node("d").rows === 2, "unlinked topics sit in column 0, below");
check(map.cols === 3, "column count");

console.log(failures ? `${failures} problem(s)` : "learning helpers OK");
process.exit(failures ? 1 : 0);
