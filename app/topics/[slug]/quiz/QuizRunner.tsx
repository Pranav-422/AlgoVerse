"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import type { KitPalette } from "@/lib/comic";
import type { QuizItem } from "@/lib/comicKit";
import { ComicQuiz } from "@/components/comic/ComicQuiz";

export function QuizRunner({ topicId, questions, palette }: { topicId: string; questions: QuizItem[]; palette: KitPalette }) {
  const [i, setI] = useState(0);
  const [results, setResults] = useState<boolean[]>([]);
  const n = questions.length;
  const done = i >= n;
  const score = results.filter(Boolean).length;

  if (done)
    return (
      <section className="box p-7 text-center space-y-4">
        <p className="label">Your score</p>
        <p className="font-head font-extrabold text-6xl">
          {score}
          <span className="text-outline text-3xl">/{n}</span>
        </p>
        <p className="font-mono text-[13px] text-muted">
          {score === n ? "All correct." : score >= n / 2 ? "Good. Review the ones you missed below." : "Worth another pass through the brief first."}
        </p>
        <ol className="text-left space-y-2">
          {questions.map((q, k) => (
            <li key={q.id} className={`border-2 rounded p-3 font-mono text-[12px] ${results[k] ? "border-ok bg-[#EAF5EC]" : "border-err bg-[#FDEEEE]"}`}>
              <b>{results[k] ? "✓" : "✗"}</b> {q.q}
              {!results[k] && <span className="block mt-1 text-muted">Answer: {q.options[q.answer]}</span>}
            </li>
          ))}
        </ol>
        <div className="flex flex-wrap justify-center gap-3">
          {/* A plain navigation re-renders the server page, which draws a new random set. */}
          <a href={`/topics/${topicId}/quiz?n=${n}`} className="btn btn-amber">
            <RotateCcw size={14} /> New set of {n}
          </a>
          <Link href={`/topics/${topicId}`} className="btn btn-light">
            Back to the brief
          </Link>
        </div>
      </section>
    );

  const q = questions[i];
  const answered = results.length > i;
  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between label mb-1.5">
          <span>
            Question {i + 1} of {n}
          </span>
          <span>Score {score}</span>
        </div>
        <div className="h-2 border-2 border-ink rounded-sm bg-card overflow-hidden">
          <div className="h-full bg-amber transition-all" style={{ width: `${(i / n) * 100}%` }} />
        </div>
      </div>
      <ComicQuiz
        key={q.id}
        quiz={q}
        palette={palette}
        topicId={topicId}
        record={q.arcId ? { topicId, arcId: q.arcId } : undefined}
        onAnswer={(ok) => setResults((r) => [...r, ok])}
      />
      <div className="flex justify-end">
        <button onClick={() => setI(i + 1)} disabled={!answered} className="btn btn-amber disabled:opacity-40">
          {i + 1 === n ? "See score" : "Next question"} <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
