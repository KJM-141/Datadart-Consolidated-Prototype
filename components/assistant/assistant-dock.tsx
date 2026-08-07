"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, ArrowUpRight, X } from "lucide-react";
import { AssistantMark } from "@/components/brand/assistant-mark";
import {
  AgentBubble,
  ChipRow,
  TypingDots,
  UserBubble,
} from "./chat-primitives";
import {
  findTopic,
  getTopic,
  GUIDE_FALLBACK,
  GUIDE_GREETING,
  GUIDE_NUDGES,
  GUIDE_TOPICS,
  type GuideAction,
  type GuideTopic,
} from "@/lib/assistant-kb";
import { PATHS } from "@/lib/nav";
import { railVisible } from "@/lib/rail-spec";
import { useAppStore, useMounted } from "@/lib/store";
import { EASE_ADV, useSafeReducedMotion } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

/**
 * ── The assistant dock ────────────────────────────────────────────────────
 *
 * The console's help, as a presence rather than a panel. It replaced a static
 * *Assistant* section pinned to the bottom of the right rail that said the same
 * three sentences on every route and could not answer a single one of them.
 *
 * It offers help unprompted — that is the point — but on a leash: three times a
 * session, never once you have opened it, and it stops for good if it has been
 * ignored often enough. An assistant that cannot take a hint is a popup.
 *
 * Scoping a real transfer is *not* its job. `lib/agent.ts` on the New transfer
 * route owns that, with the slot-filling, secret redaction and pricing guards
 * that belong to it; this thing explains, points, and gets out of the way. It
 * hides itself entirely on that route so there are never two assistants on one
 * screen.
 */

/** Per-session ceiling on unprompted nudges. */
const NUDGES_PER_SESSION = 3;
/** Give up permanently once this many have been ignored across all visits. */
const NUDGES_LIFETIME = 9;
const FIRST_NUDGE_MS = 12_000;
const REPEAT_NUDGE_MS = 75_000;
const NUDGE_VISIBLE_MS = 9_000;

interface DockTurn {
  id: string;
  role: "agent" | "user";
  text: string;
  actions?: GuideAction[];
}

const OPENING_CHIPS: GuideAction[] = GUIDE_TOPICS.slice(0, 4).map((t) => ({
  label: t.prompt,
  topic: t.id,
}));

export function AssistantDock() {
  const pathname = usePathname();
  const mounted = useMounted();
  const reduce = useSafeReducedMotion();

  const nudgeSeen = useAppStore((s) => s.assistantNudgeSeen);
  const noteAssistantNudge = useAppStore((s) => s.noteAssistantNudge);

  const [open, setOpen] = useState(false);
  const [nudge, setNudge] = useState<(typeof GUIDE_NUDGES)[number] | null>(null);
  const [turns, setTurns] = useState<DockTurn[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");

  const openedOnce = useRef(false);
  const sessionNudges = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  /* ── Unprompted nudges ─────────────────────────────────────────────── */

  // The intake terminal owns this route; two assistants on one screen is one
  // too many.
  const suppressed = pathname.startsWith(PATHS.start);
  const railHere = railVisible(pathname);

  useEffect(() => {
    if (!mounted || suppressed || open || openedOnce.current) return;
    if (nudgeSeen >= NUDGES_LIFETIME) return;

    let cancelled = false;

    const schedule = (delay: number) => {
      const t = setTimeout(() => {
        if (cancelled || openedOnce.current) return;
        if (sessionNudges.current >= NUDGES_PER_SESSION) return;

        setNudge(GUIDE_NUDGES[sessionNudges.current % GUIDE_NUDGES.length]);
        sessionNudges.current += 1;
        noteAssistantNudge();

        timers.current.push(setTimeout(() => !cancelled && setNudge(null), NUDGE_VISIBLE_MS));
        schedule(REPEAT_NUDGE_MS);
      }, delay);
      timers.current.push(t);
    };

    schedule(FIRST_NUDGE_MS);

    return () => {
      cancelled = true;
      clearTimers();
    };
  }, [mounted, suppressed, open, nudgeSeen, noteAssistantNudge, clearTimers]);

  /* ── Conversation ──────────────────────────────────────────────────── */

  const say = useCallback((topic: GuideTopic) => {
    setTyping(true);
    const t = setTimeout(() => {
      setTyping(false);
      setTurns((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          role: "agent",
          text: topic.answer,
          actions: topic.actions,
        },
      ]);
    }, 520);
    timers.current.push(t);
  }, []);

  const ask = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return;
      setInput("");

      setTurns((prev) => [
        ...prev,
        { id: `${Date.now()}-${Math.random()}`, role: "user", text },
      ]);

      const topic = findTopic(text);
      if (topic) {
        say(topic);
        return;
      }

      setTyping(true);
      const t = setTimeout(() => {
        setTyping(false);
        setTurns((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random()}`,
            role: "agent",
            text: GUIDE_FALLBACK,
            actions: [
              ...OPENING_CHIPS,
              { label: "Scope a transfer", href: PATHS.start },
            ],
          },
        ]);
      }, 520);
      timers.current.push(t);
    },
    [say],
  );

  const onTopic = useCallback(
    (id: string) => {
      const topic = getTopic(id);
      if (!topic) return;
      setTurns((prev) => [
        ...prev,
        { id: `${Date.now()}-${Math.random()}`, role: "user", text: topic.prompt },
      ]);
      say(topic);
    },
    [say],
  );

  const openDock = useCallback(() => {
    openedOnce.current = true;
    clearTimers();
    setNudge(null);
    setOpen(true);
  }, [clearTimers]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: reduce ? "auto" : "smooth",
    });
  }, [turns, typing, reduce]);

  // Nothing renders until mount: the nudge budget is persisted state, and the
  // dock is pure chrome, so there is nothing to server-render.
  if (!mounted || suppressed) return null;

  return (
    /*
      Stands clear of the right rail only where there *is* one.

      The rail is the overview's alone now, so a fixed 23.25rem inset parked the
      dock a column's width into open canvas on every other route. It tracks the
      rail instead: offset beside it on the overview at xl, and in the actual
      corner everywhere else.
    */
    <div
      className={cn(
        "pointer-events-none fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2.5 transition-[right] duration-300",
        railHere && "xl:right-[23.25rem]",
      )}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.28, ease: EASE_ADV }}
            className="pointer-events-auto flex max-h-[30rem] w-[21rem] max-w-[calc(100vw-2.5rem)] origin-bottom-right flex-col overflow-hidden rounded-2xl border border-hair bg-canvas/95 shadow-[0_24px_60px_-24px_rgb(0_0_0/0.65)] backdrop-blur-xl"
          >
            <header className="flex shrink-0 items-center gap-2.5 border-b border-hair bg-sunk/70 px-3.5 py-3">
              <span className="relative grid size-8 shrink-0 place-items-center rounded-full">
                {!reduce && (
                  <span className="adv-orbit absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent,var(--plasma),var(--cyo),transparent)]" />
                )}
                <span className="absolute inset-0.5 overflow-hidden rounded-full">
                  <AssistantMark size={28} />
                </span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-semibold leading-tight">
                  DataDart Assistant
                </p>
                <p className="truncate text-[10.5px] text-ink-3">
                  {typing ? "typing…" : "Here to explain, not to sell"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close assistant"
                className="grid size-7 shrink-0 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-accent hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </header>

            <div
              ref={scrollRef}
              className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3.5 py-3.5"
            >
              <AgentBubble text={GUIDE_GREETING}>
                <ChipRow
                  actions={OPENING_CHIPS}
                  onTopic={onTopic}
                  onNavigate={() => setOpen(false)}
                />
              </AgentBubble>

              {turns.map((turn) =>
                turn.role === "agent" ? (
                  <AgentBubble key={turn.id} text={turn.text}>
                    {turn.actions && (
                      <ChipRow
                        actions={turn.actions}
                        onTopic={onTopic}
                        onNavigate={() => setOpen(false)}
                      />
                    )}
                  </AgentBubble>
                ) : (
                  <UserBubble key={turn.id} text={turn.text} />
                ),
              )}

              {typing && <TypingDots />}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                ask(input);
              }}
              className="flex shrink-0 items-center gap-2 border-t border-hair px-3 py-2.5"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about DataDart…"
                aria-label="Ask the DataDart assistant"
                className="min-w-0 flex-1 bg-transparent py-2 text-[12.5px] outline-none placeholder:text-ink-3"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                aria-label="Send"
                className="btn-brand grid size-8 shrink-0 place-items-center rounded-full text-white disabled:pointer-events-none disabled:opacity-40"
              >
                <ArrowUp className="size-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/*
        The unprompted offer.

        A card rather than the pill it started as: a bare "Need any help?" in a
        chip asks the reader to guess what this thing knows, so it now carries
        the agent's face and one line of what taking the offer would get you.
        The whole surface is the target; the dismiss sits proud of the corner so
        it never competes with it.
      */}
      <AnimatePresence>
        {nudge && !open && (
          <motion.div
            key="nudge"
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: 18, scale: 0.94 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: 12, scale: 0.96 }}
            transition={{ duration: 0.38, ease: EASE_ADV }}
            className="pointer-events-auto relative w-[21.5rem] max-w-[calc(100vw-2.5rem)]"
          >
            {/*
              A gradient hairline, drawn as a 1px inset rather than a border, so
              the edge can carry the brand ramp.

              The two radii are locked to one number with the inner exactly 1px
              tighter, because that is the only relationship that makes the inset
              read as a hairline. They were `rounded-2xl` (27.36px) outside and
              `--radius + 0.25rem` (19.2px) inside: an 8px mismatch, which left
              the ramp running straight past all four corners as bare wedges
              while the panel curved away from it.

              The panel is opaque for the same reason. At 95% the ramp bled
              through the whole face as a violet haze, so the "hairline" was
              really a wash with a bright edge — and a notification that floats
              over arbitrary content should be solid anyway.
            */}
            <div className="rounded-[1.15rem] bg-[linear-gradient(135deg,color-mix(in_oklab,var(--plasma)_65%,transparent),color-mix(in_oklab,var(--cyo)_38%,transparent)_55%,var(--hair))] p-px shadow-[0_20px_48px_-20px_rgb(0_0_0/0.75)]">
              <button
                type="button"
                onClick={openDock}
                className="group flex w-full items-center gap-3 rounded-[calc(1.15rem-1px)] bg-elev px-3.5 py-3 text-left transition-colors hover:bg-sunk"
              >
                <span className="relative grid size-10 shrink-0 place-items-center">
                  <span
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-[radial-gradient(circle,color-mix(in_oklab,var(--plasma)_55%,transparent),transparent_70%)] blur-md"
                  />
                  <AssistantMark size={34} animated={!reduce} className="relative" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-semibold leading-snug">
                    {nudge.title}
                  </span>
                  <span className="mt-0.5 block text-[11.5px] leading-snug text-ink-3">
                    {nudge.hint}
                  </span>
                </span>

                <ArrowUpRight className="size-4 shrink-0 text-ink-3 transition-all group-hover:translate-x-0.5 group-hover:text-(--plasma)" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setNudge(null)}
              aria-label="Dismiss"
              className="absolute -right-1.5 -top-1.5 grid size-5.5 place-items-center rounded-full bg-elev text-ink-3 shadow-[0_0_0_1px_var(--hair),0_6px_14px_-6px_rgb(0_0_0/0.8)] transition-colors hover:text-ink"
            >
              <X className="size-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openDock())}
        aria-label={open ? "Close assistant" : "Open the DataDart assistant"}
        aria-expanded={open}
        className={cn(
          "pointer-events-auto relative grid size-13 shrink-0 place-items-center rounded-full transition-transform duration-300",
          !reduce && "hover:-translate-y-0.5",
        )}
      >
        {!reduce && (
          <span className="adv-orbit absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent,var(--plasma),var(--cyo),transparent)]" />
        )}
        {!reduce && !open && nudge && (
          <span className="adv-ping absolute inset-0 rounded-full bg-[color-mix(in_oklab,var(--plasma)_45%,transparent)]" />
        )}
        {/* The mark is a disc now, so it fills the ring instead of floating as
            a glyph inside a second circle — the orbit reads as a status ring
            around an avatar, which is what it always wanted to be. */}
        <span className="absolute inset-[3px] overflow-hidden rounded-full shadow-[0_10px_30px_-12px_color-mix(in_oklab,var(--plasma)_90%,transparent)]">
          <AssistantMark size={46} animated={!reduce} />
        </span>
      </button>
    </div>
  );
}
