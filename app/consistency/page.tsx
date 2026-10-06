import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getAllTopics, pad2, type Topic } from "@/lib/knowledge";
import { loadBank } from "@/lib/comicKit";
import { AppHeader } from "@/components/shared/AppHeader";
import { AppFooter } from "@/components/shared/AppFooter";

export const metadata = { title: "Consistency matrix — AlgoVerse" };

// One knowledge file per topic feeds every format. This page shows, fact by fact, where each
// fact is used — computed live from the files, so it can never drift from the content.

const VIZ_TOPICS = new Set(["arrays", "linked-lists", "stacks-queues", "sorting"]);
const STOP = new Set(["at", "of", "the", "and", "a", "to", "in", "front", "end", "beginning", "position"]);

interface Row {
  fact: string;
  lines: string[];
  quiz: string[];
  ops: string[];
}

function buildRows(topic: Topic): { rows: Row[]; narration: number; totalLines: number } {
  const bank = loadBank(topic.id);
  const rows: Row[] = topic.coreFacts.map((fact) => ({ fact, lines: [], quiz: [], ops: [] }));
  let narration = 0;
  let totalLines = 0;
  for (const arc of bank?.arcs ?? []) {
    for (const l of arc.lines) {
      totalLines++;
      if (!l.fact) {
        narration++;
        continue;
      }
      const row = rows.find((r) => r.fact.includes(l.fact!));
      row?.lines.push(l.id);
    }
    const q = (arc as { quiz?: { fact: string } }).quiz;
    if (q) rows.find((r) => r.fact.trim() === q.fact.trim())?.quiz.push(arc.id);
  }
  if (VIZ_TOPICS.has(topic.id)) {
    for (const op of topic.operations) {
      // Link an operation to a fact when the operation's name words appear in the fact.
      const keys = op.name.toLowerCase().split(/\W+/).filter((w) => w.length > 2 && !STOP.has(w));
      for (const r of rows) {
        const f = r.fact.toLowerCase();
        if (keys.length && keys.every((k) => f.includes(k.replace(/e?s$/, "")))) r.ops.push(op.name);
      }
    }
  }
  return { rows, narration, totalLines };
}

const Cell = ({ items, empty = "—" }: { items: string[]; empty?: string }) =>
  items.length ? (
    <div className="flex flex-wrap gap-1">
      {items.map((i) => (
        <span key={i} className="tag !text-[9px] !normal-case !tracking-normal">
          {i}
        </span>
      ))}
    </div>
  ) : (
    <span className="text-outline-soft">{empty}</span>
  );

export default async function ConsistencyPage() {
  const user = await requireUser();
  const topics = getAllTopics().filter((t) => t.status !== "soon");

  return (
    <div className="min-h-screen flex flex-col bg-dots">
      <AppHeader email={user.email} active="consistency" crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Consistency matrix" }]} />
      <main className="w-full max-w-[1240px] mx-auto px-6 lg:px-8 py-10 flex-1 space-y-8">
        <div>
          <span className="tag !bg-ink !text-white">One source of facts</span>
          <h1 className="font-head font-extrabold text-4xl uppercase mt-3">Consistency matrix</h1>
          <p className="font-mono text-[12px] text-muted mt-2 max-w-[780px]">
            Each row is one fact from a topic&apos;s knowledge file. The columns show every place that fact is used. Comic lines and
            quizzes are linked to facts explicitly (and checked by <code>npm run check:comics</code>); visualizer operations are matched
            by name. Every fact is also the only material the brief rewrites are allowed to use.
          </p>
        </div>

        {topics.map((t) => {
          const { rows, narration, totalLines } = buildRows(t);
          const used = rows.filter((r) => r.lines.length || r.quiz.length || r.ops.length).length;
          return (
            <section key={t.id} className="box overflow-hidden">
              <div className="px-5 py-3 border-b-2 border-ink bg-cream flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-head font-bold text-xl">
                  {pad2(t.index)} {t.name}
                </h2>
                <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                  <span className="tag">{rows.length} facts</span>
                  <span className="tag !bg-amber-light">{used} used beyond the brief</span>
                  {totalLines > 0 && (
                    <span className="tag">
                      {totalLines - narration}/{totalLines} comic lines fact-linked · {narration} narration
                    </span>
                  )}
                  <Link href={`/topics/${t.id}`} className="tag hover:!bg-amber-mid">
                    open brief →
                  </Link>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full font-mono text-[11.5px]">
                  <thead>
                    <tr className="text-left label !text-[10px] border-b border-outline-soft">
                      <th className="px-4 py-2 w-[44%]">Fact (knowledge file)</th>
                      <th className="px-3 py-2">Brief</th>
                      <th className="px-3 py-2">Comic lines</th>
                      <th className="px-3 py-2">Quiz</th>
                      <th className="px-3 py-2">Visualizer op</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.fact} className="border-b border-dashed border-outline-soft align-top">
                        <td className="px-4 py-2">{r.fact}</td>
                        <td className="px-3 py-2 text-ok font-bold" title="Injected as an allowed fact into every brief rewrite">
                          ✓
                        </td>
                        <td className="px-3 py-2">
                          <Cell items={r.lines} empty={t.formats.includes("comic") ? "—" : "no comic"} />
                        </td>
                        <td className="px-3 py-2">
                          <Cell items={r.quiz} empty={t.formats.includes("comic") ? "—" : "no comic"} />
                        </td>
                        <td className="px-3 py-2">
                          <Cell items={r.ops} empty={VIZ_TOPICS.has(t.id) ? "—" : "no visualizer"} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </main>
      <AppFooter />
    </div>
  );
}
