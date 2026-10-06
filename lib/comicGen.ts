import "server-only";
import crypto from "node:crypto";
import type { Topic } from "./knowledge";
import type { ComicWithProvenance, Provenance, Selection } from "./comic";
import type { FeedbackCategory } from "./feedbackMap";
import { loadKit, loadBank, buildPickPrompt, parseSelection, checkSelection, fallbackPick, resolveComic, factsFor, type LearnerPrefs } from "./comicKit";
import { runJson, ModelError, TEXT_MODEL } from "./gemini";
import { saveComic, latestComic, logGeneration, getPreferences } from "./db";
import { getComicPool } from "./comicPool";
import { Tracer } from "./trace";

// Comic pipeline: ONE bounded model request (≤ 2 attempts) that picks ids from the kit →
// rule check → (on failure) rule-based fallback → resolve into panels. The model never writes text.
// Every run is traced step by step and logged to gen_log for the metrics page.

export async function generateComic(
  userId: string,
  topic: Topic,
  feedback: FeedbackCategory | null,
  previous: Selection | null,
): Promise<ComicWithProvenance> {
  const tracer = new Tracer();
  const kit = loadKit();
  const bank = loadBank(topic.id);
  if (!bank) throw new ModelError("BAD_OUTPUT", `No dialogue bank for ${topic.id}`);
  const prefs = getPreferences(userId) as LearnerPrefs | null;

  const built = await tracer.time(
    "prompt built",
    () => buildPickPrompt(topic.name, kit, bank, feedback, previous, prefs),
    (b) => `${b.prompt.length} chars · ${bank.arcs.reduce((n, a) => n + a.lines.length, 0)} lines offered${prefs ? " · preferences applied" : ""}${feedback ? ` · feedback: ${feedback}` : ""}`,
  );

  let selection: Selection;
  let model: string | null = TEXT_MODEL;
  let note: string | undefined;
  let attempts = 0;
  let outcome: "first_try" | "after_retry" | "fallback" = "first_try";
  let reason: string | null = null;

  try {
    const res = await runJson(
      built.prompt,
      (raw) => {
        const sel = parseSelection(raw);
        const errs = checkSelection(sel, kit, bank, feedback, previous);
        if (errs.length) throw new Error(errs.join("; "));
        return sel;
      },
      tracer,
      "Gemini pick",
    );
    selection = res.value;
    attempts = res.attempts;
    if (res.attempts > 1) {
      outcome = "after_retry";
      reason = res.rejected.join(" | ");
    }
  } catch (e) {
    const err = e instanceof ModelError ? e : null;
    reason =
      err?.code === "NO_KEY"
        ? "no Gemini API key is configured"
        : err?.code === "TIMEOUT"
          ? "the model timed out"
          : `the model's answer was rejected (${e instanceof Error ? e.message : String(e)})`;
    attempts = err?.code === "NO_KEY" ? 0 : 2;
    selection = await tracer.time("rule-based fallback", () => fallbackPick(kit, bank, feedback, previous, Date.now(), prefs), () => "valid selection");
    model = null;
    outcome = "fallback";
    note = `Picked by the rule-based fallback because ${reason}. It follows the same kit rules and feedback constraints.`;
  }

  const id = crypto.randomUUID();
  const comic = await tracer.time("resolved into panels", () => resolveComic(selection, kit, bank, { id, source: "generated" }), (c) => `${c.panels.length} panels · arc "${c.arc}"`);
  const provenance: Provenance = {
    source: "generated",
    model,
    prompt: model ? built.prompt : null,
    injectedFacts: factsFor(selection, bank, topic.coreFacts),
    constraints: built.constraints,
    feedback: built.feedback,
    selection,
    note,
    createdAt: Date.now(),
    trace: tracer.steps,
    preferences: prefs,
  };
  // prompt_used keeps the prompt even for fallback picks, so the record shows what would have been sent.
  saveComic(userId, topic.id, { comic, provenance }, built.prompt);
  logGeneration({
    userId,
    topicId: topic.id,
    kind: "comic",
    model,
    outcome,
    reason,
    feedback,
    attempts,
    latencyMs: tracer.total(),
    trace: tracer.steps,
  });
  return { comic, provenance };
}

export function getLatestGenerated(userId: string, topicId: string): ComicWithProvenance | null {
  const row = latestComic(userId, topicId);
  if (!row) return null;
  try {
    const parsed = JSON.parse(row.panels_json) as ComicWithProvenance;
    if (!parsed?.comic?.selection) return null; // record from an older format
    if (parsed.provenance.model) parsed.provenance.prompt = row.prompt_used;
    return parsed;
  } catch {
    return null;
  }
}

/** The selection of the comic the learner is looking at (pool or their latest generated one). */
export function findPreviousSelection(userId: string, topicId: string, currentId: unknown): Selection | null {
  if (typeof currentId !== "string") return null;
  const pool = getComicPool(topicId).find((c) => c.comic.id === currentId);
  if (pool) return pool.comic.selection;
  const latest = getLatestGenerated(userId, topicId);
  return latest && latest.comic.id === currentId ? latest.comic.selection : null;
}
