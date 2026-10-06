import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { ComicWithProvenance, Selection } from "./comic";
import { loadKit, loadBank, resolveComic, factsFor, SELECTION_RULES } from "./comicKit";
import { getTopic } from "./knowledge";

// Pre-made comics: selections hand-picked from the same kit (content/comics/<topic>/*.json).

interface PoolFile {
  id: string;
  authoring: "handpicked" | "generated";
  selection: Selection;
  promptUsed?: string;
  model?: string;
}

export function getComicPool(topicId: string): ComicWithProvenance[] {
  const dir = path.join(process.cwd(), "content", "comics", topicId);
  const bank = loadBank(topicId);
  if (!bank || !fs.existsSync(dir)) return [];
  const kit = loadKit();
  const facts = getTopic(topicId)?.coreFacts ?? [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => {
      const raw = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) as PoolFile;
      const comic = resolveComic(raw.selection, kit, bank, { id: raw.id, source: "pregenerated" });
      const handpicked = raw.authoring !== "generated" || !raw.promptUsed;
      return {
        comic,
        provenance: {
          source: handpicked ? ("handwritten" as const) : ("pregenerated" as const),
          model: handpicked ? null : (raw.model ?? null),
          prompt: handpicked ? null : raw.promptUsed!,
          injectedFacts: factsFor(raw.selection, bank, facts),
          constraints: SELECTION_RULES,
          feedback: null,
          selection: raw.selection,
          note: handpicked
            ? "These picks were chosen by hand from the same kit the model uses. No model produced them, so there is no prompt to show."
            : undefined,
        },
      };
    });
}
