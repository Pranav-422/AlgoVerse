import Link from "next/link";
import { FlaskConical } from "lucide-react";
import type { StudyArm } from "@/lib/learning";

/** The matching VisuAlgo module for each topic. */
const VISUALGO: Record<string, string> = {
  arrays: "https://visualgo.net/en/array",
  sorting: "https://visualgo.net/en/sorting",
  "linked-lists": "https://visualgo.net/en/list",
  "stacks-queues": "https://visualgo.net/en/list",
  trees: "https://visualgo.net/en/bst",
  graphs: "https://visualgo.net/en/dfsbfs",
  recursion: "https://visualgo.net/en/recursion",
};

/** Tells a study member what to study for this topic, and when the other formats open. */
export function StudyBanner({ arm, topicId, done }: { arm: StudyArm; topicId: string; done: boolean }) {
  const steps =
    arm === "text"
      ? "Take the before check, read this brief, then take the after check."
      : arm === "visualgo"
        ? "Take the before check, study this topic on VisuAlgo, then come back for the after check."
        : "Take the before check, use the comic, video and visualizer, then take the after check.";
  return (
    <section className="box p-5 !bg-violet-light space-y-2">
      <span className="tag !bg-ink !text-white flex items-center gap-1.5 w-fit">
        <FlaskConical size={12} /> Study group: {arm === "text" ? "text only" : arm === "visualgo" ? "VisuAlgo" : "AlgoVerse"}
      </span>
      <p className="text-[14px]">{done ? "Your after score for this topic is saved. Every format is open now." : steps}</p>
      {!done && (
        <p className="font-mono text-[11px] text-muted">
          The comic, video and visualizer open after your {arm === "algoverse" ? "before" : "after"} check.
        </p>
      )}
      <div className="flex flex-wrap gap-3 font-mono text-[12px]">
        {!done && arm === "visualgo" && VISUALGO[topicId] && (
          <a href={VISUALGO[topicId]} target="_blank" rel="noreferrer" className="btn btn-amber !py-1.5">
            Open VisuAlgo
          </a>
        )}
        <Link href="/study" className="underline self-center">
          About the study
        </Link>
      </div>
    </section>
  );
}
