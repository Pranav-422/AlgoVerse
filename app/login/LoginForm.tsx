"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Info } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signIn(body: object) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.detail ?? json.error);
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed");
      setBusy(false);
    }
  }

  return (
    <form
      className="mt-8 flex flex-col gap-5 flex-1"
      onSubmit={(e) => {
        e.preventDefault();
        signIn({ email });
      }}
    >
      <label className="flex flex-col gap-2">
        <span className="flex justify-between">
          <span className="label !text-ink font-bold">Email</span>
          <span className="tag">required</span>
        </span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@srmist.edu.in"
          className="border-2 border-ink rounded bg-cream px-3 py-2.5 font-mono text-[13px] focus:bg-card focus:shadow-comic-sm outline-none"
        />
      </label>

      <label className="flex flex-col gap-2">
        <span className="label !text-ink font-bold">Password</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          className="border-2 border-ink rounded bg-cream px-3 py-2.5 font-mono text-[13px] focus:bg-card focus:shadow-comic-sm outline-none"
        />
      </label>

      {error && <p className="font-mono text-[12px] text-err border-l-4 border-err pl-2">{error}</p>}

      <button type="submit" disabled={busy} className="btn btn-amber w-full !py-3.5 mt-1">
        {busy ? "Signing in…" : "Enter"} <ArrowRight size={15} />
      </button>

      <button
        type="button"
        disabled={busy}
        onClick={() => signIn({ guest: true })}
        className="font-mono text-[13px] font-bold underline underline-offset-4 hover:text-amber self-center"
      >
        continue as guest →
      </button>

      <p className="mt-auto flex items-start gap-2 font-mono text-[11px] text-outline border-t border-dashed border-outline-soft pt-4">
        <Info size={13} className="shrink-0 mt-0.5" />
        Demo sign-in: any email works and the password is not checked. Progress is saved per email.
      </p>
    </form>
  );
}
