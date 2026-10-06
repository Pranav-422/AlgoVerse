import { getTopic } from "@/lib/knowledge";
import { currentUser } from "@/lib/session";
import { checkAndIncrementAttempt, refundAttempt } from "@/lib/db";
import { generateComic } from "@/lib/comicGen";
import { ok, fail, modelFailure, readJson } from "@/lib/api";

// Generate one comic live. Counts against the 3-per-24h cap.
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return fail("UNAUTHENTICATED", 401);
  const { topicId } = await readJson(req);
  const topic = typeof topicId === "string" ? getTopic(topicId) : null;
  if (!topic || !topic.formats.includes("comic")) return fail("UNKNOWN_TOPIC", 404);

  const cap = checkAndIncrementAttempt(user.id, topic.id);
  if (!cap.allowed) return ok({ denied: true, resetsAt: cap.resetsAt, remaining: 0 });

  try {
    const result = await generateComic(user.id, topic, null);
    return ok({ denied: false, remaining: cap.remaining, ...result });
  } catch (e) {
    refundAttempt(user.id, topic.id);
    return modelFailure(e);
  }
}
