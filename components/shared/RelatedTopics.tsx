import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { pad2, type Topic } from "@/lib/knowledge";

export function RelatedTopics({ topics }: { topics: Topic[] }) {
  if (!topics.length) return null;
  return (
    <section>
      <div className="flex items-end justify-between mb-4">
        <h2 className="font-head font-extrabold text-2xl uppercase">Related topics</h2>
        <Link href="/dashboard" className="font-mono text-[11px] uppercase tracking-wider underline underline-offset-4">
          Back to dashboard
        </Link>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        {topics.map((t) => {
          const soon = t.status === "soon";
          const inner = (
            <>
              <div className="flex justify-between">
                <span className="tag">Topic {pad2(t.index)}</span>
                {soon && <span className="tag">soon</span>}
              </div>
              <p className="font-head font-bold text-lg mt-3">{t.name}</p>
              <p className="text-[12px] text-muted mt-1">{t.oneLine}</p>
              {!soon && (
                <span className="mt-3 inline-flex items-center gap-1 font-mono text-[11px] font-bold uppercase">
                  Open <ArrowRight size={13} />
                </span>
              )}
            </>
          );
          return soon ? (
            <div key={t.id} className="box p-4 opacity-45 !shadow-none">
              {inner}
            </div>
          ) : (
            <Link key={t.id} href={`/topics/${t.id}`} className="box p-4 block hover:shadow-comic-lg transition-shadow">
              {inner}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
