"use client";

import { markColor, THEME } from "@/lib/theme";
import type { TreeFrame, TreeNode } from "@/lib/viz/types";

export function TreeCanvas({ frame }: { frame: TreeFrame }) {
  const nodeMap = new Map<string, TreeNode>(frame.nodes.map((n) => [n.id, n]));
  const positions = new Map<string, { x: number; y: number; depth: number }>();
  let order = 0;
  let maxDepth = 0;

  function layout(id: string | null, depth: number) {
    if (!id) return;
    const node = nodeMap.get(id);
    if (!node) return;
    if (depth > maxDepth) maxDepth = depth;
    layout(node.left, depth + 1);
    positions.set(id, { x: order++, y: depth, depth });
    layout(node.right, depth + 1);
  }

  if (frame.root) {
    layout(frame.root, 0);
  }

  const count = positions.size;
  const width = 640;
  const height = 320;
  const nodeRadius = 18;

  const getCoords = (id: string) => {
    const p = positions.get(id);
    if (!p) return { x: width / 2, y: 60 };
    const x = count === 1 ? width / 2 : 48 + (p.x + 0.5) * ((width - 96) / count);
    const depthSpacing = maxDepth > 0 ? Math.min(60, (height - 130) / maxDepth) : 0;
    const y = 48 + p.depth * depthSpacing;
    return { x, y };
  };

  const tagsFor = (id: string) => frame.tags.filter((t) => t.at === id).map((t) => t.name);

  return (
    <div className="w-full h-full flex items-center justify-center p-2">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full max-h-[420px] select-none"
        style={{ fontFamily: "monospace" }}
      >
        {frame.nodes.length === 0 && (
          <text x={width / 2} y={height / 2} textAnchor="middle" fill={THEME.muted} fontSize="14" fontWeight="bold">
            Empty tree (root is null)
          </text>
        )}

        {/* Tree Edges */}
        {frame.nodes.map((node) => {
          if (!positions.has(node.id)) return null;
          const parent = getCoords(node.id);
          return (
            <g key={`edges-${node.id}`}>
              {node.left && positions.has(node.left) && (
                <line
                  x1={parent.x}
                  y1={parent.y}
                  x2={getCoords(node.left).x}
                  y2={getCoords(node.left).y}
                  stroke={THEME.ink}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}
              {node.right && positions.has(node.right) && (
                <line
                  x1={parent.x}
                  y1={parent.y}
                  x2={getCoords(node.right).x}
                  y2={getCoords(node.right).y}
                  stroke={THEME.ink}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}
            </g>
          );
        })}

        {/* Tree Nodes */}
        {frame.nodes.map((node) => {
          if (!positions.has(node.id)) return null;
          const { x, y } = getCoords(node.id);
          const c = markColor(frame.marks[node.id]);
          const tags = tagsFor(node.id);

          return (
            <g key={node.id}>
              {tags.length > 0 && (
                <g>
                  <rect
                    x={x - 18}
                    y={y - 35}
                    width="36"
                    height="14"
                    rx="2"
                    fill={THEME.ink}
                  />
                  <text
                    x={x}
                    y={y - 25}
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
                cx={x}
                cy={y}
                r={nodeRadius}
                fill={c.fill}
                stroke={THEME.ink}
                strokeWidth="2.5"
              />
              <text
                x={x}
                y={y + 5}
                textAnchor="middle"
                fill={c.text}
                fontSize="12"
                fontWeight="bold"
              >
                {node.value}
              </text>
            </g>
          );
        })}

        {/* Output strip */}
        {frame.output.length > 0 && (
          <g transform="translate(16, 280)">
            <text x="0" y="16" fill={THEME.muted} fontSize="11" fontWeight="bold">
              Output:
            </text>
            <g transform="translate(60, 0)">
              {frame.output.map((val, idx) => (
                <g key={`out-${idx}`} transform={`translate(${idx * 34}, 0)`}>
                  <rect
                    x="0"
                    y="0"
                    width="30"
                    height="24"
                    rx="3"
                    fill={THEME.amberLight}
                    stroke={THEME.ink}
                    strokeWidth="2"
                  />
                  <text
                    x="15"
                    y="16"
                    textAnchor="middle"
                    fill={THEME.ink}
                    fontSize="11"
                    fontWeight="bold"
                  >
                    {val}
                  </text>
                </g>
              ))}
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}
