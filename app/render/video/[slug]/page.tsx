import fs from "node:fs";
import path from "node:path";
import { notFound } from "next/navigation";
import { getAllTopics, getTopic } from "@/lib/knowledge";
import { VideoStage, type Chapter, type ChapterOp } from "../VideoStage";

interface VideoMeta {
  title: string;
  file: string;
  chapters: {
    t: number;
    end: number;
    title: string;
    facts: string[];
    op: ChapterOp | null;
  }[];
  madeWith: string;
}

export function generateStaticParams() {
  return getAllTopics().map((t) => ({ slug: t.id }));
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const topic = getTopic(slug);
  return { title: `${topic?.name ?? slug} video render — AlgoVerse` };
}

export default async function VideoRenderPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const topic = getTopic(slug);
  if (!topic) notFound();

  const metaFile = path.join(process.cwd(), "content", "video", `${slug}.json`);
  if (!fs.existsSync(metaFile)) notFound();

  const meta: VideoMeta = JSON.parse(fs.readFileSync(metaFile, "utf8"));

  const resolveFact = (snippet: string) => topic.coreFacts.find((f) => f.includes(snippet)) ?? snippet;

  const chapters: Chapter[] = meta.chapters.map((ch) => ({
    start: ch.t,
    end: ch.end,
    title: ch.title,
    facts: ch.facts.map(resolveFact),
    op: ch.op,
  }));

  return <VideoStage topic={slug} title={meta.title} chapters={chapters} />;
}
