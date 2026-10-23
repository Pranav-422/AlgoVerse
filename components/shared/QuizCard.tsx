import Link from "next/link";
import { HelpCircle } from "lucide-react";

/** Side-panel launcher for the topic's practice quiz. */
export function QuizCard({ topicId, total }: { topicId: string; total: number }) {
  return (
    <section className="box overflow-hidden">
      <div className="flex justify-between items-center px-4 py-2.5 border-b-2 border-ink bg-cream">
        <span className="label !text-ink font-bold flex items-center gap-1.5">
          <HelpCircle size={13} /> Practice quiz
        </span>
        <span className="font-mono text-[10px] text-outline">{total} in the bank</span>
      </div>
      <div className="p-4 space-y-3">
        <p className="font-mono text-[11px] text-muted">Random questions, one at a time, with why each option is right or wrong.</p>
        <div className="grid grid-cols-2 gap-2">
          {[5, 10].map((n) => (
            <Link key={n} href={`/topics/${topicId}/quiz?n=${n}`} className="btn btn-light justify-center whitespace-nowrap !px-2 !py-2">
              {n} questions
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
