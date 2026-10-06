import Link from "next/link";
import { Globe, ArrowRight } from "lucide-react";
import { loadTopicPage } from "@/lib/topicPage";
import { pad2 } from "@/lib/knowledge";
import { AppHeader } from "@/components/shared/AppHeader";
import { AppFooter } from "@/components/shared/AppFooter";
import { FormatList } from "@/components/shared/FormatList";
import { RelatedTopics } from "@/components/shared/RelatedTopics";
import { ExpressiveSummary } from "./ExpressiveSummary";

export default async function BriefPage(props: PageProps<"/topics/[slug]">) {
  const { slug } = await props.params;
  const { user, topic, opened, related, crumbs } = await loadTopicPage(slug, "brief");
  const nextFormat = topic.formats.includes("comic") ? "comic" : "visualizer";

  return (
    <div className="min-h-screen flex flex-col bg-dots">
      <AppHeader email={user.email} crumbs={crumbs} topic={{ slug: topic.id, formats: topic.formats }} active="brief" />

      <main className="w-full max-w-[1240px] mx-auto px-6 lg:px-8 py-10 flex-1 space-y-10">
        {/* Title */}
        <section className="box p-7 relative overflow-hidden">
          <span
            aria-hidden
            className="absolute right-6 -top-6 font-head font-extrabold text-[180px] leading-none text-amber-light select-none"
          >
            {pad2(topic.index)}
          </span>
          <div className="relative">
            <div className="flex gap-2">
              <span className="tag !bg-ink !text-white">Topic {pad2(topic.index)} {"//"} 07</span>
              <span className="tag !bg-amber-mid">{topic.status === "complete" ? "All four formats" : "Brief + visualizer"}</span>
            </div>
            <h1 className="font-head font-extrabold text-[64px] leading-none uppercase tracking-tight mt-4">
              {topic.name}
              <span className="text-amber">.</span>
            </h1>
            <p className="font-mono text-[13px] text-muted mt-3">{topic.oneLine}</p>
          </div>
        </section>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
          <div className="space-y-8">
            <ExpressiveSummary topicId={topic.id} summary={topic.summary} />

            {/* Real world */}
            <section className="box p-6 !bg-violet-light">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-mono text-[12px] font-bold uppercase tracking-wider">
                  <Globe size={15} /> In the real world
                </span>
              </div>
              <p className="mt-3 text-[14px] leading-relaxed">{topic.realWorld}</p>
            </section>

            {/* Key points */}
            <section>
              <h2 className="label !text-ink font-bold mb-3">Key points // 3</h2>
              <ol className="space-y-3">
                {topic.keyPoints.map((k, i) => (
                  <li key={k} className="box p-4 flex gap-4 items-start">
                    <span className="tag !bg-amber-mid !text-[12px] shrink-0">{pad2(i + 1)}</span>
                    <p className="text-[14px] leading-relaxed">{k}</p>
                  </li>
                ))}
              </ol>
            </section>

            <div className="flex flex-wrap gap-3">
              <Link href={`/topics/${topic.id}/${nextFormat}`} className="btn btn-amber !py-3">
                {nextFormat === "comic" ? "Read as a comic" : "Open the visualizer"} <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24">
            <FormatList topic={topic} opened={opened} current="brief" />
            {topic.operations.length > 0 && (
              <section className="box overflow-hidden">
                <div className="px-4 py-2.5 border-b-2 border-ink bg-cream label !text-ink font-bold">
                  Operations covered
                </div>
                <ul className="p-4 space-y-2">
                  {topic.operations.map((o) => {
                    const big = o.text.match(/O\([^)]*\)/g)?.pop();
                    return (
                      <li key={o.name} className="flex justify-between gap-3 font-mono text-[12px]">
                        <span>{o.name}</span>
                        {big && <span className="tag">{big}</span>}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </aside>
        </div>

        <RelatedTopics topics={related} />
      </main>

      <AppFooter />
    </div>
  );
}
