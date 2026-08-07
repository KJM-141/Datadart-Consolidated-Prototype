"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp } from "lucide-react";
import { Dot } from "./kit";
import { useAppStore } from "@/lib/store";
import { EASE_ADV } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

/**
 * ── Operations ────────────────────────────────────────────────────────────
 *
 * The humans, docked in the workspace column.
 *
 * This used to be a second tab beside the assistant in the centre, which put
 * the two conversations in competition for the one column and meant switching
 * to ask your project manager something cost you sight of the assistant. They
 * are different kinds of conversation — one is instant and transactional, the
 * other is slow and human — so they get different homes and can be read at the
 * same time.
 *
 * Its own composer, deliberately: the centre's belongs to the assistant, and a
 * shared one would need a mode, which is the thing the split just removed.
 */

interface Msg {
  id: string;
  from: "me" | "ops";
  text: string;
  at: string;
}

const SEED: Msg[] = [
  {
    id: "s1",
    from: "ops",
    text: "Morning — the Bengaluru pickup is confirmed for Thursday 09:00 IST. I'll send the driver details the night before.",
    at: "09:14",
  },
  {
    id: "s2",
    from: "ops",
    text: "Nothing needed from you before then.",
    at: "09:14",
  },
];

const PRESETS = [
  "Can we move the pickup?",
  "Who is the driver?",
  "Send me the custody log",
];

let seq = 0;

export function OpsThread() {
  const profile = useAppStore((s) => s.profile);
  const [messages, setMessages] = useState<Msg[]>(SEED);
  const [value, setValue] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    [],
  );

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const send = useCallback((text: string) => {
    const body = text.trim();
    if (!body) return;
    setValue("");
    setMessages((prev) => [
      ...prev,
      { id: `m${seq++}`, from: "me", text: body, at: "Just now" },
    ]);
    timers.current.push(
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `m${seq++}`,
            from: "ops",
            text: "Got it — looking now. I'll come back to you within the hour.",
            at: "Just now",
          },
        ]);
      }, 950),
    );
  }, []);

  const manager = "Ops team";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-2.5 border-b border-hair px-3 py-2.5">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-sunk text-[10px] font-semibold ring-1 ring-inset ring-hair">
          OT
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-medium">{manager}</p>
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-[10.5px] text-ink-3">
            <Dot tone="ok" live /> Replies within the hour
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: EASE_ADV }}
              className={cn("flex", m.from === "me" && "justify-end")}
            >
              <div
                className={cn(
                  "max-w-[88%] rounded-xl px-3 py-2 text-[12px] leading-relaxed",
                  m.from === "me"
                    ? "rounded-br-sm bg-sunk ring-1 ring-inset ring-hair"
                    : "rounded-bl-sm bg-elev ring-1 ring-inset ring-hair",
                )}
              >
                {m.text}
                <span className="mt-1 block text-[9.5px] text-ink-3">{m.at}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={endRef} />
      </div>

      <div className="shrink-0 border-t border-hair px-3 py-2.5">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => send(preset)}
              className="rounded-full bg-sunk px-2.5 py-1 text-[10.5px] text-ink-3 ring-1 ring-inset ring-hair transition-colors hover:text-ink hover:ring-[color-mix(in_oklab,var(--plasma)_40%,transparent)]"
            >
              {preset}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(value);
          }}
          className="flex items-center gap-2 rounded-full bg-sunk px-3 py-1 shadow-[inset_0_0_0_1px_var(--hair)] transition-shadow focus-within:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--plasma)_50%,transparent)]"
        >
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={`Message the ${manager.toLowerCase()}`}
            aria-label="Message the operations team"
            className="min-w-0 flex-1 bg-transparent py-1.5 text-[12px] outline-none placeholder:text-ink-3"
          />
          <button
            type="submit"
            disabled={!value.trim()}
            aria-label="Send"
            className="btn-plasma grid size-7 shrink-0 place-items-center rounded-full text-white disabled:pointer-events-none disabled:opacity-35"
          >
            <ArrowUp className="size-3.5" />
          </button>
        </form>
        <p className="mt-1.5 text-[10px] text-ink-3">
          Signed in as {profile.firstName} {profile.lastName}
        </p>
      </div>
    </div>
  );
}
