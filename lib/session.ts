import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUser, type User } from "./db";

// Mock auth: the cookie just holds a user id. No passwords, no session server (PRD §4.1).

export const COOKIE = "av_uid";

export async function currentUser(): Promise<User | null> {
  const uid = (await cookies()).get(COOKIE)?.value;
  return uid ? getUser(uid) : null;
}

export async function requireUser(): Promise<User> {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}
