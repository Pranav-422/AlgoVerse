import type { Panel } from "@/lib/comic";
import { ImageOff } from "lucide-react";

// One comic panel on cream paper. Comic panels are the paper-coloured objects in the app.

export function PanelCard({ panel, total, title }: { panel: Panel; total: number; title: string }) {
  return (
    <article className="w-full h-full bg-[#FAF7F0] border-[3px] border-ink rounded-[4px] shadow-comic-lg flex flex-col overflow-hidden select-none">
      <header className="flex items-center justify-between px-4 py-2.5 border-b-2 border-ink">
        <span className="bg-ink text-[#FAF7F0] font-mono text-[11px] font-bold uppercase tracking-wider px-2 py-1">
          [Panel {String(panel.n).padStart(2, "0")}: {panel.concept.replace(/-/g, " ")}]
        </span>
        <span className="font-mono text-[10px] text-outline uppercase">
          {title} · {panel.n}/{total}
        </span>
      </header>

      <div className="flex-1 min-h-0 p-4">
        {panel.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={panel.image} alt={panel.scene} className="w-full h-full object-cover border-2 border-ink rounded-sm" draggable={false} />
        ) : (
          <div className="w-full h-full border-2 border-dashed border-ink/60 rounded-sm flex flex-col items-center justify-center text-center px-8 gap-3 bg-[repeating-linear-gradient(135deg,transparent_0_10px,rgba(24,23,31,0.035)_10px_11px)]">
            <span className="font-mono text-[10px] uppercase tracking-widest text-outline flex items-center gap-1.5">
              <ImageOff size={12} /> Scene · panel art not generated
            </span>
            <p className="font-head text-[19px] font-bold leading-snug max-w-[520px]">{panel.scene}</p>
          </div>
        )}
      </div>

      <footer className="px-4 pb-4">
        <div className="relative border-2 border-ink bg-card rounded-sm px-4 py-3 shadow-comic-sm">
          <span className="absolute -top-2.5 left-4 bg-amber-mid border-2 border-ink px-1.5 font-mono text-[9px] font-bold uppercase">
            Mentor
          </span>
          <p className="font-mono text-[14px] leading-relaxed">“{panel.dialogue}”</p>
        </div>
      </footer>
    </article>
  );
}
