import { getTopic } from "@/lib/knowledge";
import { notFound } from "next/navigation";
import { VideoStage, type Chapter } from "./VideoStage";

// Render source for the pre-rendered Arrays video (scripts/render-video.mjs records it).
// Every fact shown comes from content/knowledge/arrays.md; every animation frame comes from
// our own array engine. The page is deterministic: window.__seek(t) draws the frame at t seconds.

export const metadata = { title: "Arrays video render — AlgoVerse" };

export default function ArraysVideoRender() {
  const topic = getTopic("arrays");
  if (!topic) notFound();
  const fact = (snippet: string) => topic.coreFacts.find((f) => f.includes(snippet)) ?? "";

  const chapters: Chapter[] = [
    {
      start: 0,
      end: 45,
      title: "Boxes side by side: contiguous memory",
      facts: [fact("contiguous memory"), fact("Indexing starts at 0")],
      op: { id: "traverse", values: [12, 40, 7, 33, 25, 18] },
    },
    {
      start: 45,
      end: 110,
      title: "The address formula: base + i × size",
      facts: [fact("base_address + i × element_size"), fact("Access by index is O(1)")],
      op: { id: "access", values: [12, 40, 7, 33, 25, 18], index: 4 },
    },
    {
      start: 110,
      end: 170,
      title: "Why inserting in the middle costs O(n)",
      facts: [fact("Insertion in the middle is O(n)"), fact("shifted starting from the end")],
      op: { id: "insert", values: [3, 8, 5, 9, 1], index: 2, value: 4 },
    },
    {
      start: 170,
      end: 235,
      title: "Binary search on a sorted array",
      facts: [fact("Binary search requires a sorted array")],
      op: { id: "binarySearch", values: [8, 15, 23, 31, 42, 54, 67, 80], value: 54 },
    },
    {
      start: 235,
      end: 280,
      title: "Summary and complexity table",
      facts: topic.keyPoints,
      op: null,
    },
  ];

  return <VideoStage title="Arrays: why index access is instant" chapters={chapters} />;
}
