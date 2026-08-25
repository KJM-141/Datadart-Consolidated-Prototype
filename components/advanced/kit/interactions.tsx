"use client";

import { type ReactNode } from "react";
import {
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { cn } from "@/lib/utils";

/* ── Tilt ────────────────────────────────────────────────────────────────
   Neutralised for the enterprise pass. It was pointer-driven 3D rotation with
   a specular glare; on a tool meant to read like Linear/Notion that reads as a
   toy. Now a plain static wrapper — the props are kept so the dozen call sites
   don't have to change, but nothing tilts or glares. The two-div structure and
   `innerClassName` are preserved because some call sites (e.g. the product
   cards) rely on `h-full` reaching the inner element. */

export function Tilt({
  children,
  className,
  innerClassName,
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  /** Retained for source compatibility; ignored. */
  strength?: number;
  glare?: boolean;
  lift?: number;
}) {
  return (
    <div className={className}>
      <div className={cn("relative", innerClassName)}>{children}</div>
    </div>
  );
}

/* ── Spotlight ───────────────────────────────────────────────────────────
   Was a cursor-following radial wash. Retired — a bordered surface is the
   enterprise affordance. Static wrapper, props kept for compatibility. */

export function Spotlight({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  size?: number;
  color?: string;
  as?: "div" | "section" | "article" | "li";
}) {
  return <Tag className={cn("relative", className)}>{children}</Tag>;
}

/* ── Magnetic ────────────────────────────────────────────────────────────
   Was a pointer-lean on primary actions. Retired — buttons stay put. */

export function Magnetic({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
  radius?: number;
}) {
  return <span className={cn("inline-flex", className)}>{children}</span>;
}

/* ── Parallax layer ──────────────────────────────────────────────────────
   Shifts with the pointer's position over the nearest positioned ancestor.
   Used to give hero scenes depth without a scroll dependency. */

export function useSceneParallax(depth = 20) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const cfg = { stiffness: 60, damping: 20 };
  const x = useSpring(useTransform(mx, [-0.5, 0.5], [-depth, depth]), cfg);
  const y = useSpring(
    useTransform(my, [-0.5, 0.5], [-depth * 0.7, depth * 0.7]),
    cfg,
  );

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onPointerLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return { x, y, mx, my, onPointerMove, onPointerLeave, reduce: !!reduce };
}
