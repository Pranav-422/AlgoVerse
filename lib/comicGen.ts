import "server-only";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { Topic } from "./knowledge";
import type { Comic, ComicWithProvenance, Provenance } from "./comic";
import { validateScript } from "./comic";
import { COMIC_STYLE } from "./styleGuide";
import type { FeedbackCategory } from "./feedbackMap";
import { buildComicScriptPrompt } from "./prompts";
import { generateJson, generatePanelImage, TEXT_MODEL, IMAGE_MODEL } from "./gemini";
import { saveComic, latestComic, DATA_DIR } from "./db";

// Comic pipeline: script call (text) → optional image calls (one per panel). Two steps, never one.

export const PANEL_DIR = path.join(DATA_DIR, "panels");
const REF_IMAGE = path.join(process.cwd(), "public", COMIC_STYLE.character.refImage);

/** Image generation stays off until the Phase 5 identity spike passes and COMIC_IMAGES=on. */
export function imagesEnabled() {
  return process.env.COMIC_IMAGES === "on" && fs.existsSync(REF_IMAGE);
}

export async function generateComic(
  userId: string,
  topic: Topic,
  feedback: FeedbackCategory | null,
): Promise<ComicWithProvenance> {
  const built = buildComicScriptPrompt(topic, feedback);
  const limits =
    feedback === "too complex"
      ? { min: 4, max: 4, maxWords: 12 }
      : { min: COMIC_STYLE.panelCount.min, max: COMIC_STYLE.panelCount.max, maxWords: COMIC_STYLE.dialogueMaxWords };

  const script = await generateJson(built.prompt, (v) => validateScript(v, limits));
  const comicId = crypto.randomUUID();

  let images: (string | null)[] = script.panels.map(() => null);
  let imageNote: string | undefined;
  if (imagesEnabled()) {
    const reference = { data: fs.readFileSync(REF_IMAGE), mimeType: "image/png" };
    fs.mkdirSync(PANEL_DIR, { recursive: true });
    images = await Promise.all(
      script.panels.map(async (p) => {
        try {
          const img = await generatePanelImage(reference, p.scene, COMIC_STYLE.art);
          const file = `${comicId}-${p.n}.png`;
          fs.writeFileSync(path.join(PANEL_DIR, file), img.data);
          return `/api/comic/panel/${file}`;
        } catch {
          return null;
        }
      }),
    );
    if (images.some((i) => i === null)) imageNote = "Some panel images failed and are shown as scene text.";
  } else {
    imageNote =
      "Panel images are not generated in this build (image identity spike pending). Panels show the generated scene text.";
  }

  const comic: Comic = {
    id: comicId,
    title: script.title,
    topicId: topic.id,
    conceptId: script.conceptId,
    source: "generated",
    panels: script.panels.map((p, i) => ({ ...p, image: images[i] })),
  };

  const provenance: Provenance = {
    source: "generated",
    model: imagesEnabled() ? `${TEXT_MODEL} (script) + ${IMAGE_MODEL} (panels)` : TEXT_MODEL,
    prompt: built.prompt,
    injectedFacts: built.injectedFacts,
    constraints: built.constraints,
    feedback: built.feedback,
    note: imageNote,
    createdAt: Date.now(),
  };

  saveComic(userId, topic.id, { comic, provenance }, built.prompt);
  return { comic, provenance };
}

export function getLatestGenerated(userId: string, topicId: string): ComicWithProvenance | null {
  const row = latestComic(userId, topicId);
  if (!row) return null;
  try {
    const parsed = JSON.parse(row.panels_json) as ComicWithProvenance;
    // prompt_used is the source of truth for what was sent.
    parsed.provenance.prompt = row.prompt_used;
    return parsed;
  } catch {
    return null;
  }
}
