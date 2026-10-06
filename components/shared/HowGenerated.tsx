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
