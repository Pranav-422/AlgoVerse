"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, AlertTriangle, Layers, LayoutGrid, Play, Pause, Volume2, VolumeX } from "lucide-react";
import type { ComicWithProvenance } from "@/lib/comic";
import type { FeedbackCategory } from "@/lib/feedbackMap";
import { PanelDeck } from "./PanelDeck";
import { PageView } from "./PageView";
import { FeedbackBar } from "./FeedbackBar";
import { ComicQuiz } from "./ComicQuiz";
import { HowGenerated } from "@/components/shared/HowGenerated";

const CLIENT_TIMEOUT_MS = 90_000;
const AUTOPLAY_MS = 4500;

interface Props {
  topicId: string;
  pool: ComicWithProvenance[];
  initialGenerated: ComicWithProvenance | null;
  initialRemaining: number;
  initialResetsAt: number | null;
}

export function ComicViewer({ topicId, pool, initialGenerated, initialRemaining, initialResetsAt }: Props) {
  const [generated, setGenerated] = useState<ComicWithProvenance | null>(initialGenerated);
  const comics = generated ? [...pool, generated] : pool;
  const [which, setWhich] = useState(initialGenerated ? pool.length : 0);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [category, setCategory] = useState<FeedbackCategory | null>(null);
  const [remaining, setRemaining] = useState(initialRemaining);
  const [resetsAt, setResetsAt] = useState<number | null>(initialResetsAt);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"deck" | "page">("deck");
  const [autoplay, setAutoplay] = useState(false);
  // Read-aloud uses the browser's built-in speech synthesis (not a model).
  const [voice, setVoice] = useState(false);
  const shuffleTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoplayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const current = comics[Math.min(which, comics.length - 1)];
  const panels = current.comic.panels;
  const atLast = index === panels.length - 1;
  const showQuiz = (atLast || view === "page") && current.comic.quiz;

  // Stop autoplay: clear timer and optionally reset state (only call from event handlers)
  const stopAutoplay = useCallback(() => {
    setAutoplay(false);
    if (autoplayTimer.current) {
      clearTimeout(autoplayTimer.current);
      autoplayTimer.current = null;
    }
  }, []);


  const go = useCallback(
    (d: 1 | -1, manual = true) => {
      if (busy) return;
      if (manual) stopAutoplay();
      setDirection(d);
      setIndex((i) => Math.min(Math.max(i + d, 0), panels.length - 1));
    },
    [busy, panels.length, stopAutoplay],
  );

  // Autoplay: schedule next advance; when reaching last panel, stop via a timeout callback (not sync setState)
  useEffect(() => {
    if (!autoplay || view !== "deck" || busy) return;
    if (atLast) {
      // Schedule the state update asynchronously — not synchronous setState in effect body
      const t = setTimeout(() => setAutoplay(false), 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      go(1, false);
    }, AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [autoplay, view, busy, atLast, index, go]);

  // Read the active panel's line aloud whenever it changes.
  useEffect(() => {
    if (!voice || view !== "deck" || busy || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(panels[Math.min(index, panels.length - 1)].text);
    u.rate = 0.95;
    u.lang = "en-IN";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
    return () => window.speechSynthesis.cancel();
  }, [voice, view, busy, index, panels]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  // Shuffle animation during regeneration
  function startShuffle() {
    setDirection(1);
    shuffleTimer.current = setInterval(() => setIndex((i) => (i + 1) % panels.length), 380);
  }
  function stopShuffle() {
    if (shuffleTimer.current) clearInterval(shuffleTimer.current);
    shuffleTimer.current = null;
  }
  useEffect(() => stopShuffle, []);


  async function regenerate() {
    setBusy(true);
    setError(null);
    startShuffle();
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), CLIENT_TIMEOUT_MS);
    try {
      const res = await fetch(category ? "/api/comic/feedback" : "/api/comic/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId, currentId: current.comic.id, ...(category ? { category } : {}) }),
        signal: ctl.signal,
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.detail ?? json.error);
      if (json.data.denied) {
        setRemaining(0);
        setResetsAt(json.data.resetsAt);
        return;
      }
      setGenerated({ comic: json.data.comic, provenance: json.data.provenance });
      setRemaining(json.data.remaining);
      if (json.data.remaining === 0) setResetsAt(Date.now() + 24 * 3600 * 1000);
      setWhich(pool.length);
      setCategory(null);
    } catch (e) {
      setError(
        ctl.signal.aborted
          ? "Generation timed out. Nothing was charged against your limit."
          : `Generation failed: ${e instanceof Error ? e.message : String(e)}`,
      );
    } finally {
      clearTimeout(timer);
      stopShuffle();
      setIndex(0);
      setBusy(false);
    }
  }

  const handleSwipe = useCallback(
    (d: 1 | -1) => go(d),
    [go],
  );

  return (
    <div className="space-y-6">
      {/* Comic picker */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="label mr-1">Comics:</span>
        {comics.map((c, i) => (
          <button
            key={c.comic.id}
            disabled={busy}
            onClick={() => {
              stopAutoplay();
              setWhich(i);
              setIndex(0);
            }}
            className={`px-3 py-1.5 border-2 rounded font-mono text-[11px] font-bold uppercase tracking-wider ${
              i === which ? "bg-amber border-ink text-white shadow-comic-sm" : "bg-card border-outline-soft hover:border-ink"
            }`}
          >
            {String.fromCharCode(65 + i)} · {c.comic.title}
            {c.provenance.source === "generated" && " · live"}
          </button>
        ))}
      </div>

      {/* The kit picks behind this comic */}
      <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
        <span className="label mr-1">Picked from the kit:</span>
        <span className="tag">layout · {current.comic.layout.name} ({panels.length})</span>
        <span className="tag">
          palette · {current.comic.palette.name}
          {[current.comic.palette.accent, current.comic.palette.accent2, current.comic.palette.soft].map((c) => (
            <span key={c} className="inline-block w-2.5 h-2.5 rounded-full border border-ink ml-0.5" style={{ background: c }} />
          ))}
        </span>
        <span className="tag">design · {current.comic.design}</span>
        <span className="tag">theme · {current.comic.theme}</span>

        {/* View switcher + autoplay toggle */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setVoice((v) => !v)}
            className={`px-3 py-1 border-2 border-ink rounded font-mono text-[11px] font-bold uppercase flex items-center gap-1 ${voice ? "bg-ink text-amber-mid" : "bg-card hover:bg-cream"}`}
            title="Read each panel aloud (browser speech, not AI-generated)"
            aria-pressed={voice}
          >
            {voice ? <Volume2 size={11} /> : <VolumeX size={11} />} Read
          </button>
          {/* Auto-play toggle — only in deck view */}
          {view === "deck" && (
            <button
              onClick={() => {
                if (autoplay) {
                  stopAutoplay();
                } else {
                  // If at last panel, wrap back
                  if (atLast) setIndex(0);
                  setAutoplay(true);
                }
              }}
              disabled={busy}
              className={`px-3 py-1 border-2 border-ink rounded font-mono text-[11px] font-bold uppercase flex items-center gap-1 ${autoplay ? "bg-ink text-amber-mid" : "bg-card hover:bg-cream"}`}
              title={autoplay ? "Pause auto-play" : "Auto-play panels"}
            >
              {autoplay ? <Pause size={11} /> : <Play size={11} />} Auto
            </button>
          )}

          <div className="flex border-2 border-ink rounded overflow-hidden">
            {(["deck", "page"] as const).map((v) => (
              <button
                key={v}
                onClick={() => { stopAutoplay(); setView(v); }}
                className={`px-3 py-1 font-mono text-[11px] font-bold uppercase flex items-center gap-1 ${view === v ? "bg-ink text-amber-mid" : "bg-card hover:bg-cream"}`}
              >
                {v === "deck" ? <Layers size={12} /> : <LayoutGrid size={12} />} {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === "page" && !busy ? (
        <PageView
          comic={current.comic}
          active={index}
          onPick={(i) => {
            setIndex(i);
            setView("deck");
          }}
        />
      ) : (
        <div className="grid grid-cols-[56px_1fr_56px] items-center gap-4">
          <button onClick={() => go(-1)} disabled={busy || index === 0} className="btn btn-light !p-3" aria-label="Previous panel">
            <ChevronLeft size={20} />
          </button>
          <div className="max-w-[780px] w-full mx-auto pr-6 pb-3">
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-outline-soft rounded-full mb-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${((index + 1) / panels.length) * 100}%`, background: current.comic.palette.accent }}
              />
            </div>

            <PanelDeck
              comic={current.comic}
              index={Math.min(index, panels.length - 1)}
              direction={direction}
              shuffling={busy}
              onSwipe={handleSwipe}
            />

            {/* One-line hint */}
            <p className="font-mono text-[10px] text-muted mt-2 text-center opacity-75">
              Tip: tap any box in the picture to inspect it · swipe or use ← → to move
            </p>
          </div>
          <button
            onClick={() => go(1)}
            disabled={busy || index === panels.length - 1}
            className="btn btn-light !p-3"
            aria-label="Next panel"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {error && (
        <div className="box !bg-[#FCEEEE] !border-err p-4 flex gap-3 items-start font-mono text-[12px] text-err">
          <AlertTriangle size={16} className="shrink-0" /> {error}
        </div>
      )}

      {/* Thumbnail strip */}
      <div>
        <div className="flex justify-between label mb-2">
          <span>Strip navigation</span>
          <span>
            Panel {index + 1} of {panels.length}
          </span>
        </div>
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${panels.length}, minmax(0,1fr))` }}>
          {panels.map((p, i) => (
            <button
              key={p.n}
              disabled={busy}
              onClick={() => {
                stopAutoplay();
                setDirection(i >= index ? 1 : -1);
                setIndex(i);
              }}
              className={`text-left border-2 border-ink rounded p-2 h-20 flex flex-col justify-between transition-all ${
                i === index ? "bg-amber-light shadow-comic -translate-y-1" : "bg-[#FAF7F0] hover:bg-cream"
              }`}
            >
              <span className="font-mono text-[10px] font-bold">#{String(p.n).padStart(2, "0")}</span>
              <span className="font-mono text-[10px] uppercase truncate">{p.concept.replace(/-/g, " ")}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Quiz — resets when comic changes via key prop */}
      {showQuiz && current.comic.quiz && (
        <ComicQuiz key={current.comic.id} quiz={current.comic.quiz} palette={current.comic.palette} record={{ topicId, arcId: current.comic.arc }} />
      )}

      <FeedbackBar
        selected={category}
        onSelect={setCategory}
        onRegenerate={regenerate}
        remaining={remaining}
        resetsAt={resetsAt}
        busy={busy}
      />

      <HowGenerated provenance={current.provenance} />
    </div>
  );
}
