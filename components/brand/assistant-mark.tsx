"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * The DataDart Assistant mark — a purpose-built identity for the conversational
 * agent, distinct from the DATA|DART wordmark.
 *
 * Concept: a **dart** (the brand's namesake) formed inside a conversation
 * bubble, with a trailing data-stream. It reads as "an agent that moves data"
 * at 20px and at 200px.
 */
export function AssistantMark({
  size = 28,
  animated = false,
  className,
}: {
  size?: number;
  /** Adds the traveling data-stream animation (chat header / hero use). */
  animated?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");

  return (
    <span
      className={cn("inline-flex shrink-0", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 40 40" width={size} height={size} role="img">
        <defs>
          <linearGradient id={`am-g-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8E2DE2" />
            <stop offset="100%" stopColor="#4361EE" />
          </linearGradient>
          <linearGradient id={`am-s-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fff" stopOpacity="0" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0.95" />
          </linearGradient>
        </defs>

        {/* conversation bubble — squircle with a tail */}
        <path
          d="M11 3h18a8 8 0 0 1 8 8v12a8 8 0 0 1-8 8H19l-7.2 5.4A1 1 0 0 1 10.2 36l.3-5H11a8 8 0 0 1-8-8V11a8 8 0 0 1 8-8Z"
          fill={`url(#am-g-${uid})`}
        />

        {/* the dart — a chevron arrowhead pointing right (data in motion) */}
        <path
          d="M15.5 11.5 24.5 17l-9 5.5V18l-4.2 2.6v-7.2L15.5 16z"
          fill="#fff"
          fillOpacity="0.96"
        />

        {/* data stream trailing the dart */}
        <g strokeLinecap="round" stroke="#fff">
          <line x1="26.5" y1="17" x2="31" y2="17" strokeWidth="2.2" strokeOpacity="0.9">
            {animated && (
              <animate
                attributeName="stroke-opacity"
                values="0.9;0.3;0.9"
                dur="1.8s"
                repeatCount="indefinite"
              />
            )}
          </line>
          <line x1="26.5" y1="22.5" x2="29.5" y2="22.5" strokeWidth="2" strokeOpacity="0.55">
            {animated && (
              <animate
                attributeName="stroke-opacity"
                values="0.55;0.15;0.55"
                dur="1.8s"
                begin="0.3s"
                repeatCount="indefinite"
              />
            )}
          </line>
          <line x1="26.5" y1="11.5" x2="29.5" y2="11.5" strokeWidth="2" strokeOpacity="0.55">
            {animated && (
              <animate
                attributeName="stroke-opacity"
                values="0.55;0.15;0.55"
                dur="1.8s"
                begin="0.6s"
                repeatCount="indefinite"
              />
            )}
          </line>
        </g>
      </svg>
    </span>
  );
}

/**
 * Assistant identity row — mark plus name, optionally with a live status dot.
 * Used in the chat header so the agent has a consistent, branded presence.
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
          {subtitle ?? "Scopes your transfer · priced instantly"}
        </span>
      </span>
    </span>
  );
}
