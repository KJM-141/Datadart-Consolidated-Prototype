"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { motion } from "motion/react";
import { Logo } from "@/components/brand/logo";
import { EASE_ADV, EASE_IRIS, useSafeReducedMotion } from "@/lib/advanced-motion";

const STORAGE_KEY = "datadart-deck-boot";

/** Module singleton so the console can time its entrance to the iris. */
let playing = false;
export function isBootPlaying(): boolean {
  return playing;
}
export const BOOT_REVEAL_MS = 2150;

const TRACE = [
  "resolving portal.datadart.services",
  "tls 1.3, x25519 handshake",
  "attesting device binding",
  "chain-of-custody ledger online",
  "secure channel established",
];

/**
 * Reactor boot — the Aurora Deck's cold-start.
 *
 * A charge ring winds up while a trace log streams, then the whole curtain
 * irises open onto the auth stage. Runs once per session; reduced-motion and
 * repeat visits skip it before paint, so it never delays anyone twice.
 */
export function DeckBoot() {
  const [phase, setPhase] = useState<"charge" | "open" | "done">("charge");
  const [line, setLine] = useState(0);
  const reduce = useSafeReducedMotion();

  useLayoutEffect(() => {
    const skip =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      sessionStorage.getItem(STORAGE_KEY) === "1";
    if (skip) {
      setPhase("done");
      return;
    }
    playing = true;
    sessionStorage.setItem(STORAGE_KEY, "1");
    const t = setTimeout(() => setPhase("open"), BOOT_REVEAL_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== "charge") {
      playing = false;
      return;
    }
    const id = setInterval(
      () => setLine((n) => Math.min(n + 1, TRACE.length)),
      BOOT_REVEAL_MS / (TRACE.length + 1),
    );
    return () => clearInterval(id);
  }, [phase]);

  if (phase === "done") return null;

  return (
    <motion.div
      role="presentation"
      onClick={() => setPhase("open")}
      initial={false}
      animate={
        phase === "open"
          ? { clipPath: "circle(145% at 50% 50%)", opacity: 0 }
          : { clipPath: "circle(100% at 50% 50%)", opacity: 1 }
      }
      transition={{ duration: 0.85, ease: EASE_IRIS }}
      onAnimationComplete={() => phase === "open" && setPhase("done")}
      className="fixed inset-0 z-80 flex cursor-pointer flex-col items-center justify-center overflow-hidden bg-[#04030d]"
      style={{ colorScheme: "dark" }}
    >
      <div aria-hidden className="absolute inset-0">
        <div className="adv-aurora-1 absolute -left-32 -top-32 h-[26rem] w-[26rem] rounded-full bg-[#7b2ff7] opacity-20 blur-[130px]" />
        <div className="adv-aurora-2 absolute -bottom-32 -right-32 h-[26rem] w-[26rem] rounded-full bg-[#2f6bff] opacity-20 blur-[130px]" />
        <div className="hud-grid absolute inset-0 opacity-30" />
        <div className="deck-grain" />
      </div>

      <div className="relative flex flex-col items-center">
        {/* charge ring */}
        <div className="relative grid size-56 place-items-center sm:size-64">
          <svg
            viewBox="0 0 200 200"
            className="absolute inset-0 size-full -rotate-90"
            aria-hidden
          >
            <defs>
              <linearGradient id="boot-ring" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ff5fa2" />
                <stop offset="45%" stopColor="#a56dff" />
                <stop offset="100%" stopColor="#22d3ee" />
              </linearGradient>
            </defs>
            <circle
              cx="100"
              cy="100"
              r="92"
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth="1.5"
            />
            <motion.circle
              cx="100"
              cy="100"
              r="92"
              fill="none"
              stroke="url(#boot-ring)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={578}
              initial={{ strokeDashoffset: 578 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: BOOT_REVEAL_MS / 1000, ease: [0.4, 0, 0.2, 1] }}
              style={{ filter: "drop-shadow(0 0 10px rgba(165,109,255,0.8))" }}
            />
            <circle
              cx="100"
              cy="100"
              r="78"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
              strokeDasharray="2 8"
            />
          </svg>

          {!reduce && (
            <span className="adv-orbit absolute inset-2">
              <span className="absolute left-1/2 top-0 size-1.5 -translate-x-1/2 rounded-full bg-[#22d3ee] shadow-[0_0_14px_3px_rgba(34,211,238,0.75)]" />
            </span>
          )}

          <motion.span
            initial={{ opacity: 0, scale: 0.86, filter: "blur(12px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.7, ease: EASE_ADV }}
            className="relative inline-flex overflow-hidden px-3 py-2 drop-shadow-[0_4px_30px_rgba(157,92,255,0.55)]"
          >
            <Logo size="md" href={null} />
            <motion.span
              aria-hidden
              initial={{ x: "-170%" }}
              animate={{ x: "170%" }}
              transition={{ duration: 1, ease: "easeInOut", delay: 0.6 }}
              className="absolute inset-y-0 w-1/2 -skew-x-12 bg-linear-to-r from-transparent via-white/50 to-transparent"
            />
          </motion.span>
        </div>

        {/* trace log */}
        <div className="mt-7 h-24 w-72 space-y-1.5 sm:w-80">
          {TRACE.slice(0, line).map((t, i) => (
            <motion.p
              key={t}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: i === line - 1 ? 1 : 0.32, x: 0 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.06em] text-white/70"
            >
              <span className="text-[#22d3ee]">›</span>
              {t}
            </motion.p>
          ))}
        </div>
      </div>

      <p className="absolute bottom-8 text-[10px] font-medium uppercase tracking-[0.3em] text-white/22">
        click to skip
      </p>
    </motion.div>
  );
}
