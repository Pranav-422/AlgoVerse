"use client";

import { motion } from "framer-motion";
import { SkipBack, SkipForward, Play, Pause, RotateCcw } from "lucide-react";

// Playback bar + clickable step timeline. Stepping is index arithmetic over the frame list.

interface Props {
  index: number;
  total: number;
  playing: boolean;
  speed: number;
  onIndex: (i: number) => void;
  onPlaying: (p: boolean) => void;
  onSpeed: (s: number) => void;
}

const SPEEDS = [0.5, 1, 1.5, 2, 3];

export function Transport({ index, total, playing, speed, onIndex, onPlaying, onSpeed }: Props) {
  const atEnd = index >= total - 1;
  return (
    <div className="box p-3 space-y-3">
      {/* Timeline */}
      <div className="flex items-end gap-[3px] h-9 px-1" role="slider" aria-valuemin={1} aria-valuemax={total} aria-valuenow={index + 1}>
        {Array.from({ length: total }).map((_, i) => {
          const past = i < index;
          const now = i === index;
          return (
            <button
              key={i}
              onClick={() => onIndex(i)}
              aria-label={`Go to step ${i + 1}`}
              className="flex-1 min-w-[3px] h-full flex items-end group"
            >
              <motion.span
                className={`w-full rounded-t-[2px] border border-ink ${now ? "bg-amber" : past ? "bg-amber-light" : "bg-card group-hover:bg-cream"}`}
                animate={{ height: now ? "100%" : past ? "55%" : "40%" }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button className="btn btn-light !p-2" onClick={() => onIndex(Math.max(index - 1, 0))} disabled={index === 0} aria-label="Step back">
          <SkipBack size={16} />
        </button>
        <button
          className="btn btn-amber !px-5 !py-2 min-w-[110px]"
          onClick={() => {
            if (atEnd) onIndex(0);
            onPlaying(!playing);
          }}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />} {playing ? "Pause" : atEnd ? "Replay" : "Play"}
        </button>
        <button className="btn btn-light !p-2" onClick={() => onIndex(Math.min(index + 1, total - 1))} disabled={atEnd} aria-label="Step forward">
          <SkipForward size={16} />
        </button>
        <button
          className="btn btn-light !p-2"
          onClick={() => {
            onPlaying(false);
            onIndex(0);
          }}
          aria-label="Reset"
        >
          <RotateCcw size={16} />
        </button>

        <div className="flex items-center gap-1 ml-3 border-2 border-ink rounded-full p-0.5 bg-cream">
          {SPEEDS.map((s) => (
            <button
              key={s}
              onClick={() => onSpeed(s)}
              className={`px-2 py-0.5 rounded-full font-mono text-[11px] font-bold ${speed === s ? "bg-ink text-amber-mid" : "hover:bg-card"}`}
            >
              {s}×
            </button>
          ))}
        </div>

        <span className="ml-auto font-mono text-[12px] font-bold">
          <span className="text-2xl font-head">{String(index + 1).padStart(2, "0")}</span>
          <span className="text-outline"> / {String(total).padStart(2, "0")}</span>
        </span>
      </div>
    </div>
  );
}
