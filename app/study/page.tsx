import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getArm } from "@/lib/db";
import { getAllTopics, pad2 } from "@/lib/knowledge";
import { AppHeader } from "@/components/shared/AppHeader";
import { AppFooter } from "@/components/shared/AppFooter";
import { StudyJoin } from "./StudyJoin";

export const metadata = { title: "Classroom study — AlgoVerse" };

const ARM_TEXT = {
  text: "Text only: read the topic brief, like a textbook page.",
  visualgo: "VisuAlgo: read the brief, then study the topic on VisuAlgo, an existing visualization site.",
  algoverse: "AlgoVerse: read the brief, then use the comic, video and visualizer.",
};

export default async function StudyPage() {
  const user = await requireUser();
  const arm = getArm(user.id);
  const topics = getAllTopics().filter((t) => t.status !== "soon");

  return (
    <div className="min-h-screen flex flex-col bg-dots">
      <AppHeader email={user.email} crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "study" }]} />
      <main className="w-full max-w-[860px] mx-auto px-6 lg:px-8 py-10 flex-1 space-y-8">
        <div>
          <span className="tag !bg-ink !text-white">Classroom study</span>
          <h1 className="font-head font-extrabold text-4xl uppercase mt-3">Which way of studying works best?</h1>
          <p className="text-[14px] text-muted mt-3">
            Join and you are put in one of three groups at random. Every group answers the same three questions on a topic before studying it and
            again after. Your teacher compares the groups on the insights page.
          </p>
        </div>

        <section className="box p-6 space-y-3">
          <h2 className="font-head font-bold text-lg">The three groups</h2>
          <ul className="space-y-2 text-[14px]">
            {Object.entries(ARM_TEXT).map(([k, v]) => (
              <li key={k} className={arm === k ? "font-bold" : ""}>
                {arm === k ? "▸ " : "· "}
                {v}
              </li>
            ))}
          </ul>
          <p className="font-mono text-[11px] text-muted">
            Every group takes the before check first. Text and VisuAlgo groups then see only the brief for a topic until its after check is saved. Your first after score is the one that counts.
          </p>
          <StudyJoin joined={!!arm} />
        </section>

        {arm && (
          <section className="box p-6 space-y-3">
            <h2 className="font-head font-bold text-lg">Pick the topic your teacher named</h2>
            <div className="grid sm:grid-cols-2 gap-2">
              {topics.map((t) => (
                <Link key={t.id} href={`/topics/${t.id}`} className="btn btn-light justify-start">
                  {pad2(t.index)} {t.name}
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <AppFooter />
    </div>
  );
}
