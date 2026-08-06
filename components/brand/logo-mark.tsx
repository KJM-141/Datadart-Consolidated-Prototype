"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * The DataDart app mark — the dart-and-datastream glyph from the favicon
 * (`app/icon.svg`), inlined so it scales crisply and needs no network request.
 * Used wherever the full DATA|DART lockup won't fit: the collapsed rail, the
 * mobile bar, compact chrome.
 */
export function LogoMark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  // Gradient ids must be unique per instance or the first one on the page wins.
  const uid = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      role="img"
      aria-label="DataDart"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id={`lm-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b30f5" />
          <stop offset="0.5" stopColor="#6444f4" />
          <stop offset="1" stopColor="#2f6bff" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="116" fill={`url(#lm-${uid})`} />
      <path d="M400 256 L142 152 L212 256 L142 360 Z" fill="#ffffff" />
      <circle cx="118" cy="256" r="14" fill="#ffffff" opacity="0.85" />
      <circle cx="76" cy="256" r="9" fill="#ffffff" opacity="0.5" />
    </svg>
  );
}
