"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      aria-label="Sign out"
      title="Sign out"
      className="p-1 text-muted hover:text-ink"
      onClick={async () => {
        await fetch("/api/auth/mock", { method: "DELETE" });
        router.push("/login");
        router.refresh();
      }}
    >
      <LogOut size={14} />
    </button>
  );
}
