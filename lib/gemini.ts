import "server-only";
import { GoogleGenAI } from "@google/genai";
import type { Tracer } from "./trace";

// The only module that holds an API key or makes an outbound model call.
// Each request is one bounded step: fixed prompt in, result out, a timeout per attempt,
// and at most TWO attempts in total (the first try plus one retry). Never more.

export const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-3.8-flash";
/** If the first model is overloaded (503) or rate-limited (429), the one retry goes to the next model. */
export const MODEL_CHAIN = (process.env.GEMINI_TEXT_MODELS || `${TEXT_MODEL},gemini-3.5-flash-lite,gemini-3.6-flash`)
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);
const isBusy = (msg: string) => /(503|429)|UNAVAILABLE|RESOURCE_EXHAUSTED|high demand|quota/i.test(msg);
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
async function callModel(prompt: string, opts: { json?: boolean; temperature?: number }, model = TEXT_MODEL): Promise<string> {
  const ai = getClient();
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TEXT_TIMEOUT_MS);
  try {
    const res = await ai.models.generateContent({
      model,
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
  /** The model that produced the accepted answer. */
  model: string;
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
export async function runJson<T>(
  prompt: string,
  validate: (v: unknown) => T,
  trace?: Tracer,
  label = "model call",
  /** Offline scripts only: a different model chain / attempt budget. The app never passes this. */
  override?: { models?: string[]; maxAttempts?: number },
): Promise<{ value: T } & RunInfo> {
  return runAttempts(prompt, { json: true, ...override }, (raw) => {
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
  opts: { json: boolean; temperature?: number; models?: string[]; maxAttempts?: number },
  accept: (raw: string) => T,
  trace: Tracer | undefined,
  label: string,
): Promise<{ value: T } & RunInfo> {
  // Budget: at most `maxAttempts` (2) model ANSWERS are judged. A model that is busy or
  // rate-limited (503/429) gives no answer; it is skipped along the fixed model chain without
  // using up an answer attempt. Every other failure (timeout, network) uses an attempt.
  const rejected: string[] = [];
  const chain = opts.models?.length ? opts.models : MODEL_CHAIN;
  const maxAttempts = opts.maxAttempts ?? MAX_ATTEMPTS;
  let modelIdx = 0;
  let attempt = 0;
  let calls = 0;
  while (attempt < maxAttempts && modelIdx < chain.length) {
    const model = chain[modelIdx];
    const start = Date.now();
    calls++;
    let raw: string;
    try {
      raw = await callModel(prompt, opts, model);
    } catch (e) {
      const err = e instanceof ModelError ? e : new ModelError("UPSTREAM", String(e));
      if (err.code === "NO_KEY") {
        trace?.add(`${label} (${model})`, "fail", Date.now() - start, err.message);
        throw err;
      }
      const busy = isBusy(err.message);
      if (busy) modelIdx++;
      else attempt++;
      const exhausted = attempt >= maxAttempts || modelIdx >= chain.length;
      trace?.add(`${label} call ${calls} (${model})`, exhausted ? "fail" : "retry", Date.now() - start, `${busy ? "busy/rate-limited, skipping to next model: " : ""}${err.message.slice(0, 160)}`);
      rejected.push(`${model}: ${busy ? "busy/rate-limited" : err.message.slice(0, 120)}`);
      if (exhausted) throw err;
      continue;
    }
    attempt++;
    trace?.add(`${label} call ${calls} (${model})`, "ok", Date.now() - start, `${raw.length} chars`);
    try {
      const value = accept(raw);
      trace?.add("rule check", "ok", 0, "answer accepted");
      return { value, attempts: attempt, rejected, model };
    } catch (e) {
      const why = e instanceof Error ? e.message : String(e);
      rejected.push(why);
      const last = attempt >= maxAttempts;
      trace?.add("rule check", last ? "fail" : "retry", 0, why);
      if (last) throw new ModelError("BAD_OUTPUT", why);
    }
  }
  throw new ModelError("UPSTREAM", "every model in the chain is busy or rate-limited right now");
}
