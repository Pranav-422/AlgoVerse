import { requireUser } from "@/lib/session";
import { getPreferences } from "@/lib/db";
import { AppHeader } from "@/components/shared/AppHeader";
import { AppFooter } from "@/components/shared/AppFooter";
import { PreferenceQuiz } from "./PreferenceQuiz";

export const metadata = { title: "How do you like to learn? — AlgoVerse" };

export default async function WelcomePage() {
  const user = await requireUser();
  const prefs = getPreferences(user.id);
  return (
    <div className="min-h-screen flex flex-col bg-grid">
      <AppHeader email={user.email} active="topics" crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Learning style" }]} />
      <main className="w-full max-w-[820px] mx-auto px-6 py-12 flex-1">
        <span className="tag !bg-ink !text-white">3 quick taps</span>
        <h1 className="font-head font-extrabold text-4xl uppercase mt-3">How do you like to learn?</h1>
        <p className="font-mono text-[12px] text-muted mt-2">
          Your answers decide which comic you see first and are given to the comic picker as guidance. You can change them any time.
        </p>
        <PreferenceQuiz initial={prefs} />
      </main>
      <AppFooter />
    </div>
  );
}
