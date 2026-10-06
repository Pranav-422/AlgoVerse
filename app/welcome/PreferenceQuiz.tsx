"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import type { Preferences } from "@/lib/db";

const QUESTIONS: { key: keyof Preferences; q: string; options: { value: string; title: string; text: string }[] }[] = [
  {
    key: "length",
    q: "When you learn something new, you prefer…",
    options: [
      { value: "short", title: "Short and sharp", text: "The core idea in as few panels as possible." },
      { value: "detailed", title: "The full picture", text: "More panels, including the 'why' behind each step." },
    ],
  },
  {
    key: "style",
    q: "What sticks with you best?",
    options: [
      { value: "visual", title: "Pictures", text: "Diagrams of boxes, nodes and arrows." },
      { value: "worded", title: "Explanations", text: "Lines that spell out the reasoning." },
    ],
  },
  {
    key: "pace",
    q: "How should a comic move?",
    options: [
      { value: "step", title: "Step by step", text: "Many small steps, one change at a time." },
      { value: "story", title: "Like a story", text: "A strong opening, the key moves, a clear ending." },
    ],
  },
];

export function PreferenceQuiz({ initial }: { initial: Preferences | null }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Partial<Preferences>>(initial ?? {});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const done = QUESTIONS.every((q) => answers[q.key]);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.detail ?? json.error);
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 space-y-6">
      {QUESTIONS.map((q, qi) => (
        <motion.section
          key={q.key}
          className="box p-5"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: qi * 0.08 }}
        >
          <p className="label !text-ink font-bold">
            {qi + 1} / 3 · {q.q}
          </p>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            {q.options.map((o) => {
              const on = answers[q.key] === o.value;
              return (
                <button
                  key={o.value}
                  onClick={() => setAnswers((a) => ({ ...a, [q.key]: o.value }))}
                  className={`text-left border-2 border-ink rounded p-4 transition-all ${on ? "bg-amber-mid shadow-comic -translate-y-0.5" : "bg-card hover:bg-cream"}`}
                  aria-pressed={on}
                >
                  <span className="flex items-center justify-between font-head font-bold text-lg">
                    {o.title} {on && <Check size={18} />}
                  </span>
                  <span className="block font-mono text-[12px] text-muted mt-1">{o.text}</span>
                </button>
              );
            })}
          </div>
        </motion.section>
      ))}
      {error && <p className="font-mono text-[12px] text-err">{error}</p>}
      <button onClick={save} disabled={!done || busy} className="btn btn-amber !py-3">
        {busy ? "Saving…" : "Save my learning style"} <ArrowRight size={15} />
      </button>
    </div>
  );
}
