import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { Comic, ComicWithProvenance } from "./comic";
import { styleConstraints } from "./styleGuide";

// The pre-made comic pool shipped with the app (content/comics/<topic>/*.json).

interface PoolFile extends Comic {
  authoring?: "handwritten" | "generated";
  promptUsed?: string;
  model?: string;
}

export function getComicPool(topicId: string): ComicWithProvenance[] {
  const dir = path.join(process.cwd(), "content", "comics", topicId);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => {
      const raw = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) as PoolFile;
      const { authoring, promptUsed, model, ...comic } = raw;
      const handwritten = authoring !== "generated" || !promptUsed;
      return {
        comic,
        provenance: handwritten
          ? {
              source: "handwritten" as const,
              model: null,
              prompt: null,
              injectedFacts: [],
              constraints: styleConstraints(),
              feedback: null,
              note: "This comic was written by hand to the same style guide. No model produced it, so there is no prompt to show.",
            }
          : {
              source: "pregenerated" as const,
              model: model ?? null,
              prompt: promptUsed,
              injectedFacts: [],
              constraints: styleConstraints(),
              feedback: null,
            },
      };
    });
}
