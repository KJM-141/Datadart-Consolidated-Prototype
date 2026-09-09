"use client";

import { motion, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import { STAGES, STAGE_SHORT, stageIndex, type Stage } from "@/lib/lifecycle";
import { EASE_ADV } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

/**
 * The ten-stage order lifecycle as a plasma spine.
 *
 * Reads the same `STAGES` source as the Normal tracker, so the model can never
 * diverge — what changes is that completed nodes stay lit, the live node
 * ignites with a halo, and the connector between them fills rather than simply
 * switching colour.
 */
export function StageSpine({
  stage,
  orientation = "horizontal",
  labels = true,
  closed,
  className,
}: {
  stage: Stage;
  orientation?: "horizontal" | "vertical";
  labels?: boolean;
  closed?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const current = stageIndex(stage);
  const vertical = orientation === "vertical";

  return (
    <ol
      className={cn(
        "flex",
        vertical ? "flex-col gap-0" : "items-start gap-0",
        className,
      )}
      aria-label={`Order lifecycle, currently at ${stage}`}
    >
      {STAGES.map((s, i) => {
        const done = i < current || (closed && i <= current);
        const live = i === current && !closed;
        const last = i === STAGES.length - 1;

        return (
          <li
            key={s}
            className={cn(
              "relative flex",
              vertical ? "gap-3 pb-5 last:pb-0" : "min-w-0 flex-1 flex-col",
            )}
            aria-current={live ? "step" : undefined}
          >
            {/* node + connector */}
            <div
              className={cn(
                "flex shrink-0 items-center",
                vertical ? "flex-col self-stretch" : "w-full",
              )}
            >
              <span className="relative grid size-5 shrink-0 place-items-center">
                {live && !reduce && (
                  <span className="adv-ping absolute inset-0 rounded-full plasma-fill opacity-60" />
                )}
                <motion.span
                  initial={reduce ? false : { scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    duration: 0.4,
                    ease: EASE_ADV,
                    delay: Math.min(i * 0.045, 0.4),
                  }}
                  className={cn(
                    "relative grid size-5 place-items-center rounded-full ring-1 transition-colors",
                    done &&
                      "plasma-fill text-white ring-transparent shadow-[0_0_14px_-2px_color-mix(in_oklab,var(--plasma)_90%,transparent)]",
                    live &&
                      "bg-warning text-[#12102a] ring-warning shadow-[0_0_18px_-2px_var(--warning)]",
                    !done && !live && "bg-muted ring-border",
                  )}
                >
                  {done && <Check className="size-3" strokeWidth={3.2} />}
                  {live && <span className="size-1.5 rounded-full bg-current" />}
                </motion.span>
              </span>

              {!last && (
                <span
                  className={cn(
                    "relative overflow-hidden bg-border",
                    vertical ? "w-px flex-1" : "h-px flex-1",
                  )}
                >
                  <motion.span
                    initial={reduce ? false : { scaleX: 0, scaleY: 0 }}
                    animate={{
                      scaleX: 1,
                      scaleY: 1,
                      opacity: i < current ? 1 : 0,
                    }}
                    transition={{
                      duration: 0.5,
                      ease: EASE_ADV,
                      delay: Math.min(i * 0.045 + 0.1, 0.5),
                    }}
                    className={cn(
                      "absolute inset-0 plasma-fill",
                      vertical ? "origin-top" : "origin-left",
                    )}
                  />
                </span>
              )}
            </div>

            {labels && (
              <span
                className={cn(
                  "block truncate text-[10px] font-semibold uppercase tracking-[0.1em] transition-colors",
                  vertical ? "pt-0.5" : "mt-2 pr-2",
                  live
                    ? "text-warning"
                    : done
                      ? "text-foreground/70"
                      : "text-muted-foreground/50",
                )}
              >
                {STAGE_SHORT[s]}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Compact bar form — ten segments, no labels. For cards and list rows. */
export function StageBar({
  stage,
  closed,
  className,
}: {
  stage: Stage;
  closed?: boolean;
  className?: string;
}) {
  const current = stageIndex(stage);
  return (
    <div
      className={cn("flex items-center gap-1", className)}
      aria-label={`Stage ${current + 1} of ${STAGES.length}, ${stage}`}
    >
      {STAGES.map((s, i) => {
        const done = i < current || (closed && i <= current);
        const live = i === current && !closed;
        return (
          <motion.span
            key={s}
            initial={{ scaleX: 0.2, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            transition={{ duration: 0.35, ease: EASE_ADV, delay: i * 0.03 }}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              done && "plasma-fill",
              live && "bg-warning pulse-stage",
              !done && !live && "bg-border",
            )}
          />
        );
      })}
    </div>
  );
}
