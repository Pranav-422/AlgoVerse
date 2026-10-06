"use client";

import { useState } from "react";
import { ChevronDown, Cpu } from "lucide-react";
import type { Provenance } from "@/lib/comic";

// The examiner-facing panel (SPEC §11). Collapsed by default.
// Shows only real data. If there is no real prompt, it says so.

const SOURCE_LABEL: Record<Provenance["source"], string> = {
  generated: "Generated live",
  pregenerated: "Pre-generated",
  handwritten: "Hand-authored",
  deterministic: "Deterministic engine",
};

export function HowGenerated({ provenance, title = "How this was generated" }: { provenance: Provenance; title?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="box overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-cream hover:bg-cream-high transition-colors"
      >
        <span className="flex items-center gap-2 font-mono text-[12px] font-bold uppercase tracking-wider">
          <Cpu size={15} /> {title}
        </span>
        <span className="flex items-center gap-2">
          <span className={`tag ${provenance.source === "generated" ? "!bg-amber-mid" : ""}`}>
            {SOURCE_LABEL[provenance.source]}
          </span>
          <ChevronDown size={16} className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>

      {open && (
        <div className="border-t-2 border-ink p-4 space-y-5 text-[13px]">
          <dl className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-2 font-mono text-[12px]">
            <dt className="label">Source</dt>
            <dd>{SOURCE_LABEL[provenance.source]}</dd>
            <dt className="label">Model</dt>
            <dd>{provenance.model ?? "None — no model was called"}</dd>
            <dt className="label">Feedback adj.</dt>
            <dd>
              {provenance.feedback ? (
                <>
                  <span className="tag mr-2">{provenance.feedback.category}</span>
                  {provenance.feedback.instruction}
                </>
              ) : (
                "None active"
              )}
            </dd>
            {provenance.createdAt && (
              <>
                <dt className="label">Created</dt>
                <dd>{new Date(provenance.createdAt).toLocaleString()}</dd>
              </>
            )}
          </dl>

          {provenance.note && (
            <p className="border-l-4 border-amber bg-cream px-3 py-2 font-mono text-[12px]">{provenance.note}</p>
          )}

          {provenance.guard && (
            <div
              className={`flex items-start gap-2 border-2 rounded px-3 py-2 font-mono text-[12px] ${
                provenance.guard.ok ? "border-ok bg-[#EAF6EE]" : "border-err bg-[#FCEEEE]"
              }`}
            >
              <span className="font-bold">{provenance.guard.ok ? "✓ Fact guard passed" : "⚠ Fact guard failed"}</span>
              <span>
                {provenance.guard.checked} number/complexity claim(s) checked against the knowledge file
                {provenance.guard.newClaims.length ? ` · new: ${provenance.guard.newClaims.join(", ")}` : " · nothing new was added"}
              </span>
            </div>
          )}

          {provenance.preferences && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="label mr-1">Learner preferences used</span>
              <span className="tag">{provenance.preferences.length}</span>
              <span className="tag">{provenance.preferences.style}</span>
              <span className="tag">{provenance.preferences.pace}</span>
            </div>
          )}

          {provenance.trace && provenance.trace.length > 0 && (
            <div>
              <h4 className="label mb-2">Pipeline trace</h4>
              <ol className="relative border-l-2 border-ink ml-2 space-y-2">
                {provenance.trace.map((t, i) => (
                  <li key={i} className="pl-4 relative">
                    <span
                      className={`absolute -left-[7px] top-1 w-3 h-3 rounded-full border-2 border-ink ${
                        t.status === "ok" ? "bg-ok" : t.status === "retry" ? "bg-amber-mid" : t.status === "fail" ? "bg-err" : "bg-card"
                      }`}
                    />
                    <div className="flex flex-wrap items-baseline gap-2 font-mono text-[12px]">
                      <span className="font-bold">{t.step}</span>
                      <span className="tag !text-[9px]">{t.status}</span>
                      {t.ms > 0 && <span className="text-outline">{t.ms} ms</span>}
                    </div>
                    {t.detail && <p className="font-mono text-[11px] text-muted break-words">{t.detail}</p>}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div>
            <h4 className="label mb-2">Prompt sent to the model</h4>
            {provenance.prompt ? (
              <pre className="bg-ink text-[#F5EADF] rounded p-3 text-[11.5px] leading-relaxed whitespace-pre-wrap max-h-[420px] overflow-auto font-mono">
                {provenance.prompt}
              </pre>
            ) : (
              <p className="font-mono text-[12px] text-muted italic">
                No prompt exists for this content, so none is shown.
              </p>
            )}
          </div>

          {provenance.injectedFacts.length > 0 && (
            <div>
              <h4 className="label mb-2">Knowledge-base facts used</h4>
              <ul className="space-y-1">
                {provenance.injectedFacts.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-amber font-bold">›</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {provenance.selection && (
            <div>
              <h4 className="label mb-2">Picks returned (ids from the comic kit)</h4>
              <pre className="bg-cream border-2 border-ink rounded p-3 text-[11.5px] leading-relaxed whitespace-pre-wrap font-mono">
                {JSON.stringify(provenance.selection, null, 2)}
              </pre>
            </div>
          )}

          {provenance.constraints.length > 0 && (
            <div>
              <h4 className="label mb-2">Rules applied</h4>
              <div className="flex flex-wrap gap-1.5">
                {provenance.constraints.map((c) => (
                  <span key={c} className="tag !normal-case !tracking-normal !font-medium">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
