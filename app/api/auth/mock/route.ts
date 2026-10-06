import { cookies } from "next/headers";
import { findOrCreateUser } from "@/lib/db";
import { COOKIE } from "@/lib/session";
import { ok, fail, readJson } from "@/lib/api";

// Mock sign-in: any email works, the password is never checked (PRD §4.1).
export async function POST(req: Request) {
  const body = await readJson(req);
  const guest = body.guest === true;
  const email = guest ? `guest-${Date.now()}@algoverse.local` : String(body.email ?? "").trim().toLowerCase();
  if (!guest && !/^\S+@\S+\.\S+$/.test(email)) return fail("INVALID_EMAIL", 400, "Enter an email address.");

  const user = findOrCreateUser(email);
  (await cookies()).set(COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return ok({ userId: user.id, email: user.email });
}

export async function DELETE() {
  (await cookies()).delete(COOKIE);
  return ok({ signedOut: true });
}
