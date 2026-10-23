"use client";

import { useState } from "react";
import { ClipboardCheck, Check, X } from "lucide-react";

type Score = { score: number; total: number };

interface Props {
  topicId: string;
  questions: { q: string; options: string[] }[];
  pre?: Score;
  post?: Score;
  /** False once a format other than the brief is open: a "before" score would no longer be one. */
  canPre: boolean;
  /** Study members keep their first after score, so there is no retake. */
  inStudy?: boolean;
}

// The same few questions before and after learning, graded on the server, so the
// learner (and the insights page) can see what the topic actually taught.
export function TopicCheck({ topicId, questions, pre: initialPre, post: initialPost, canPre, inStudy }: Props) {
  const [pre, setPre] = useState(initialPre);
  const [post, setPost] = useState(initialPost);
  const [open, setOpen] = useState(!initialPre && canPre);
  const [picks, setPicks] = useState<(number | null)[]>(() => questions.map(() => null));
  const [marks, setMarks] = useState<boolean[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!questions.length || (!pre && !canPre)) return null;
  const phase = pre ? "post" : "pre";

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, phase, answers: picks }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error === "TOO_LATE" ? "You have already opened other formats, so this can no longer be a 'before' score." : json.error === "ALREADY_TAKEN" ? "Your score for the study is already saved." : "Could not save your answers. Try again.");
      const score = { score: json.data.score, total: json.data.total };
      if (phase === "pre") setPre(score);
      else setPost(score);
      setMarks(json.data.correct);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function retake() {
    setPicks(questions.map(() => null));
    setMarks(null);
    setOpen(true);
  }

  return (
    <section className="box p-5 !bg-cream" aria-label="Before and after check">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ClipboardCheck size={16} />
          <h2 className="font-mono text-[12px] font-bold uppercase tracking-wider">Check yourself {"//"} before &amp; after</h2>
        </div>
        {pre && (
          <div className="flex items-center gap-2 font-mono text-[12px]">
            <span className="tag">Before {pre.score}/{pre.total}</span>
            <span aria-hidden>→</span>
            <span className={`tag ${post ? "!bg-amber-mid" : ""}`}>{post ? `After ${post.score}/${post.total}` : "After: not yet"}</span>
          </div>
        )}
      </div>
      <p className="font-mono text-[12px] text-muted mt-2">
        {!pre
          ? `Before you start: ${questions.length} quick questions. No marks — you will answer the same ones after the comic and visualizer, and see what changed.`
          : !post
            ? "Done the formats? Take the same questions again to see what you learned."
            : post.score > pre.score
              ? `You went from ${pre.score} to ${post.score} out of ${post.total}.`
              : "Same questions, same score — the comic and visualizer may help with the ones you missed."}
      </p>

      {open ? (
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          {questions.map((q, i) => (
            <fieldset key={q.q} disabled={!!marks} className="space-y-1.5">
              <legend className="font-mono text-[13px] font-semibold mb-1.5 flex items-start gap-2">
                <span className="tag shrink-0">{i + 1}</span>
                <span>{q.q}</span>
                {marks && (marks[i] ? <Check size={16} className="text-ok shrink-0" aria-label="right" /> : <X size={16} className="text-err shrink-0" aria-label="wrong" />)}
              </legend>
              {q.options.map((o, j) => (
                <label key={o} className="flex items-start gap-2 font-mono text-[12px] cursor-pointer">
                  <input
                    type="radio"
                    name={`check-${i}`}
                    checked={picks[i] === j}
                    onChange={() => setPicks((p) => p.map((v, k) => (k === i ? j : v)))}
                    className="mt-0.5 accent-[var(--color-amber)]"
                  />
                  <span>{o}</span>
                </label>
              ))}
            </fieldset>
          ))}
          {error && <p className="font-mono text-[12px] text-err">{error}</p>}
          {marks ? (
            <button type="button" className="btn btn-light !py-1.5" onClick={() => setOpen(false)}>
              Close
            </button>
          ) : (
            <button type="submit" className="btn btn-ink !py-1.5" disabled={busy || picks.some((p) => p === null)}>
              {busy ? "Saving…" : phase === "pre" ? "Save my starting point" : "See what changed"}
            </button>
          )}
        </form>
      ) : (
        pre && !(post && inStudy) && (
          <button type="button" className="btn btn-light !py-1.5 mt-3" onClick={retake}>
            {post ? "Retake" : "Take the after check"}
          </button>
        )
      )}
    </section>
  );
}
