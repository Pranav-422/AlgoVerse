// AlgoVerse visualizer frame format.
// An engine turns (operation, input) into a list of frames. Frames are plain data:
// the canvas draws one frame, the player walks the list. No timers, no React here.

/** How an element is drawn in a frame. */
export type Mark =
  | "focus" // the element being looked at right now
  | "compare" // one side of a comparison
  | "swap" // moving / being swapped
  | "found" // search hit
  | "done" // finished: sorted, visited, settled
  | "fresh" // just written / inserted
  | "gone" // being removed
  | "out"; // ruled out (e.g. outside the binary-search range)

/** A named marker over a position (i, j, lo, mid, head, curr…). */
export interface Tag {
  name: string;
  /** Array index or node id, depending on the structure. */
  at: number | string;
}

export interface BaseFrame {
  /** One sentence shown under the canvas. */
  note: string;
  /** 1-based pseudocode lines active in this frame. */
  lines: number[];
}

export interface Program<F extends BaseFrame> {
  frames: F[];
  /** Pseudocode for this operation, one entry per line. */
  code: string[];
}

// --- Array ---------------------------------------------------------------------

export interface Cell {
  id: string;
  /** null = an empty slot (the gap that opens during insert/delete shifts). */
  value: number | null;
}

export interface ArrayFrame extends BaseFrame {
  cells: Cell[];
  marks: Record<string, Mark>;
  tags: Tag[];
}

// --- Linked list ---------------------------------------------------------------

export interface ListNode {
  id: string;
  value: number;
  /** Display address, e.g. "0x1C". */
  addr: string;
}

export interface ListFrame extends BaseFrame {
  /** Nodes in left-to-right display order. */
  nodes: ListNode[];
  /** node id → id of the node its next pointer refers to (null = NULL). */
  next: Record<string, string | null>;
  head: string | null;
  /** Nodes drawn lifted above the row (just created, or just unlinked). */
  lifted: string[];
  marks: Record<string, Mark>;
  /** Pointer variables (curr, prev…) — `at` is a node id. */
  tags: Tag[];
  /** Pointers that changed this frame: node ids, or "head". */
  changed: string[];
}

// --- Stack ---------------------------------------------------------------------

export interface StackFrame extends BaseFrame {
  /** Bottom → top. */
  items: Cell[];
  capacity: number;
  /** An item drawn beside the stack (on its way in, or just popped). */
  aside: Cell | null;
  marks: Record<string, Mark>;
  /** Balanced-parentheses input, with the character being read. */
  input?: { text: string; at: number; result?: "ok" | "fail" };
  alert?: { text: string; tone: "ok" | "error" };
}

// --- Queue ---------------------------------------------------------------------

export interface QueueFrame extends BaseFrame {
  slots: (Cell | null)[];
  front: number;
  rear: number;
  count: number;
  circular: boolean;
  marks: Record<string, Mark>;
  /** Which of front / rear moved in this frame. */
  moved: ("front" | "rear")[];
  alert?: { text: string; tone: "ok" | "error" };
}
