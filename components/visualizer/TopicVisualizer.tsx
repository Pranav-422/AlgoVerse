"use client";

import dynamic from "next/dynamic";
import type { OpInfo } from "./VisualizerShell";

// Client-only: frames carry generated ids, so rendering on the server would not match.
const Loading = () => <div className="box p-10 font-mono text-[12px] text-outline">Loading visualizer…</div>;

const VISUALIZERS = {
  arrays: dynamic(() => import("./ArrayVisualizer").then((m) => m.ArrayVisualizer), { ssr: false, loading: Loading }),
  // Sorting reuses the array engine; its knowledge file decides which sorts are offered.
  sorting: dynamic(() => import("./ArrayVisualizer").then((m) => m.ArrayVisualizer), { ssr: false, loading: Loading }),
  "linked-lists": dynamic(() => import("./LinkedListVisualizer").then((m) => m.LinkedListVisualizer), { ssr: false, loading: Loading }),
  "stacks-queues": dynamic(() => import("./StackQueueVisualizer").then((m) => m.StackQueueVisualizer), { ssr: false, loading: Loading }),
} as const;

export function TopicVisualizer({ topicId, ops }: { topicId: string; ops: OpInfo[] }) {
  const V = VISUALIZERS[topicId as keyof typeof VISUALIZERS];
  return V ? <V ops={ops} /> : null;
}
