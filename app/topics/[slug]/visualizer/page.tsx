import { loadTopicPage } from "@/lib/topicPage";
import { AppHeader } from "@/components/shared/AppHeader";
import { AppFooter } from "@/components/shared/AppFooter";
import { RelatedTopics } from "@/components/shared/RelatedTopics";
import { NotBuilt } from "@/components/shared/NotBuilt";
import { HowGenerated } from "@/components/shared/HowGenerated";
import { TopicVisualizer } from "@/components/visualizer/TopicVisualizer";

const SUPPORTED = ["arrays", "linked-lists", "stacks-queues", "sorting"];

export default async function VisualizerPage(props: PageProps<"/topics/[slug]/visualizer">) {
  const { slug } = await props.params;
  const { user, topic, available, related, crumbs } = await loadTopicPage(slug, "visualizer");
  const ready = available && SUPPORTED.includes(topic.id);

  return (
    <div className="min-h-screen flex flex-col bg-dots">
      <AppHeader email={user.email} crumbs={crumbs} topic={{ slug: topic.id, formats: topic.formats }} active="visualizer" />
      <main className="w-full max-w-[1440px] mx-auto px-6 lg:px-8 py-8 flex-1 space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="tag !bg-ink !text-white">Visualizer {"//"} {topic.name}</span>
            <h1 className="font-head font-extrabold text-4xl uppercase mt-3">Step through {topic.name}</h1>
          </div>
          <p className="font-mono text-[11px] text-outline">← → step · space play/pause</p>
        </div>

        {ready ? <TopicVisualizer topicId={topic.id} ops={topic.operations} /> : <NotBuilt format="Visualizer" topic={topic.name} />}

        <HowGenerated
          provenance={{
            source: "deterministic",
            model: null,
            prompt: null,
            injectedFacts: [],
            constraints: [],
            feedback: null,
            note: "Visualizer frames come from AlgoVerse's own deterministic engines (lib/viz), not from a model. The same input always produces the same frames, so there is no prompt to show. Operation names, descriptions and complexities are read from this topic's knowledge file.",
          }}
        />

        <RelatedTopics topics={related} />
      </main>
      <AppFooter />
    </div>
  );
}
