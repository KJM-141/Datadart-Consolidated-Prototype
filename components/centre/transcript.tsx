"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { AssistantMark } from "@/components/brand/assistant-mark";
import { Markdown } from "@/components/shared/markdown";
import { EstimateCard } from "@/components/pricing/estimate-card";
import type { Assistant } from "./use-assistant";
import type { LensId } from "@/lib/centre";
import { EASE_ADV, useSafeReducedMotion } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

/**
 * The transcript, at either size.
 *
 * `compact` is the docked panel: smaller type, no inline estimate card (the
 * panel is 24rem and the card needs 30 to be readable — the range is in the
 * message text either way).
 */
export function Transcript({
  assistant,
  onOpenLens,
  compact = false,
}: {
  assistant: Assistant;
  onOpenLens?: (id: LensId) => void;
  compact?: boolean;
}) {
  const reduce = useSafeReducedMotion();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [assistant.turns, assistant.typing]);

  return (
    <>
      <AnimatePresence initial={false}>
        {assistant.turns.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.34, ease: EASE_ADV }}
            className={cn(
              compact ? "mb-3.5" : "mb-5",
              t.role === "user" && "flex justify-end",
            )}
          >
            {t.role === "user" ? (
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl rounded-br-sm bg-sunk px-3.5 py-2.5 leading-relaxed ring-1 ring-inset ring-hair",
                  compact ? "text-[12px]" : "text-[13px]",
                )}
              >
                {t.text}
              </div>
            ) : (
              <div className="flex items-start gap-2.5">
                <AssistantMark
                  size={compact ? 16 : 20}
                  className="mt-1 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "leading-relaxed",
                      compact ? "text-[12.5px]" : "text-[13.5px]",
                    )}
                  >
                    <Markdown text={t.text} />
                  </p>

                  {t.estimate && assistant.estimate && !compact && (
                    <div className="mt-3">
                      <EstimateCard estimate={assistant.estimate} compact />
                    </div>
                  )}

                  {t.chips && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {t.chips.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => assistant.send(c)}
                          className="rounded-full bg-sunk px-3 py-1.5 text-[11.5px] text-ink-2 ring-1 ring-inset ring-hair transition-colors hover:text-ink hover:ring-[color-mix(in_oklab,var(--plasma)_40%,transparent)]"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  )}

                  {t.lens && onOpenLens && (
                    <button
                      type="button"
                      onClick={() => onOpenLens(t.lens!)}
                      className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-(--plasma) underline decoration-[color-mix(in_oklab,var(--plasma)_35%,transparent)] underline-offset-[3px] transition-colors hover:decoration-(--plasma)"
                    >
                      Open {t.lensLabel?.toLowerCase()}
                      <ArrowUpRight className="size-3" />
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>

      {assistant.typing && (
        <div className={cn("flex items-center gap-1.5 pl-8", compact ? "mb-3.5" : "mb-5")}>
          {[0, 1, 2].map((n) => (
            <motion.span
              key={n}
              animate={reduce ? undefined : { opacity: [0.25, 1, 0.25] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: n * 0.16 }}
              className="size-1.5 rounded-full bg-ink-3"
            />
          ))}
        </div>
      )}

      <div ref={endRef} />
    </>
  );
}
