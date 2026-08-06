"use client";

import { motion } from "motion/react";
import { useId } from "react";
import { spring } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface SegmentedProps<T extends string> {
  options: readonly T[] | T[];
  value: T | undefined;
  onChange: (value: T) => void;
  labels?: Partial<Record<T, string>>;
  size?: "sm" | "md";
  className?: string;
  "aria-label"?: string;
}

/**
 * Pill segmented control with a darting active thumb (shared layoutId).
 * Used for Yes/No/N-A questions, capacity selection, list tabs, etc.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  labels,
  size = "md",
  className,
  "aria-label": ariaLabel,
}: SegmentedProps<T>) {
  const group = useId();
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex flex-wrap items-center gap-1 rounded-full bg-muted p-1",
        className,
      )}
    >
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt)}
            className={cn(
              "relative rounded-full font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              // Touch pointers get a taller pill so each option clears ~40px.
              size === "sm"
                ? "px-3 py-1 text-xs coarse:px-4 coarse:py-3"
                : "px-4 py-1.5 text-sm coarse:py-2.5",
              active
                ? "text-white"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId={`segmented-${group}`}
                transition={spring}
                className="absolute inset-0 rounded-full bg-gradient-brand shadow-brand-sm"
              />
            )}
            <span className="relative">{labels?.[opt] ?? opt}</span>
          </button>
        );
      })}
    </div>
  );
}
