import Link from "next/link";
import { Logo } from "./Logo";
import { SignOutButton } from "./SignOutButton";

export interface Crumb {
  label: string;
  href?: string;
}

interface Props {
  email: string;
  crumbs?: Crumb[];
  /** Topic slug — enables the per-format nav. */
  topic?: { slug: string; formats: string[] };
  active?: "topics" | "brief" | "comic" | "video" | "visualizer";
  children?: React.ReactNode;
}

const FORMAT_LINKS = [
  { key: "brief", label: "Brief", path: "" },
  { key: "comic", label: "Comic", path: "/comic" },
  { key: "video", label: "Video", path: "/video" },
  { key: "visualizer", label: "Visualizer", path: "/visualizer" },
] as const;

export function AppHeader({ email, crumbs, topic, active, children }: Props) {
  const linkCls = (on: boolean) =>
    on
      ? "px-3 py-1.5 bg-amber-mid text-ink border-2 border-ink rounded font-bold shadow-comic-sm"
      : "px-3 py-1.5 text-muted hover:text-ink hover:bg-cream rounded transition-colors border-2 border-transparent";

  return (
    <>
      <header className="sticky top-0 z-50 bg-card border-b-2 border-ink">
        <div className="h-16 w-full max-w-[1440px] mx-auto px-6 lg:px-8 flex items-center justify-between gap-4">
          <Logo href="/dashboard" />
          <div className="flex-1 max-w-lg mx-auto">{children}</div>
          <div className="flex items-center gap-3 shrink-0">
            <nav className="flex items-center gap-1.5 font-mono text-[12px] font-semibold">
              <Link href="/dashboard" className={linkCls(active === "topics")}>
                Topics
              </Link>
              {topic &&
                FORMAT_LINKS.map((f) =>
                  topic.formats.includes(f.key) ? (
                    <Link key={f.key} href={`/topics/${topic.slug}${f.path}`} className={linkCls(active === f.key)}>
                      {f.label}
                    </Link>
                  ) : (
                    <span
                      key={f.key}
                      className="px-3 py-1.5 text-outline-soft border-2 border-transparent cursor-not-allowed"
                      title="Not built for this topic yet"
                    >
                      {f.label}
                    </span>
                  ),
                )}
            </nav>
            <div className="h-6 w-px bg-outline-soft" />
            <div className="flex items-center gap-2 border-2 border-ink rounded bg-card pl-1 pr-2 py-0.5 shadow-comic-sm">
              <span className="w-7 h-7 rounded bg-ink text-amber-mid font-mono font-bold text-xs flex items-center justify-center uppercase">
                {email[0]}
              </span>
              <span className="font-mono text-[11px] max-w-[140px] truncate" title={email}>
                {email.startsWith("guest-") ? "guest" : email}
              </span>
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>
      {crumbs && (
        <div className="w-full bg-cream border-b-2 border-ink">
          <div className="max-w-[1440px] mx-auto px-6 lg:px-8 py-2 flex items-center gap-2 font-mono text-[11px] text-muted uppercase tracking-wider">
            {crumbs.map((c, i) => (
              <span key={i} className="flex items-center gap-2">
                {i > 0 && <span className="text-outline-soft">/</span>}
                {c.href ? (
                  <Link href={c.href} className="hover:text-ink underline-offset-2 hover:underline">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-ink font-bold">{c.label}</span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
