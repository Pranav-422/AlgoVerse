import "server-only";
import crypto from "node:crypto";
import type { Topic } from "./knowledge";
import type { ComicWithProvenance, Provenance, Selection } from "./comic";
import type { FeedbackCategory } from "./feedbackMap";
import { loadKit, loadBank, buildPickPrompt, parseSelection, checkSelection, fallbackPick, resolveComic, factsFor } from "./comicKit";
import { generateJson, ModelError, TEXT_MODEL } from "./gemini";
import { saveComic, latestComic } from "./db";
import { getComicPool } from "./comicPool";

// Comic pipeline: ONE bounded model call that picks ids from the kit → rule check →
// (on failure) rule-based fallback → resolve into panels. The model never writes text.

export async function generateComic(
  userId: string,
  topic: Topic,
  feedback: FeedbackCategory | null,
  previous: Selection | null,
): Promise<ComicWithProvenance> {
  const kit = loadKit();
  const bank = loadBank(topic.id);
  if (!bank) throw new ModelError("BAD_OUTPUT", `No dialogue bank for ${topic.id}`);

  const built = buildPickPrompt(topic.name, kit, bank, feedback, previous);
  let selection: Selection;
  let model: string | null = TEXT_MODEL;
  let note: string | undefined;

  try {
    // generateJson retries once on malformed or rule-breaking output.
    selection = await generateJson(built.prompt, (raw) => {
      const sel = parseSelection(raw);
      const errs = checkSelection(sel, kit, bank, feedback, previous);
      if (errs.length) throw new Error(errs.join("; "));
      return sel;
    });
  } catch (e) {
    const reason =
      e instanceof ModelError
        ? e.code === "NO_KEY"
          ? "no Gemini API key is configured"
          : e.code === "TIMEOUT"
            ? "the model timed out"
            : `the model's answer was rejected (${e.message})`
        : String(e);
    selection = fallbackPick(kit, bank, feedback, previous);
    model = null;
    note = `Picked by the rule-based fallback because ${reason}. It follows the same kit rules and feedback constraints; no model was called successfully.`;
  }

  const id = crypto.randomUUID();
  const comic = resolveComic(selection, kit, bank, { id, source: "generated" });
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
  };
  // prompt_used keeps the prompt even for fallback picks, so the record shows what would have been sent.
  saveComic(userId, topic.id, { comic, provenance }, built.prompt);
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
