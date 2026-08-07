"use client";

import { motion, useReducedMotion } from "motion/react";
import { EASE_ADV } from "@/lib/advanced-motion";

/**
 * Re-mounts on every route change inside the console, which is what makes this
 * an entrance rather than a layout. Content warps in behind a light sweep that
 * crosses it once as it lands.
 *
 * ── `transitionEnd` is load-bearing ───────────────────────────────────────
 *
 * The entrance settled on `filter: blur(0px)`, and `blur(0px)` is not `none`.
 * Any filter other than `none` makes the element a containing block for
 * `position: fixed` descendants — permanently, since that resting value stays on
 * the element. Every page in the console is a child of this div, so for as long
 * as it said `blur(0px)` there was no such thing as a viewport-fixed element
 * inside a page: `fixed bottom-0` resolved to the bottom of the *document*.
 *
 * That is what hid the product page's purchase bar 537px below the fold, and it
 * would have hidden the next one too. `transitionEnd` hands the filter back to
 * `none` the moment the animation finishes, so the entrance is unchanged and the
 * containing block does not outlive it.
 */
export default function ConsoleTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, filter: "blur(9px)" }}
      animate={{
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transitionEnd: { filter: "none" },
      }}
      transition={{ duration: 0.5, ease: EASE_ADV }}
      className="relative"
    >
      {!reduce && (
        <motion.span
          aria-hidden
          initial={{ x: "-40%", opacity: 0.85 }}
          animate={{ x: "140%", opacity: 0 }}
          transition={{ duration: 0.85, ease: EASE_ADV }}
          className="pointer-events-none absolute inset-y-0 z-50 w-1/3 -skew-x-12 bg-[linear-gradient(90deg,transparent,color-mix(in_oklab,var(--plasma)_16%,transparent),transparent)]"
        />
      )}
      {children}
    </motion.div>
  );
}
