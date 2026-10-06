"use client";

import { useState } from "react";
import { Check, X, RotateCcw, HelpCircle } from "lucide-react";
import type { ComicQuiz as ComicQuizType, KitPalette } from "@/lib/comic";

interface Props {
  quiz: ComicQuizType;
  palette: KitPalette;
  /** When set, answers are recorded for the learner's mastery score. */
  record?: { topicId: string; arcId: string };
}

export function ComicQuiz({ quiz, palette, record }: Props) {
  const [picked, setPicked] = useState<number | null>(null);

  const answered = picked !== null;
  const isCorrect = picked === quiz.answer;

  return (
    <section
      className="box p-4 mt-4 border-2 border-ink rounded shadow-comic bg-card"
      style={{ borderLeftWidth: "6px", borderLeftColor: palette.accent }}
      aria-label="Check yourself quiz"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white font-mono text-[11px] font-bold"
          style={{ background: palette.ink }}
        >
          <HelpCircle size={13} />
        </span>
        <h3 className="font-head text-[15px] font-extrabold uppercase tracking-wide text-ink">
          Check yourself
        </h3>
      </div>

      <p className="font-mono text-[13px] font-semibold text-text mb-3 leading-snug">
        {quiz.q}
      </p>

      <div className="flex flex-col sm:flex-row flex-wrap gap-2" role="radiogroup" aria-label="Quiz options">
        {quiz.options.map((opt, i) => {
          const isSelected = picked === i;
          const isAnswer = i === quiz.answer;

          let btnClass = "bg-card border-ink text-ink hover:bg-cream";
          let badge = null;

          if (answered) {
            if (isSelected) {
              if (isCorrect) {
                btnClass = "bg-[#EAF5EC] !border-ok text-ok font-bold";
                badge = <Check size={14} className="text-ok shrink-0 stroke-[3]" />;
              } else {
                btnClass = "bg-[#FDEEEE] !border-err text-err font-bold";
                badge = <X size={14} className="text-err shrink-0 stroke-[3]" />;
              }
            } else if (isAnswer) {
              btnClass = "bg-[#EAF5EC] !border-ok text-ok font-bold";
              badge = <Check size={14} className="text-ok shrink-0 stroke-[3]" />;
            } else {
              btnClass = "opacity-50 border-outline-soft text-muted";
            }
          }

          return (
            <button
              key={i}
              role="radio"
              aria-checked={isSelected}
              disabled={answered}
              onClick={() => {
                if (picked !== null) return;
                setPicked(i);
                if (record)
                  void fetch("/api/quiz", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...record, correct: i === quiz.answer }),
                  }).catch(() => {});
              }}
              className={`px-3 py-2 border-2 rounded font-mono text-[12px] text-left flex items-center gap-2 transition-all ${btnClass} disabled:cursor-default`}
            >
              <span className="font-bold opacity-70 font-mono text-[10px]">
                {String.fromCharCode(65 + i)}.
              </span>
              <span className="flex-1">{opt}</span>
              {badge}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="mt-3 pt-3 border-t border-outline-soft flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="font-mono text-[12px] text-muted flex items-center gap-2">
            <span className="font-bold text-ink uppercase text-[10px] px-1.5 py-0.5 rounded border border-ink bg-amber-light">
              Fact
            </span>
            <span>{quiz.fact}</span>
          </div>

          <button
            onClick={() => setPicked(null)}
            className="btn btn-light !py-1 !px-2.5 !text-[11px] self-start sm:self-auto shrink-0"
          >
            <RotateCcw size={12} />
            Try again
          </button>
        </div>
      )}
    </section>
  );
}
