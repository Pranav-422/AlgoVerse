import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ensureUser, type User } from "./db";

// Mock auth: the cookie holds "<user id>|<email>". No passwords, no session server (PRD §4.1).
// Carrying the email lets any server instance re-create the user row if its local
// database does not have it (on Vercel each function instance has its own /tmp).

export const COOKIE = "av_uid";

export const cookieValue = (user: User) => `${user.id}|${encodeURIComponent(user.email)}`;

export async function currentUser(): Promise<User | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  const [id, email] = raw.split("|");
  if (!id || !email) return null;
  return ensureUser(id, decodeURIComponent(email));
}

export async function requireUser(): Promise<User> {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}
