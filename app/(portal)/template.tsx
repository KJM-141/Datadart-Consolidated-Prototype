"use client";

import { motion } from "motion/react";
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
  /*
    Calm pass (2026-08-24): the entrance kept its quiet fade + rise, but the
    full-width plasma light-sweep that crossed the whole page on *every*
    navigation was decoration firing on every click — the kind of texture the
    console's own notes warn against. Gone; the content still lands softly.

    A shorter, smaller `y` travel too — the old 18px lift read as a lurch on
    dense pages.
  */
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
      animate={{
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transitionEnd: { filter: "none" },
      }}
      transition={{ duration: 0.4, ease: EASE_ADV }}
      className="relative"
    >
      {children}
    </motion.div>
  );
}
