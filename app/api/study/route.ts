import { currentUser } from "@/lib/session";
import { joinStudy, leaveStudy } from "@/lib/db";
import { ok, fail } from "@/lib/api";

// Join the classroom study (the server picks the group) or leave it.
export async function POST() {
  const user = await currentUser();
  if (!user) return fail("UNAUTHENTICATED", 401);
  return ok({ arm: joinStudy(user.id) });
}

export async function DELETE() {
  const user = await currentUser();
  if (!user) return fail("UNAUTHENTICATED", 401);
  leaveStudy(user.id);
  return ok({ arm: null });
}
