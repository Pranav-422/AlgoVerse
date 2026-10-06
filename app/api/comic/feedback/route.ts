import { getTopic } from "@/lib/knowledge";
import { currentUser } from "@/lib/session";
import { checkAndIncrementAttempt, recordFeedback, refundAttempt } from "@/lib/db";
import { isFeedbackCategory } from "@/lib/feedbackMap";
import { generateComic } from "@/lib/comicGen";
import { ok, fail, modelFailure, readJson } from "@/lib/api";

// Record a feedback category, then regenerate with its fixed adjustment.
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return fail("UNAUTHENTICATED", 401);
  const { topicId, category } = await readJson(req);
  const topic = typeof topicId === "string" ? getTopic(topicId) : null;
  if (!topic || !topic.formats.includes("comic")) return fail("UNKNOWN_TOPIC", 404);
  if (!isFeedbackCategory(category)) return fail("UNKNOWN_CATEGORY", 400);

  recordFeedback(user.id, topic.id, "comic", category);

  const cap = checkAndIncrementAttempt(user.id, topic.id);
  if (!cap.allowed) return ok({ denied: true, resetsAt: cap.resetsAt, remaining: 0 });

  try {
    const result = await generateComic(user.id, topic, category);
    return ok({ denied: false, remaining: cap.remaining, ...result });
  } catch (e) {
    refundAttempt(user.id, topic.id);
    return modelFailure(e);
  }
}
