import { getTopic } from "@/lib/knowledge";
import { currentUser } from "@/lib/session";
import { buildRewritePrompt, type RewriteMode } from "@/lib/prompts";
import { runText, ModelError, TEXT_MODEL } from "@/lib/gemini";
import { guardRewrite } from "@/lib/factGuard";
import { logGeneration } from "@/lib/db";
import { Tracer } from "@/lib/trace";
import { ok, fail, modelFailure, readJson } from "@/lib/api";

// Rewrite the brief summary (more expressive, or Hinglish) with facts held fixed.
// The fact guard rejects any rewrite that introduces a number or Big-O not in the knowledge file;
// a rejected first answer gets the one retry, after which the original summary stays on screen.
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return fail("UNAUTHENTICATED", 401);
  const { topicId, mode: rawMode } = await readJson(req);
  const mode: RewriteMode = rawMode === "hinglish" ? "hinglish" : "expressive";
  const topic = typeof topicId === "string" ? getTopic(topicId) : null;
  if (!topic || topic.status === "soon") return fail("UNKNOWN_TOPIC", 404);

  const tracer = new Tracer();
  const built = await tracer.time(`prompt built (${mode})`, () => buildRewritePrompt(topic, mode), (b) => `${b.prompt.length} chars · ${b.injectedFacts.length} facts`);
  const sources = [topic.summary, ...topic.coreFacts];
  let lastGuard = { ok: false, newClaims: [] as string[], checked: 0 };

  try {
    const res = await runText(
      built.prompt,
      {
        temperature: 0.9,
        label: "Gemini rewrite",
        check: (text) => {
          lastGuard = guardRewrite(text, sources);
          if (!lastGuard.ok) throw new Error(`fact guard: new claim(s) ${lastGuard.newClaims.join(", ")}`);
        },
      },
      tracer,
    );
    tracer.add("fact guard", "ok", 0, `${lastGuard.checked} claim(s) checked, none new`);
    logGeneration({
      userId: user.id,
      topicId: topic.id,
      kind: mode,
      model: TEXT_MODEL,
      outcome: res.attempts > 1 ? "after_retry" : "first_try",
      reason: res.rejected.join(" | ") || null,
      attempts: res.attempts,
      latencyMs: tracer.total(),
      trace: tracer.steps,
    });
    return ok({
      summary: res.text,
      mode,
      provenance: {
        source: "generated",
        model: TEXT_MODEL,
        prompt: built.prompt,
        injectedFacts: built.injectedFacts,
        constraints: built.constraints,
        feedback: null,
        createdAt: Date.now(),
        trace: tracer.steps,
        guard: lastGuard,
      },
    });
  } catch (e) {
    const err = e instanceof ModelError ? e : null;
    logGeneration({
      userId: user.id,
      topicId: topic.id,
      kind: mode,
      model: err?.code === "NO_KEY" ? null : TEXT_MODEL,
      outcome: "error",
      reason: e instanceof Error ? e.message : String(e),
      attempts: err?.code === "NO_KEY" ? 0 : 2,
      latencyMs: tracer.total(),
      trace: tracer.steps,
    });
    if (err?.code === "BAD_OUTPUT" && !lastGuard.ok && lastGuard.newClaims.length) {
      return fail("FACT_GUARD", 422, `Both rewrites added claims that are not in the knowledge file (${lastGuard.newClaims.join(", ")}), so they were discarded. The original summary is kept.`);
    }
    return modelFailure(e);
  }
}
