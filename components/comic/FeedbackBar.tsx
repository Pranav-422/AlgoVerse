"use client";

import { useSyncExternalStore } from "react";
import { RefreshCw, Clock } from "lucide-react";
import { FEEDBACK_CATEGORIES, type FeedbackCategory } from "@/lib/feedbackMap";

interface Props {
  selected: FeedbackCategory | null;
  onSelect: (c: FeedbackCategory | null) => void;
  onRegenerate: () => void;
  remaining: number;
  resetsAt: number | null;
  busy: boolean;
}

function until(ts: number) {
  const ms = Math.max(ts - Date.now(), 0);
  const h = Math.floor(ms / 3_600_000);
  const m = Math.ceil((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function FeedbackBar({ selected, onSelect, onRegenerate, remaining, resetsAt, busy }: Props) {
  const exhausted = remaining <= 0;
  // Times depend on the viewer's clock and locale, so they are rendered only after mount.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  return (
    <div className="box px-4 py-3 flex flex-wrap items-center gap-3">
      <span className="label !text-ink font-bold">Didn&apos;t land? Why:</span>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Feedback category">
        {FEEDBACK_CATEGORIES.map((c) => {
          const on = selected === c;
          return (
            <button
              key={c}
              role="radio"
              aria-checked={on}
              disabled={busy || exhausted}
              onClick={() => onSelect(on ? null : c)}
              className={`px-3 py-1.5 border-2 border-ink rounded font-mono text-[11px] font-bold uppercase tracking-wider transition-all disabled:opacity-40 ${
                on ? "bg-amber-mid shadow-comic-sm" : "bg-card hover:bg-cream"
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>

      <div className="ml-auto flex items-center gap-3">
        {exhausted && resetsAt && mounted ? (
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-err">
            <Clock size={13} /> Limit reached · resets in {until(resetsAt)} ({new Date(resetsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
          </span>
        ) : null}
        <button onClick={onRegenerate} disabled={busy || exhausted} className="btn btn-ink">
          <RefreshCw size={14} className={busy ? "animate-spin" : ""} />
          {busy ? "Generating…" : selected ? `Regenerate · ${selected}` : "Regenerate"}
        </button>
        <span className="tag !text-[11px]" title="Regenerations left in the rolling 24 hours">
          {remaining} of 3 left
        </span>
      </div>
    </div>
  );
}
