"use client";

import { useId } from "react";
import {
  EMPHASES,
  ENDPOINT_STYLE,
  ROUTE_STYLE,
  type Emphasis,
} from "@/lib/map-style";
import { cn } from "@/lib/utils";

/**
 * The map's key.
 *
 * Every swatch is drawn as SVG from `ROUTE_STYLE` — the same colour, width and
 * dash array the map itself strokes with — rather than approximated with border
 * classes. A legend rendered from a second set of numbers is a legend that will
 * eventually lie, and this one has three states that differ by exactly those
 * three properties.
 */
export function MapLegend({
  className,
  emphases = EMPHASES,
}: {
  className?: string;
  /** Restrict the key to the states actually on the map, if you know them. */
  emphases?: Emphasis[];
}) {
  // Gradient ids have to be unique per instance — the dashboard renders this
  // alongside the expanded map dialog, and duplicate ids resolve to whichever
  // was defined first.
  const uid = useId().replace(/:/g, "");

  // Brightest first: the key reads top-down as most-urgent to least, which is
  // the opposite of the paint order (dimmest first, so bright lanes land on top).
  const ordered = [...emphases].reverse();

  return (
    <ul
      className={cn(
        "flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-ink-2",
        className,
      )}
    >
      {ordered.map((e) => {
        const s = ROUTE_STYLE[e];
        return (
          <li key={e} className="flex items-center gap-2">
            <svg
              width="26"
              height="10"
              viewBox="0 0 26 10"
              aria-hidden
              className="shrink-0 overflow-visible"
            >
              <defs>
                {/* userSpaceOnUse, not the default objectBoundingBox: a
                    horizontal line has a zero-height bounding box, and SVG
                    declines to paint a bounding-box gradient onto one. The
                    first pass drew nothing but the packet dot. */}
                <linearGradient
                  id={`legend-${e}-${uid}`}
                  gradientUnits="userSpaceOnUse"
                  x1="1"
                  y1="5"
                  x2="25"
                  y2="5"
                >
                  <stop offset="0%" stopColor="#9d5cff" />
                  <stop offset="100%" stopColor="#5c8dff" />
                </linearGradient>
              </defs>
              <line
                x1="1"
                y1="5"
                x2="25"
                y2="5"
                stroke={ENDPOINT_STYLE.halo}
                strokeOpacity={0.55}
                strokeWidth={s.width + 1.6}
                strokeLinecap="round"
              />
              <line
                x1="1"
                y1="5"
                x2="25"
                y2="5"
                stroke={s.gradient ? `url(#legend-${e}-${uid})` : s.color}
                strokeOpacity={s.opacity}
                strokeWidth={s.width}
                strokeDasharray={s.dash}
                strokeLinecap="round"
              />
              {s.packet && <circle cx="17" cy="5" r={s.packet.r} fill="#fff" />}
            </svg>
            <span className="whitespace-nowrap">{s.label}</span>
          </li>
        );
      })}

      {/* The nodes. Two sizes and two fills on the map, so two entries here. */}
      {([ENDPOINT_STYLE.active, ENDPOINT_STYLE.idle] as const).map((node) => (
        <li key={node.label} className="flex items-center gap-2">
          <svg width="12" height="10" viewBox="0 0 12 10" aria-hidden className="shrink-0">
            <circle cx="6" cy="5" r={node.r + 0.9} fill={ENDPOINT_STYLE.halo} fillOpacity={0.75} />
            <circle
              cx="6"
              cy="5"
              r={node.r}
              fill={node.fill}
              stroke="#c9c9ec"
              strokeOpacity={0.5}
              strokeWidth="0.7"
            />
          </svg>
          <span className="whitespace-nowrap">{node.label}</span>
        </li>
      ))}
    </ul>
  );
}
