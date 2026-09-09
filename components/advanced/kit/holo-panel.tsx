"use client";

import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "motion/react";
import { bloom } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

type Variant = "glass" | "solid" | "plasma" | "outline";

export interface HoloPanelProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children?: React.ReactNode;
  variant?: Variant;
  /** HUD corner ticks. */
  brackets?: boolean;
  /** Running conic border — reserve for surfaces that are genuinely live. */
  live?: boolean;
  /** Light bar that sweeps across on hover. */
  sheen?: boolean;
  /** Slow vertical scan bar, for monitoring panels. */
  scan?: boolean;
  glow?: boolean;
  /** Lifts and brightens the edge on hover. */
  interactive?: boolean;
  /** Opt out of the default `bloom` entrance (e.g. inside AnimatePresence). */
  plain?: boolean;
}

/**
 * The deck's primary surface. Every variant shares the same silhouette so a
 * page of mixed panels still reads as one instrument.
 */
export const HoloPanel = forwardRef<HTMLDivElement, HoloPanelProps>(
  function HoloPanel(
    {
      variant = "glass",
      brackets,
      live,
      sheen,
      scan,
      glow,
      interactive,
      plain,
      className,
      children,
      ...rest
    },
    ref,
  ) {
    return (
      <motion.div
        ref={ref}
        variants={plain ? undefined : bloom}
        className={cn(
          "relative",
          variant === "plasma" ? "holo-plasma" : "holo",
          variant === "solid" && "holo-solid",
          variant === "outline" &&
            "bg-transparent shadow-none backdrop-blur-none",
          brackets && "holo-brackets",
          live && "holo-live",
          sheen && "holo-sheen",
          glow && "plasma-glow",
          interactive &&
            "transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1",
          className,
        )}
        {...rest}
      >
        {sheen && <span aria-hidden className="sheen" />}
        {/* `scan` (an animated cyan gradient sweep) was retired: an enterprise
            panel reports a number, it doesn't need to look like it's scanning.
            The prop is still accepted so call sites don't churn — it's a no-op. */}
        {children}
      </motion.div>
    );
  },
);

/**
 * Section head used inside panels. The optional eyebrow sits *above* a plain
 * title — earlier revisions gave every panel a themed codename ("Vault",
 * "Ledger", "Signal log") which read as set dressing rather than information.
 */
export function PanelHead({
  label,
  title,
  hint,
  action,
  className,
}: {
  label?: string;
  title: React.ReactNode;
  hint?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        {label && <p className="hud-label mb-1.5">{label}</p>}
        <h2 className="truncate text-[15px] font-semibold leading-snug">
          {title}
        </h2>
        {hint && (
          <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
            {hint}
          </p>
        )}
      </div>
      {action && <div className="shrink-0 pt-0.5">{action}</div>}
    </div>
  );
}
