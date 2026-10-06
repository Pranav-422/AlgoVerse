"use client";

import { useState } from "react";
import { Sparkles, RotateCcw, Languages, ShieldCheck, ShieldAlert } from "lucide-react";
import type { Provenance } from "@/lib/comic";
import { HowGenerated } from "@/components/shared/HowGenerated";

type Mode = "expressive" | "hinglish";

const LABEL: Record<Mode, string> = { expressive: "expressive rewrite", hinglish: "Hinglish" };

export function ExpressiveSummary({ topicId, summary }: { topicId: string; summary: string }) {
  const [text, setText] = useState(summary);
  const [prov, setProv] = useState<Provenance | null>(null);
  const [mode, setMode] = useState<Mode | null>(null);
  const [busy, setBusy] = useState<Mode | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function rewrite(m: Mode) {
    setBusy(m);
    setError(null);
    try {
      const res = await fetch("/api/brief/expressive", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, mode: m }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.detail ?? json.error);
      setText(json.data.summary);
      setProv(json.data.provenance);
      setMode(m);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rewrite failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-3">
      <section className="box p-6">
        <div className="flex items-center justify-between mb-3 gap-3">
          <span className="label !text-ink font-bold">Summary {"//"} {mode ? LABEL[mode] : "from the knowledge file"}</span>
          {prov?.guard && (
            <span
              className={`tag ${prov.guard.ok ? "!bg-[#EAF6EE] !border-ok" : "!bg-[#FCEEEE] !border-err"}`}
              title={`${prov.guard.checked} number/complexity claim(s) checked against the knowledge file`}
            >
              {prov.guard.ok ? <ShieldCheck size={11} /> : <ShieldAlert size={11} />}
              {prov.guard.ok ? "facts preserved" : "new claim found"}
            </span>
          )}
        </div>
        <p className={`text-[15px] leading-[1.75] transition-opacity ${busy ? "opacity-40" : ""}`}>{text}</p>
        {error && (
          <p className="mt-4 font-mono text-[12px] text-err border-l-4 border-err pl-2">
            Couldn&apos;t rewrite: {error}
            {error.includes("original summary") ? "" : " The original summary is shown."}
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <button onClick={() => rewrite("expressive")} disabled={!!busy} className="btn btn-light">
            <Sparkles size={14} /> {busy === "expressive" ? "Rewriting…" : "Make it more expressive"}
          </button>
          <button onClick={() => rewrite("hinglish")} disabled={!!busy} className="btn btn-light">
            <Languages size={14} /> {busy === "hinglish" ? "Translating…" : "Explain in Hinglish"}
          </button>
          {prov && (
            <button
              onClick={() => {
                setText(summary);
                setProv(null);
                setMode(null);
              }}
              className="btn btn-light"
            >
              <RotateCcw size={14} /> Original
            </button>
          )}
        </div>
        <p className="mt-3 font-mono text-[10.5px] text-outline">
          Every rewrite is checked by a fact guard: any number or Big-O that is not in the knowledge file gets the answer rejected.
        </p>
      </section>
      {prov && <HowGenerated provenance={prov} />}
    </div>
  );
}
