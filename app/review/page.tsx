import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/session";
import { reviewQueue } from "@/lib/db";
import { loadBank, loadKit } from "@/lib/comicKit";
import { getTopic, pad2 } from "@/lib/knowledge";
import { REVIEW_GAPS } from "@/lib/learning";
import { AppHeader } from "@/components/shared/AppHeader";
import { AppFooter } from "@/components/shared/AppFooter";
import { ComicQuiz } from "@/components/comic/ComicQuiz";

export const metadata = { title: "Review — AlgoVerse" };

const DAY = 86_400_000;
const inDays = (ts: number, now: number) => new Intl.RelativeTimeFormat("en", { numeric: "auto" }).format(Math.max(1, Math.ceil((ts - now) / DAY)), "day");

export default async function ReviewPage() {
  const user = await requireUser();
  const queue = reviewQueue(user.id);
  const { later, now } = queue;
  const due = queue.due.flatMap((r) => {
    const topic = getTopic(r.topic_id);
    const quiz = loadBank(r.topic_id)?.arcs.find((a) => a.id === r.arc_id)?.quiz;
    return topic && quiz ? [{ ...r, topic, quiz }] : [];
  });
  const palette = loadKit().palettes[0];

  return (
    <div className="min-h-screen flex flex-col bg-dots">
      <AppHeader email={user.email} crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Review" }]} />
      <main className="w-full max-w-[900px] mx-auto px-6 lg:px-8 py-10 flex-1 space-y-8">
        <section className="box p-7">
          <span className="tag !bg-ink !text-white">Review {"//"} spaced repetition</span>
          <h1 className="font-head font-extrabold text-4xl uppercase mt-3">Questions you missed</h1>
          <p className="font-mono text-[12px] text-muted mt-3 leading-relaxed">
            A question you get wrong comes back after {REVIEW_GAPS.join(", then ")} days. Get it right each time it comes back and it retires. Getting it wrong
            starts it over.
          </p>
        </section>

        {due.length ? (
          due.map((r) => (
            <div key={`${r.topic_id}/${r.arc_id}`}>
              <Link href={`/topics/${r.topic.id}`} className="tag hover:!bg-amber-light">
                {pad2(r.topic.index)} {r.topic.name}
              </Link>
              <ComicQuiz quiz={r.quiz} palette={palette} record={{ topicId: r.topic_id, arcId: r.arc_id }} />
            </div>
          ))
        ) : (
          <section className="box p-8 text-center space-y-3">
            <p className="font-head font-bold text-xl">Nothing to review right now.</p>
            <p className="font-mono text-[12px] text-muted">
              {later.length
                ? `${later.length} question${later.length === 1 ? "" : "s"} scheduled — the next one comes back ${inDays(later[0].due_at, now)}.`
                : "Answer the “Check yourself” questions in the comics; any you miss will come back here."}
            </p>
            <Link href="/dashboard" className="btn btn-light">
              Back to topics <ArrowRight size={14} />
            </Link>
          </section>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
