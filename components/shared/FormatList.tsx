import Link from "next/link";
import { BookOpen, PanelsTopLeft, Clapperboard, Activity, Check, ChevronRight } from "lucide-react";
import type { Format, Topic } from "@/lib/knowledge";

const ITEMS: { key: Format; label: string; sub: string; path: string; icon: typeof BookOpen }[] = [
  { key: "brief", label: "Brief", sub: "Summary + key points", path: "", icon: BookOpen },
  { key: "comic", label: "Comic", sub: "Panel-by-panel story", path: "/comic", icon: PanelsTopLeft },
  { key: "video", label: "Video", sub: "Pre-rendered lesson", path: "/video", icon: Clapperboard },
  { key: "visualizer", label: "Visualizer", sub: "Step through the algorithm", path: "/visualizer", icon: Activity },
];

export function FormatList({ topic, opened, current }: { topic: Topic; opened: Format[]; current: Format }) {
  return (
    <section className="box overflow-hidden">
      <div className="flex justify-between items-center px-4 py-2.5 border-b-2 border-ink bg-cream">
        <span className="label !text-ink font-bold">Learning modes // 4 formats</span>
        <span className="font-mono text-[10px] text-outline">{opened.length}/4 opened</span>
      </div>
      <ol>
        {ITEMS.map((f, i) => {
          const available = topic.formats.includes(f.key);
          const isCurrent = f.key === current;
          const seen = opened.includes(f.key);
          const inner = (
            <>
              <span
                className={`h-9 w-9 shrink-0 rounded border-2 flex items-center justify-center ${
                  available ? "border-ink bg-card" : "border-outline-soft"
                } ${isCurrent ? "!bg-amber-mid" : ""}`}
              >
                <f.icon size={16} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-head font-bold">{f.label}</span>
                <span className="block font-mono text-[11px] text-outline">{available ? f.sub : "Not built for this topic yet"}</span>
              </span>
              {isCurrent ? (
                <span className="tag !bg-amber-mid">current</span>
              ) : seen ? (
                <Check size={16} className="text-ok" />
              ) : available ? (
                <ChevronRight size={16} />
              ) : (
                <span className="tag !border-outline-soft !text-outline">soon</span>
              )}
            </>
          );
          const cls = `flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-dashed border-outline-soft" : ""}`;
          return (
            <li key={f.key}>
              {available && !isCurrent ? (
                <Link href={`/topics/${topic.id}${f.path}`} className={`${cls} hover:bg-cream transition-colors`}>
                  {inner}
                </Link>
              ) : (
                <div className={`${cls} ${available ? "bg-amber-light/40" : "opacity-50"}`}>{inner}</div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
