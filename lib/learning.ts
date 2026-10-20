// Pure learning helpers: the spaced-review schedule and the learning-map layout.
// No I/O here, so scripts/check-learning.mts can test them directly.

const DAY = 86_400_000;
/** Days until the next review after 0, 1, 2 right answers in a row; after the last, the question retires. */
export const REVIEW_GAPS = [1, 3, 7];

export interface ReviewState {
  box: number;
  due_at: number;
}

/**
 * Leitner-style schedule for one quiz question. A wrong answer (re)starts it, due tomorrow.
 * A right answer once it is due moves it to the next gap; right answers before then change nothing.
 * Returns the new state, or null when the question is not (or no longer) scheduled.
 */
export function nextReview(prev: ReviewState | null, correct: boolean, now: number): ReviewState | null {
  if (!correct) return { box: 0, due_at: now + REVIEW_GAPS[0] * DAY };
  if (!prev || prev.due_at > now) return prev;
  const box = prev.box + 1;
  return box < REVIEW_GAPS.length ? { box, due_at: now + REVIEW_GAPS[box] * DAY } : null;
}

export interface MapTopic {
  id: string;
  index: number;
  related: string[];
}

/**
 * Lay topics out as a left-to-right learning path. A `related` link always points from the
 * lower-numbered topic to the higher one; a topic's column is its longest chain of earlier topics.
 */
export function layoutMap(topics: MapTopic[]) {
  const sorted = [...topics].sort((a, b) => a.index - b.index);
  const byId = new Map(sorted.map((t) => [t.id, t]));
  const keys = new Set<string>();
  const edges: { from: string; to: string }[] = [];
  for (const t of sorted)
    for (const r of t.related) {
      const o = byId.get(r);
      if (!o || o.index === t.index) continue;
      const [from, to] = o.index > t.index ? [t.id, o.id] : [o.id, t.id];
      if (keys.has(`${from}>${to}`)) continue;
      keys.add(`${from}>${to}`);
      edges.push({ from, to });
    }
  const col = new Map<string, number>();
  // Edges only point to higher indexes, so index order is a valid processing order.
  for (const t of sorted) col.set(t.id, Math.max(0, ...edges.filter((e) => e.to === t.id).map((e) => col.get(e.from)! + 1)));
  const cols = Math.max(0, ...col.values()) + 1;
  const nodes = sorted.map((t) => {
    const mates = sorted.filter((o) => col.get(o.id) === col.get(t.id));
    return { id: t.id, col: col.get(t.id)!, row: mates.indexOf(t), rows: mates.length };
  });
  return { nodes, edges, cols };
}
