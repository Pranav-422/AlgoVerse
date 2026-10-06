"use client";

import { useState } from "react";
import { Sparkles, RotateCcw } from "lucide-react";
import type { Provenance } from "@/lib/comic";
import { HowGenerated } from "@/components/shared/HowGenerated";

export function ExpressiveSummary({ topicId, summary }: { topicId: string; summary: string }) {
  const [text, setText] = useState(summary);
  const [prov, setProv] = useState<Provenance | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function rewrite() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/brief/expressive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.detail ?? json.error);
      setText(json.data.summary);
      setProv(json.data.provenance);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rewrite failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <section className="box p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="label !text-ink font-bold">Summary {prov ? "// expressive rewrite" : "// from the knowledge file"}</span>
          {prov && <span className="tag !bg-amber-mid">generated</span>}
        </div>
        <p className={`text-[15px] leading-[1.75] transition-opacity ${busy ? "opacity-40" : ""}`}>{text}</p>
        {error && (
          <p className="mt-4 font-mono text-[12px] text-err border-l-4 border-err pl-2">
            Couldn&apos;t rewrite: {error}. The original summary is shown.
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <button onClick={rewrite} disabled={busy} className="btn btn-light">
            <Sparkles size={14} /> {busy ? "Rewriting…" : "Make it more expressive"}
          </button>
          {prov && (
            <button
              onClick={() => {
                setText(summary);
                setProv(null);
              }}
              className="btn btn-light"
            >
              <RotateCcw size={14} /> Original
            </button>
          )}
        </div>
      </section>
      {prov && <HowGenerated provenance={prov} />}
    </div>
  );
}
