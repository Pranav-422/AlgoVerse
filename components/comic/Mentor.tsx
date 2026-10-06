"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { KitPalette } from "@/lib/comic";

// The Mentor: one fixed character drawn in SVG, so identity never drifts between panels.
// Only the pose (arms, brows, mouth) changes. Colours come from the comic's palette.

type Pose = "explain" | "point" | "think" | "surprised" | "cheer";

const SKIN = "#F3D3B5";

// Arm paths: [shoulder → elbow → hand], in a 120×170 box. The Mentor faces left (toward the scene).
const ARMS: Record<Pose, { left: string; right: string; lh: [number, number]; rh: [number, number] }> = {
  explain: { left: "M44 92 L36 118 L40 140", right: "M76 92 L70 112 L48 118", lh: [40, 142], rh: [45, 118] },
  point: { left: "M44 92 L36 118 L40 140", right: "M76 92 L52 96 L18 92", lh: [40, 142], rh: [14, 92] },
  think: { left: "M44 92 L40 116 L56 118", right: "M76 92 L74 74 L62 66", lh: [58, 118], rh: [60, 64] },
  surprised: { left: "M44 92 L26 78 L20 56", right: "M76 92 L94 78 L100 56", lh: [20, 53], rh: [100, 53] },
  cheer: { left: "M44 92 L36 118 L40 140", right: "M76 92 L90 70 L86 40", lh: [40, 142], rh: [86, 36] },
};

const FACE: Record<Pose, { brows: string; mouth: string }> = {
  explain: { brows: "M48 38 L55 37 M65 37 L72 38", mouth: "M54 58 Q60 62 66 58" },
  point: { brows: "M48 37 L55 36 M65 36 L72 37", mouth: "M54 57 Q60 61 66 57" },
  think: { brows: "M48 39 L55 36 M65 38 L72 38", mouth: "M55 59 L65 58" },
  surprised: { brows: "M48 33 L55 31 M65 31 L72 33", mouth: "M57 57 Q60 64 63 57 Q60 54 57 57" },
  cheer: { brows: "M48 36 L55 35 M65 35 L72 36", mouth: "M52 55 Q60 66 68 55 Z" },
};

interface MentorProps {
  pose: string;
  palette: KitPalette;
  className?: string;
  isActive?: boolean;
  isPayoff?: boolean;
}

export function Mentor({ pose, palette, className, isActive = true, isPayoff = false }: MentorProps) {
  const reduce = useReducedMotion();
  const p = (ARMS[pose as Pose] ? pose : "explain") as Pose;
  const arm = ARMS[p];
  const face = FACE[p];
  const ink = palette.ink;

  return (
    <motion.svg
      viewBox="0 0 120 170"
      className={className}
      initial={{ y: 8, opacity: 0 }}
      animate={
        isPayoff && isActive && !reduce
          ? { y: [0, -12, 0], opacity: 1 }
          : { y: 0, opacity: 1 }
      }
      transition={{
        y: isPayoff && isActive && !reduce ? { duration: 0.36, ease: "easeOut" } : { type: "spring", stiffness: 260, damping: 20 },
        opacity: { duration: 0.2 },
      }}
      aria-label={`Mentor, ${p}`}
      role="img"
    >
      <motion.g
        animate={isActive && !reduce ? { y: [-2, 2, -2] } : { y: 0 }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: isPayoff && isActive && !reduce ? 0.36 : 0,
        }}
      >
        {/* legs */}
        <path d="M50 150 L48 168 M70 150 L72 168" stroke={ink} strokeWidth="6" strokeLinecap="round" />
        {/* body / jacket */}
        <path d="M40 92 Q60 84 80 92 L84 152 Q60 158 36 152 Z" fill={palette.accent} stroke={ink} strokeWidth="3" strokeLinejoin="round" />
        <path d="M60 90 L60 150" stroke={ink} strokeWidth="2" opacity="0.5" />
        {/* scarf */}
        <path d="M46 86 Q60 94 74 86 L72 94 Q60 100 48 94 Z" fill={palette.accent2} stroke={ink} strokeWidth="2.5" />
        <path d="M66 94 L70 112 L62 110 Z" fill={palette.accent2} stroke={ink} strokeWidth="2" />
        {/* arms */}
        <motion.path d={arm.left} initial={false} animate={{ d: arm.left }} fill="none" stroke={ink} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <motion.path d={arm.right} initial={false} animate={{ d: arm.right }} fill="none" stroke={ink} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={arm.lh[0]} cy={arm.lh[1]} r="5.5" fill={SKIN} stroke={ink} strokeWidth="2.5" />
        <circle cx={arm.rh[0]} cy={arm.rh[1]} r="5.5" fill={SKIN} stroke={ink} strokeWidth="2.5" />
        {/* neck + head */}
        <rect x="55" y="70" width="10" height="12" fill={SKIN} stroke={ink} strokeWidth="2.5" />
        <circle cx="60" cy="48" r="24" fill={SKIN} stroke={ink} strokeWidth="3" />
        {/* hair */}
        <path d="M36 46 Q36 20 60 20 Q86 20 84 46 Q78 32 64 32 Q50 30 40 40 Z" fill={ink} />
        {/* glasses */}
        <circle cx="51" cy="47" r="7" fill="#FFFFFF" fillOpacity="0.35" stroke={ink} strokeWidth="2.5" />
        <circle cx="69" cy="47" r="7" fill="#FFFFFF" fillOpacity="0.35" stroke={ink} strokeWidth="2.5" />
        <path d="M58 47 L62 47" stroke={ink} strokeWidth="2.5" />
        {/* blinking pupils */}
        <motion.g
          animate={isActive && !reduce ? { scaleY: [1, 1, 0.1, 1, 1] } : { scaleY: 1 }}
          transition={{
            duration: 4,
            repeat: Infinity,
            times: [0, 0.92, 0.95, 0.98, 1],
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "60px 47.5px" }}
        >
          <circle cx="51" cy="47.5" r="2" fill={ink} />
          <circle cx="69" cy="47.5" r="2" fill={ink} />
        </motion.g>
        {/* brows + mouth */}
        <path d={face.brows} stroke={ink} strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d={face.mouth} stroke={ink} strokeWidth="2.5" strokeLinecap="round" fill={p === "cheer" ? "#FFFFFF" : "none"} />
        {p === "think" && <text x="88" y="26" fontSize="18" fontWeight="700" fill={palette.accent} fontFamily="monospace">?</text>}
        {p === "surprised" && <text x="90" y="24" fontSize="18" fontWeight="700" fill={palette.accent} fontFamily="monospace">!</text>}
      </motion.g>
    </motion.svg>
  );
}
