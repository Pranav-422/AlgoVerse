import { redirect } from "next/navigation";
import { currentUser } from "@/lib/session";
import { LoginForm } from "./LoginForm";
import Link from "next/link";

export const metadata = { title: "Sign in — AlgoVerse" };

const CHIPS = [
  { n: "01", label: "Brief" },
  { n: "02", label: "Comic" },
  { n: "03", label: "Video" },
  { n: "04", label: "Visualizer" },
];

export default async function LoginPage() {
  if (await currentUser()) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-grid flex flex-col">
      <div className="flex justify-between px-8 py-4 font-mono text-[11px] text-outline uppercase tracking-wider">
        <Link href="/" className="hover:text-ink">← AlgoVerse</Link>
        <span>Sign in</span>
      </div>

      <main className="flex-1 flex items-center justify-center px-6 pb-16">
        <div className="w-full max-w-[1040px] grid md:grid-cols-[1.35fr_1fr] border-2 border-ink rounded shadow-comic-lg overflow-hidden bg-card">
          {/* Left: brand panel */}
          <section className="relative bg-cream p-10 flex flex-col justify-between min-h-[520px] border-b-2 md:border-b-0 md:border-r-2 border-ink">
            <div className="flex items-center justify-between">
              <span className="tag">AlgoVerse // learn</span>
              <span className="tag !bg-amber-light">7 topics</span>
            </div>

            <div>
              <span className="tag !bg-amber-mid mb-4">DSA, four ways</span>
              <h1 className="font-head font-extrabold text-[clamp(52px,7vw,88px)] leading-none tracking-tight text-ink mt-3">
                ALGO<span className="text-amber">VERSE</span>
              </h1>
              <p className="font-mono text-[13px] mt-3">Learn DSA four ways: Read · Comic · Watch · Step through</p>

              <div className="mt-8 grid grid-cols-4 gap-3">
                {CHIPS.map((c, i) => (
                  <div
                    key={c.n}
                    className={`border-2 border-ink rounded p-3 shadow-comic-sm ${i === 3 ? "bg-amber-light" : "bg-card"}`}
                  >
                    <p className="font-mono text-[10px] text-outline">{c.n}</p>
                    <p className="font-mono text-[12px] font-bold uppercase mt-3">{c.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between font-mono text-[10px] text-outline uppercase tracking-wider">
              <span>21CSE306P · Applied Generative AI</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber border border-ink" /> Demo build
              </span>
            </div>
          </section>

          {/* Right: form */}
          <section className="p-10 flex flex-col">
            <span className="tag self-start">Sign in</span>
            <h2 className="font-head font-extrabold text-4xl mt-4">Welcome back</h2>
            <p className="font-mono text-[12px] text-outline mt-2">Pick up where you left off.</p>
            <LoginForm />
          </section>
        </div>
      </main>
    </div>
  );
}
