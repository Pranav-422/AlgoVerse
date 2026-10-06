import Link from "next/link";
import { BookOpen, Clapperboard, PanelsTopLeft, Activity, Sparkles, FileText, Route, ShieldCheck } from "lucide-react";
import { currentUser } from "@/lib/session";
import { getAllTopics, pad2 } from "@/lib/knowledge";
import { Logo } from "@/components/shared/Logo";
import { AppFooter } from "@/components/shared/AppFooter";
import { Reveal, Stagger, StaggerItem, TiltCard, WordReveal, Marquee } from "@/components/motion/Motion";
import { HeroSortDemo } from "@/components/motion/HeroSortDemo";

// Landing page — adapted from the Stitch "Warm Amber" hero.

const FORMATS = [
  { icon: BookOpen, name: "Brief", text: "A short written summary, a real-world picture and three key points." },
  { icon: PanelsTopLeft, name: "Comic", text: "A panel-by-panel comic. If it doesn't land, say why in one tap and get another." },
  { icon: Clapperboard, name: "Video", text: "A pre-rendered walkthrough with chapter markers." },
  { icon: Activity, name: "Visualizer", text: "Step through the algorithm frame by frame, with the pseudocode line lit up." },
];

const PIPELINE = [
  { icon: FileText, title: "One knowledge file", text: "Every topic's facts live in a single markdown file. The brief, comic script, video and visualizer labels all read from it." },
  { icon: Route, title: "A fixed pipeline", text: "A gateway routes each request to an independent service with a timeout and a fallback. Every model call is one bounded step with a fixed prompt template." },
  { icon: ShieldCheck, title: "Shown, not hidden", text: "Every generated comic carries a 'How this was generated' panel with the real prompt, the facts injected and the style constraints applied." },
];

const FAQS = [
  { q: "Which topics are ready?", a: "Arrays has all four formats. Linked Lists and Stacks & Queues have a brief and a visualizer. Trees, Graphs, Sorting and Recursion are marked 'soon' and cannot be opened." },
  { q: "Is the video generated?", a: "No. The video is pre-rendered and labelled PRE-RENDERED on screen." },
  { q: "How many times can I regenerate a comic?", a: "Three times per topic in any rolling 24 hours. After that the button shows when it resets." },
  { q: "Do I need an account?", a: "Sign-in is mocked for the demo. Any email works, or continue as a guest." },
];

export default async function Landing() {
  const user = await currentUser();
  const start = user ? "/dashboard" : "/login";
  const topics = getAllTopics();

  return (
    <div className="relative min-h-screen flex flex-col bg-paper overflow-hidden">
      <div aria-hidden className="absolute inset-0 bg-dots opacity-[0.18] pointer-events-none" />
      <div
        aria-hidden
        className="absolute left-1/2 top-[-120px] -translate-x-1/2 w-[900px] h-[700px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(closest-side, rgba(255,186,56,0.35), rgba(255,222,172,0.18) 55%, transparent)" }}
      />

      <header className="relative z-10 max-w-[1240px] w-full mx-auto px-6 h-20 grid grid-cols-[1fr_auto_1fr] items-center">
        <Logo />
        <nav className="hidden md:flex items-center gap-2 font-mono text-[12px]">
          {[
            ["Formats", "#formats"],
            ["How it works", "#how"],
            ["Topics", "#topics"],
            ["FAQs", "#faqs"],
          ].map(([label, href]) => (
            <a key={href} href={href} className="px-4 py-2 rounded-full border border-outline-soft bg-card/70 hover:border-ink transition-colors">
              {label}
            </a>
          ))}
        </nav>
        <div className="justify-self-end">
          <Link href={start} className="btn btn-amber">
            {user ? "Open dashboard" : "Start learning"}
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex-1">
        <section className="max-w-[1240px] mx-auto px-6 pt-20 pb-20 grid lg:grid-cols-[1.15fr_1fr] gap-12 items-center">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-mid bg-card/80 px-3 py-1 font-mono text-[11px] tracking-widest uppercase">
                <Sparkles size={13} className="text-amber" /> Data structures, four ways
              </span>
            </Reveal>
            <h1 className="mt-7 font-head font-extrabold text-ink text-[clamp(40px,5.6vw,72px)] leading-[1.04] tracking-tight">
              <WordReveal text="Finally see what your algorithm is doing." accent={["see"]} />
            </h1>
            <Reveal delay={0.6}>
              <p className="mt-6 max-w-[520px] text-[15px] text-muted leading-relaxed">
                Pick a topic and move through a written brief, a comic, a video and a step-by-step visualizer — all built
                from one source of facts, so they never disagree.
              </p>
              <div className="mt-9 flex items-center gap-3">
                <Link href={start} className="btn btn-amber">
                  Start learning
                </Link>
                <a href="#formats" className="btn btn-light">
                  See the formats
                </a>
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.35}>
            <HeroSortDemo />
          </Reveal>
        </section>

        <section className="border-y-2 border-ink bg-amber-mid py-4">
          <Marquee items={topics.map((t) => t.name)} />
        </section>

        <section className="border-b-2 border-ink bg-card">
          <div className="max-w-[1240px] mx-auto px-6 py-4 grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[12px]">
            <span className="flex items-center gap-2"><span className="tag !bg-amber-mid">{topics.length}</span> topics, numbered in order</span>
            <span className="flex items-center gap-2 sm:justify-center"><span className="tag !bg-amber-mid">4</span> formats per topic</span>
            <span className="flex items-center gap-2 sm:justify-end"><span className="tag !bg-amber-mid">1</span> knowledge file per topic</span>
          </div>
        </section>

        <section id="formats" className="max-w-[1240px] mx-auto px-6 py-20">
          <Reveal>
            <p className="label">01 {"//"} Formats</p>
            <h2 className="font-head font-extrabold text-4xl mt-2">One topic. Four ways in.</h2>
          </Reveal>
          <Stagger className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FORMATS.map((f, i) => (
              <StaggerItem key={f.name}>
                <TiltCard className="box p-5 h-full">
                  <div className="flex items-center justify-between">
                    <span className="h-10 w-10 rounded border-2 border-ink bg-amber-light flex items-center justify-center">
                      <f.icon size={18} />
                    </span>
                    <span className="font-mono text-[11px] text-outline">{pad2(i + 1)}</span>
                  </div>
                  <h3 className="font-head font-bold text-xl mt-4">{f.name}</h3>
                  <p className="text-[13px] text-muted mt-2 leading-relaxed">{f.text}</p>
                </TiltCard>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        <section id="how" className="bg-cream border-y-2 border-ink">
          <div className="max-w-[1240px] mx-auto px-6 py-20">
            <Reveal>
              <p className="label">02 {"//"} How it works</p>
              <h2 className="font-head font-extrabold text-4xl mt-2">An orchestrated pipeline, in the open.</h2>
            </Reveal>
            <Stagger className="mt-10 grid md:grid-cols-3 gap-5" gap={0.12}>
              {PIPELINE.map((p, i) => (
                <StaggerItem key={p.title}>
                  <div className="box p-6 h-full relative">
                    <span className="absolute -top-3 -left-3 h-8 w-8 rounded-full bg-ink text-amber-mid font-mono text-[12px] font-bold flex items-center justify-center border-2 border-ink">
                      {i + 1}
                    </span>
                    <p.icon size={20} className="text-amber" />
                    <h3 className="font-head font-bold text-xl mt-3">{p.title}</h3>
                    <p className="text-[13px] text-muted mt-2 leading-relaxed">{p.text}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>

        <section id="topics" className="max-w-[1240px] mx-auto px-6 py-20">
          <p className="label">03 // Topics</p>
          <h2 className="font-head font-extrabold text-4xl mt-2">Seven topics, in order.</h2>
          <Stagger className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4" gap={0.06}>
            {topics.map((t) => (
              <StaggerItem key={t.id} className={`box p-4 ${t.status === "soon" ? "!shadow-none !border-outline-soft" : ""}`}>
                <div className={t.status === "soon" ? "opacity-50" : ""}>
                <div className="flex items-center justify-between">
                  <span className="font-head font-extrabold text-2xl">{pad2(t.index)}</span>
                  <span className={`tag ${t.status === "complete" ? "!bg-amber-mid" : t.status === "partial" ? "!bg-violet-light" : ""}`}>
                    {t.status === "complete" ? "all formats" : t.status === "partial" ? "partial" : "soon"}
                  </span>
                </div>
                <p className="font-head font-bold mt-2">{t.name}</p>
                <p className="text-[12px] text-muted mt-1">{t.oneLine}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        <section id="faqs" className="bg-card border-t-2 border-ink">
          <div className="max-w-[900px] mx-auto px-6 py-20">
            <p className="label">04 // FAQs</p>
            <h2 className="font-head font-extrabold text-4xl mt-2">Straight answers.</h2>
            <div className="mt-8 divide-y-2 divide-ink border-2 border-ink rounded">
              {FAQS.map((f) => (
                <details key={f.q} className="group p-4">
                  <summary className="cursor-pointer font-head font-bold text-lg list-none flex justify-between">
                    {f.q}
                    <span className="font-mono text-amber group-open:rotate-45 transition-transform">+</span>
                  </summary>
                  <p className="text-[13px] text-muted mt-3 leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
            <div className="mt-12 text-center">
              <Link href={start} className="btn btn-amber">
                Start with Arrays
              </Link>
            </div>
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  );
}
