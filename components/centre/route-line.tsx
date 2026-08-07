"use client";

import { motion } from "motion/react";
import { useSafeReducedMotion } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

/**
 * ── The route line ────────────────────────────────────────────────────────
 *
 * A transfer, drawn as the thing it is: a journey between two places with
 * something part of the way along it.
 *
 * This exists because a progress bar answers "how far through the process" and
 * this product's users are asking "where is my data". Same number, completely
 * different question — and a bar cannot show that the origin is behind you and
 * the destination is ahead, which is the whole shape of the answer.
 *
 * The travelled segment is solid, the remainder is a hairline, and the marker
 * sits at the boundary with a slow pulse while the shipment is actually moving.
 * Nothing animates once it has landed; a pulsing dot on a closed transfer is a
 * lie told in motion.
 */
export function RouteLine({
  progress,
  live = false,
  className,
}: {
  /** 0‥1 along the lane. */
  progress: number;
  live?: boolean;
  className?: string;
}) {
  const reduce = useSafeReducedMotion();
  const pct = Math.min(100, Math.max(0, progress * 100));

  return (
    <div className={cn("relative h-3 w-full", className)}>
      {/* The lane */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 rounded-full bg-hair"
      />
      {/* Travelled */}
      <motion.span
        aria-hidden
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full plasma-fill"
      />

      {/* Origin */}
      <span
        aria-hidden
        className="absolute left-0 top-1/2 size-1.5 -translate-y-1/2 rounded-full plasma-fill"
      />

      {/* The shipment */}
      <motion.span
        aria-hidden
        initial={{ left: "0%" }}
        animate={{ left: `${pct}%` }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
      >
        {live && !reduce && (
          <span className="adv-ping absolute inset-0 rounded-full bg-(--cyo)" />
        )}
        <span
          className={cn(
            "relative block size-2 rounded-full ring-2 ring-card",
            live ? "bg-(--cyo)" : "plasma-fill",
          )}
        />
      </motion.span>

      {/* Destination */}
      <span
        aria-hidden
        className={cn(
          "absolute right-0 top-1/2 size-1.5 -translate-y-1/2 rounded-full",
          pct >= 100 ? "plasma-fill" : "bg-hair ring-1 ring-inset ring-ink-3/40",
        )}
      />
    </div>
  );
}

/**
 * A ring that fills clockwise. Used for a rental term, where the question is
 * "how much of the period is gone", which is circular rather than linear.
 */
export function TermRing({
  value,
  size = 40,
  stroke = 3,
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(1, Math.max(0, value));

  return (
    <span
      className="relative grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="absolute -rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--hair)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--plasma)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - clamped) }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <span className="relative text-[9.5px] font-semibold tabular-nums">
        {children}
      </span>
    </span>
  );
}
