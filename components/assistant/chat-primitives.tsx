"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { AssistantMark } from "@/components/brand/assistant-mark";
import { Markdown } from "@/components/shared/markdown";
import type { GuideAction } from "@/lib/assistant-kb";
import { EASE_ADV, useSafeReducedMotion } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

/**
 * ── Chat furniture ────────────────────────────────────────────────────────
 *
 * The bubbles, chips and typing indicator shared by the floating dock and the
 * guided "Get started" view. Both are conversations with the same agent, so
 * they have to *look* like the same agent — and the intake terminal on the New
 * transfer route already established what that looks like.
 *
 * That route is deliberately not refactored onto these: it renders an estimate
 * card inline in the transcript and carries the redaction guard, so it earns its
 * own copy. These are for the two surfaces that only ever render prose.
 */

export function AgentBubble({
  text,
  children,
  className,
}: {
  text: string;
  /** Anything that belongs under the prose — a card, a set of chips. */
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, filter: "blur(5px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.38, ease: EASE_ADV }}
      className={cn("flex items-start gap-2.5", className)}
    >
      <AssistantMark size={20} className="mt-1.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="relative overflow-hidden rounded-2xl rounded-tl-sm bg-muted/60 px-3.5 py-2.5 text-[12.5px] leading-relaxed ring-1 ring-inset ring-border">
          <span
            aria-hidden
            className="absolute inset-y-0 left-0 w-0.5 plasma-fill"
          />
          <Markdown text={text} />
        </div>
        {children}
      </div>
    </motion.div>
  );
}

export function UserBubble({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: EASE_ADV }}
      className="flex justify-end"
    >
      <div className="max-w-[85%] rounded-2xl rounded-tr-sm plasma-fill px-3.5 py-2.5 text-[12.5px] leading-relaxed text-white">
        {text}
      </div>
    </motion.div>
  );
}

/**
 * Quick replies. An action either navigates or branches to another topic, and
 * the two are visually distinguished — a chip that leaves the page should say so
 * before it is pressed, not after.
 */
export function ChipRow({
  actions,
  onTopic,
  onNavigate,
  className,
}: {
  actions: GuideAction[];
  onTopic: (topicId: string) => void;
  /** Called before following a link — lets the dock close itself. */
  onNavigate?: () => void;
  className?: string;
}) {
  if (!actions.length) return null;

  return (
    <div className={cn("mt-2 flex flex-wrap gap-1.5", className)}>
      {actions.map((a, i) => {
        const inner = (
          <>
            {a.label}
            {a.href && <ArrowUpRight className="size-3 shrink-0" />}
          </>
        );
        const chip =
          "inline-flex items-center gap-1 rounded-full bg-[color-mix(in_oklab,var(--plasma)_12%,transparent)] px-3 py-1.5 text-left text-[11px] font-semibold text-(--plasma) ring-1 ring-inset ring-[color-mix(in_oklab,var(--plasma)_38%,transparent)] transition-all hover:bg-[color-mix(in_oklab,var(--plasma)_22%,transparent)]";

        return (
          <motion.span
            key={`${a.label}-${i}`}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.08 + i * 0.05, ease: EASE_ADV }}
          >
            {a.href ? (
              <Link href={a.href} onClick={onNavigate} className={chip}>
                {inner}
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => a.topic && onTopic(a.topic)}
                className={chip}
              >
                {inner}
              </button>
            )}
          </motion.span>
        );
      })}
    </div>
  );
}

export function TypingDots({ label = "typing" }: { label?: string }) {
  const reduce = useSafeReducedMotion();
  return (
    <div className="flex items-center gap-2 pl-7">
      <span className="flex h-3.5 items-end gap-0.5">
        {[0, 1, 2, 3].map((n) => (
          <motion.span
            key={n}
            animate={
              reduce ? undefined : { scaleY: [0.3, 1, 0.3], opacity: [0.4, 1, 0.4] }
            }
            transition={{ duration: 1.05, repeat: Infinity, delay: n * 0.11 }}
            className="h-2.5 w-0.75 origin-bottom rounded-full plasma-fill"
          />
        ))}
      </span>
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
    </div>
  );
}
