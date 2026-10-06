"use client";

import { useRef, useState } from "react";
import { Film, PlayCircle } from "lucide-react";

export interface Chapter {
  t: number;
  title: string;
}

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export function VideoPlayer({ src, chapters, hasFile }: { src: string; chapters: Chapter[]; hasFile: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [time, setTime] = useState(0);
  const active = chapters.reduce((acc, c, i) => (time >= c.t ? i : acc), 0);

  return (
    <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
      <div className="box p-3">
        <div className="relative aspect-video bg-ink rounded-sm overflow-hidden border-2 border-ink">
          {hasFile ? (
            <video
              ref={ref}
              src={src}
              controls
              className="w-full h-full"
              onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
            />
          ) : (
            <div className="absolute inset-0 bg-grid !bg-[#FAF7F0] flex flex-col items-center justify-center text-center gap-3 px-10">
              <Film size={34} className="text-amber" />
              <p className="font-head font-extrabold text-2xl">Video file not added yet</p>
              <p className="font-mono text-[12px] text-muted max-w-[460px]">
                The lesson is pre-rendered outside the app. Put the file at <code className="bg-cream px-1">public{src}</code>{" "}
                and it plays here with the chapter markers on the right.
              </p>
            </div>
          )}
          <span className="absolute top-3 left-3 tag !bg-amber-mid">Pre-rendered</span>
        </div>
      </div>

      <aside className="box overflow-hidden">
        <div className="px-4 py-2.5 border-b-2 border-ink bg-cream flex justify-between">
          <span className="label !text-ink font-bold">Chapter markers</span>
          <span className="font-mono text-[10px] text-outline">{chapters.length} sections</span>
        </div>
        <ol>
          {chapters.map((c, i) => (
            <li key={c.t}>
              <button
                disabled={!hasFile}
                onClick={() => {
                  if (ref.current) {
                    ref.current.currentTime = c.t;
                    void ref.current.play();
                  }
                }}
                className={`w-full text-left flex gap-3 px-4 py-3 border-t border-dashed border-outline-soft first:border-t-0 disabled:cursor-default ${
                  hasFile && i === active ? "bg-amber-light/60" : "hover:bg-cream"
                }`}
              >
                <PlayCircle size={16} className={hasFile && i === active ? "text-amber" : "text-outline"} />
                <span className="flex-1">
                  <span className="block font-mono text-[10px] text-outline">{fmt(c.t)}</span>
                  <span className="block font-mono text-[12px] font-bold">
                    {String(i + 1).padStart(2, "0")}. {c.title}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
