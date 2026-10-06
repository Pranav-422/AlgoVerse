import { currentUser } from "@/lib/session";
import { getTopic } from "@/lib/knowledge";
import { loadBank } from "@/lib/comicKit";
import { recordQuiz } from "@/lib/db";
import { ok, fail, readJson } from "@/lib/api";

// Record one "Check yourself" answer. The latest answer per arc counts toward mastery.
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return fail("UNAUTHENTICATED", 401);
  const { topicId, arcId, correct } = await readJson(req);
  if (typeof topicId !== "string" || typeof arcId !== "string" || typeof correct !== "boolean") return fail("INVALID", 400);
  if (!getTopic(topicId) || !loadBank(topicId)?.arcs.some((a) => a.id === arcId)) return fail("UNKNOWN_ARC", 404);
  recordQuiz(user.id, topicId, arcId, correct);
  return ok({ recorded: true });
}
