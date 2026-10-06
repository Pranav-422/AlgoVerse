import "server-only";
import { NextResponse } from "next/server";
import { ModelError } from "./gemini";

// All routes return { ok: true, data } or { ok: false, error, detail? } (SPEC §8).

export const ok = <T,>(data: T, init?: ResponseInit) => NextResponse.json({ ok: true, data }, init);

export const fail = (error: string, status = 400, detail?: unknown) =>
  NextResponse.json({ ok: false, error, ...(detail !== undefined ? { detail } : {}) }, { status });

export function modelFailure(e: unknown) {
  if (e instanceof ModelError) {
    const status = e.code === "NO_KEY" ? 503 : e.code === "TIMEOUT" ? 504 : 502;
    return fail(e.code, status, e.message);
  }
  return fail("UNKNOWN", 500, e instanceof Error ? e.message : String(e));
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const body = await req.json();
    return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
