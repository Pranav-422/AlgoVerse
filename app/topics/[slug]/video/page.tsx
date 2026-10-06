import fs from "node:fs";
import path from "node:path";
import { loadTopicPage } from "@/lib/topicPage";
import { AppHeader } from "@/components/shared/AppHeader";
import { AppFooter } from "@/components/shared/AppFooter";
import { RelatedTopics } from "@/components/shared/RelatedTopics";
import { NotBuilt } from "@/components/shared/NotBuilt";
import { VideoPlayer, type Chapter } from "./VideoPlayer";

export default async function VideoPage(props: PageProps<"/topics/[slug]/video">) {
  const { slug } = await props.params;
  const { user, topic, available, related, crumbs } = await loadTopicPage(slug, "video");

  const metaFile = path.join(process.cwd(), "content", "video", `${topic.id}.json`);
  const meta =
    available && fs.existsSync(metaFile)
      ? (JSON.parse(fs.readFileSync(metaFile, "utf8")) as { title: string; file: string; chapters: Chapter[] })
      : null;
  const hasFile = meta ? fs.existsSync(path.join(process.cwd(), "public", meta.file)) : false;

  return (
    <div className="min-h-screen flex flex-col bg-dots">
      <AppHeader email={user.email} crumbs={crumbs} topic={{ slug: topic.id, formats: topic.formats }} active="video" />
      <main className="w-full max-w-[1240px] mx-auto px-6 lg:px-8 py-10 flex-1 space-y-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex gap-2">
              <span className="tag !bg-ink !text-white">Video // {topic.name}</span>
              <span className="tag !bg-amber-mid">Pre-rendered — not generated</span>
            </div>
            <h1 className="font-head font-extrabold text-4xl uppercase mt-3">{meta?.title ?? topic.name}</h1>
          </div>
        </div>
        {meta ? <VideoPlayer src={meta.file} chapters={meta.chapters} hasFile={hasFile} /> : <NotBuilt format="Video" topic={topic.name} />}
        <RelatedTopics topics={related} />
      </main>
      <AppFooter />
    </div>
  );
}
