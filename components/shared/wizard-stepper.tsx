"use client";

import { motion } from "motion/react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface WizardStepperProps {
  steps: string[];
  current: number; // 0-based
  orientation?: "vertical" | "horizontal";
  onStepClick?: (index: number) => void;
  className?: string;
}

/** Labeled progress rail for multi-step wizards; completed steps are clickable. */
export function WizardStepper({
  steps,
  current,
  orientation = "vertical",
  onStepClick,
  className,
}: WizardStepperProps) {
  if (orientation === "horizontal") {
    return (
      <ol className={cn("flex items-center gap-2", className)}>
        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label} className="flex flex-1 items-center gap-2">
              <StepDot
                index={i}
                done={done}
                active={active}
                clickable={done && !!onStepClick}
                onClick={() => done && onStepClick?.(i)}
              />
              <span
                className={cn(
                  "hidden truncate text-xs sm:block",
                  active
                    ? "font-semibold text-foreground"
                    : done
                      ? "font-medium text-foreground/70"
                      : "text-muted-foreground",
                )}
              >
                {label}
              </span>
              {i < steps.length - 1 && (
                <div className="relative h-px flex-1 overflow-hidden rounded bg-border">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-brand"
                    initial={false}
                    animate={{ width: done ? "100%" : "0%" }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ol className={cn("flex flex-col", className)}>
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex gap-3">
            <div className="flex flex-col items-center">
              <StepDot
                index={i}
                done={done}
                active={active}
                clickable={done && !!onStepClick}
                onClick={() => done && onStepClick?.(i)}
              />
              {i < steps.length - 1 && (
                <div className="relative my-1 w-px flex-1 overflow-hidden rounded bg-border">
                  <motion.div
                    className="absolute inset-x-0 top-0 bg-gradient-brand"
                    initial={false}
                    animate={{ height: done ? "100%" : "0%" }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              )}
            </div>
            <button
              type="button"
              disabled={!done || !onStepClick}
              onClick={() => onStepClick?.(i)}
              className={cn(
                "pb-7 text-left text-sm outline-none",
                active
                  ? "font-semibold text-foreground"
                  : done
                    ? "font-medium text-foreground/70 hover:text-foreground"
                    : "text-muted-foreground",
                done && onStepClick && "cursor-pointer",
              )}
            >
              <span className="block leading-tight">{label}</span>
              {active && (
                <motion.span
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-0.5 block text-xs font-normal text-muted-foreground"
                >
                  Current step
                </motion.span>
              )}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function StepDot({
  index,
  done,
  active,
  clickable,
  onClick,
}: {
  index: number;
  done: boolean;
  active: boolean;
  clickable?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      onClick={onClick}
      disabled={!clickable}
      aria-current={active ? "step" : undefined}
      className={cn(
        "relative flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
        // Only a reachable step is a real tap target; a passive dot stays small.
        clickable && "coarse:size-10",
        done
          ? "border-transparent bg-gradient-brand text-white shadow-brand-sm"
          : active
            ? "border-transparent bg-gradient-brand text-white shadow-brand-sm"
            : "border-border bg-card text-muted-foreground",
        clickable && "cursor-pointer",
      )}
    >
      {done ? (
        <motion.span
          initial={{ scale: 0, rotate: -40 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 24 }}
        >
          <Check className="size-3.5" strokeWidth={3} />
        </motion.span>
      ) : (
        index + 1
      )}
      {active && (
        <span className="absolute -inset-1 -z-10 rounded-full bg-gradient-brand opacity-25 blur-[6px]" />
      )}
    </button>
  );
}
