"use client";

import { motion } from "motion/react";
import { Logo } from "@/components/brand/logo";
import { GlobeCinematic } from "@/components/brand/globe-cinematic";
import { useSceneParallax } from "@/components/advanced/kit/interactions";
import { EASE_ADV } from "@/lib/advanced-motion";
import { DeckBoot } from "./boot-sequence";

/**
 * ── Auth stage ────────────────────────────────────────────────────────────
 *
 * Everything behind the sign-in / sign-up card: one full-bleed establishing
 * shot and a slim header. No page footer — the card carries its own links.
 *
 * `GlobeCinematic` carries the whole frame: Earth from orbit, turning, with
 * the terminator across it and the cities lit on the night side. It is placed
 * with its dark limb toward the panel, so the form always sits on the darkest
 * part of the image and the lit crescent falls in the open right-hand third.
 *
 * Everything that used to crowd this stage is gone — the mote field, two blur
 * blobs, a repeating light sweep, and in turn a route map, a map-to-globe
 * morph, a custody ledger and an aurora. What is left does one of three jobs:
 * deepen the image (grain, vignette, letterbox), protect legibility (the
 * scrim), or say something the image cannot (the header and the trust row).
 *
 * Always dark. The theme toggle lives inside the console; this is the
 * threshold, and a threshold has one look.
 */
export function AuthStage({ children }: { children: React.ReactNode }) {
  // Gentle. The shot is an establishing shot and should feel locked off — this
  // is a breath of depth on pointer move, not a parallax effect.
  const scene = useSceneParallax(10);

  return (
    <>
      <DeckBoot />

      <main
        onPointerMove={scene.onPointerMove}
        onPointerLeave={scene.onPointerLeave}
        className="on-dark dark relative flex min-h-dvh flex-col overflow-hidden bg-[#04030c] text-white"
        style={{ colorScheme: "dark" }}
      >
        {/* ── The shot ──────────────────────────────────────────────────── */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {/* Overscanned by 32px so the parallax can never expose an edge. */}
          <motion.div style={{ x: scene.x, y: scene.y }} className="absolute -inset-8">
            <GlobeCinematic />
          </motion.div>

          {/* Scrim pooled under the panel rather than washed across the frame,
              so space stays clean everywhere nothing sits on top of it. The
              globe is placed with its dark limb toward the panel, so on wide
              screens this barely has to do anything; on small ones the panel
              covers the width and the scrim widens to match. */}
          <div className="absolute inset-0 bg-[radial-gradient(64%_82%_at_26%_50%,rgba(4,3,12,0.9),transparent_74%)] lg:bg-[radial-gradient(36%_68%_at_15%_48%,rgba(4,3,12,0.78),transparent_72%)]" />

          {/* Letterbox bars. The single cheapest cue that this is a frame you
              are looking through rather than a page you are on. */}
          <div className="absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,#04030c,transparent)]" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-[linear-gradient(0deg,#04030c,transparent)]" />

          <div className="deck-grain" />
          <div className="deck-vignette" />
        </div>

        {/* ── Chrome ────────────────────────────────────────────────────── */}
        <motion.header
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE_ADV, delay: 0.15 }}
          className="relative z-20 flex items-center gap-4 px-5 py-5 sm:px-9"
        >
          <Logo size="md" href={null} />
        </motion.header>

        {/* ── Console ───────────────────────────────────────────────────── */}
        <div className="relative z-10 flex flex-1 items-center px-5 py-6 sm:px-9">
          <motion.div
            initial={{ opacity: 0, y: 22, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, ease: EASE_ADV, delay: 0.3 }}
            className="w-full lg:max-w-[30rem] xl:ml-[5%]"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </>
  );
}
