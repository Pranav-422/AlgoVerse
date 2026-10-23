"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function StudyJoin({ joined }: { joined: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function send(method: "POST" | "DELETE") {
    setBusy(true);
    setError("");
    try {
      const json = await (await fetch("/api/study", { method })).json();
      if (!json.ok) throw new Error();
      router.refresh();
    } catch {
      setError("Could not save. Try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-2">
      <button type="button" disabled={busy} className={`btn ${joined ? "btn-light" : "btn-amber"}`} onClick={() => send(joined ? "DELETE" : "POST")}>
        {busy ? "Saving…" : joined ? "Leave the study" : "Join the study"}
      </button>
      {error && <p className="font-mono text-[11px] text-err">{error}</p>}
    </div>
  );
}
