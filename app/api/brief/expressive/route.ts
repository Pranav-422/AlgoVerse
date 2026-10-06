import { getTopic } from "@/lib/knowledge";
import { currentUser } from "@/lib/session";
import { buildExpressivePrompt } from "@/lib/prompts";
import { generateText, TEXT_MODEL } from "@/lib/gemini";
import { ok, fail, modelFailure, readJson } from "@/lib/api";

// Rewrite the brief summary in richer language, facts held fixed.
export async function POST(req: Request) {
  if (!(await currentUser())) return fail("UNAUTHENTICATED", 401);
  const { topicId } = await readJson(req);
  const topic = typeof topicId === "string" ? getTopic(topicId) : null;
  if (!topic || topic.status === "soon") return fail("UNKNOWN_TOPIC", 404);

  const built = buildExpressivePrompt(topic);
  try {
    const summary = await generateText(built.prompt, { temperature: 0.9 });
    return ok({
      summary,
      provenance: {
        source: "generated",
        model: TEXT_MODEL,
        prompt: built.prompt,
        injectedFacts: built.injectedFacts,
        constraints: built.constraints,
        feedback: null,
        createdAt: Date.now(),
      },
    });
  } catch (e) {
    return modelFailure(e);
  }
}
