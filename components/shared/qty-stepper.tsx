"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QtyStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  className?: string;
}

export function QtyStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
  className,
}: QtyStepperProps) {
  const btn = cn(
    "flex items-center justify-center rounded-full text-muted-foreground transition-colors",
    "hover:bg-accent hover:text-accent-foreground disabled:opacity-35 disabled:pointer-events-none",
    size === "sm" ? "size-6" : "size-7",
  );
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border bg-card p-1",
        className,
      )}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        className={btn}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <Minus className={size === "sm" ? "size-3" : "size-3.5"} />
      </button>
      <span
        className={cn(
          "min-w-7 text-center font-semibold tabular-nums",
          size === "sm" ? "text-xs" : "text-sm",
        )}
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        className={btn}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus className={size === "sm" ? "size-3" : "size-3.5"} />
      </button>
    </div>
  );
}
