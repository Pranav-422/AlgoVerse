import fs from "node:fs";
import path from "node:path";
import { requireUser } from "@/lib/session";
import { allGenerations, feedbackCounts } from "@/lib/db";
import { AppHeader } from "@/components/shared/AppHeader";
import { AppFooter } from "@/components/shared/AppFooter";
import { OutcomeBar, CountBars, type Segment } from "./Charts";
import { ExperimentPanel, type ExperimentResult } from "./ExperimentPanel";

export const metadata = { title: "Pipeline insights — AlgoVerse" };

// Outcome colours: validated with the dataviz palette checker (all checks pass; CVD 7.1 for
// first-try vs retry, so every segment is also direct-labelled and listed in the table).
const OUTCOMES: { key: string; label: string; color: string }[] = [
  { key: "first_try", label: "Valid on first try", color: "#2F7D4F" },
  { key: "after_retry", label: "Valid after one retry", color: "#B07A00" },
  { key: "fallback", label: "Rule-based fallback", color: "#7C5CFF" },
  { key: "error", label: "Failed (original kept)", color: "#B3261E" },
];

const KIND_LABEL: Record<string, string> = { comic: "Comic picks", expressive: "Expressive rewrite", hinglish: "Hinglish rewrite" };

function median(xs: number[]) {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

function loadExperiment(): ExperimentResult | null {
  const file = path.join(process.cwd(), "content", "experiments", "constrained-vs-free.json");
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as ExperimentResult;
  } catch {
    return null;
  }
}

export default async function InsightsPage() {
  const user = await requireUser();
  const rows = allGenerations();
  const fb = feedbackCounts();
  const total = rows.length;
  const modelRows = rows.filter((r) => r.model);
  const count = (k: string) => rows.filter((r) => r.outcome === k).length;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  const segments: Segment[] = OUTCOMES.map((o) => ({ ...o, value: count(o.key) }));
  const byKind = Object.entries(KIND_LABEL).map(([k, label]) => ({ label, value: rows.filter((r) => r.kind === k).length }));
  const experiment = loadExperiment();

  const tiles = [
    { label: "Generations logged", value: String(total), sub: `${modelRows.length} reached the model` },
    { label: "Valid on first try", value: `${pct(count("first_try"))}%`, sub: `${count("first_try")} of ${total}` },
    { label: "Needed the retry", value: `${pct(count("after_retry"))}%`, sub: `${count("after_retry")} of ${total}` },
    { label: "Fell back to rules", value: `${pct(count("fallback"))}%`, sub: `${count("fallback")} of ${total}` },
    { label: "Median latency", value: `${median(rows.map((r) => r.latency_ms))} ms`, sub: "whole pipeline, per request" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-dots">
      <AppHeader email={user.email} active="insights" crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Pipeline insights" }]} />
      <main className="w-full max-w-[1240px] mx-auto px-6 lg:px-8 py-10 flex-1 space-y-8">
        <div>
          <span className="tag !bg-ink !text-white">Pipeline {"//"} reliability</span>
          <h1 className="font-head font-extrabold text-4xl uppercase mt-3">How the generation pipeline behaves</h1>
          <p className="font-mono text-[12px] text-muted mt-2 max-w-[760px]">
            Every model request is logged: how many attempts it took, whether the rule check accepted the answer, whether the
            fallback had to step in, and how long it took. These numbers come from real requests made in this app — nothing here
            is sample data.
          </p>
        </div>

        <section className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {tiles.map((t) => (
            <div key={t.label} className="box p-4">
              <p className="label !text-[10px]">{t.label}</p>
              <p className="font-head font-extrabold text-3xl mt-1">{t.value}</p>
              <p className="font-mono text-[10px] text-outline mt-1">{t.sub}</p>
            </div>
          ))}
        </section>

        {total === 0 ? (
          <div className="box p-8 text-center font-mono text-[13px] text-muted">
            No generations yet. Regenerate a comic or press &ldquo;Make it more expressive&rdquo; on a brief, then come back.
          </div>
        ) : (
          <>
            <section className="box p-5">
              <h2 className="font-head font-bold text-xl">Outcome of every request</h2>
              <p className="font-mono text-[11px] text-muted mb-4">Share of {total} requests by how they finished.</p>
              <OutcomeBar segments={segments} total={total} />
            </section>

            <div className="grid md:grid-cols-2 gap-6">
              <section className="box p-5">
                <h2 className="font-head font-bold text-xl">Requests by feature</h2>
                <p className="font-mono text-[11px] text-muted mb-4">Number of logged requests</p>
                <CountBars items={byKind} unit="requests" />
              </section>
              <section className="box p-5">
                <h2 className="font-head font-bold text-xl">Feedback learners gave</h2>
                <p className="font-mono text-[11px] text-muted mb-4">Times each comic complaint was pressed</p>
                {fb.length ? (
                  <CountBars items={fb.map((f) => ({ label: f.category, value: f.n }))} unit="presses" />
                ) : (
                  <p className="font-mono text-[12px] text-muted">No feedback recorded yet.</p>
                )}
              </section>
            </div>

            <section className="box overflow-hidden">
              <div className="px-5 py-3 border-b-2 border-ink bg-cream flex justify-between">
                <h2 className="font-head font-bold text-lg">Recent requests</h2>
                <span className="font-mono text-[11px] text-outline">latest {Math.min(rows.length, 25)}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full font-mono text-[12px]">
                  <thead>
                    <tr className="text-left label !text-[10px] border-b border-outline-soft">
                      <th className="px-4 py-2">When</th>
                      <th className="px-4 py-2">Feature</th>
                      <th className="px-4 py-2">Topic</th>
                      <th className="px-4 py-2">Outcome</th>
                      <th className="px-4 py-2 text-right">Attempts</th>
                      <th className="px-4 py-2 text-right">Latency</th>
                      <th className="px-4 py-2">Why</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 25).map((r, i) => {
                      const o = OUTCOMES.find((x) => x.key === r.outcome);
                      return (
                        <tr key={i} className="border-b border-dashed border-outline-soft align-top">
                          <td className="px-4 py-2 whitespace-nowrap">{new Date(r.created_at).toISOString().slice(5, 16).replace("T", " ")}</td>
                          <td className="px-4 py-2">{KIND_LABEL[r.kind] ?? r.kind}</td>
                          <td className="px-4 py-2">{r.topic_id}</td>
                          <td className="px-4 py-2 whitespace-nowrap">
                            <span className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 align-middle" style={{ background: o?.color }} />
                            {o?.label ?? r.outcome}
                          </td>
                          <td className="px-4 py-2 text-right">{r.attempts}</td>
                          <td className="px-4 py-2 text-right">{r.latency_ms} ms</td>
                          <td className="px-4 py-2 text-muted max-w-[320px] break-words">{r.reason ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        <ExperimentPanel result={experiment} />
      </main>
      <AppFooter />
    </div>
  );
}
