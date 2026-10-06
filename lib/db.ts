import "server-only";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import Database from "better-sqlite3";
import type { Format } from "./knowledge";

// SQLite, created on first run. Single file, no server to run at demo time.

// On Vercel the deployment is read-only; /tmp is the only writable place (and it is wiped
// when the instance is recycled). Locally the database lives in ./data.
export const DATA_DIR = process.env.VERCEL ? "/tmp/algoverse" : path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "algoverse.db");

export const CAP = 3;
export const WINDOW_MS = 24 * 60 * 60 * 1000;

const g = globalThis as unknown as { __algoverseDb?: Database.Database };

function open(): Database.Database {
  if (g.__algoverseDb) return g.__algoverseDb;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      email       TEXT UNIQUE NOT NULL,
      created_at  INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS comic_attempts (
      user_id         TEXT NOT NULL,
      topic_id        TEXT NOT NULL,
      attempt_count   INTEGER NOT NULL DEFAULT 0,
      last_attempt_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, topic_id)
    );
    CREATE TABLE IF NOT EXISTS feedback_events (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL,
      topic_id   TEXT NOT NULL,
      module     TEXT NOT NULL,
      category   TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS generated_comics (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      topic_id    TEXT NOT NULL,
      panels_json TEXT NOT NULL,
      prompt_used TEXT NOT NULL,
      created_at  INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS gen_log (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      topic_id    TEXT NOT NULL,
      kind        TEXT NOT NULL,      -- 'comic' | 'expressive' | 'hinglish'
      model       TEXT,               -- null when the fallback produced the result
      outcome     TEXT NOT NULL,      -- 'first_try' | 'after_retry' | 'fallback' | 'error'
      reason      TEXT,               -- why it retried / fell back / failed
      feedback    TEXT,
      attempts    INTEGER NOT NULL,
      latency_ms  INTEGER NOT NULL,
      trace_json  TEXT NOT NULL,
      created_at  INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS quiz_results (
      user_id     TEXT NOT NULL,
      topic_id    TEXT NOT NULL,
      arc_id      TEXT NOT NULL,
      correct     INTEGER NOT NULL,
      answered_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, topic_id, arc_id)
    );
    CREATE TABLE IF NOT EXISTS preferences (
      user_id     TEXT PRIMARY KEY,
      length      TEXT NOT NULL,      -- 'short' | 'detailed'
      style       TEXT NOT NULL,      -- 'visual' | 'worded'
      pace        TEXT NOT NULL,      -- 'step' | 'story'
      updated_at  INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS progress (
      user_id   TEXT NOT NULL,
      topic_id  TEXT NOT NULL,
      format    TEXT NOT NULL,
      opened_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, topic_id, format)
    );
  `);
  g.__algoverseDb = db;
  return db;
}

const id = () => crypto.randomUUID();

// --- users -------------------------------------------------------------------

export interface User {
  id: string;
  email: string;
  created_at: number;
}

export function findOrCreateUser(email: string): User {
  const db = open();
  const existing = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as User | undefined;
  if (existing) return existing;
  const user: User = { id: id(), email, created_at: Date.now() };
  db.prepare("INSERT INTO users (id, email, created_at) VALUES (@id, @email, @created_at)").run(user);
  return user;
}

/** Look a user up by id; if this instance's database lacks the row, recreate it. */
export function ensureUser(userId: string, email: string): User {
  const db = open();
  const found = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as User | undefined;
  if (found) return found;
  const user: User = { id: userId, email, created_at: Date.now() };
  db.prepare("INSERT OR IGNORE INTO users (id, email, created_at) VALUES (@id, @email, @created_at)").run(user);
  return (db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as User | undefined) ?? user;
}

// --- progress ----------------------------------------------------------------

export function markProgress(userId: string, topicId: string, format: Format) {
  open()
    .prepare(
      "INSERT INTO progress (user_id, topic_id, format, opened_at) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING",
    )
    .run(userId, topicId, format, Date.now());
}

/** topicId → formats opened */
export function getProgress(userId: string): Record<string, Format[]> {
  const rows = open().prepare("SELECT topic_id, format FROM progress WHERE user_id = ?").all(userId) as {
    topic_id: string;
    format: Format;
  }[];
  const out: Record<string, Format[]> = {};
  for (const r of rows) (out[r.topic_id] ??= []).push(r.format);
  return out;
}

// --- regeneration cap (SPEC §6) ------------------------------------------------

export type CapResult = { allowed: true; remaining: number } | { allowed: false; remaining: 0; resetsAt: number };

interface AttemptRow {
  attempt_count: number;
  last_attempt_at: number;
}

export function checkAndIncrementAttempt(userId: string, topicId: string, now = Date.now()): CapResult {
  const db = open();
  const row = db
    .prepare("SELECT attempt_count, last_attempt_at FROM comic_attempts WHERE user_id = ? AND topic_id = ?")
    .get(userId, topicId) as AttemptRow | undefined;

  if (!row) {
    db.prepare(
      "INSERT INTO comic_attempts (user_id, topic_id, attempt_count, last_attempt_at) VALUES (?, ?, 1, ?)",
    ).run(userId, topicId, now);
    return { allowed: true, remaining: CAP - 1 };
  }
  if (now - row.last_attempt_at > WINDOW_MS) {
    db.prepare(
      "UPDATE comic_attempts SET attempt_count = 1, last_attempt_at = ? WHERE user_id = ? AND topic_id = ?",
    ).run(now, userId, topicId);
    return { allowed: true, remaining: CAP - 1 };
  }
  if (row.attempt_count >= CAP) {
    return { allowed: false, remaining: 0, resetsAt: row.last_attempt_at + WINDOW_MS };
  }
  db.prepare(
    "UPDATE comic_attempts SET attempt_count = attempt_count + 1, last_attempt_at = ? WHERE user_id = ? AND topic_id = ?",
  ).run(now, userId, topicId);
  return { allowed: true, remaining: CAP - row.attempt_count - 1 };
}

/** Give an attempt back when generation failed before producing anything. */
export function refundAttempt(userId: string, topicId: string) {
  open()
    .prepare(
      "UPDATE comic_attempts SET attempt_count = MAX(attempt_count - 1, 0) WHERE user_id = ? AND topic_id = ?",
    )
    .run(userId, topicId);
}

/** Read-only view for showing remaining attempts before the learner presses anything. */
export function attemptStatus(userId: string, topicId: string, now = Date.now()) {
  const row = open()
    .prepare("SELECT attempt_count, last_attempt_at FROM comic_attempts WHERE user_id = ? AND topic_id = ?")
    .get(userId, topicId) as AttemptRow | undefined;
  if (!row || now - row.last_attempt_at > WINDOW_MS) return { remaining: CAP, resetsAt: null as number | null };
  const remaining = Math.max(CAP - row.attempt_count, 0);
  return { remaining, resetsAt: remaining === 0 ? row.last_attempt_at + WINDOW_MS : null };
}

// --- feedback ----------------------------------------------------------------

export function recordFeedback(userId: string, topicId: string, module: "comic" | "brief", category: string) {
  open()
    .prepare(
      "INSERT INTO feedback_events (id, user_id, topic_id, module, category, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .run(id(), userId, topicId, module, category, Date.now());
}

// --- generated comics --------------------------------------------------------

export interface StoredComic {
  id: string;
  panels_json: string;
  prompt_used: string;
  created_at: number;
}

export function saveComic(userId: string, topicId: string, comic: unknown, promptUsed: string): string {
  const cid = id();
  open()
    .prepare(
      "INSERT INTO generated_comics (id, user_id, topic_id, panels_json, prompt_used, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .run(cid, userId, topicId, JSON.stringify(comic), promptUsed, Date.now());
  return cid;
}

export function latestComic(userId: string, topicId: string): StoredComic | null {
  return (
    (open()
      .prepare(
        "SELECT id, panels_json, prompt_used, created_at FROM generated_comics WHERE user_id = ? AND topic_id = ? ORDER BY created_at DESC LIMIT 1",
      )
      .get(userId, topicId) as StoredComic | undefined) ?? null
  );
}

// --- generation log (pipeline metrics) -----------------------------------------

export interface GenLogEntry {
  userId: string;
  topicId: string;
  kind: "comic" | "expressive" | "hinglish";
  model: string | null;
  outcome: "first_try" | "after_retry" | "fallback" | "error";
  reason?: string | null;
  feedback?: string | null;
  attempts: number;
  latencyMs: number;
  trace: unknown;
}

export function logGeneration(e: GenLogEntry) {
  open()
    .prepare(
      `INSERT INTO gen_log (id, user_id, topic_id, kind, model, outcome, reason, feedback, attempts, latency_ms, trace_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(id(), e.userId, e.topicId, e.kind, e.model, e.outcome, e.reason ?? null, e.feedback ?? null, e.attempts, e.latencyMs, JSON.stringify(e.trace), Date.now());
}

export interface GenRow {
  kind: string;
  topic_id: string;
  model: string | null;
  outcome: string;
  reason: string | null;
  feedback: string | null;
  attempts: number;
  latency_ms: number;
  created_at: number;
}

export function allGenerations(): GenRow[] {
  return open()
    .prepare("SELECT kind, topic_id, model, outcome, reason, feedback, attempts, latency_ms, created_at FROM gen_log ORDER BY created_at DESC")
    .all() as GenRow[];
}

export function feedbackCounts(): { category: string; n: number }[] {
  return open().prepare("SELECT category, COUNT(*) AS n FROM feedback_events GROUP BY category ORDER BY n DESC").all() as {
    category: string;
    n: number;
  }[];
}

// --- quiz results --------------------------------------------------------------

export function recordQuiz(userId: string, topicId: string, arcId: string, correct: boolean) {
  open()
    .prepare(
      `INSERT INTO quiz_results (user_id, topic_id, arc_id, correct, answered_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (user_id, topic_id, arc_id) DO UPDATE SET correct = excluded.correct, answered_at = excluded.answered_at`,
    )
    .run(userId, topicId, arcId, correct ? 1 : 0, Date.now());
}

/** topicId → { answered, correct } */
export function quizMastery(userId: string): Record<string, { answered: number; correct: number }> {
  const rows = open()
    .prepare("SELECT topic_id, COUNT(*) AS answered, SUM(correct) AS correct FROM quiz_results WHERE user_id = ? GROUP BY topic_id")
    .all(userId) as { topic_id: string; answered: number; correct: number }[];
  return Object.fromEntries(rows.map((r) => [r.topic_id, { answered: r.answered, correct: r.correct }]));
}

// --- learner preferences -------------------------------------------------------

export interface Preferences {
  length: "short" | "detailed";
  style: "visual" | "worded";
  pace: "step" | "story";
}

export function getPreferences(userId: string): Preferences | null {
  const r = open().prepare("SELECT length, style, pace FROM preferences WHERE user_id = ?").get(userId) as Preferences | undefined;
  return r ?? null;
}

export function savePreferences(userId: string, p: Preferences) {
  open()
    .prepare(
      `INSERT INTO preferences (user_id, length, style, pace, updated_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (user_id) DO UPDATE SET length = excluded.length, style = excluded.style, pace = excluded.pace, updated_at = excluded.updated_at`,
    )
    .run(userId, p.length, p.style, p.pace, Date.now());
}
