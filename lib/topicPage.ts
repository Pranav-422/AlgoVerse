import "server-only";
import { notFound } from "next/navigation";
import { requireUser } from "./session";
import { getTopic, getAllTopics, pad2, type Format, type Topic } from "./knowledge";
import { markProgress, getProgress } from "./db";
import { loadBank } from "./comicKit";

/** Shared loader for /topics/[slug]/*: auth, topic lookup, availability, progress write. */
export async function loadTopicPage(slug: string, format: Format) {
  const user = await requireUser();
  const topic = getTopic(slug);
  if (!topic || topic.status === "soon") notFound();
  const available = topic.formats.includes(format);
  if (available) markProgress(user.id, topic.id, format);
  const opened = getProgress(user.id)[topic.id] ?? [];
  const related = topic.related.map((id) => getAllTopics().find((t) => t.id === id)).filter(Boolean) as Topic[];

  const crumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: `${pad2(topic.index)} ${topic.name}`, href: `/topics/${topic.id}` },
    ...(format === "brief" ? [] : [{ label: format }]),
  ];
  return { user, topic, available, opened, related, crumbs };
}

/** The before/after check: the first three "Check yourself" questions of the topic's comic arcs. */
export function checkQuestions(topicId: string) {
  return (loadBank(topicId)?.arcs ?? []).flatMap((a) => (a.quiz ? [{ ...a.quiz, arcId: a.id }] : [])).slice(0, 3);
}
