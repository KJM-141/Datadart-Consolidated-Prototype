"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown, Sparkles } from "lucide-react";
import { AssistantMark } from "@/components/brand/assistant-mark";
import { Composer } from "./composer";
import { Label } from "./kit";
import { Transcript } from "./transcript";
import { useAssistant } from "./use-assistant";
import type { LensId } from "@/lib/centre";
import { EASE_ADV } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

/**
 * ── The docked assistant ──────────────────────────────────────────────────
 *
 * The assistant, on every route that is not the command centre.
 *
 * The point is not that a chat exists somewhere — it is that you never have to
 * go and find it. Standing on a transfer and wanting to know when it lands, the
 * old answer was "navigate to the command centre, lose this page, and say which
 * transfer you meant". Now it is one click, and the question resolves against
 * the record already on screen because the page declared it (`page-context`).
 *
 * The subject line at the top of the panel is load-bearing: it is the contract
 * that says *this is what I will assume you mean*, so a scoped answer never
 * arrives as a surprise.
 *
 * Bottom-right rather than a side rail — it overlays rather than reflows, so
 * opening it never moves the thing you were reading.
 */
export function AssistantDock({
  onOpenLens,
}: {
  onOpenLens?: (id: LensId) => void;
}) {
  const [open, setOpen] = useState(false);
  const assistant = useAssistant();

  // Escape closes, but only when nothing heavier is over it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.aside
            role="dialog"
            aria-label="DataDart assistant"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.24, ease: EASE_ADV }}
            className="fixed bottom-4 right-4 z-[58] flex h-[min(34rem,calc(100dvh-6rem))] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl bg-elev shadow-[var(--shadow-lift)] ring-1 ring-inset ring-hair"
          >
            <header className="flex shrink-0 items-start justify-between gap-3 border-b border-hair px-3.5 py-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <AssistantMark size={18} className="shrink-0" />
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold leading-none">
                    Assistant
                  </p>
                  {/* The contract: what I will assume you mean. */}
                  <p className="mt-1 truncate text-[10.5px] text-ink-3">
                    {assistant.subject ?? "Across your account"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close assistant"
                className="grid size-6 shrink-0 place-items-center rounded-md text-ink-3 transition-colors hover:bg-sunk hover:text-ink"
              >
                <ChevronDown className="size-4" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-3.5 py-3">
              {!assistant.started ? (
                <div className="py-2">
                  <Label className="mb-2">Ask about this page</Label>
                  <div className="flex flex-col items-start gap-1.5">
                    {assistant.suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => assistant.send(s)}
                        className="rounded-lg bg-sunk px-3 py-1.5 text-left text-[11.5px] text-ink-2 ring-1 ring-inset ring-hair transition-colors hover:text-ink hover:ring-[color-mix(in_oklab,var(--plasma)_40%,transparent)]"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <Transcript
                  assistant={assistant}
                  onOpenLens={onOpenLens}
                  compact
                />
              )}
            </div>

            <div className="shrink-0 border-t border-hair px-3 py-2.5">
              <Composer
                onSend={assistant.send}
                disabled={assistant.typing}
                placeholder="Ask about this page"
              />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Launcher. Hidden while the panel is up so the two never overlap. */}
      <AnimatePresence>
        {!open && (
          <motion.button
            type="button"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.18, ease: EASE_ADV }}
            onClick={() => setOpen(true)}
            aria-label="Open the assistant"
            className={cn(
              "btn-plasma fixed bottom-4 right-4 z-[57] inline-flex h-11 items-center gap-2 px-4",
              "text-[12.5px] font-medium text-white shadow-[var(--shadow-lift)]",
            )}
          >
            <Sparkles className="size-4" />
            Ask
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
