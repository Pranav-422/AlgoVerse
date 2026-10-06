"use client";

import { type CSSProperties, useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import type { Comic, Panel } from "@/lib/comic";
import { Mentor } from "./Mentor";
import { Scene, Backdrop } from "./Scenes";
import { PayoffBurst } from "./PayoffBurst";

// One comic panel, drawn entirely from the kit: design frame + theme backdrop +
// scene + Mentor pose + the dialogue line in a speech bubble.

export function frameStyle(design: string, palette: Comic["palette"], n: number): CSSProperties {
  switch (design) {
    case "halftone":
      return {
        border: `3px solid ${palette.ink}`,
        boxShadow: `4px 4px 0 ${palette.ink}`,
        backgroundColor: palette.paper,
        backgroundImage: `radial-gradient(${palette.ink}22 1.2px, transparent 1.3px)`,
        backgroundSize: "9px 9px",
      };
    case "blueprint":
      return {
        border: `2px solid ${palette.accent}`,
        boxShadow: `0 0 0 4px ${palette.paper}, 0 0 0 5px ${palette.accent}`,
        backgroundColor: palette.paper,
        backgroundImage: `linear-gradient(${palette.accent}22 1px, transparent 1px), linear-gradient(90deg, ${palette.accent}22 1px, transparent 1px)`,
        backgroundSize: "18px 18px",
      };
    case "sketch":
      return {
        border: `2.5px dashed ${palette.ink}`,
        boxShadow: `3px 3px 0 ${palette.soft}`,
        backgroundColor: palette.paper,
        transform: `rotate(${n % 2 ? 0.8 : -0.8}deg)`,
      };
    default: // bold-ink
      return { border: `3px solid ${palette.ink}`, boxShadow: `5px 5px 0 ${palette.ink}`, backgroundColor: palette.paper };
  }
}

interface PanelCardProps {
  panel: Panel;
  comic: Comic;
  compact?: boolean;
  /** True when this card is the front-most active card in the deck view. */
  active?: boolean;
}

export function PanelCard({ panel, comic, compact = false, active = false }: PanelCardProps) {
  const { palette } = comic;
  const blue = comic.design === "blueprint";
  const reduce = useReducedMotion();

  const isPayoff = panel.role === "payoff";
  // Only the active deck card gets the typewriter and payoff effects.
  const showFull = !active || compact || reduce;

  // --- typewriter state ---
  const [wordCount, setWordCount] = useState<number>(0);
  const [showAll, setShowAll] = useState(false);

  const words = panel.text.split(" ");
  // When not active, compact, or reduced-motion: always show full text
  const displayedText = showFull || showAll
    ? panel.text
    : words.slice(0, wordCount).join(" ");

  useEffect(() => {
    // When not active, skip typewriter entirely — displayedText is handled by showFull
    if (!active || reduce) {
      return;
    }
    // Start typewriter — wordCount starts at 0 and showAll at false (component key-resets per panel)
    const timer = setInterval(() => {
      setWordCount((c) => {
        if (c >= words.length) {
          clearInterval(timer);
          return c;
        }
        return c + 1;
      });
    }, 35);
    return () => {
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, reduce]);

  return (
    <article className="relative w-full h-full rounded-[4px] overflow-hidden flex flex-col select-none" style={frameStyle(comic.design, palette, panel.n)}>
      <Backdrop theme={comic.theme} palette={palette} />

      {/* caption strip */}
      {!compact && (
        <header className="relative flex items-center justify-between px-3 pt-2.5">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5" style={{ background: palette.ink, color: palette.paper }}>
            {String(panel.n).padStart(2, "0")} · {panel.concept.replace(/-/g, " ")}
          </span>
          <span className="font-mono text-[10px] uppercase" style={{ color: palette.ink, opacity: 0.6 }}>
            {comic.title} · {panel.n}/{comic.panels.length}
          </span>
        </header>
      )}

      {/* speech bubble */}
      <div className={`relative ${compact ? "px-2 pt-2" : "px-4 pt-3"}`}>
        <div
          className={`relative rounded-[14px] ${compact ? "px-2.5 py-1.5" : "px-4 py-2.5"} cursor-pointer`}
          style={{ background: "#FFFFFF", border: `2.5px solid ${blue ? palette.accent : palette.ink}` }}
          onClick={() => { if (active && !showFull) setShowAll(true); }}
          title={active && !showFull && !showAll ? "Click to reveal full text" : undefined}
        >
          <p className={`font-mono leading-snug ${compact ? "text-[10.5px]" : "text-[14px]"}`} style={{ color: palette.ink }}>
            {displayedText}
            {/* Blinking cursor while typewriter is running */}
            {active && !reduce && !showAll && !showFull && wordCount < words.length && (
              <span className="inline-block w-[2px] h-[1em] bg-current align-middle ml-0.5 animate-pulse" aria-hidden />
            )}
          </p>
          {/* tail toward the Mentor (bottom-right) */}
          <svg className="absolute -bottom-[13px] right-[14%]" width="22" height="14" viewBox="0 0 22 14" aria-hidden>
            <path d="M2 0 L20 0 L16 13 Z" fill="#FFFFFF" stroke={blue ? palette.accent : palette.ink} strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M3 0 L19 0" stroke="#FFFFFF" strokeWidth="4" />
          </svg>
          {/* Payoff burst anchored to bubble */}
          {isPayoff && active && <PayoffBurst palette={palette} />}
        </div>
      </div>

      {/* stage: scene + Mentor */}
      <div className="relative flex-1 min-h-0 flex items-end gap-1 px-2 pb-1">
        <div className="flex-1 min-w-0 h-full py-1">
          <Scene spec={panel.scene} palette={palette} isActive={active} />
        </div>
        <div className={`${compact ? "w-[22%]" : "w-[20%]"} h-[92%] shrink-0`}>
          <Mentor
            key={panel.lineId + panel.pose}
            pose={panel.pose}
            palette={palette}
            className="w-full h-full"
            isActive={active}
            isPayoff={isPayoff}
          />
        </div>
      </div>
    </article>
  );
}
