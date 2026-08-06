import type { Transition, Variants } from "motion/react";

/** Signature easing — fast start, soft landing. */
export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const spring: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 32,
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE },
  },
};

export const fade: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.3, ease: "easeOut" } },
};

/** Parent container that staggers `fadeUp` children. */
export const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

/** Horizontal step slide for wizards; direction = 1 (next) | -1 (back). */
export const stepSlide = (direction: number) => ({
  initial: { opacity: 0, x: 26 * direction },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -26 * direction },
  transition: { duration: 0.28, ease: EASE },
});
