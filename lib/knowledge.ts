import "server-only";
import fs from "node:fs";
import path from "node:path";

// The knowledge base. One markdown file per topic; every module reads facts from here and nowhere else.

export type Format = "brief" | "comic" | "video" | "visualizer";
export const FORMATS: Format[] = ["brief", "comic", "video", "visualizer"];
export type TopicStatus = "complete" | "partial" | "soon";

export interface Operation {
  /** Engine operation id, from `{#id}` in the heading. */
  id: string;
  name: string;
  text: string;
  /** Big-O taken from the operation text (last O(...) in it). */
  complexity: string;
  /** Classes from the heading, e.g. `.main`, `.stack`. */
  tags: string[];
}

export interface Topic {
  id: string;
  index: number;
  name: string;
  oneLine: string;
  palette: string;
  status: TopicStatus;
  formats: Format[];
  related: string[];
  summary: string;
  realWorld: string;
  keyPoints: string[];
  coreFacts: string[];
  operations: Operation[];
  /** Raw section text keyed by heading, for prompt injection. */
  sections: Record<string, string>;
}

const DIR = path.join(process.cwd(), "content", "knowledge");

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) throw new Error("Knowledge file is missing frontmatter");
  const meta: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim();
  }
  return { meta, body: m[2] };
}

function splitSections(body: string): Record<string, string> {
  const out: Record<string, string> = {};
  const parts = body.split(/^## /m).slice(1);
  for (const part of parts) {
    const nl = part.indexOf("\n");
    const title = (nl === -1 ? part : part.slice(0, nl)).trim();
    out[title] = (nl === -1 ? "" : part.slice(nl + 1)).trim();
  }
  return out;
}

const bullets = (text = "") =>
  text
    .split(/\r?\n/)
    .filter((l) => l.trim().startsWith("- "))
    .map((l) => l.trim().slice(2).trim());

const list = (v = "") =>
  v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

function parseOperations(text = ""): Operation[] {
  return text
    .split(/^### /m)
    .slice(1)
    .map((p) => {
      const nl = p.indexOf("\n");
      const heading = p.slice(0, nl).trim();
      const attrs = heading.match(/\{([^}]*)\}\s*$/)?.[1] ?? "";
      const text = p.slice(nl + 1).trim();
      const name = heading.replace(/\{[^}]*\}\s*$/, "").trim();
      return {
        id: attrs.match(/#([\w-]+)/)?.[1] ?? name.toLowerCase().replace(/\W+/g, "-"),
        name,
        text,
        complexity: text.match(/O\([^)]*\)/g)?.pop() ?? "",
        tags: [...attrs.matchAll(/\.([\w-]+)/g)].map((m) => m[1]),
      };
    });
}

function load(file: string): Topic {
  const raw = fs.readFileSync(path.join(DIR, file), "utf8");
  const { meta, body } = parseFrontmatter(raw);
  for (const key of ["id", "index", "name", "oneLine", "status"]) {
    if (!meta[key]) throw new Error(`Knowledge file ${file} is missing "${key}"`);
  }
  const sections = splitSections(body);
  const topic: Topic = {
    id: meta.id,
    index: Number(meta.index),
    name: meta.name,
    oneLine: meta.oneLine,
    palette: meta.palette || "amber",
    status: meta.status as TopicStatus,
    formats: list(meta.formats) as Format[],
    related: list(meta.related),
    summary: sections["Summary"] ?? "",
    realWorld: sections["Real world"] ?? "",
    keyPoints: bullets(sections["Key points"]),
    coreFacts: bullets(sections["Core facts"]),
    operations: parseOperations(sections["Operations"]),
    sections,
  };
  if (topic.status !== "soon" && (!topic.summary || topic.keyPoints.length === 0)) {
    throw new Error(`Knowledge file ${file} is marked ${topic.status} but has no Summary or Key points`);
  }
  return topic;
}

export function getAllTopics(): Topic[] {
  return fs
    .readdirSync(DIR)
    .filter((f) => f.endsWith(".md"))
    .map(load)
    .sort((a, b) => a.index - b.index);
}

export function getTopic(slug: string): Topic | null {
  const file = path.join(DIR, `${slug}.md`);
  if (!/^[a-z0-9-]+$/.test(slug) || !fs.existsSync(file)) return null;
  return load(`${slug}.md`);
}

export const pad2 = (n: number) => String(n).padStart(2, "0");
