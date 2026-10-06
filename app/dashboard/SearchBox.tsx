"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function SearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      const next = new URLSearchParams(params);
      if (q) next.set("q", q);
      else next.delete("q");
      router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
    }, 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        ref.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative flex items-center bg-cream border-2 border-ink rounded px-3 py-1.5 focus-within:bg-card focus-within:shadow-comic-sm transition-all">
      <Search size={16} className="text-outline mr-2 shrink-0" />
      <input
        ref={ref}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full bg-transparent font-mono text-[13px] text-ink placeholder:text-outline focus:outline-none"
        placeholder="search a topic…"
        aria-label="Search topics"
      />
      <kbd className="font-mono text-[10px] bg-card border border-ink/40 px-1.5 py-0.5 rounded ml-2 font-bold whitespace-nowrap">Ctrl K</kbd>
    </div>
  );
}
