"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * ── The DataDart Assistant mark ───────────────────────────────────────────
 *
 * A sibling of the app mark in `logo-mark.tsx`, not a variation on a chat icon.
 *
 * The first version was a speech bubble with a chevron inside it, which is the
 * shape every assistant in every product has worn for a decade — it identified
 * the category, not this product. This one is built from the two things the
 * brand already owns: the **dart** (the same concave arrowhead the app mark and
 * the favicon carry) and the **route arc** that every transfer is drawn as on
 * the map.
 *
 * So the glyph reads literally: a dart, and the lane it travels. The distinction
 * from the app mark is deliberate and conventional — the product is a rounded
 * tile, the agent is a circle, the way an avatar always is. At 17px you see a
 * dart in a ring; at 200px you see the route under it.
 */
export function AssistantMark({
  size = 28,
  animated = false,
  className,
}: {
  size?: number;
  /** Sends a packet down the lane — chat header and hero use. */
  animated?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  /*
   * The lane, climbing left to right, with the dart at its head.
   *
   * It was briefly a symmetrical arc slung *under* a horizontal dart, which at
   * any size above a favicon resolved into a face — two marks over a curve is a
   * smile, and the eye finds it instantly. Rake the whole thing along a
   * diagonal and the same two elements read as trajectory instead.
   */
  const lane = "M10 29 Q 16 23 23 17.5";

  return (
    <span
      className={cn("inline-flex shrink-0", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 40 40" width={size} height={size} role="img">
        <defs>
          {/* The app mark's exact ramp — purple through indigo to blue — so the
              agent is unmistakably the same family. */}
          <linearGradient id={`am-g-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8b30f5" />
            <stop offset="50%" stopColor="#6444f4" />
            <stop offset="100%" stopColor="#2f6bff" />
          </linearGradient>
          {/* Top-left key light, so the disc reads as a form rather than a
              flat dot at avatar sizes. */}
          <radialGradient id={`am-s-${uid}`} cx="28%" cy="18%" r="78%">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="20" cy="20" r="20" fill={`url(#am-g-${uid})`} />
        <circle cx="20" cy="20" r="20" fill={`url(#am-s-${uid})`} />

        {/* The lane it travels. */}
        <path
          d={lane}
          fill="none"
          stroke="#fff"
          strokeOpacity="0.42"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* The dart — the app mark's arrowhead, concave at the tail — set on
            the lane's tangent so it is leaving rather than sitting. */}
        <g transform="translate(26.6 14.6) rotate(-38)">
          <path
            d="M7.6 0 L-6.2 -5.4 L-2.1 0 L-6.2 5.4 Z"
            fill="#fff"
            fillOpacity="0.97"
          />
        </g>

        {/* Origin node, and a packet running the lane when live. */}
        <circle cx="10" cy="29" r="1.8" fill="#fff" fillOpacity="0.9" />
        {animated && (
          <circle r="1.6" fill="#fff">
            <animateMotion dur="2.4s" repeatCount="indefinite" path={lane} />
            <animate
              attributeName="fill-opacity"
              values="0;1;1;0"
              keyTimes="0;0.2;0.75;1"
              dur="2.4s"
              repeatCount="indefinite"
            />
          </circle>
        )}
      </svg>
    </span>
  );
}

/**
 * Assistant identity row — mark plus name, optionally with a live status dot.
 * Used in chat headers so the agent has a consistent, branded presence.
 */
export function AssistantIdentity({
  online = true,
  subtitle,
  className,
}: {
  online?: boolean;
  subtitle?: string;
  className?: string;
}) {
  return (
    <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <span className="relative">
        <AssistantMark size={32} animated />
        {online && (
          <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-background bg-success" />
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold leading-tight">
          DataDart Assistant
        </span>
        <span className="block truncate text-[11px] text-muted-foreground">
          {subtitle ?? "Scopes your transfer, priced instantly"}
        </span>
      </span>
    </span>
  );
}
