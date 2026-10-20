import Link from "next/link";
import type { Format, Topic } from "@/lib/knowledge";
import { pad2 } from "@/lib/knowledge";
import { layoutMap } from "@/lib/learning";

// The curriculum as a path: topics are nodes, `related` links are edges pointing to the
// later topic. Edges out of a topic the learner has started glow, with dots flowing along them.

type Mastery = { correct: number; total: number };
type State = "understood" | "started" | "new" | "soon";

interface Props {
  topics: Topic[];
  progress: Record<string, Format[]>;
  masteryFor: (id: string) => Mastery;
  nextId?: string;
  nextUp: { label: string; detail?: string; href?: string }[];
}

const W = 1000;
const H = 300;
const NODE_W = 150;

const STATE_STYLE: Record<State, { border: string; text: string }> = {
  understood: { border: "border-[#5FBF85]", text: "text-[#8FDCAA]" },
  started: { border: "border-amber-mid", text: "text-amber-mid" },
  new: { border: "border-[#4A4858]", text: "text-[#9D9AAE]" },
  soon: { border: "border-dashed border-[#3A3846]", text: "text-[#6E6B7E]" },
};

export function LearningMap({ topics, progress, masteryFor, nextId, nextUp }: Props) {
  const { nodes, edges, cols } = layoutMap(topics);
  const byId = new Map(topics.map((t) => [t.id, t]));
  const pos = new Map(
    nodes.map((n) => [n.id, { x: cols > 1 ? NODE_W / 2 + 15 + (n.col * (W - NODE_W - 30)) / (cols - 1) : W / 2, y: (H * (n.row + 1)) / (n.rows + 1) }]),
  );
  const state = (t: Topic): State => {
    if (t.status === "soon") return "soon";
    const m = masteryFor(t.id);
    if (m.total > 0 && m.correct === m.total) return "understood";
    return (progress[t.id]?.length ?? 0) > 0 ? "started" : "new";
  };
  const statusText = (t: Topic, s: State) => {
    const opened = progress[t.id]?.filter((f) => t.formats.includes(f)).length ?? 0;
    if (s === "understood") return "✓ understood";
    if (s === "soon") return "soon";
    return opened ? `${opened}/${t.formats.length} formats` : "not started";
  };
  const withQuiz = topics.filter((t) => masteryFor(t.id).total > 0);

  return (
    <section className="rounded-[4px] border-2 border-ink bg-ink text-[#EDEBF5] shadow-comic p-5 sm:p-6 space-y-5" aria-label="Learning map">
      <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-wider">
        <span className="font-bold text-amber-mid">{"//"} Learning map</span>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[#9D9AAE]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm border-2 border-[#5FBF85]" /> understood
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm border-2 border-amber-mid" /> in progress
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm border-2 border-[#4A4858]" /> not started
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-[2px] bg-amber-mid shadow-[0_0_6px_#FFBA38]" /> where you have been
          </span>
        </div>
      </div>

      <div className="overflow-x-auto -mx-1 px-1">
        <div className="relative min-w-[760px] aspect-[10/3]">
          <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" aria-hidden>
            <defs>
              {/* userSpaceOnUse: a horizontal line has a zero-height box and would vanish otherwise */}
              <filter id="map-glow" filterUnits="userSpaceOnUse" x="0" y="0" width={W} height={H}>
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            {edges.map((e, i) => {
              const a = pos.get(e.from)!;
              const b = pos.get(e.to)!;
              const x1 = a.x + NODE_W / 2;
              const x2 = b.x - NODE_W / 2;
              const dx = (x2 - x1) / 2;
              const d = `M ${x1} ${a.y} C ${x1 + dx} ${a.y}, ${x2 - dx} ${b.y}, ${x2} ${b.y}`;
              const lit = ["started", "understood"].includes(state(byId.get(e.from)!));
              return lit ? (
                <g key={d}>
                  <path d={d} fill="none" stroke="#FFBA38" strokeWidth="2" filter="url(#map-glow)" />
                  {[0, 1].map((k) => (
                    <circle key={k} r="3" fill="#FFDEAC" className="motion-reduce:hidden">
                      <animateMotion dur="2.6s" begin={`${k * 1.3 + i * 0.2}s`} repeatCount="indefinite" path={d} />
                    </circle>
                  ))}
                </g>
              ) : (
                <path key={d} d={d} fill="none" stroke="#3A3846" strokeWidth="1.5" strokeDasharray="4 5" />
              );
            })}
          </svg>

          {nodes.map((n) => {
            const t = byId.get(n.id)!;
            const s = state(t);
            const p = pos.get(n.id)!;
            const opened = progress[t.id]?.filter((f) => t.formats.includes(f)).length ?? 0;
            const style = STATE_STYLE[s];
            const body = (
              <>
                <span className="flex items-center justify-between font-mono text-[10px] text-[#9D9AAE]">
                  {pad2(t.index)}
                  {t.id === nextId && <span className="text-amber-mid font-bold">next ▸</span>}
                </span>
                <span className="block font-mono text-[12px] font-bold text-white truncate">{t.name}</span>
                <span className={`block font-mono text-[10px] ${style.text}`}>{statusText(t, s)}</span>
                <span className="block h-1 mt-1.5 bg-[#3A3846]">
                  <span className="block h-full bg-amber-mid" style={{ width: `${(opened / Math.max(1, t.formats.length)) * 100}%` }} />
                </span>
              </>
            );
            const cls = `absolute -translate-x-1/2 -translate-y-1/2 rounded-[4px] border-2 bg-[#232230] px-2.5 py-2 ${style.border} ${
              t.id === nextId ? "ring-2 ring-amber-mid/60 ring-offset-2 ring-offset-ink" : ""
            }`;
            const at = { left: `${(p.x / W) * 100}%`, top: `${(p.y / H) * 100}%`, width: `${(NODE_W / W) * 100}%` };
            return s === "soon" ? (
              <div key={n.id} className={`${cls} opacity-60`} style={at} aria-label={`${t.name}: soon`}>
                {body}
              </div>
            ) : (
              <Link key={n.id} href={`/topics/${t.id}`} className={`${cls} hover:bg-[#2C2B3B] transition-colors`} style={at} aria-label={`${t.name}: ${statusText(t, s)}`}>
                {body}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-[4px] border border-[#3A3846] p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#9D9AAE] mb-3">
            {"//"} Mastery <span className="float-right">check-yourself answers</span>
          </p>
          <ul className="space-y-2.5">
            {withQuiz.map((t) => {
              const m = masteryFor(t.id);
              return (
                <li key={t.id} className="font-mono text-[11px]">
                  <span className="flex justify-between">
                    <span>{t.name}</span>
                    <span className="text-[#9D9AAE]">
                      {m.correct}/{m.total}
                    </span>
                  </span>
                  <span className="block h-1.5 mt-1 bg-[#3A3846] rounded-sm overflow-hidden">
                    <span className={`block h-full ${m.correct === m.total ? "bg-[#5FBF85]" : "bg-amber-mid"}`} style={{ width: `${(m.correct / m.total) * 100}%` }} />
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="rounded-[4px] border border-[#3A3846] p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[#9D9AAE] mb-3">{"//"} Next up</p>
          {nextUp.length ? (
            <ol className="space-y-2">
              {nextUp.map((item, i) => {
                const row = (
                  <>
                    <span
                      className={`w-6 h-6 shrink-0 rounded-[3px] border flex items-center justify-center text-[11px] ${
                        i === 0 ? "border-amber-mid bg-amber-mid text-ink font-bold" : "border-[#4A4858] text-[#9D9AAE]"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className={i === 0 ? "text-white font-bold" : "text-[#C9C6D6]"}>
                      {item.label}
                      {item.detail && <span className="block text-[10px] font-normal text-[#9D9AAE]">{item.detail}</span>}
                    </span>
                  </>
                );
                return (
                  <li key={item.label} className="font-mono text-[12px]">
                    {item.href ? (
                      <Link href={item.href} className="flex items-start gap-2.5 hover:underline underline-offset-2">
                        {row}
                      </Link>
                    ) : (
                      <span className="flex items-start gap-2.5">{row}</span>
                    )}
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="font-mono text-[12px] text-[#9D9AAE]">Every format is open. Retake the checks on each topic page to see what stuck.</p>
          )}
        </div>
      </div>
    </section>
  );
}
