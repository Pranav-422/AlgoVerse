import Link from "next/link";
import { Lock } from "lucide-react";
import type { Format, Topic } from "@/lib/knowledge";
import { pad2 } from "@/lib/knowledge";

const FORMAT_TAGS: { key: Format; label: string }[] = [
  { key: "brief", label: "Brief" },
  { key: "comic", label: "Comic" },
  { key: "video", label: "Video" },
  { key: "visualizer", label: "Visual" },
];

export function TopicCard({
  topic,
  opened,
  mastery,
}: {
  topic: Topic;
  opened: Format[];
  /** Quiz results for this topic: arcs answered / answered correctly / arcs available. */
  mastery?: { answered: number; correct: number; total: number };
}) {
  const soon = topic.status === "soon";
  const done = opened.length;
  const pct = (done / 4) * 100;

  const statusTag = soon ? (
    <span className="tag">soon</span>
  ) : done > 0 ? (
    <span className="tag !bg-amber-mid">● in progress</span>
  ) : (
    <span className="tag !bg-violet-light">ready</span>
  );

  const body = (
    <>
      <div className="flex items-start justify-between">
        <span className="font-head font-extrabold text-2xl text-ink">{pad2(topic.index)}</span>
        {statusTag}
      </div>
      <h3 className="font-head font-extrabold text-xl uppercase tracking-wide mt-3">{topic.name}</h3>
      <p className="text-[12px] text-muted mt-1.5 leading-relaxed min-h-[36px]">{topic.oneLine}</p>
      <div className="flex flex-wrap gap-1.5 mt-4">
        {FORMAT_TAGS.map((f) => {
          const available = topic.formats.includes(f.key);
          const seen = opened.includes(f.key);
          return (
            <span
              key={f.key}
              className={`tag ${seen ? "!bg-amber-light" : ""} ${available ? "" : "!border-outline-soft !text-outline-soft line-through"}`}
              title={available ? (seen ? "Opened" : "Not opened yet") : "Not built for this topic"}
            >
              {f.label}
            </span>
          );
        })}
      </div>
      <div className="mt-5">
        <div className="flex justify-between font-mono text-[10px] text-outline uppercase tracking-wider mb-1.5">
          <span>{soon ? "Pipeline staged" : "Formats opened"}</span>
          <span>{soon ? <Lock size={11} /> : `${done}/4`}</span>
        </div>
        <div className="h-2.5 border-2 border-ink rounded-sm bg-card overflow-hidden">
          <div className="h-full bg-amber" style={{ width: `${pct}%` }} />
        </div>
        {mastery && mastery.total > 0 && (
          <div className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider">
            <span className="text-outline">Quiz mastery</span>
            <span className="flex items-center gap-1">
              {Array.from({ length: mastery.total }, (_, i) => (
                <span
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full border border-ink ${i < mastery.correct ? "bg-ok" : i < mastery.answered ? "bg-err" : "bg-card"}`}
                />
              ))}
              <span className="ml-1 text-ink font-bold">
                {mastery.correct}/{mastery.total}
              </span>
            </span>
          </div>
        )}
      </div>
    </>
  );

  if (soon) {
    return (
      <div aria-disabled className="box p-5 opacity-45 !shadow-none cursor-not-allowed select-none">
        {body}
      </div>
    );
  }
  return (
    <Link href={`/topics/${topic.id}`} className="box p-5 block hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-comic-lg transition-all">
      {body}
    </Link>
  );
}
