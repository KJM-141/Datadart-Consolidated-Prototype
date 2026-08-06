"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface RouteArcProps {
  from: string;
  to: string;
  /** Show the traveling data packet */
  live?: boolean;
  className?: string;
}

/**
 * The signature "data in motion" mark: an arc from source to destination with
 * a dashed flow line and a traveling packet (SMIL animateMotion — zero JS).
 */
export function RouteArc({ from, to, live = true, className }: RouteArcProps) {
  const id = useId().replace(/[:]/g, "");
  const path = "M 16 64 Q 150 -14 284 64";

  return (
    <div className={cn("w-full", className)}>
      <svg
        viewBox="0 0 300 84"
        className="h-auto w-full"
        role="img"
        aria-label={`Transfer route from ${from} to ${to}`}
      >
        <defs>
          <linearGradient id={`arc-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--brand-purple)" />
            <stop offset="100%" stopColor="var(--brand-blue)" />
          </linearGradient>
        </defs>

        {/* Base + flow line */}
        <path
          d={path}
          fill="none"
          stroke={`url(#arc-${id})`}
          strokeOpacity="0.25"
          strokeWidth="2"
        />
        <path
          d={path}
          fill="none"
          stroke={`url(#arc-${id})`}
          strokeWidth="2"
          strokeLinecap="round"
          className={live ? "route-dash" : undefined}
          strokeDasharray={live ? undefined : "0"}
        />

        {/* Endpoints */}
        <circle cx="16" cy="64" r="4.5" fill="var(--brand-purple)" />
        <circle cx="16" cy="64" r="8" fill="var(--brand-purple)" opacity="0.2">
          {live && (
            <animate
              attributeName="r"
              values="6;11;6"
              dur="2.2s"
              repeatCount="indefinite"
            />
          )}
        </circle>
        <circle cx="284" cy="64" r="4.5" fill="var(--brand-blue)" />
        <circle cx="284" cy="64" r="8" fill="var(--brand-blue)" opacity="0.2">
          {live && (
            <animate
              attributeName="r"
              values="6;11;6"
              dur="2.2s"
              begin="1.1s"
              repeatCount="indefinite"
            />
          )}
        </circle>

        {/* Traveling packet */}
        {live && (
          <circle r="3.4" fill="#fff" stroke={`url(#arc-${id})`} strokeWidth="2">
            <animateMotion dur="2.8s" repeatCount="indefinite" path={path} />
          </circle>
        )}
      </svg>
      <div className="mt-1 flex items-baseline justify-between gap-3 text-xs">
        <span className="max-w-[46%] truncate font-medium">{from}</span>
        <span className="max-w-[46%] truncate text-right font-medium">{to}</span>
      </div>
    </div>
  );
}
