import { currentUser } from "@/lib/session";
import { getTopic } from "@/lib/knowledge";
import { getArm, getChecks, getProgress, recordCheck } from "@/lib/db";
import { checkQuestions } from "@/lib/topicPage";
import { ok, fail, readJson } from "@/lib/api";

// Grade a before/after check here; the page never receives the answers.
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return fail("UNAUTHENTICATED", 401);
  const { topicId, phase, answers } = await readJson(req);
  if (typeof topicId !== "string" || (phase !== "pre" && phase !== "post") || !Array.isArray(answers)) return fail("INVALID", 400);
  const questions = getTopic(topicId) ? checkQuestions(topicId) : [];
  if (!questions.length || answers.length !== questions.length) return fail("INVALID", 400);
  // Once another format is open, or a first score exists, a new "before" score would not measure the starting point.
  if (phase === "pre" && (getProgress(user.id)[topicId] ?? []).some((f) => f !== "brief")) return fail("TOO_LATE", 409);
  if (phase === "pre" && getChecks(user.id, topicId).pre) return fail("ALREADY_TAKEN", 409);
  // In the study, a retake after opening more formats would mix groups, so the first after score stays.
  if (phase === "post" && getArm(user.id) && getChecks(user.id, topicId).post) return fail("ALREADY_TAKEN", 409);
  const correct = questions.map((q, i) => answers[i] === q.answer);
  const score = correct.filter(Boolean).length;
  recordCheck(user.id, topicId, phase, score, questions.length);
  return ok({ score, total: questions.length, correct });
}
