import "server-only";
import { GoogleGenAI } from "@google/genai";
import type { Tracer } from "./trace";

// The only module that holds an API key or makes an outbound model call.
// Each request is one bounded step: fixed prompt in, result out, a timeout per attempt,
// and at most TWO attempts in total (the first try plus one retry). Never more.

export const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";
export const TEXT_TIMEOUT_MS = 20_000;
const MAX_ATTEMPTS = 2;

export class ModelError extends Error {
  constructor(
    public code: "NO_KEY" | "TIMEOUT" | "BAD_OUTPUT" | "UPSTREAM",
    message: string,
  ) {
    super(message);
  }
}

let client: GoogleGenAI | null = null;
function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new ModelError("NO_KEY", "GEMINI_API_KEY is not set");
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

export function hasKey() {
  return Boolean(process.env.GEMINI_API_KEY);
}

/** One HTTP call to the model with a timeout. No retry here. */
async function callModel(prompt: string, opts: { json?: boolean; temperature?: number }): Promise<string> {
  const ai = getClient();
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TEXT_TIMEOUT_MS);
  try {
    const res = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        abortSignal: ctl.signal,
        temperature: opts.temperature ?? 0.8,
        ...(opts.json ? { responseMimeType: "application/json" } : {}),
      },
    });
    const text = res.text?.trim();
    if (!text) throw new ModelError("BAD_OUTPUT", "Model returned no text");
    return text;
  } catch (e) {
    if (ctl.signal.aborted) throw new ModelError("TIMEOUT", `Model call exceeded ${TEXT_TIMEOUT_MS / 1000}s`);
    if (e instanceof ModelError) throw e;
    throw new ModelError("UPSTREAM", e instanceof Error ? e.message : String(e));
  } finally {
    clearTimeout(timer);
  }
}

export interface RunInfo {
  attempts: number;
  /** Why earlier attempts were rejected (validation errors, timeouts…). */
  rejected: string[];
}

/**
 * Text generation with at most two attempts. `check` may throw to reject an answer
 * (e.g. a fact-guard failure); a rejected first answer gets the one retry.
 */
export async function runText(
  prompt: string,
  opts: { temperature?: number; check?: (text: string) => void; label?: string },
  trace?: Tracer,
): Promise<{ text: string } & RunInfo> {
  return runAttempts(prompt, { json: false, temperature: opts.temperature }, (raw) => {
    opts.check?.(raw);
    return raw;
  }, trace, opts.label ?? "model call").then(({ value, ...info }) => ({ text: value, ...info }));
}

/** JSON generation with at most two attempts; `validate` parses and rule-checks the answer. */
export async function runJson<T>(prompt: string, validate: (v: unknown) => T, trace?: Tracer, label = "model call"): Promise<{ value: T } & RunInfo> {
  return runAttempts(prompt, { json: true }, (raw) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new ModelError("BAD_OUTPUT", "answer was not valid JSON");
    }
    return validate(parsed);
  }, trace, label);
}

async function runAttempts<T>(
  prompt: string,
  opts: { json: boolean; temperature?: number },
  accept: (raw: string) => T,
  trace: Tracer | undefined,
  label: string,
): Promise<{ value: T } & RunInfo> {
  const rejected: string[] = [];
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const last = attempt === MAX_ATTEMPTS;
    const start = Date.now();
    let raw: string;
    try {
      raw = await callModel(prompt, opts);
    } catch (e) {
      const err = e instanceof ModelError ? e : new ModelError("UPSTREAM", String(e));
      trace?.add(`${label} #${attempt}`, err.code === "NO_KEY" || last ? "fail" : "retry", Date.now() - start, err.message);
      if (err.code === "NO_KEY" || last) throw err;
      rejected.push(err.message);
      continue;
    }
    trace?.add(`${label} #${attempt}`, "ok", Date.now() - start, `${TEXT_MODEL}, ${raw.length} chars`);
    try {
      const value = accept(raw);
      trace?.add("rule check", "ok", 0, "answer accepted");
      return { value, attempts: attempt, rejected };
    } catch (e) {
      const why = e instanceof Error ? e.message : String(e);
      rejected.push(why);
      trace?.add("rule check", last ? "fail" : "retry", 0, why);
      if (last) throw new ModelError("BAD_OUTPUT", why);
    }
  }
  throw new ModelError("BAD_OUTPUT", "no attempts left");
}
