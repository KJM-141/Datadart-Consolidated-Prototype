"use client";

import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { EASE_ADV } from "@/lib/advanced-motion";
import { PATHS } from "@/lib/nav";

/**
 * Re-mounts on every route change inside the console, which is what makes this
 * an entrance rather than a layout. Content warps in behind a light sweep that
 * crosses it once as it lands.
 *
 * The command centre opts out. It is the viewport rather than a page in one,
 * and blurring the whole screen in — bar, rails and all — reads as a page load
 * rather than an arrival. Its own regions animate themselves.
 */
export default function ConsoleTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const pathname = usePathname();
  const bare = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  if (bare === PATHS.dashboard) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, filter: "blur(9px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
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
