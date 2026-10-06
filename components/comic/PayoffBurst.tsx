"use client";

import { useReducedMotion, motion } from "framer-motion";
import { useEffect, useState } from "react";
import type { KitPalette } from "@/lib/comic";

interface Props {
  palette: KitPalette;
}

const PARTICLES = Array.from({ length: 12 }, (_, i) => {
  const angle = (i * 30 * Math.PI) / 180;
  const dist = 48 + (i % 4) * 10;
  return {
    id: i,
    x: Math.cos(angle) * dist,
    y: Math.sin(angle) * dist,
    size: 10 + (i % 3) * 3,
  };
});

export function PayoffBurst({ palette }: Props) {
  const reduce = useReducedMotion();
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDone(true), 900);
    return () => clearTimeout(timer);
  }, []);

  if (reduce || done) return null;

  const colors = [palette.accent, palette.accent2, palette.ink, palette.accent];

  return (
    <div
      className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-visible"
      aria-hidden="true"
    >
      {PARTICLES.map((p) => {
        const color = colors[p.id % colors.length];
        return (
          <motion.div
            key={p.id}
            className="absolute"
            initial={{ scale: 0, x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{
              scale: [0, 1.25, 0],
              x: p.x,
              y: p.y,
              opacity: [1, 1, 0],
              rotate: [0, 90],
            }}
            transition={{
              duration: 0.75,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <svg
              width={p.size}
              height={p.size}
              viewBox="-8 -8 16 16"
              style={{ overflow: "visible" }}
            >
              <path
                d="M 0 -8 Q 0 0 8 0 Q 0 0 0 8 Q 0 0 -8 0 Q 0 0 0 -8 Z"
                fill={color}
              />
            </svg>
          </motion.div>
        );
      })}
    </div>
  );
}
