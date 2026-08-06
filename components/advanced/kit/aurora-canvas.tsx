"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * The Aurora Deck's ambient field: a drifting constellation of data motes that
 * link to their neighbours and lean away from the pointer.
 *
 * Written against raw canvas 2D rather than a WebGL library — the effect is
 * cheap enough that adding a dependency (and a shader compile on first paint)
 * would cost more than it buys. Guardrails that matter for a field that runs
 * on every screen:
 *
 *   · the loop stops when the tab is hidden or the canvas scrolls off-screen
 *   · particle count scales with area, then hard-caps
 *   · reduced-motion renders exactly one static frame and never schedules again
 */

interface Mote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  /** 0‥1 — drives both size and alpha so the field reads as having depth. */
  z: number;
}

export function AuroraCanvas({
  className,
  /** Motes per 100k px², before the cap. */
  density = 8,
  /** Peak link distance in CSS px. */
  link = 116,
  speed = 0.22,
  colors = ["#a56dff", "#5c8dff", "#22d3ee"],
  /** Pointer repulsion radius; 0 disables interaction. */
  interactive = 150,
  opacity = 1,
}: {
  className?: string;
  density?: number;
  link?: number;
  speed?: number;
  colors?: string[];
  interactive?: number;
  opacity?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let motes: Mote[] = [];
    let frame = 0;
    let visible = true;
    const pointer = { x: -9999, y: -9999 };

    const rgb = colors.map((hex) => {
      const n = parseInt(hex.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
    });

    const seed = () => {
      const area = width * height;
      const count = Math.min(150, Math.round((area / 100_000) * density));
      motes = Array.from({ length: count }, () => {
        const z = Math.random();
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * speed,
          vy: (Math.random() - 0.5) * speed,
          r: 0.7 + z * 1.9,
          z,
        };
      });
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Links first so motes sit on top of their own web.
      for (let i = 0; i < motes.length; i++) {
        const a = motes[i];
        for (let j = i + 1; j < motes.length; j++) {
          const b = motes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > link * link) continue;
          const t = 1 - Math.sqrt(d2) / link;
          const c = rgb[(i + j) % rgb.length];
          ctx.strokeStyle = `rgba(${c[0]},${c[1]},${c[2]},${t * 0.2 * opacity})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      for (let i = 0; i < motes.length; i++) {
        const m = motes[i];
        const c = rgb[i % rgb.length];
        const alpha = (0.22 + m.z * 0.5) * opacity;
        ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${alpha})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();

        // A soft bloom on the nearest motes only — the glow is the expensive
        // part, so it is spent where it actually reads.
        if (m.z > 0.72) {
          ctx.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${0.07 * opacity})`;
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.r * 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const step = () => {
      for (const m of motes) {
        m.x += m.vx * (0.4 + m.z);
        m.y += m.vy * (0.4 + m.z);

        if (interactive > 0) {
          const dx = m.x - pointer.x;
          const dy = m.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < interactive * interactive && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const push = ((interactive - d) / interactive) * 0.9;
            m.x += (dx / d) * push;
            m.y += (dy / d) * push;
          }
        }

        // Wrap rather than bounce: a bounded box reads as an aquarium.
        if (m.x < -20) m.x = width + 20;
        if (m.x > width + 20) m.x = -20;
        if (m.y < -20) m.y = height + 20;
        if (m.y > height + 20) m.y = -20;
      }
      draw();
      frame = requestAnimationFrame(step);
    };

    const start = () => {
      if (frame || reduce) return;
      frame = requestAnimationFrame(step);
    };
    const stop = () => {
      if (!frame) return;
      cancelAnimationFrame(frame);
      frame = 0;
    };

    resize();

    if (reduce) {
      draw();
      return () => window.removeEventListener("resize", onResize);
    }

    const onResize = () => resize();
    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      pointer.x = -9999;
      pointer.y = -9999;
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else if (visible) start();
    };

    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    if (interactive > 0) {
      window.addEventListener("pointermove", onPointer, { passive: true });
      window.addEventListener("pointerleave", onLeave);
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !document.hidden) start();
        else stop();
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    start();

    return () => {
      stop();
      io.disconnect();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerleave", onLeave);
    };
    // `colors` is a literal at every call site; spreading it into the dep list
    // would re-seed the field on each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [density, link, speed, interactive, opacity, reduce]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
    />
  );
}
