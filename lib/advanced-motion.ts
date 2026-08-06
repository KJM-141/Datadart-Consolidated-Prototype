"use client";

import { useEffect, useState } from "react";
import { useReducedMotion, type Transition, type Variants } from "motion/react";

/**
 * ── Aurora Deck motion vocabulary ─────────────────────────────────────────
 *
 * The Advanced skin has a named motion language rather than ad-hoc tweens, so
 * every surface accelerates and settles the same way. Anything that repeats
 * forever must be gated on `useReducedMotion()` at the call site; the global
 * reduced-motion rule in `globals.css` neutralises CSS animation but cannot
 * reach JS-driven springs.
 */

/** Signature curve — snaps away, glides home. Slower tail than the base app. */
export const EASE_ADV: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Curtain/iris curve — heavy in, heavy out. Used for full-screen reveals. */
export const EASE_IRIS: [number, number, number, number] = [0.83, 0, 0.17, 1];

export const springSoft: Transition = {
  type: "spring",
  stiffness: 220,
  damping: 30,
};

export const springSnap: Transition = {
  type: "spring",
  stiffness: 460,
  damping: 34,
};

/** Detent feel for the mode dial — overshoots just enough to feel mechanical. */
export const springDetent: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 22,
  mass: 0.7,
};

/** Panel entrance: rises out of focus into focus. */
export const bloom: Variants = {
  hidden: { opacity: 0, y: 22, scale: 0.985, filter: "blur(10px)" },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.66, ease: EASE_ADV },
  },
};

/** Lighter sibling of `bloom` for rows, chips and list items. */
export const bloomSoft: Variants = {
  hidden: { opacity: 0, y: 12, filter: "blur(5px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.46, ease: EASE_ADV },
  },
};

/** Sideways sibling — for rail items and anything that reads as "arriving". */
export const driftIn: Variants = {
  hidden: { opacity: 0, x: -14, filter: "blur(6px)" },
  show: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: EASE_ADV },
  },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.82 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 380, damping: 26 },
  },
};

/** Stagger container. `deckStagger(0.09)` for showier sections. */
export const deck: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.06 } },
};

export const deckStagger = (stagger: number, delay = 0.06): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

/** Route change: content warps in behind a light sweep. */
export const warp: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.994, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: { duration: 0.52, ease: EASE_ADV },
  },
  exit: {
    opacity: 0,
    y: -10,
    filter: "blur(6px)",
    transition: { duration: 0.22, ease: "easeIn" },
  },
};

/** Wizard/pane traversal; direction = 1 forward, -1 back. */
export const paneSlide = (direction: number) => ({
  initial: { opacity: 0, x: 34 * direction, filter: "blur(8px)" },
  animate: { opacity: 1, x: 0, filter: "blur(0px)" },
  exit: {
    opacity: 0,
    x: -34 * direction,
    filter: "blur(8px)",
    position: "absolute" as const,
  },
  transition: { duration: 0.38, ease: EASE_ADV },
});

/** Error feedback — a hard mechanical rejection, not a wobble. */
export const glitchShake = {
  x: [0, -11, 10, -7, 6, -3, 0],
  transition: { duration: 0.44, ease: "easeInOut" as const },
};

/** Word-by-word headline reveal; pass the word index as `custom`. */
export const wordReveal: Variants = {
  hidden: { opacity: 0, y: 22, filter: "blur(10px)" },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.62, ease: EASE_ADV, delay: 0.06 + i * 0.05 },
  }),
};

/** Viewport-triggered reveal props for long scrolling pages. */
export const inView = {
  initial: "hidden" as const,
  whileInView: "show" as const,
  viewport: { once: true, margin: "-12% 0px -8% 0px" },
};

/**
 * Reduced-motion that is safe to branch *DOM structure* on.
 *
 * `useReducedMotion()` reads the media query synchronously, so on a machine
 * with reduce-motion enabled the client's first render disagrees with the
 * prerendered HTML — and `{!reduce && <Sheen/>}` becomes a hydration mismatch
 * (React #418), which is fatal in production where React discards the tree.
 *
 * This defers the answer by one commit: the first client render matches the
 * server, then the real preference applies. Use it wherever the preference
 * decides whether an element exists at all. Where it only picks between
 * transitions, `useReducedMotion()` directly is fine and reacts a frame sooner.
 */
export function useSafeReducedMotion(): boolean {
  const reduce = useReducedMotion();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated && !!reduce;
}
