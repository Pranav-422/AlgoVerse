// Results of scripts/experiment.mts (constrained vs free generation). Server component.

interface Arm {
  runs: number;
  schemaFailures: number;
  lines: number;
  overLimit: number;
  unsupportedBigO: number;
  judgeFlagged: number;
  judgeFailures: number;
}

export interface ExperimentResult {
  runAt: string;
  model: string;
  runsPerArmPerTopic: number;
  topics: string[];
  arms: { free: Arm; kit: Arm };
  examples: { arm: string; topic: string; line: string; why: string }[];
}

const pct = (n: number, d: number) => (d ? `${Math.round((n / d) * 1000) / 10}%` : "—");

export function ExperimentPanel({ result }: { result: ExperimentResult | null }) {
  return (
    <section className="box overflow-hidden">
      <div className="px-5 py-3 border-b-2 border-ink bg-cream">
        <h2 className="font-head font-bold text-xl">Experiment: why Gemini only picks from a kit</h2>
        <p className="font-mono text-[11px] text-muted">
          Same model, same facts. FREE = Gemini writes the comic script itself. KIT = Gemini only picks ids from the prepared kit.
        </p>
      </div>
      {!result ? (
        <div className="p-6 font-mono text-[12px] text-muted space-y-2">
          <p>Not run yet. Results appear here after running the experiment with a Gemini key:</p>
          <pre className="bg-ink text-[#F5EADF] rounded p-3 text-[12px]">npm run experiment</pre>
          <p>No numbers are shown until the experiment has actually been run.</p>
        </div>
      ) : (
        <div className="p-5 space-y-5">
          <p className="font-mono text-[11px] text-outline">
            Run {result.runAt.slice(0, 16).replace("T", " ")} UTC · model {result.model} · {result.runsPerArmPerTopic} runs per arm × {result.topics.length} topics
          </p>
          <div className="overflow-x-auto">
            <table className="w-full font-mono text-[12px]">
              <thead>
                <tr className="text-left label !text-[10px] border-b border-outline-soft">
                  <th className="px-3 py-2">Metric</th>
                  <th className="px-3 py-2 text-right">FREE (writes text)</th>
                  <th className="px-3 py-2 text-right">KIT (picks ids)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Answers that broke the schema / rules", (a: Arm) => `${a.schemaFailures} / ${a.runs} (${pct(a.schemaFailures, a.runs)})`],
                  ["Lines over the 18-word limit", (a: Arm) => `${a.overLimit} / ${a.lines} (${pct(a.overLimit, a.lines)})`],
                  ["Lines with a Big-O not in the facts", (a: Arm) => `${a.unsupportedBigO} / ${a.lines} (${pct(a.unsupportedBigO, a.lines)})`],
                  ["Lines the judge flagged as unsupported", (a: Arm) => `${a.judgeFlagged} / ${a.lines} (${pct(a.judgeFlagged, a.lines)})`],
                  ["Judge calls that failed", (a: Arm) => String(a.judgeFailures)],
                ].map(([label, f]) => (
                  <tr key={label as string} className="border-b border-dashed border-outline-soft">
                    <td className="px-3 py-2">{label as string}</td>
                    <td className="px-3 py-2 text-right">{(f as (a: Arm) => string)(result.arms.free)}</td>
                    <td className="px-3 py-2 text-right font-bold">{(f as (a: Arm) => string)(result.arms.kit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result.examples.length > 0 && (
            <div>
              <h3 className="label mb-2">Examples of flagged lines</h3>
              <ul className="space-y-1.5 font-mono text-[12px]">
                {result.examples.map((e, i) => (
                  <li key={i} className="border-l-4 border-err pl-3">
                    <span className="tag mr-2">{e.arm}</span>
                    <span className="tag mr-2">{e.topic}</span>“{e.line}” <span className="text-muted">— {e.why}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="font-mono text-[10.5px] text-outline">
            The judge is a separate Gemini call given only the facts and the lines; it can be wrong, so its column is a signal, not ground truth.
            Lines in the KIT arm were also checked when the bank was written (npm run check:comics).
          </p>
        </div>
      )}
    </section>
  );
}
