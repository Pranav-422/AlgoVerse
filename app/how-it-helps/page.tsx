import Link from "next/link";
import { requireUser } from "@/lib/session";
import { AppHeader } from "@/components/shared/AppHeader";
import { AppFooter } from "@/components/shared/AppFooter";

export const metadata = { title: "How it helps — AlgoVerse" };

// shortcut: temporary page for the 1-minute demo, delete this folder and its link in AppHeader afterwards.

const STEPS = [
  {
    time: "0:00",
    title: "Know where you start",
    problem: "Students feel they understood a topic because the page looked familiar.",
    does: "A short check comes first. Its score locks once another format opens, so it is an honest starting point.",
    idea: "Pretesting",
    href: "/topics/arrays",
    cta: "Open the check",
  },
  {
    time: "0:10",
    title: "See it four ways",
    problem: "One static format does not suit every learner.",
    does: "Brief, comic, video and visualizer all read one knowledge file, so every format teaches the same facts.",
    idea: "Dual coding: words and pictures together",
    href: "/topics/arrays/comic",
    cta: "Open the comic",
  },
  {
    time: "0:25",
    title: "Guess before you see",
    problem: "Watching an animation feels like learning, but asks nothing of the learner.",
    does: "Predict mode pauses the visualizer and asks for the next step before showing it.",
    idea: "Generation effect: producing an answer helps it stick",
    href: "/topics/arrays/visualizer",
    cta: "Open the visualizer",
  },
  {
    time: "0:40",
    title: "Fix what you missed",
    problem: "Mistakes get forgotten, and so does the topic a week later.",
    does: "Each wrong option names its misconception. Missed questions return after 1, 3 and 7 days, and the weakest topic becomes the next step.",
    idea: "Spaced retrieval practice",
    href: "/review",
    cta: "Open reviews",
  },
  {
    time: "0:50",
    title: "Measure the change",
    problem: "A nice-looking tool does not prove anyone learned.",
    does: "The same check runs again after learning. Insights shows the gain per topic and per format, against reading the text alone.",
    idea: "Before and after comparison",
    href: "/insights",
    cta: "Open Insights",
  },
];

export default async function HowItHelpsPage() {
  const user = await requireUser();

  return (
    <div className="min-h-screen flex flex-col bg-dots">
      <AppHeader email={user.email} active="help" crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "How it helps" }]} />
      <main className="flex-1 w-full max-w-[1100px] mx-auto px-4 sm:px-6 py-8 space-y-6">
        <section className="box p-6">
          <p className="label mb-2">{"//"} The one-minute version</p>
          <h1 className="font-head text-3xl sm:text-4xl font-black tracking-tight text-ink">How AlgoVerse helps you learn</h1>
          <p className="font-mono text-[13px] text-muted mt-3 max-w-3xl leading-relaxed">
            Students memorise data structures but cannot picture them. AlgoVerse makes them see the idea, commit to an answer, come back to what they missed, and then measures what changed.
          </p>
        </section>

        <ol className="space-y-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="box p-4 sm:p-5 grid md:grid-cols-[72px_1fr_1fr_170px] gap-4 items-start">
              <div className="font-mono">
                <span className="block text-2xl font-bold text-primary">{i + 1}</span>
                <span className="text-[11px] text-outline">{s.time}</span>
              </div>
              <div>
                <h2 className="font-mono text-[15px] font-bold text-ink mb-1">{s.title}</h2>
                <p className="font-mono text-[12px] text-muted leading-relaxed">{s.problem}</p>
              </div>
              <p className="font-mono text-[12px] text-ink leading-relaxed">{s.does}</p>
              <div className="space-y-2">
                <span className="block font-mono text-[10px] uppercase tracking-wider text-outline">{s.idea}</span>
                <Link href={s.href} className="btn btn-light !py-1.5 inline-block">
                  {s.cta}
                </Link>
              </div>
            </li>
          ))}
        </ol>

        <p className="font-mono text-[11px] text-muted">
          The labels name known learning-science ideas behind each step. They are not results from AlgoVerse; our own numbers appear on Insights as learners take both checks.
        </p>
      </main>
      <AppFooter />
    </div>
  );
}
