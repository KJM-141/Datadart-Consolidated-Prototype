"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { Composer } from "./composer";
import { StatStrip } from "./stat-strip";
import { Transcript } from "./transcript";
import { useAssistant } from "./use-assistant";
import type { LensId } from "@/lib/centre";
import { useMounted } from "@/lib/store";
import { EASE_ADV } from "@/lib/advanced-motion";

/**
 * ── The conversation ──────────────────────────────────────────────────────
 *
 * Centre column of the command centre, and the reason the other two are
 * allowed to be so quiet.
 *
 * It is the same engine the docked assistant runs (`useAssistant`) at full
 * size — the only differences are the greeting, the stat strip above it and
 * the inline estimate card, all of which need the width. Extracting the engine
 * is what makes "the assistant is on every page" true rather than approximately
 * true.
 */
export function Conversation({
  onOpenLens,
  injected,
  onInjected,
  greetingName,
}: {
  onOpenLens: (id: LensId) => void;
  /** Sentence handed in from the workspace, e.g. the quick sizer. */
  injected?: string | null;
  onInjected?: () => void;
  greetingName?: string;
}) {
  // The greeting reads the clock, and the console ships as a static export —
  // the HTML is stamped at build time, so rendering it during SSR guarantees a
  // hydration mismatch. Held back until mount; the entrance fade covers it.
  const mounted = useMounted();
  const assistant = useAssistant();
  const { send } = assistant;

  useEffect(() => {
    if (!injected) return;
    send(injected);
    onInjected?.();
    // `send` changes as facts accumulate; re-running on it would resend.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [injected]);

  const composer = (
    <Composer
      onSend={send}
      disabled={assistant.typing}
      placeholder="Ask about your transfers, or say what you need moved"
    />
  );

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <StatStrip onOpenLens={onOpenLens} />

      <main className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-6">
        {!assistant.started ? (
          <div className="flex h-full items-center justify-center py-10">
            <div className="w-full max-w-xl">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: mounted ? 1 : 0, y: 0 }}
                transition={{ duration: 0.45, ease: EASE_ADV }}
                className="text-[26px] font-semibold leading-tight"
              >
                {mounted ? greeting() : " "}
                {mounted && greetingName ? `, ${greetingName}` : ""}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.06, ease: EASE_ADV }}
                className="mt-2 text-[13.5px] leading-relaxed text-ink-3"
              >
                Ask about anything in flight, or describe a move and I&apos;ll
                size and price it.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.12, ease: EASE_ADV }}
                className="mt-6"
              >
                {composer}
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {assistant.suggestions.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => send(q)}
                      className="rounded-full bg-sunk px-3 py-1.5 text-[11.5px] text-ink-3 ring-1 ring-inset ring-hair transition-colors hover:text-ink hover:ring-[color-mix(in_oklab,var(--plasma)_40%,transparent)]"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-xl py-6">
            <Transcript assistant={assistant} onOpenLens={onOpenLens} />
          </div>
        )}
      </main>

      {assistant.started && (
        <div className="shrink-0 px-4 pb-4 sm:px-6">
          <div className="mx-auto w-full max-w-xl">
            {composer}
            <button
              type="button"
              onClick={() =>
                toast.success("Connecting you to a specialist", {
                  description:
                    "Someone from the operations team will pick this up shortly.",
                })
              }
              className="mt-2 text-[11px] text-ink-3 transition-colors hover:text-ink"
            >
              Talk to a human instead
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}
