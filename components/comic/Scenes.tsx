"use client";

import type { KitPalette, SceneSpec } from "@/lib/comic";

// Pre-made scene illustrations. Each dialogue line names one scene and its props;
// the model never chooses scene content, so what is drawn always matches the line.

type P = { palette: KitPalette };

const FONT = "var(--font-jetbrains), monospace";

// --- row of boxes ----------------------------------------------------------------

interface RowProps {
  values: (number | null)[];
  hi?: number[];
  found?: number[];
  fresh?: number[];
  grey?: [number, number][];
  swap?: [number, number];
  shift?: { from: number; dir: "right" | "left" };
  tags?: Record<string, string>;
  note?: string;
}

function Row({ values, hi = [], found = [], fresh = [], grey = [], swap, shift, tags = {}, note, palette }: RowProps & P) {
  const W = 46;
  const G = 8;
  const width = values.length * (W + G) - G;
  const vbW = Math.max(width + 40, 300);
  const x0 = (vbW - width) / 2;
  const y = 70;
  const isGrey = (i: number) => grey.some(([a, b]) => i >= a && i <= b);
  const cx = (i: number) => x0 + i * (W + G) + W / 2;

  return (
    <svg viewBox={`0 0 ${vbW} 160`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {note && (
        <g transform={`translate(${x0 - 4} 14) rotate(-3)`}>
          <rect width={note.length * 8 + 18} height="24" fill={palette.soft} stroke={palette.ink} strokeWidth="2" />
          <text x="9" y="16" fontSize="12" fontWeight="700" fill={palette.ink} fontFamily={FONT}>
            {note}
          </text>
        </g>
      )}
      {values.map((v, i) => {
        const x = x0 + i * (W + G);
        const g = isGrey(i);
        const fill = found.includes(i) ? palette.accent : fresh.includes(i) ? palette.accent : hi.includes(i) ? palette.accent2 : g ? palette.soft : "#FFFFFF";
        const txt = found.includes(i) || fresh.includes(i) ? palette.paper : palette.ink;
        return (
          <g key={i} opacity={g ? 0.45 : 1}>
            <rect x={x} y={y} width={W} height={W} rx="3" fill={v === null ? "none" : fill} stroke={palette.ink} strokeWidth="2.5" strokeDasharray={v === null ? "5 4" : undefined} />
            {v !== null && (
              <text x={x + W / 2} y={y + W / 2 + 6} textAnchor="middle" fontSize="17" fontWeight="700" fill={txt} fontFamily={FONT}>
                {v}
              </text>
            )}
            <text x={x + W / 2} y={y + W + 16} textAnchor="middle" fontSize="10" fill={palette.ink} opacity="0.6" fontFamily={FONT}>
              [{i}]
            </text>
            {tags[String(i)] && (
              <g>
                <rect x={x + W / 2 - (tags[String(i)].length * 7 + 12) / 2} y={y - 30} width={tags[String(i)].length * 7 + 12} height="18" rx="2" fill={palette.ink} />
                <text x={x + W / 2} y={y - 17} textAnchor="middle" fontSize="11" fontWeight="700" fill={palette.accent2} fontFamily={FONT}>
                  {tags[String(i)]}
                </text>
                <path d={`M${x + W / 2 - 4} ${y - 12} L${x + W / 2 + 4} ${y - 12} L${x + W / 2} ${y - 6} Z`} fill={palette.ink} />
              </g>
            )}
          </g>
        );
      })}
      {swap && (
        <path
          d={`M${cx(swap[0])} ${y - 6} C ${cx(swap[0])} ${y - 40}, ${cx(swap[1])} ${y - 40}, ${cx(swap[1])} ${y - 6}`}
          fill="none"
          stroke={palette.accent}
          strokeWidth="3"
          markerEnd={`url(#arrow-${palette.id})`}
          markerStart={`url(#arrow-${palette.id})`}
        />
      )}
      {shift &&
        values.map((_, i) => {
          const moves = shift.dir === "right" ? i >= shift.from && i < values.length - 1 : i >= shift.from;
          if (!moves || values[i] === null) return null;
          const a = cx(i);
          const b = shift.dir === "right" ? cx(i + 1) : cx(i - 1);
          return <path key={i} d={`M${a} ${y - 8} Q ${(a + b) / 2} ${y - 30} ${b} ${y - 8}`} fill="none" stroke={palette.accent} strokeWidth="2.5" markerEnd={`url(#arrow-${palette.id})`} />;
        })}
      <defs>
        <marker id={`arrow-${palette.id}`} viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 Z" fill={palette.accent} />
        </marker>
      </defs>
    </svg>
  );
}

// --- address formula -------------------------------------------------------------

function Formula({ base, i, size, solved, palette }: { base: number; i: number; size: number; solved: boolean } & P) {
  const addr = base + i * size;
  const cells = Array.from({ length: 6 }, (_, k) => base + k * size);
  return (
    <svg viewBox="0 0 320 160" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <rect x="20" y="14" width="280" height="62" rx="4" fill="#FFFFFF" stroke={palette.ink} strokeWidth="2.5" />
      <text x="160" y="40" textAnchor="middle" fontSize="15" fontWeight="700" fill={palette.ink} fontFamily={FONT}>
        address = base + i × size
      </text>
      <text x="160" y="64" textAnchor="middle" fontSize="14" fill={solved ? palette.accent : palette.ink} fontWeight="700" fontFamily={FONT}>
        {solved ? `= ${base} + ${i} × ${size} = ${addr}` : `base = ${base}, i = ${i}, size = ${size}`}
      </text>
      {cells.map((c, k) => (
        <g key={c}>
          <rect x={22 + k * 47} y="98" width="42" height="30" rx="2" fill={solved && c === addr ? palette.accent : "#FFFFFF"} stroke={palette.ink} strokeWidth="2" />
          <text x={43 + k * 47} y="118" textAnchor="middle" fontSize="11" fontWeight="700" fill={solved && c === addr ? palette.paper : palette.ink} fontFamily={FONT}>
            {c}
          </text>
          <text x={43 + k * 47} y="144" textAnchor="middle" fontSize="9" fill={palette.ink} opacity="0.6" fontFamily={FONT}>
            [{k}]
          </text>
        </g>
      ))}
    </svg>
  );
}

// --- cinema row ------------------------------------------------------------------

function Cinema({ seats, latecomer, palette }: { seats: number; latecomer: number | null } & P) {
  const W = 42;
  const x0 = (320 - seats * (W + 6)) / 2;
  const tones = [palette.accent, palette.accent2, palette.soft, palette.ink];
  return (
    <svg viewBox="0 0 320 160" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {Array.from({ length: seats }, (_, i) => {
        const x = x0 + i * (W + 6);
        return (
          <g key={i}>
            <circle cx={x + W / 2} cy="86" r="11" fill={tones[i % tones.length]} stroke={palette.ink} strokeWidth="2" />
            <rect x={x} y="98" width={W} height="34" rx="6" fill="#FFFFFF" stroke={palette.ink} strokeWidth="2.5" />
            <text x={x + W / 2} y="148" textAnchor="middle" fontSize="10" fill={palette.ink} opacity="0.6" fontFamily={FONT}>
              seat {i}
            </text>
          </g>
        );
      })}
      {latecomer !== null && (
        <g>
          <circle cx={x0 + latecomer * (W + 6) + W / 2} cy="30" r="12" fill={palette.accent} stroke={palette.ink} strokeWidth="2.5" />
          <text x={x0 + latecomer * (W + 6) + W / 2 + 18} y="26" fontSize="11" fontWeight="700" fill={palette.ink} fontFamily={FONT}>
            latecomer
          </text>
          <path d={`M${x0 + latecomer * (W + 6) + W / 2} 46 L${x0 + latecomer * (W + 6) + W / 2} 68`} stroke={palette.ink} strokeWidth="2.5" strokeDasharray="4 3" />
        </g>
      )}
    </svg>
  );
}

// --- complexity badge ------------------------------------------------------------

function Complexity({ label, big, vs, palette }: { label: string; big: string; vs?: string } & P) {
  return (
    <svg viewBox="0 0 320 160" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <g transform="rotate(-4 160 78)">
        <circle cx="160" cy="76" r="58" fill={palette.accent2} stroke={palette.ink} strokeWidth="3" />
        <circle cx="160" cy="76" r="48" fill="none" stroke={palette.ink} strokeWidth="1.5" strokeDasharray="3 4" />
        <text x="160" y="88" textAnchor="middle" fontSize={big.length > 5 ? 26 : 34} fontWeight="800" fill={palette.ink} fontFamily={FONT}>
          {big}
        </text>
      </g>
      <text x="160" y="150" textAnchor="middle" fontSize="12" fontWeight="700" fill={palette.ink} fontFamily={FONT}>
        {label}
        {vs ? ` · ${vs}` : ""}
      </text>
    </svg>
  );
}

// --- sorted vs unsorted shelves ---------------------------------------------------

function Messy({ palette }: P) {
  const messy = [42, 8, 67, 15, 80, 23];
  const sorted = [8, 15, 23, 42, 67, 80];
  return (
    <svg viewBox="0 0 320 160" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {messy.map((v, i) => (
        <g key={`m${i}`} transform={`rotate(${(i % 2 ? 6 : -5)} ${40 + i * 40} 40)`}>
          <rect x={22 + i * 40} y="24" width="34" height="30" rx="2" fill="#FFFFFF" stroke={palette.ink} strokeWidth="2" />
          <text x={39 + i * 40} y="44" textAnchor="middle" fontSize="12" fontWeight="700" fill={palette.ink} fontFamily={FONT}>
            {v}
          </text>
        </g>
      ))}
      <text x="292" y="45" fontSize="20" fontWeight="800" fill="#B3261E">✗</text>
      {sorted.map((v, i) => (
        <g key={`s${i}`}>
          <rect x={22 + i * 40} y="96" width="34" height="30" rx="2" fill={palette.soft} stroke={palette.ink} strokeWidth="2" />
          <text x={39 + i * 40} y="116" textAnchor="middle" fontSize="12" fontWeight="700" fill={palette.ink} fontFamily={FONT}>
            {v}
          </text>
        </g>
      ))}
      <text x="292" y="117" fontSize="20" fontWeight="800" fill="#2F7D4F">✓</text>
      <text x="22" y="150" fontSize="10" fill={palette.ink} opacity="0.7" fontFamily={FONT}>
        halving only works on the sorted shelf
      </text>
    </svg>
  );
}

export function Scene({ spec, palette }: { spec: SceneSpec; palette: KitPalette }) {
  const s = spec as Record<string, unknown>;
  switch (spec.id) {
    case "row":
      return <Row {...(s as unknown as RowProps)} palette={palette} />;
    case "formula":
      return <Formula base={s.base as number} i={s.i as number} size={s.size as number} solved={Boolean(s.solved)} palette={palette} />;
    case "cinema":
      return <Cinema seats={s.seats as number} latecomer={(s.latecomer as number | null) ?? null} palette={palette} />;
    case "complexity":
      return <Complexity label={s.label as string} big={s.big as string} vs={s.vs as string | undefined} palette={palette} />;
    case "messy":
      return <Messy palette={palette} />;
    default:
      return null;
  }
}

// --- theme backdrops -------------------------------------------------------------

export function Backdrop({ theme, palette }: { theme: string; palette: KitPalette }) {
  const c = palette.ink;
  return (
    <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.13 }} aria-hidden>
      {theme === "warehouse" && (
        <g stroke={c} strokeWidth="3" fill="none">
          <path d="M0 90 H400 M0 160 H400 M0 230 H400" />
          {[20, 120, 250, 330].map((x) => (
            <rect key={x} x={x} y="185" width="50" height="45" />
          ))}
          {[60, 180, 300].map((x) => (
            <rect key={x} x={x} y="115" width="40" height="45" />
          ))}
        </g>
      )}
      {theme === "cinema" && (
        <g fill={c}>
          <path d="M0 0 H90 Q70 60 90 250 H0 Z" />
          <path d="M400 0 H310 Q330 60 310 250 H400 Z" />
          <ellipse cx="200" cy="250" rx="140" ry="40" fill={palette.accent} />
        </g>
      )}
      {theme === "library" && (
        <g fill={c}>
          {Array.from({ length: 26 }, (_, i) => (
            <rect key={i} x={i * 15.5} y={250 - (40 + ((i * 37) % 45))} width="12" height={40 + ((i * 37) % 45)} />
          ))}
        </g>
      )}
      {theme === "lab" && (
        <g stroke={c} strokeWidth="1">
          {Array.from({ length: 20 }, (_, i) => (
            <path key={`v${i}`} d={`M${i * 20} 0 V250`} />
          ))}
          {Array.from({ length: 13 }, (_, i) => (
            <path key={`h${i}`} d={`M0 ${i * 20} H400`} />
          ))}
          {Array.from({ length: 40 }, (_, i) => (
            <path key={`t${i}`} d={`M${i * 10} 250 V${i % 5 ? 242 : 232}`} strokeWidth="2" />
          ))}
        </g>
      )}
    </svg>
  );
}
