import type { Format, Topic } from "@/lib/knowledge";
import { loadQuizBank } from "@/lib/comicKit";
import { FormatList } from "./FormatList";
import { QuizCard } from "./QuizCard";

/** The right-hand panel on every topic page: what to open next, then the practice quiz. */
export function TopicSidePanel({ topic, opened, current, children }: { topic: Topic; opened: Format[]; current?: Format; children?: React.ReactNode }) {
  return (
    <aside className="space-y-6 lg:sticky lg:top-24">
      <FormatList topic={topic} opened={opened} current={current} />
      <QuizCard topicId={topic.id} total={loadQuizBank(topic.id).length} />
      {children}
    </aside>
  );
}
