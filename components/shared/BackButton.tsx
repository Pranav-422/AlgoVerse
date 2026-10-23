"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/** Goes back in history; a page opened directly (no history) falls back to `fallback`. */
export function BackButton({ fallback }: { fallback: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}
      className="flex items-center gap-1 px-2 py-0.5 border-2 border-ink rounded bg-card text-ink font-bold hover:bg-amber-light shrink-0"
      aria-label="Go back"
    >
      <ArrowLeft size={12} /> Back
    </button>
  );
}
