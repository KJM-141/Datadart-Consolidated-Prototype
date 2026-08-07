"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ArrowUpRight, RotateCcw } from "lucide-react";
import { AssistantMark } from "@/components/brand/assistant-mark";
import { Markdown } from "@/components/shared/markdown";
import {
  findTopic,
  getTopic,
  GUIDE_FALLBACK,
  GUIDE_TOPICS,
  TOUR,
} from "@/lib/assistant-kb";
import type { GuideAction } from "@/lib/assistant-kb";
import { PATHS } from "@/lib/nav";
import { useAppStore, useMounted } from "@/lib/store";
import { EASE_ADV, useSafeReducedMotion } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

/**
 * ── Get started ───────────────────────────────────────────────────────────
 *
 * The other half of the overview route: what the console should say to someone
 * who has never used it.
 *
 * It opens on nothing — a greeting, a line of orientation, one field and four
 * things worth asking. No transcript, no seeded monologue, no panel. An empty
 * conversation that has already said its piece before you have said anything is
 * a wall of text you have to read past to reach the input, and every assistant
 * that opens that way is teaching you to scroll before it teaches you anything.
 *
 * Once you ask, the field drops to the foot of the column and the answers stack
 * above it — the ordinary shape of a conversation, laid directly on the aurora
 * with no card around it. Only your own words get an enclosure.
 *
 * Prose comes from the same `assistant-kb` the floating dock answers from, so
 * the guide and the helper can never disagree.
 */

interface Turn {
  id: string;
  role: "agent" | "user";
  text: string;
  actions?: GuideAction[];
}

const uid = () => `${Date.now()}-${Math.random()}`;

function greetingFor(hour: number): string {
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

export function GettingStarted() {
  const reduce = useSafeReducedMotion();
  const mounted = useMounted();
  const profile = useAppStore((s) => s.profile);

  const [turns, setTurns] = useState<Turn[]>([]);
  const [step, setStep] = useState(-1);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const started = turns.length > 0;

  /* Openers the guide can actually answer, plus one way straight out. */
  const openers = useMemo<GuideAction[]>(
    () => [
      ...GUIDE_TOPICS.slice(0, 3).map((t) => ({ label: t.prompt, topic: t.id })),
      { label: "Scope a move →", href: PATHS.start },
    ],
    [],
  );

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);
  useEffect(() => () => clearTimers(), [clearTimers]);

  const say = useCallback((text: string, actions?: GuideAction[], delay = 460) => {
    setTyping(true);
    timers.current.push(
      setTimeout(() => {
        setTyping(false);
        setTurns((prev) => [...prev, { id: uid(), role: "agent", text, actions }]);
      }, delay),
    );
  }, []);

  const pushUser = useCallback((text: string) => {
    setTurns((prev) => [...prev, { id: uid(), role: "user", text }]);
  }, []);

  useEffect(() => {
    if (!started) return;
    endRef.current?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "nearest",
    });
  }, [turns, typing, reduce, started]);

  /** Play a tour chapter and offer the one after it. */
  const advance = useCallback(
    (next: number) => {
      const topic = getTopic(TOUR[next]);
      if (!topic) return;
      setStep(next);

      const following = getTopic(TOUR[next + 1]);
      say(topic.answer, [
        ...(topic.actions ?? []).filter((a) => a.href),
        ...(following
          ? [{ label: `Next — ${following.prompt}`, topic: "__next" }]
          : [{ label: "Scope my first transfer", href: PATHS.start }]),
      ]);
    },
    [say],
  );

  const onAction = useCallback(
    (topicId: string) => {
      if (topicId === "__next") {
        const next = step + 1;
        if (next >= TOUR.length) return;
        pushUser(getTopic(TOUR[next])?.prompt ?? "Continue");
        advance(next);
        return;
      }
      const topic = getTopic(topicId);
      if (!topic) return;
      pushUser(topic.prompt);

      // Keep the tour pointer honest when a branch lands on a chapter, so
      // "Next" continues from where the reader actually is.
      const at = TOUR.indexOf(topicId as (typeof TOUR)[number]);
      if (at >= 0) setStep(at);
      say(topic.answer, topic.actions);
    },
    [step, advance, pushUser, say],
  );

  const ask = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return;
      setInput("");
      pushUser(text);

      const topic = findTopic(text);
      if (topic) {
        const at = TOUR.indexOf(topic.id as (typeof TOUR)[number]);
        if (at >= 0) setStep(at);
        say(topic.answer, topic.actions);
        return;
      }
      say(GUIDE_FALLBACK, [
        ...GUIDE_TOPICS.slice(0, 3).map((t) => ({ label: t.prompt, topic: t.id })),
        { label: "Scope a transfer", href: PATHS.start },
      ]);
    },
    [pushUser, say],
  );

  const restart = useCallback(() => {
    clearTimers();
    setTyping(false);
    setStep(-1);
    setTurns([]);
    setInput("");
  }, [clearTimers]);

  const composer = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        ask(input);
      }}
      className="relative flex items-center gap-2.5 rounded-full bg-elev/80 px-4 py-1.5 shadow-[inset_0_0_0_1px_var(--hair)] backdrop-blur-xl transition-shadow duration-300 focus-within:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--plasma)_52%,transparent),0_0_28px_-14px_color-mix(in_oklab,var(--plasma)_95%,transparent)]"
    >
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask about DataDart, or say what you need moved"
        aria-label="Ask the DataDart assistant"
        className="min-w-0 flex-1 bg-transparent py-2.5 text-[14px] outline-none placeholder:text-ink-3"
      />
      <button
        type="submit"
        disabled={!input.trim()}
        aria-label="Send"
        className="btn-brand grid size-8 shrink-0 place-items-center rounded-full text-white disabled:pointer-events-none disabled:opacity-30"
      >
        <ArrowRight className="size-3.5" />
      </button>
    </form>
  );

  /* ── Nothing asked yet ─────────────────────────────────────────────── */

  if (!started && !typing) {
    return (
      /*
        Centred in the working column, not in an arbitrary slice of it.

        A `60dvh` box centred its contents inside itself and then left the
        remaining third of the screen empty underneath — the hero read as
        top-aligned with a hole below it. The viewport minus the console chrome
        (56px bar, main's padding, the view toggle) is the space actually
        available, so that is what it centres in.
      */
      <div className="flex min-h-[calc(100dvh-11rem)] items-center justify-center">
        <div className="w-full max-w-xl">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: mounted ? 1 : 0, y: 0 }}
            transition={{ duration: 0.45, ease: EASE_ADV }}
            className="text-[26px] font-semibold leading-tight tracking-tight sm:text-[28px]"
          >
            {/* The clock is read on the client. This ships as a static export,
                so the HTML is stamped at build time and rendering a greeting
                during SSR guarantees a hydration mismatch — held back until
                mount, with the entrance fade covering the gap. */}
            {mounted ? greetingFor(new Date().getHours()) : " "}
            {mounted && profile.firstName ? `, ${profile.firstName}` : ""}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.06, ease: EASE_ADV }}
            className="mt-2 text-[13.5px] leading-relaxed text-ink-3"
          >
            Ask how any of this works, or jump straight into scoping a move and
            I&apos;ll size and price it.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.12, ease: EASE_ADV }}
            className="mt-6"
          >
            {composer}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {openers.map((a) =>
                a.href ? (
                  <Link
                    key={a.label}
                    href={a.href}
                    className="rounded-full bg-sunk px-3 py-1.5 text-[11.5px] text-ink-3 ring-1 ring-inset ring-hair transition-colors hover:text-ink hover:ring-[color-mix(in_oklab,var(--plasma)_40%,transparent)]"
                  >
                    {a.label}
                  </Link>
                ) : (
                  <button
                    key={a.label}
                    type="button"
                    onClick={() => a.topic && onAction(a.topic)}
                    className="rounded-full bg-sunk px-3 py-1.5 text-[11.5px] text-ink-3 ring-1 ring-inset ring-hair transition-colors hover:text-ink hover:ring-[color-mix(in_oklab,var(--plasma)_40%,transparent)]"
                  >
                    {a.label}
                  </button>
                ),
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  /* ── In conversation ───────────────────────────────────────────────── */

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col">
      <div className="flex items-center gap-3">
        <span className="relative grid size-8 shrink-0 place-items-center rounded-full">
          {!reduce && (
            <span className="adv-orbit absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent,var(--plasma),var(--cyo),transparent)]" />
          )}
          <span className="absolute inset-0.5 overflow-hidden rounded-full">
            <AssistantMark size={28} />
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold leading-tight">
            DataDart Assistant
          </p>
          <p className="mt-0.5 text-[11px] text-ink-3">
            {typing
              ? "typing…"
              : step >= 0
                ? `guided tour · ${step + 1} of ${TOUR.length}`
                : "here to explain, not to sell"}
          </p>
        </div>
        <button
          type="button"
          onClick={restart}
          className="inline-flex shrink-0 items-center gap-1.5 text-[11.5px] font-medium text-ink-3 transition-colors hover:text-ink"
        >
          <RotateCcw className="size-3" /> Start over
        </button>
      </div>

      {/* Progress as a rule, not a widget. */}
      <div className="mt-3 flex gap-1" aria-hidden>
        {TOUR.map((id, i) => (
          <span
            key={id}
            className={cn(
              "h-0.5 flex-1 rounded-full transition-colors duration-500",
              i <= step ? "plasma-fill" : "bg-hair",
            )}
          />
        ))}
      </div>

      <div className="mt-8 space-y-7">
        <AnimatePresence initial={false}>
          {turns.map((turn) =>
            turn.role === "agent" ? (
              <motion.div
                key={turn.id}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10, filter: "blur(5px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.42, ease: EASE_ADV }}
                className="flex gap-3.5"
              >
                <AssistantMark size={18} className="mt-1 shrink-0 opacity-80" />
                <div className="min-w-0 flex-1">
                  {/* No bubble. The words sit on the page. */}
                  <div className="space-y-3 text-[14.5px] leading-[1.75] text-ink-2 [&_strong]:font-semibold [&_strong]:text-ink [&_li]:marker:text-(--plasma)">
                    <Markdown text={turn.text} />
                  </div>
                  {turn.actions && turn.actions.length > 0 && (
                    <Chips actions={turn.actions} onTopic={onAction} />
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={turn.id}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32, ease: EASE_ADV }}
                className="flex justify-end"
              >
                {/* The only enclosure on the page, and it is translucent. */}
                <p className="max-w-[80%] rounded-2xl rounded-br-md bg-[color-mix(in_oklab,var(--plasma)_13%,transparent)] px-4 py-2.5 text-[14px] leading-relaxed text-ink ring-1 ring-inset ring-[color-mix(in_oklab,var(--plasma)_26%,transparent)]">
                  {turn.text}
                </p>
              </motion.div>
            ),
          )}
        </AnimatePresence>

        {typing && (
          <div className="flex items-center gap-3.5">
            <AssistantMark size={18} className="shrink-0 opacity-40" />
            <span className="flex h-3.5 items-end gap-1">
              {[0, 1, 2].map((n) => (
                <motion.span
                  key={n}
                  animate={reduce ? undefined : { opacity: [0.25, 1, 0.25] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: n * 0.16 }}
                  className="size-1.5 rounded-full plasma-fill"
                />
              ))}
            </span>
          </div>
        )}

        {/* Scroll target. The margin keeps the newest reply — and its chips —
            clear of the sticky composer. */}
        <div ref={endRef} className="scroll-mb-32" />
      </div>

      <div className="sticky bottom-0 mt-10 pb-1 pt-10">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 top-0 bg-[linear-gradient(180deg,transparent,var(--canvas)_55%)]"
        />
        <div className="relative">{composer}</div>
      </div>
    </div>
  );
}

/* ── Quick replies ──────────────────────────────────────────────────────── */

function Chips({
  actions,
  onTopic,
}: {
  actions: GuideAction[];
  onTopic: (topicId: string) => void;
}) {
  const base =
    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-all";

  return (
    <div className="mt-4 flex flex-wrap gap-1.5">
      {actions.map((a, i) => (
        <motion.span
          key={`${a.label}-${i}`}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + i * 0.05, ease: EASE_ADV }}
        >
          {a.href ? (
            <Link
              href={a.href}
              className={cn(base, "text-ink-2 shadow-[inset_0_0_0_1px_var(--hair)] hover:text-ink hover:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--plasma)_45%,transparent)]")}
            >
              {a.label}
              <ArrowUpRight className="size-3 text-(--plasma)" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => a.topic && onTopic(a.topic)}
              className={cn(
                base,
                "text-(--plasma) shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--plasma)_32%,transparent)] hover:bg-[color-mix(in_oklab,var(--plasma)_10%,transparent)]",
              )}
            >
              {a.label}
            </button>
          )}
        </motion.span>
      ))}
    </div>
  );
}
