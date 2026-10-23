import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getTopic, pad2 } from "@/lib/knowledge";
import { loadKit, loadQuizBank } from "@/lib/comicKit";
import { AppHeader } from "@/components/shared/AppHeader";
import { AppFooter } from "@/components/shared/AppFooter";
import { QuizRunner } from "./QuizRunner";

/** A fresh random draw on every visit, so a retake is a different set. */
function draw<T>(xs: T[], n: number) {
  return xs
    .map((x) => ({ x, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .slice(0, n)
    .map(({ x }) => x);
}

export default async function QuizPage(props: PageProps<"/topics/[slug]/quiz">) {
  const user = await requireUser();
  const { slug } = await props.params;
  const topic = getTopic(slug);
  if (!topic || topic.status === "soon") notFound();
  const bank = loadQuizBank(topic.id);
  const n = Math.min((await props.searchParams).n === "10" ? 10 : 5, bank.length);
  const questions = draw(bank, n);
  const crumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: `${pad2(topic.index)} ${topic.name}`, href: `/topics/${topic.id}` },
    { label: "quiz" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-dots">
      <AppHeader email={user.email} crumbs={crumbs} topic={{ slug: topic.id, formats: topic.formats }} />
      <main className="w-full max-w-[820px] mx-auto px-6 lg:px-8 py-10 flex-1 space-y-8">
        <div>
          <span className="tag !bg-ink !text-white">Quiz // {topic.name}</span>
          <h1 className="font-head font-extrabold text-4xl uppercase mt-3">{n} questions on {topic.name}</h1>
        </div>
        <QuizRunner key={questions.map((q) => q.id).join()} topicId={topic.id} questions={questions} palette={loadKit().palettes[0]} />
      </main>
      <AppFooter />
    </div>
  );
}
