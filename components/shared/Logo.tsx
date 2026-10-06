import Link from "next/link";

export function Logo({ href = "/", sub = "LEARN DSA FOUR WAYS" }: { href?: string; sub?: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 shrink-0" aria-label="AlgoVerse home">
      <span className="h-9 w-9 bg-amber border-2 border-ink rounded flex items-center justify-center shadow-comic-sm font-mono font-extrabold text-white text-base">
        A\
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-head text-[19px] font-extrabold tracking-wider text-ink uppercase">AlgoVerse</span>
        <span className="font-mono text-[9px] tracking-widest text-primary font-semibold">{sub}</span>
      </span>
    </Link>
  );
}
