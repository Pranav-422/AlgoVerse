import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getProgress, getPreferences, quizMastery } from "@/lib/db";
import { loadBank } from "@/lib/comicKit";
import { getAllTopics, pad2, type Format } from "@/lib/knowledge";
import { AppHeader } from "@/components/shared/AppHeader";
import { AppFooter } from "@/components/shared/AppFooter";
import { TopicCard } from "@/components/shared/TopicCard";
import { SearchBox } from "./SearchBox";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/Motion";

export const metadata = { title: "Dashboard — AlgoVerse" };

const FILTERS = [
  { key: "all", label: "All topics" },
  { key: "progress", label: "In progress" },
  { key: "ready", label: "Ready" },
  { key: "soon", label: "Soon" },
] as const;

const FORMAT_ORDER: Format[] = ["brief", "comic", "video", "visualizer"];
const FORMAT_PATH: Record<Format, string> = { brief: "", comic: "/comic", video: "/video", visualizer: "/visualizer" };

export default async function Dashboard(props: PageProps<"/dashboard">) {
  const user = await requireUser();
  const sp = await props.searchParams;
  const q = (typeof sp.q === "string" ? sp.q : "").trim().toLowerCase();
  const filter = typeof sp.f === "string" ? sp.f : "all";

  const topics = getAllTopics();
  const progress = getProgress(user.id);
  const prefs = getPreferences(user.id);
  const quiz = quizMastery(user.id);
  const masteryFor = (id: string) => {
    const total = loadBank(id)?.arcs.length ?? 0;
    const q = quiz[id] ?? { answered: 0, correct: 0 };
    return { ...q, total };
  };
  const ready = topics.filter((t) => t.status !== "soon");
  const openedTotal = ready.reduce((n, t) => n + (progress[t.id]?.filter((f) => t.formats.includes(f)).length ?? 0), 0);
  const availableTotal = ready.reduce((n, t) => n + t.formats.length, 0);
  const pct = availableTotal ? Math.round((openedTotal / availableTotal) * 100) : 0;

  const counts = {
    all: topics.length,
    progress: topics.filter((t) => (progress[t.id]?.length ?? 0) > 0).length,
    ready: ready.length,
    soon: topics.length - ready.length,
  };

  const shown = topics.filter((t) => {
    if (q && !t.name.toLowerCase().includes(q)) return false;
    if (filter === "progress") return (progress[t.id]?.length ?? 0) > 0;
    if (filter === "ready") return t.status !== "soon";
    if (filter === "soon") return t.status === "soon";
    return true;
  });

  // Next step: first ready topic with an unopened, available format (suggested order).
  let next: { topic: (typeof topics)[number]; format: Format } | null = null;
  for (const t of ready) {
    const f = FORMAT_ORDER.find((f) => t.formats.includes(f) && !progress[t.id]?.includes(f));
    if (f) {
      next = { topic: t, format: f };
      break;
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-dots">
      <AppHeader email={user.email} active="topics" crumbs={[{ label: "Dashboard" }]}>
        <Suspense>
          <SearchBox />
        </Suspense>
      </AppHeader>

      <main className="w-full max-w-[1240px] mx-auto px-6 lg:px-8 py-10 flex-1 space-y-8">
        {/* Curriculum hero */}
        <Reveal>
        <section className="box p-7">
          <div className="flex flex-wrap gap-2">
            <span className="tag !bg-ink !text-white">Track 01 // {topics.length} topics</span>
            <span className="tag">Completion: {pct}%</span>
            {next && <span className="tag !bg-amber-mid">Up next: {next.topic.name}</span>}
          </div>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-[640px]">
              <h1 className="font-head font-extrabold text-[44px] leading-[1.02] uppercase tracking-tight">
                Core data structures &amp; algorithms
              </h1>
              <p className="text-[13px] text-muted mt-3 leading-relaxed">
                Each topic is taught four ways from one knowledge file: a written brief, a comic, a video and a
                step-by-step visualizer. Take them in order, or jump straight to the one you need.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="border-2 border-ink rounded p-3 min-w-[120px] bg-cream">
                <p className="label !text-[9px]">Formats opened</p>
                <p className="font-head font-extrabold text-3xl mt-1">
                  {openedTotal}
                  <span className="text-outline text-lg">/{availableTotal}</span>
                </p>
              </div>
              <div className="border-2 border-ink rounded p-3 min-w-[120px] bg-amber-light">
                <p className="label !text-[9px]">Topics ready</p>
                <p className="font-head font-extrabold text-3xl mt-1">
                  {ready.length}
                  <span className="text-outline text-lg">/{topics.length}</span>
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <div className="flex justify-between font-mono text-[10px] uppercase tracking-wider text-outline mb-1.5">
              <span>Overall progress</span>
              <span>
                {openedTotal} / {availableTotal} formats opened
              </span>
            </div>
            <div className="h-3 border-2 border-ink rounded-sm bg-card overflow-hidden">
              <div className="h-full bg-amber transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </section>

        </Reveal>

        {/* Learning style */}
        <section className={`box p-4 flex flex-wrap items-center justify-between gap-3 ${prefs ? "" : "!bg-amber-light"}`}>
          {prefs ? (
            <div className="flex flex-wrap items-center gap-2 font-mono text-[12px]">
              <span className="label !text-ink font-bold mr-1">Your learning style</span>
              <span className="tag">{prefs.length}</span>
              <span className="tag">{prefs.style}</span>
              <span className="tag">{prefs.pace}</span>
              <span className="text-outline">· comics are picked with this in mind</span>
            </div>
          ) : (
            <p className="font-mono text-[12px]">
              <span className="font-bold">Tell us how you like to learn</span> — three taps, and comics will be picked to suit you.
            </p>
          )}
          <Link href="/welcome" className="btn btn-light !py-1.5">
            {prefs ? "Change" : "Set my learning style"}
          </Link>
        </section>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <span className="label mr-1">Filter:</span>
          {FILTERS.map((f) => {
            const on = filter === f.key;
            const params = new URLSearchParams();
            if (q) params.set("q", q);
            if (f.key !== "all") params.set("f", f.key);
            return (
              <Link
                key={f.key}
                href={`/dashboard${params.size ? `?${params}` : ""}`}
                scroll={false}
                className={`px-3 py-1 border-2 rounded font-bold uppercase tracking-wider ${
                  on ? "bg-amber border-ink shadow-comic-sm text-white" : "border-outline-soft bg-card hover:border-ink"
                }`}
              >
                {f.label} ({counts[f.key]})
              </Link>
            );
          })}
        </div>

        {/* Topic grid */}
        {shown.length ? (
          <Stagger key={`${q}|${filter}`} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {shown.map((t) => (
              <StaggerItem key={t.id}>
                <TopicCard topic={t} opened={progress[t.id] ?? []} mastery={masteryFor(t.id)} />
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <div className="box p-10 text-center font-mono text-[13px] text-muted">
            No topic matches “{q}”.
          </div>
        )}

        {/* Next step */}
        {next && (
          <section className="box p-5 flex flex-wrap items-center justify-between gap-4 bg-cream">
            <div>
              <span className="tag !bg-ink !text-white">Next step</span>
              <p className="font-head font-bold text-xl mt-2">
                {pad2(next.topic.index)} {next.topic.name} — {next.format}
              </p>
              <p className="text-[12px] text-muted mt-1">You haven&apos;t opened this format yet.</p>
            </div>
            <Link href={`/topics/${next.topic.id}${FORMAT_PATH[next.format]}`} className="btn btn-amber">
              Resume: {next.topic.name} <ArrowRight size={15} />
            </Link>
          </section>
        )}
      </main>

      <AppFooter />
    </div>
  );
}
