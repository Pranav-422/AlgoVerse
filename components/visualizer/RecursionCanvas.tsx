"use client";

import { THEME } from "@/lib/theme";
import type { RecursionFrame } from "@/lib/viz/types";

export function RecursionCanvas({ frame }: { frame: RecursionFrame }) {
  const width = 680;
  const height = 340;
  const stackBaseY = 300;
  const stackX = 40;
  const stackWidth = 310;
  const frameHeight = 36;
  const frameGap = 6;

  const topIndex = frame.stack.length - 1;

  return (
    <div className="w-full h-full flex items-center justify-center p-2">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full max-h-[420px] select-none"
        style={{ fontFamily: "monospace" }}
      >
        {/* Call Stack Container */}
        <g>
          <text x={stackX} y="30" fill={THEME.ink} fontSize="12" fontWeight="bold">
            CALL STACK (BOTTOM → TOP)
          </text>
          <line
            x1={stackX}
            y1={stackBaseY + 5}
            x2={stackX + stackWidth}
            y2={stackBaseY + 5}
            stroke={THEME.ink}
            strokeWidth="3"
            strokeLinecap="round"
          />

          {frame.stack.length === 0 ? (
            <text x={stackX + 20} y={stackBaseY - 20} fill={THEME.outline} fontSize="12">
              (call stack empty)
            </text>
          ) : (
            frame.stack.map((item, idx) => {
              const isTop = idx === topIndex;
              const y = stackBaseY - (idx + 1) * (frameHeight + frameGap);

              return (
                <g key={`frame-${idx}-${item.call}`}>
                  <rect
                    x={stackX}
                    y={y}
                    width={stackWidth}
                    height={frameHeight}
                    rx="3"
                    fill={isTop ? THEME.amberMid : THEME.card}
                    stroke={THEME.ink}
                    strokeWidth={isTop ? 2.5 : 2}
                  />
                  {isTop && (
                    <g transform={`translate(${stackX + stackWidth - 45}, ${y + 8})`}>
                      <rect width="36" height="18" rx="2" fill={THEME.ink} />
                      <text
                        x="18"
                        y="13"
                        textAnchor="middle"
                        fill={THEME.amberLight}
                        fontSize="9"
                        fontWeight="bold"
                      >
                        TOP
                      </text>
                    </g>
                  )}
                  <text
                    x={stackX + 12}
                    y={y + 23}
                    fill={THEME.ink}
                    fontSize="13"
                    fontWeight="bold"
                  >
                    {item.call}
                  </text>
                  {item.local && (
                    <text
                      x={isTop ? stackX + 155 : stackX + 180}
                      y={y + 23}
                      fill={isTop ? THEME.text : THEME.muted}
                      fontSize="11"
                    >
                      {item.local}
                    </text>
                  )}
                </g>
              );
            })
          )}
        </g>

        {/* Right side panels */}
        {/* Result Panel */}
        <g transform="translate(380, 20)">
          <rect
            x="0"
            y="0"
            width="270"
            height="90"
            rx="4"
            fill={frame.result !== null ? THEME.amberLight : THEME.cream}
            stroke={THEME.ink}
            strokeWidth="2"
          />
          <text x="14" y="24" fill={THEME.ink} fontSize="11" fontWeight="bold">
            RETURNED VALUE / RESULT
          </text>
          {frame.result !== null ? (
            <text x="14" y="62" fill={THEME.ink} fontSize="20" fontWeight="bold">
              {frame.result}
            </text>
          ) : (
            <text x="14" y="58" fill={THEME.outline} fontSize="12">
              evaluating recursion…
            </text>
          )}
        </g>

        {/* Hanoi Moves / Output Panel */}
        <g transform="translate(380, 125)">
          <rect
            x="0"
            y="0"
            width="270"
            height="185"
            rx="4"
            fill={THEME.card}
            stroke={THEME.ink}
            strokeWidth="2"
          />
          <text x="14" y="24" fill={THEME.ink} fontSize="11" fontWeight="bold">
            {frame.output.length > 0 ? `OUTPUT / MOVES (${frame.output.length})` : "EXECUTION TRACE"}
          </text>
          {frame.output.length === 0 ? (
            <text x="14" y="60" fill={THEME.outline} fontSize="11">
              Active stack depth: {frame.stack.length}
            </text>
          ) : (
            <g transform="translate(14, 40)">
              {frame.output.slice(-10).map((move, idx, arr) => {
                const isLatest = idx === arr.length - 1;
                const col = idx % 2;
                const row = Math.floor(idx / 2);
                const x = col * 125;
                const y = row * 26;

                return (
                  <g key={`move-${idx}-${move}`} transform={`translate(${x}, ${y})`}>
                    <rect
                      x="0"
                      y="0"
                      width="115"
                      height="22"
                      rx="2"
                      fill={isLatest ? THEME.amberMid : THEME.creamHigh}
                      stroke={THEME.ink}
                      strokeWidth="1.5"
                    />
                    <text
                      x="10"
                      y="15"
                      fill={THEME.ink}
                      fontSize="11"
                      fontWeight="bold"
                    >
                      {idx + 1}. {move}
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}
