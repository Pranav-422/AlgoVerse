import { loadTopicPage } from "@/lib/topicPage";
import { getComicPool } from "@/lib/comicPool";
import { getLatestGenerated } from "@/lib/comicGen";
import { attemptStatus } from "@/lib/db";
import { AppHeader } from "@/components/shared/AppHeader";
import { AppFooter } from "@/components/shared/AppFooter";
import { RelatedTopics } from "@/components/shared/RelatedTopics";
import { NotBuilt } from "@/components/shared/NotBuilt";
import { ComicViewer } from "@/components/comic/ComicViewer";

export default async function ComicPage(props: PageProps<"/topics/[slug]/comic">) {
  const { slug } = await props.params;
  const { user, topic, available, related, crumbs } = await loadTopicPage(slug, "comic");
  const pool = available ? getComicPool(topic.id) : [];
  const generated = available ? getLatestGenerated(user.id, topic.id) : null;
  const cap = attemptStatus(user.id, topic.id);

  return (
    <div className="min-h-screen flex flex-col bg-dots">
      <AppHeader email={user.email} crumbs={crumbs} topic={{ slug: topic.id, formats: topic.formats }} active="comic" />
      <main className="w-full max-w-[1240px] mx-auto px-6 lg:px-8 py-10 flex-1 space-y-10">
        <div>
          <span className="tag !bg-ink !text-white">Comic // {topic.name}</span>
          <h1 className="font-head font-extrabold text-4xl uppercase mt-3">{topic.name}, panel by panel</h1>
        </div>
        {available && pool.length > 0 ? (
          <ComicViewer
            topicId={topic.id}
            pool={pool}
            initialGenerated={generated}
            initialRemaining={cap.remaining}
            initialResetsAt={cap.resetsAt}
          />
        ) : (
          <NotBuilt format="Comic" topic={topic.name} />
        )}
        <RelatedTopics topics={related} />
      </main>
      <AppFooter />
    </div>
  );
}
