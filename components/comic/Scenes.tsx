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

// --- linked list chain -----------------------------------------------------------

interface ChainProps {
  values: number[];
  head?: boolean;
  hi?: number[];
  found?: number[];
  fresh?: number[];
  reversed?: number;
  tags?: Record<string | number, string>;
  nullEnd?: boolean;
  note?: string;
}

function Chain({
  values = [],
  head = false,
  hi = [],
  found = [],
  fresh = [],
  reversed = 0,
  tags = {},
  nullEnd = false,
  note,
  palette,
}: ChainProps & P) {
  const N = values.length;
  const Wv = 34;
  const Wp = 16;
  const W = Wv + Wp;
  const H = 34;
  const gap = 24;

  const headW = head ? 46 : 0;
  const nullW = nullEnd ? 42 : 0;
  const totalW = headW + (N > 0 ? N * W + (N - 1) * gap : 0) + nullW;
  const vbW = Math.max(totalW + 40, 320);
  const startX = (vbW - totalW) / 2 + headW;
  const baseY = 80;

  return (
    <svg viewBox={`0 0 ${vbW} 160`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <marker id={`chain-arrow-${palette.id}`} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0 L10 5 L0 10 Z" fill={palette.accent} />
        </marker>
        <marker id={`chain-arrow-ink-${palette.id}`} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0 L10 5 L0 10 Z" fill={palette.ink} />
        </marker>
      </defs>

      {note && (
        <g transform="translate(20 14) rotate(-3)">
          <rect width={note.length * 8 + 18} height="24" fill={palette.soft} stroke={palette.ink} strokeWidth="2" />
          <text x="9" y="16" fontSize="12" fontWeight="700" fill={palette.ink} fontFamily={FONT}>
            {note}
          </text>
        </g>
      )}

      {head && (
        <g>
          <rect x={startX - headW} y={baseY + 3} width="36" height="28" rx="3" fill={palette.soft} stroke={palette.ink} strokeWidth="2" />
          <text x={startX - headW + 18} y={baseY + 21} textAnchor="middle" fontSize="10" fontWeight="700" fill={palette.ink} fontFamily={FONT}>
            HEAD
          </text>
          <path
            d={`M${startX - headW + 36} ${baseY + 17} L${startX - 2} ${baseY + 17}`}
            stroke={palette.ink}
            strokeWidth="2"
            markerEnd={`url(#chain-arrow-ink-${palette.id})`}
          />
        </g>
      )}

      {values.map((v, i) => {
        const x = startX + i * (W + gap);
        const isLifted = fresh.includes(i);
        const y = isLifted ? baseY - 24 : baseY;
        const isFound = found.includes(i);
        const isFresh = fresh.includes(i);
        const isHi = hi.includes(i);
        const fill = isFound || isFresh ? palette.accent : isHi ? palette.accent2 : "#FFFFFF";
        const txt = isFound || isFresh ? palette.paper : palette.ink;
        const tag = tags[String(i)] ?? tags[i];
        const isRev = reversed > i;

        return (
          <g key={i}>
            {tag && (
              <g>
                <rect x={x + W / 2 - (tag.length * 7 + 12) / 2} y={y - 28} width={tag.length * 7 + 12} height="18" rx="2" fill={palette.ink} />
                <text x={x + W / 2} y={y - 15} textAnchor="middle" fontSize="11" fontWeight="700" fill={palette.accent2} fontFamily={FONT}>
                  {tag}
                </text>
                <path d={`M${x + W / 2 - 4} ${y - 10} L${x + W / 2 + 4} ${y - 10} L${x + W / 2} ${y - 4} Z`} fill={palette.ink} />
              </g>
            )}

            <rect x={x} y={y} width={W} height={H} rx="3" fill={fill} stroke={palette.ink} strokeWidth="2.5" />
            <line x1={x + Wv} y1={y} x2={x + Wv} y2={y + H} stroke={palette.ink} strokeWidth="2" />

            <text x={x + Wv / 2} y={y + H / 2 + 5} textAnchor="middle" fontSize="15" fontWeight="700" fill={txt} fontFamily={FONT}>
              {v}
            </text>

            <circle cx={x + Wv + Wp / 2} cy={y + H / 2} r="3" fill={palette.ink} />

            {i < N - 1 && !isRev && (
              <path
                d={
                  isLifted
                    ? `M${x + Wv + Wp / 2} ${y + H / 2} C${x + W + 12} ${y + H / 2}, ${x + W} ${baseY + H / 2}, ${x + W + gap - 2} ${baseY + H / 2}`
                    : `M${x + Wv + Wp / 2} ${y + H / 2} L${x + W + gap - 2} ${y + H / 2}`
                }
                fill="none"
                stroke={palette.accent}
                strokeWidth="2.5"
                markerEnd={`url(#chain-arrow-${palette.id})`}
              />
            )}

            {isRev && (
              <path
                d={
                  i > 0
                    ? `M${x + Wv + Wp / 2} ${y + H / 2} C${x + Wv + Wp / 2} ${y - 16}, ${x - gap + W / 2} ${y - 16}, ${x - gap + 2} ${y + H / 2}`
                    : `M${x + Wv + Wp / 2} ${y + H / 2} C${x + Wv} ${y + H + 18}, ${x - 16} ${y + H + 18}, ${x - 20} ${y + H / 2}`
                }
                fill="none"
                stroke={palette.accent}
                strokeWidth="2.5"
                markerEnd={`url(#chain-arrow-${palette.id})`}
              />
            )}

            {i === N - 1 && nullEnd && (
              <g>
                <line
                  x1={x + Wv + Wp / 2}
                  y1={y + H / 2}
                  x2={x + W + 18}
                  y2={y + H / 2}
                  stroke={palette.ink}
                  strokeWidth="2"
                  markerEnd={`url(#chain-arrow-ink-${palette.id})`}
                />
                <text x={x + W + 22} y={y + H / 2 + 4} fontSize="11" fontWeight="700" fill={palette.ink} fontFamily={FONT}>
                  NULL
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// --- vertical stack --------------------------------------------------------------

interface StackProps {
  values?: (number | string)[];
  top?: boolean;
  hi?: number[];
  incoming?: number | string;
  outgoing?: number | string;
  capacity?: number;
  note?: string;
}

function Stack({
  values = [],
  top = false,
  hi = [],
  incoming,
  outgoing,
  capacity,
  note,
  palette,
}: StackProps & P) {
  const cap = capacity ?? Math.max(values.length, 4);
  const W = 88;
  const H = 22;
  const x = 116;
  const yFloor = 142;
  const yTop = yFloor - cap * H;

  return (
    <svg viewBox="0 0 320 160" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <marker id={`stack-arrow-${palette.id}`} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0 L10 5 L0 10 Z" fill={palette.accent} />
        </marker>
        <marker id={`stack-arrow-ink-${palette.id}`} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0 L10 5 L0 10 Z" fill={palette.ink} />
        </marker>
      </defs>

      {note && (
        <g transform="translate(16 14) rotate(-3)">
          <rect width={note.length * 8 + 18} height="24" fill={palette.soft} stroke={palette.ink} strokeWidth="2" />
          <text x="9" y="16" fontSize="12" fontWeight="700" fill={palette.ink} fontFamily={FONT}>
            {note}
          </text>
        </g>
      )}

      {/* Container frame */}
      <path
        d={`M${x} ${yTop} L${x} ${yFloor} L${x + W} ${yFloor} L${x + W} ${yTop}`}
        fill="none"
        stroke={palette.ink}
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Slots */}
      {Array.from({ length: cap }, (_, k) => {
        const slotY = yFloor - (k + 1) * H;
        const hasVal = k < values.length;
        const v = hasVal ? values[k] : null;
        const isHi = hi.includes(k);
        return (
          <g key={k}>
            {hasVal ? (
              <g>
                <rect
                  x={x + 3}
                  y={slotY + 2}
                  width={W - 6}
                  height={H - 4}
                  rx="2"
                  fill={isHi ? palette.accent2 : palette.soft}
                  stroke={palette.ink}
                  strokeWidth="1.5"
                />
                <text x={x + W / 2} y={slotY + H / 2 + 5} textAnchor="middle" fontSize="12" fontWeight="700" fill={palette.ink} fontFamily={FONT}>
                  {v}
                </text>
              </g>
            ) : (
              <rect
                x={x + 3}
                y={slotY + 2}
                width={W - 6}
                height={H - 4}
                rx="2"
                fill="none"
                stroke={palette.ink}
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.3"
              />
            )}
          </g>
        );
      })}

      {/* TOP pointer */}
      {top && values.length > 0 && (
        <g>
          <path
            d={`M${x - 28} ${yFloor - (values.length - 0.5) * H} L${x - 6} ${yFloor - (values.length - 0.5) * H}`}
            stroke={palette.ink}
            strokeWidth="2"
            markerEnd={`url(#stack-arrow-ink-${palette.id})`}
          />
          <text x={x - 32} y={yFloor - (values.length - 0.5) * H + 4} textAnchor="end" fontSize="10" fontWeight="700" fill={palette.ink} fontFamily={FONT}>
            TOP
          </text>
        </g>
      )}

      {/* Incoming element */}
      {incoming !== undefined && (
        <g>
          <rect x={x + 4} y={yTop - 34} width={W - 8} height={H - 4} rx="2" fill={palette.accent} stroke={palette.ink} strokeWidth="2" />
          <text x={x + W / 2} y={yTop - 34 + H / 2 + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill={palette.paper} fontFamily={FONT}>
            {incoming}
          </text>
          <path
            d={`M${x + W / 2} ${yTop - 14} L${x + W / 2} ${yTop - 4}`}
            stroke={palette.accent}
            strokeWidth="2.5"
            markerEnd={`url(#stack-arrow-${palette.id})`}
          />
        </g>
      )}

      {/* Outgoing element */}
      {outgoing !== undefined && (
        <g>
          <rect x={x + W + 24} y={yFloor - values.length * H - 18} width={W - 14} height={H - 4} rx="2" fill={palette.accent} stroke={palette.ink} strokeWidth="2" />
          <text x={x + W + 24 + (W - 14) / 2} y={yFloor - values.length * H - 18 + H / 2 + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill={palette.paper} fontFamily={FONT}>
            {outgoing}
          </text>
          <path
            d={`M${x + W + 6} ${yFloor - values.length * H - 8} L${x + W + 20} ${yFloor - values.length * H - 8}`}
            stroke={palette.accent}
            strokeWidth="2.5"
            markerEnd={`url(#stack-arrow-${palette.id})`}
          />
        </g>
      )}
    </svg>
  );
}

// --- queue (linear and circular ring) --------------------------------------------

interface QueueProps {
  values?: (number | null)[];
  front?: number;
  rear?: number;
  hi?: number[];
  incoming?: number;
  outgoing?: number;
  ring?: boolean;
  note?: string;
}

function Queue({
  values = [],
  front = 0,
  rear = 0,
  hi = [],
  incoming,
  outgoing,
  ring = false,
  note,
  palette,
}: QueueProps & P) {
  if (ring) {
    const N = Math.max(values.length, 4);
    const cx = 160;
    const cy = 84;
    const R = 46;
    const rSlot = 16;
    return (
      <svg viewBox="0 0 320 160" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {note && (
          <g transform="translate(16 12) rotate(-3)">
            <rect width={note.length * 8 + 18} height="24" fill={palette.soft} stroke={palette.ink} strokeWidth="2" />
            <text x="9" y="16" fontSize="12" fontWeight="700" fill={palette.ink} fontFamily={FONT}>
              {note}
            </text>
          </g>
        )}

        <circle cx={cx} cy={cy} r={R} fill="none" stroke={palette.ink} strokeWidth="1.5" strokeDasharray="4 4" opacity="0.3" />

        {Array.from({ length: N }, (_, i) => {
          const angle = -Math.PI / 2 + (2 * Math.PI * i) / N;
          const sx = cx + R * Math.cos(angle);
          const sy = cy + R * Math.sin(angle);
          const v = values[i] ?? null;
          const isHi = hi.includes(i);
          const isFront = i === front;
          const isRear = i === rear;

          return (
            <g key={i}>
              <circle
                cx={sx}
                cy={sy}
                r={rSlot}
                fill={isHi ? palette.accent2 : v !== null ? palette.soft : "#FFFFFF"}
                stroke={palette.ink}
                strokeWidth="2"
                strokeDasharray={v === null ? "3 3" : undefined}
              />
              {v !== null && (
                <text x={sx} y={sy + 4} textAnchor="middle" fontSize="12" fontWeight="700" fill={palette.ink} fontFamily={FONT}>
                  {v}
                </text>
              )}
              <text
                x={cx + (R + 24) * Math.cos(angle)}
                y={cy + (R + 24) * Math.sin(angle) + 4}
                textAnchor="middle"
                fontSize="9"
                fill={palette.ink}
                opacity="0.6"
                fontFamily={FONT}
              >
                [{i}]
              </text>
              {isFront && (
                <g>
                  <circle cx={cx + (R - 20) * Math.cos(angle)} cy={cy + (R - 20) * Math.sin(angle)} r="8" fill={palette.ink} />
                  <text x={cx + (R - 20) * Math.cos(angle)} y={cy + (R - 20) * Math.sin(angle) + 3} textAnchor="middle" fontSize="8" fontWeight="700" fill={palette.paper} fontFamily={FONT}>
                    F
                  </text>
                </g>
              )}
              {isRear && (
                <g>
                  <circle cx={cx + (R - 20) * Math.cos(angle) + (isFront ? 14 : 0)} cy={cy + (R - 20) * Math.sin(angle)} r="8" fill={palette.accent} />
                  <text x={cx + (R - 20) * Math.cos(angle) + (isFront ? 14 : 0)} y={cy + (R - 20) * Math.sin(angle) + 3} textAnchor="middle" fontSize="8" fontWeight="700" fill={palette.paper} fontFamily={FONT}>
                    R
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {incoming !== undefined && (
          <g>
            <rect x="250" y="24" width="42" height="26" rx="3" fill={palette.accent} stroke={palette.ink} strokeWidth="2" />
            <text x="271" y="41" textAnchor="middle" fontSize="11" fontWeight="700" fill={palette.paper} fontFamily={FONT}>
              +{incoming}
            </text>
          </g>
        )}
      </svg>
    );
  }

  const N = Math.max(values.length, 1);
  const W = 38;
  const G = 6;
  const totalW = N * (W + G) - G;
  const x0 = (320 - totalW) / 2;
  const y = 68;

  return (
    <svg viewBox="0 0 320 160" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <marker id={`queue-arrow-lin-${palette.id}`} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0 L10 5 L0 10 Z" fill={palette.accent} />
        </marker>
        <marker id={`queue-arrow-ink-${palette.id}`} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0 L10 5 L0 10 Z" fill={palette.ink} />
        </marker>
      </defs>

      {note && (
        <g transform={`translate(${Math.max(x0 - 4, 14)} 12) rotate(-3)`}>
          <rect width={note.length * 8 + 18} height="24" fill={palette.soft} stroke={palette.ink} strokeWidth="2" />
          <text x="9" y="16" fontSize="12" fontWeight="700" fill={palette.ink} fontFamily={FONT}>
            {note}
          </text>
        </g>
      )}

      {values.map((v, i) => {
        const x = x0 + i * (W + G);
        const isHi = hi.includes(i);
        const isFront = i === front;
        const isRear = i === rear;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={W}
              height={W}
              rx="3"
              fill={isHi ? palette.accent2 : v !== null ? palette.soft : "#FFFFFF"}
              stroke={palette.ink}
              strokeWidth="2"
              strokeDasharray={v === null ? "4 3" : undefined}
            />
            {v !== null && (
              <text x={x + W / 2} y={y + W / 2 + 5} textAnchor="middle" fontSize="14" fontWeight="700" fill={palette.ink} fontFamily={FONT}>
                {v}
              </text>
            )}
            <text x={x + W / 2} y={y + W + 14} textAnchor="middle" fontSize="9" fill={palette.ink} opacity="0.6" fontFamily={FONT}>
              [{i}]
            </text>

            {isFront && (
              <g>
                <text x={x + W / 2} y={y - 12} textAnchor="middle" fontSize="10" fontWeight="700" fill={palette.ink} fontFamily={FONT}>
                  FRONT
                </text>
                <path d={`M${x + W / 2} ${y - 10} L${x + W / 2} ${y - 2}`} stroke={palette.ink} strokeWidth="2" markerEnd={`url(#queue-arrow-ink-${palette.id})`} />
              </g>
            )}

            {isRear && (
              <g>
                <text x={x + W / 2} y={y + W + 28} textAnchor="middle" fontSize="10" fontWeight="700" fill={palette.accent} fontFamily={FONT}>
                  REAR
                </text>
                <path d={`M${x + W / 2} ${y + W + 18} L${x + W / 2} ${y + W + 6}`} stroke={palette.accent} strokeWidth="2" markerEnd={`url(#queue-arrow-lin-${palette.id})`} />
              </g>
            )}
          </g>
        );
      })}

      {incoming !== undefined && (
        <g>
          <rect x={x0 + totalW + 16} y={y + 4} width={34} height={28} rx="3" fill={palette.accent} stroke={palette.ink} strokeWidth="2" />
          <text x={x0 + totalW + 33} y={y + 22} textAnchor="middle" fontSize="12" fontWeight="700" fill={palette.paper} fontFamily={FONT}>
            {incoming}
          </text>
          <path
            d={`M${x0 + totalW + 14} ${y + 18} L${x0 + totalW + 2} ${y + 18}`}
            stroke={palette.accent}
            strokeWidth="2.5"
            markerEnd={`url(#queue-arrow-lin-${palette.id})`}
          />
        </g>
      )}

      {outgoing !== undefined && (
        <g>
          <rect x={x0 - 46} y={y + 4} width={34} height={28} rx="3" fill={palette.accent} stroke={palette.ink} strokeWidth="2" />
          <text x={x0 - 29} y={y + 22} textAnchor="middle" fontSize="12" fontWeight="700" fill={palette.paper} fontFamily={FONT}>
            {outgoing}
          </text>
          <path
            d={`M${x0 - 2} ${y + 18} L${x0 - 12} ${y + 18}`}
            stroke={palette.accent}
            strokeWidth="2.5"
            markerEnd={`url(#queue-arrow-lin-${palette.id})`}
          />
        </g>
      )}
    </svg>
  );
}

// --- binary tree -----------------------------------------------------------------

interface TreeProps {
  nodes?: (number | null)[];
  hi?: number[];
  found?: number[];
  path?: number[];
  order?: Record<string | number, number> | number[];
  note?: string;
}

const TREE_COORDS: { x: number; y: number }[] = [
  { x: 160, y: 32 },
  { x: 96, y: 76 },
  { x: 224, y: 76 },
  { x: 64, y: 124 },
  { x: 128, y: 124 },
  { x: 192, y: 124 },
  { x: 256, y: 124 },
];

const TREE_PAIRS: [number, number][] = [
  [0, 1],
  [0, 2],
  [1, 3],
  [1, 4],
  [2, 5],
  [2, 6],
];

function Tree({
  nodes = [],
  hi = [],
  found = [],
  path = [],
  order,
  note,
  palette,
}: TreeProps & P) {
  const getOrder = (i: number): number | undefined => {
    if (!order) return undefined;
    if (Array.isArray(order)) return order[i];
    return (order as Record<string, number>)[String(i)] ?? (order as Record<string, number>)[i];
  };

  return (
    <svg viewBox="0 0 320 160" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {note && (
        <g transform="translate(16 12) rotate(-3)">
          <rect width={note.length * 8 + 18} height="24" fill={palette.soft} stroke={palette.ink} strokeWidth="2" />
          <text x="9" y="16" fontSize="12" fontWeight="700" fill={palette.ink} fontFamily={FONT}>
            {note}
          </text>
        </g>
      )}

      {TREE_PAIRS.map(([p, c]) => {
        if (p >= nodes.length || c >= nodes.length) return null;
        if (nodes[p] === null || nodes[p] === undefined || nodes[c] === null || nodes[c] === undefined) return null;
        const pPt = TREE_COORDS[p];
        const cPt = TREE_COORDS[c];
        if (!pPt || !cPt) return null;
        const isPathEdge = path.includes(p) && path.includes(c);
        return (
          <line
            key={`edge-${p}-${c}`}
            x1={pPt.x}
            y1={pPt.y}
            x2={cPt.x}
            y2={cPt.y}
            stroke={isPathEdge ? palette.accent : palette.ink}
            strokeWidth={isPathEdge ? "3.5" : "2"}
          />
        );
      })}

      {nodes.map((v, i) => {
        if (v === null || v === undefined) return null;
        const pt = TREE_COORDS[i];
        if (!pt) return null;
        const isFound = found.includes(i);
        const isHi = hi.includes(i);
        const isPath = path.includes(i);
        const fill = isFound ? palette.accent : isHi ? palette.accent2 : isPath ? palette.soft : "#FFFFFF";
        const txtColor = isFound ? palette.paper : palette.ink;
        const ord = getOrder(i);

        return (
          <g key={i}>
            <circle cx={pt.x} cy={pt.y} r="14" fill={fill} stroke={palette.ink} strokeWidth="2.5" />
            <text x={pt.x} y={pt.y + 4} textAnchor="middle" fontSize="11" fontWeight="700" fill={txtColor} fontFamily={FONT}>
              {v}
            </text>

            {ord !== undefined && (
              <g>
                <circle cx={pt.x + 12} cy={pt.y - 11} r="7" fill={palette.ink} />
                <text x={pt.x + 12} y={pt.y - 8} textAnchor="middle" fontSize="8" fontWeight="700" fill={palette.paper} fontFamily={FONT}>
                  {ord}
                </text>
              </g>
            )}
          </g>
        );
      })}
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
    case "chain":
      return <Chain {...(s as unknown as ChainProps)} palette={palette} />;
    case "stack":
      return <Stack {...(s as unknown as StackProps)} palette={palette} />;
    case "queue":
      return <Queue {...(s as unknown as QueueProps)} palette={palette} />;
    case "tree":
      return <Tree {...(s as unknown as TreeProps)} palette={palette} />;
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
