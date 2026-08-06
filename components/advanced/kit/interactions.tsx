"use client";

import { useRef, type ReactNode } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { cn } from "@/lib/utils";

/* ── Tilt ────────────────────────────────────────────────────────────────
   Pointer-driven 3D rotation with an optional specular glare. The perspective
   lives on the wrapper so children can use their own transforms freely. */

export function Tilt({
  children,
  className,
  innerClassName,
  /** Max rotation in degrees. */
  strength = 9,
  /** Adds a moving highlight that tracks the pointer across the face. */
  glare = true,
  /** Pushes content toward the viewer on hover. */
  lift = 0,
}: {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  strength?: number;
  glare?: boolean;
  lift?: number;
}) {
  const reduce = useReducedMotion();
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const cfg = { stiffness: 180, damping: 20, mass: 0.4 };

  const rotateY = useSpring(
    useTransform(px, [0, 1], [-strength, strength]),
    cfg,
  );
  const rotateX = useSpring(
    useTransform(py, [0, 1], [strength, -strength]),
    cfg,
  );
  const glareX = useTransform(px, [0, 1], ["0%", "100%"]);
  const glareY = useTransform(py, [0, 1], ["0%", "100%"]);
  const glareBg = useMotionTemplate`radial-gradient(60% 60% at ${glareX} ${glareY}, color-mix(in oklab, #fff 26%, transparent), transparent 70%)`;

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <div
      className={cn("[perspective:1400px]", className)}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        px.set((e.clientX - r.left) / r.width);
        py.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => {
        px.set(0.5);
        py.set(0.5);
      }}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        whileHover={lift ? { z: lift } : undefined}
        className={cn("relative", innerClassName)}
      >
        {children}
        {glare && (
          <motion.span
            aria-hidden
            style={{ background: glareBg }}
            className="pointer-events-none absolute inset-0 z-10 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
        )}
      </motion.div>
    </div>
  );
}

/* ── Spotlight ───────────────────────────────────────────────────────────
   A radial wash that follows the cursor inside the element. Cheap, and it does
   more for "this is interactive" than a border colour change. */

export function Spotlight({
  children,
  className,
  size = 340,
  color = "color-mix(in oklab, var(--plasma) 22%, transparent)",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  size?: number;
  color?: string;
  as?: "div" | "section" | "article" | "li";
}) {
  const x = useMotionValue(-9999);
  const y = useMotionValue(-9999);
  const bg = useMotionTemplate`radial-gradient(${size}px circle at ${x}px ${y}px, ${color}, transparent 72%)`;
  const Motion = motion[Tag] as typeof motion.div;

  return (
    <Motion
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set(e.clientX - r.left);
        y.set(e.clientY - r.top);
      }}
      onPointerLeave={() => {
        x.set(-9999);
        y.set(-9999);
      }}
      className={cn("group relative", className)}
    >
      <motion.span
        aria-hidden
        style={{ background: bg }}
        className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      {children}
    </Motion>
  );
}

/* ── Magnetic ────────────────────────────────────────────────────────────
   Leans toward the pointer while it is nearby. Applied to primary actions and
   rail pods, never to text links — the displacement would break reading. */

export function Magnetic({
  children,
  className,
  strength = 0.32,
  radius = 90,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
  radius?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const x = useSpring(useMotionValue(0), { stiffness: 260, damping: 18 });
  const y = useSpring(useMotionValue(0), { stiffness: 260, damping: 18 });

  if (reduce) return <span className={className}>{children}</span>;

  return (
    <motion.span
      ref={ref}
      style={{ x, y }}
      className={cn("inline-flex", className)}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy);
        if (d > radius) return;
        x.set(dx * strength);
        y.set(dy * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
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
