import "server-only";
import { GoogleGenAI } from "@google/genai";

// The only module that holds an API key or makes an outbound model call.
// Each call is one bounded step: fixed prompt in, result out, a timeout, and at most one retry.

export const TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || "gemini-2.5-flash";

export const TEXT_TIMEOUT_MS = 20_000;

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
  if (!apiKey) throw new ModelError("NO_KEY", "GEMINI_API_KEY is not set in .env.local");
  client ??= new GoogleGenAI({ apiKey });
  return client;
}

export function hasKey() {
  return Boolean(process.env.GEMINI_API_KEY);
}

async function withTimeout<T>(ms: number, run: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    return await run(ctl.signal);
  } catch (e) {
    if (ctl.signal.aborted) throw new ModelError("TIMEOUT", `Model call exceeded ${ms / 1000}s`);
    if (e instanceof ModelError) throw e;
    throw new ModelError("UPSTREAM", e instanceof Error ? e.message : String(e));
  } finally {
    clearTimeout(timer);
  }
}

/** One attempt, then one retry on failure. Never more. */
async function once<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ModelError && e.code === "NO_KEY") throw e;
    return fn();
  }
}

export async function generateText(prompt: string, opts: { json?: boolean; temperature?: number } = {}): Promise<string> {
  const ai = getClient();
  return once(() =>
    withTimeout(TEXT_TIMEOUT_MS, async (abortSignal) => {
      const res = await ai.models.generateContent({
        model: TEXT_MODEL,
        contents: prompt,
        config: {
          abortSignal,
          temperature: opts.temperature ?? 0.8,
          ...(opts.json ? { responseMimeType: "application/json" } : {}),
        },
      });
      const text = res.text?.trim();
      if (!text) throw new ModelError("BAD_OUTPUT", "Model returned no text");
      return text;
    }),
  );
}

/**
 * Generate a JSON value and validate it. Malformed output gets one retry, then fails visibly.
 */
export async function generateJson<T>(prompt: string, validate: (v: unknown) => T): Promise<T> {
  const attempt = async () => {
    const text = await generateText(prompt, { json: true });
    try {
      return validate(JSON.parse(text));
    } catch (e) {
      throw new ModelError("BAD_OUTPUT", `Script did not match the schema: ${e instanceof Error ? e.message : e}`);
    }
  };
  try {
    return await attempt();
  } catch (e) {
    if (e instanceof ModelError && e.code === "BAD_OUTPUT") return attempt();
    throw e;
  }
}
