"use client";

import { markColor, THEME } from "@/lib/theme";
import type { GraphFrame } from "@/lib/viz/types";

export function GraphCanvas({ frame }: { frame: GraphFrame }) {
  const width = 680;
  const height = 340;
  const cx = 200;
  const cy = 165;
  const radius = 105;
  const nodeRadius = 18;

  const positions = new Map<number, { x: number; y: number }>();
  const totalVertices = Math.max(1, frame.vertices.length);

  frame.vertices.forEach((v, i) => {
    const angle = (2 * Math.PI * i) / totalVertices - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    positions.set(v, { x, y });
  });

  const tagsFor = (v: number) => frame.tags.filter((t) => Number(t.at) === v).map((t) => t.name);

  return (
    <div className="w-full h-full flex items-center justify-center p-2">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full max-h-[420px] select-none"
        style={{ fontFamily: "monospace" }}
      >
        {/* Graph Edges */}
        {frame.edges.map(([u, v]) => {
          const p1 = positions.get(u);
          const p2 = positions.get(v);
          if (!p1 || !p2) return null;

          const isPathEdge =
            frame.output.length > 1 &&
            frame.output.some((node, idx) => {
              const next = frame.output[idx + 1];
              return (node === u && next === v) || (node === v && next === u);
            });

          return (
            <line
              key={`edge-${u}-${v}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={isPathEdge ? THEME.amber : THEME.ink}
              strokeWidth={isPathEdge ? 4 : 2.5}
              strokeLinecap="round"
            />
          );
        })}

        {/* Graph Vertices */}
        {frame.vertices.map((v) => {
          const pos = positions.get(v);
          if (!pos) return null;
          const c = markColor(frame.marks[String(v)]);
          const tags = tagsFor(v);

          return (
            <g key={`vertex-${v}`}>
              {tags.length > 0 && (
                <g>
                  <rect
                    x={pos.x - 18}
                    y={pos.y - 34}
                    width="36"
                    height="14"
                    rx="2"
                    fill={THEME.ink}
                  />
                  <text
                    x={pos.x}
                    y={pos.y - 24}
                    textAnchor="middle"
                    fill={THEME.amberMid}
                    fontSize="9"
                    fontWeight="bold"
                  >
                    {tags.join(",")}↓
                  </text>
                </g>
              )}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={nodeRadius}
                fill={c.fill}
                stroke={THEME.ink}
                strokeWidth="2.5"
              />
              <text
                x={pos.x}
                y={pos.y + 5}
                textAnchor="middle"
                fill={c.text}
                fontSize="13"
                fontWeight="bold"
              >
                {v}
              </text>
            </g>
          );
        })}

        {/* Frontier Strip (Queue / Stack) */}
        <g transform="translate(390, 25)">
          <rect
            x="0"
            y="0"
            width="270"
            height="125"
            rx="4"
            fill={THEME.cream}
            stroke={THEME.ink}
            strokeWidth="2"
          />
          <text x="14" y="24" fill={THEME.ink} fontSize="11" fontWeight="bold">
            FRONTIER (QUEUE / STACK)
          </text>
          {frame.frontier.length === 0 ? (
            <text x="14" y="65" fill={THEME.outline} fontSize="11">
              (empty)
            </text>
          ) : (
            <g transform="translate(14, 45)">
              {frame.frontier.slice(0, 7).map((nodeVal, idx) => (
                <g key={`front-${nodeVal}-${idx}`} transform={`translate(${idx * 34}, 0)`}>
                  <rect
                    x="0"
                    y="0"
                    width="30"
                    height="32"
                    rx="2"
                    fill={idx === 0 ? THEME.amberMid : THEME.card}
                    stroke={THEME.ink}
                    strokeWidth="2"
                  />
                  <text
                    x="15"
                    y="20"
                    textAnchor="middle"
                    fill={THEME.ink}
                    fontSize="13"
                    fontWeight="bold"
                  >
                    {nodeVal}
                  </text>
                  {idx === 0 && (
                    <text
                      x="15"
                      y="45"
                      textAnchor="middle"
                      fill={THEME.primary}
                      fontSize="9"
                      fontWeight="bold"
                    >
                      front
                    </text>
                  )}
                </g>
              ))}
              {frame.frontier.length > 7 && (
                <text x="245" y="20" fill={THEME.muted} fontSize="12" fontWeight="bold">
                  +
                </text>
              )}
            </g>
          )}
        </g>

        {/* Visited / Output Strip */}
        <g transform="translate(390, 170)">
          <rect
            x="0"
            y="0"
            width="270"
            height="140"
            rx="4"
            fill={THEME.card}
            stroke={THEME.ink}
            strokeWidth="2"
          />
          <text x="14" y="24" fill={THEME.ink} fontSize="11" fontWeight="bold">
            VISIT ORDER / OUTPUT
          </text>
          {frame.output.length === 0 ? (
            <text x="14" y="65" fill={THEME.outline} fontSize="11">
              (none visited yet)
            </text>
          ) : (
            <g transform="translate(14, 45)">
              {frame.output.slice(0, 7).map((nodeVal, idx) => (
                <g key={`out-${nodeVal}-${idx}`} transform={`translate(${idx * 34}, 0)`}>
                  <rect
                    x="0"
                    y="0"
                    width="30"
                    height="32"
                    rx="2"
                    fill={THEME.amberLight}
                    stroke={THEME.ink}
                    strokeWidth="2"
                  />
                  <text
                    x="15"
                    y="20"
                    textAnchor="middle"
                    fill={THEME.ink}
                    fontSize="13"
                    fontWeight="bold"
                  >
                    {nodeVal}
                  </text>
                  <text
                    x="15"
                    y="45"
                    textAnchor="middle"
                    fill={THEME.outline}
                    fontSize="9"
                    fontWeight="bold"
                  >
                    #{idx + 1}
                  </text>
                </g>
              ))}
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}
