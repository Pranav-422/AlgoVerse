// Comic shape (SPEC §7) + schema validation. Client-safe: no server imports.

export interface Panel {
  n: number;
  scene: string;
  dialogue: string;
  concept: string;
  /** Public URL of the panel art, or null when no art exists for this panel. */
  image: string | null;
}

export interface Comic {
  id: string;
  title: string;
  topicId: string;
  conceptId: string;
  source: "pregenerated" | "generated";
  panels: Panel[];
}

/** Everything "How this was generated" needs for the comic currently on screen. */
export interface Provenance {
  source: "pregenerated" | "generated" | "handwritten" | "deterministic";
  model: string | null;
  /** The exact string sent to the model, or null if there was no prompt. */
  prompt: string | null;
  injectedFacts: string[];
  constraints: string[];
  feedback: { category: string; instruction: string } | null;
  note?: string;
  createdAt?: number;
}

export interface ComicWithProvenance {
  comic: Comic;
  provenance: Provenance;
}

const str = (v: unknown, field: string, max = 400): string => {
  if (typeof v !== "string" || !v.trim()) throw new Error(`${field} must be a non-empty string`);
  return v.trim().slice(0, max);
};

/** Validate model output for the script call. Throws on any mismatch. */
export function validateScript(
  v: unknown,
  limits: { min: number; max: number; maxWords: number },
): { title: string; conceptId: string; panels: Omit<Panel, "image">[] } {
  if (!v || typeof v !== "object") throw new Error("root must be an object");
  const o = v as Record<string, unknown>;
  if (!Array.isArray(o.panels)) throw new Error("panels must be an array");
  if (o.panels.length < limits.min || o.panels.length > limits.max)
    throw new Error(`expected ${limits.min}–${limits.max} panels, got ${o.panels.length}`);
  const panels = o.panels.map((p, i) => {
    if (!p || typeof p !== "object") throw new Error(`panel ${i + 1} must be an object`);
    const q = p as Record<string, unknown>;
    const dialogue = str(q.dialogue, `panels[${i}].dialogue`, 240);
    const words = dialogue.split(/\s+/).filter(Boolean).length;
    if (words > limits.maxWords + 4) throw new Error(`panel ${i + 1} dialogue has ${words} words`);
    return {
      n: i + 1,
      scene: str(q.scene, `panels[${i}].scene`),
      dialogue,
      concept: str(q.concept ?? "concept", `panels[${i}].concept`, 60),
    };
  });
  return {
    title: str(o.title ?? "Untitled", "title", 80),
    conceptId: str(o.conceptId ?? "general", "conceptId", 60),
    panels,
  };
}
