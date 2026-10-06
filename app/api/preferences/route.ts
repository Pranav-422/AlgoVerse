import { currentUser } from "@/lib/session";
import { savePreferences, type Preferences } from "@/lib/db";
import { ok, fail, readJson } from "@/lib/api";

// Save the learner's three stated preferences. They steer which comic is shown first and
// are passed to the comic picker as guidance (never as hard rules).
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return fail("UNAUTHENTICATED", 401);
  const b = await readJson(req);
  const length = b.length === "short" || b.length === "detailed" ? b.length : null;
  const style = b.style === "visual" || b.style === "worded" ? b.style : null;
  const pace = b.pace === "step" || b.pace === "story" ? b.pace : null;
  if (!length || !style || !pace) return fail("INVALID_PREFERENCES", 400);
  const prefs: Preferences = { length, style, pace };
  savePreferences(user.id, prefs);
  return ok(prefs);
}
