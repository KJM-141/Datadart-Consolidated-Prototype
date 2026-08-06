"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "motion/react";
import { EASE_ADV, wordReveal } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789/\\<>[]{}=+*#%$";

/**
 * Decode reveal: the string resolves left-to-right out of a churn of glyphs.
 * Layout-stable — it always renders exactly `text.length` characters — so it
 * can sit in a heading without reflowing the page as it settles.
 */
export function ScrambleText({
  text,
  className,
  /** ms per settled character. */
  speed = 34,
  delay = 0,
  /** Re-run whenever the pointer enters. */
  onHover = false,
  as: Tag = "span",
}: {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
  onHover?: boolean;
  as?: "span" | "h1" | "h2" | "h3" | "p" | "div";
}) {
  const reduce = useReducedMotion();
  const [out, setOut] = useState(reduce ? text : "");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const kickoff = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = () => {
    if (reduce) return;
    if (timer.current) clearInterval(timer.current);
    let settled = 0;
    timer.current = setInterval(() => {
      settled += 1;
      if (settled > text.length) {
        setOut(text);
        if (timer.current) clearInterval(timer.current);
        timer.current = null;
        return;
      }
      const locked = text.slice(0, settled);
      const churn = text
        .slice(settled)
        .split("")
        .map((c) => (c === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0]))
        .join("");
      setOut(locked + churn);
    }, speed);
  };

  useEffect(() => {
    if (reduce) {
      setOut(text);
      return;
    }
    kickoff.current = setTimeout(run, delay);
    return () => {
      if (kickoff.current) clearTimeout(kickoff.current);
      if (timer.current) clearInterval(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, reduce, delay]);

  return (
    <Tag
      className={cn(className)}
      onMouseEnter={onHover ? run : undefined}
      // The churn is decoration; assistive tech should read the real string.
      aria-label={text}
    >
      <span aria-hidden>{out || text.replace(/\S/g, " ")}</span>
    </Tag>
  );
}

/** Headline that rises word by word out of a blur. */
export function WordReveal({
  text,
  className,
  wordClassName,
  /** Indices (or a predicate) that wear the plasma gradient. */
  highlight,
  as: Tag = "h1",
  delay = 0,
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  highlight?: number[] | ((word: string, i: number) => boolean);
  as?: "h1" | "h2" | "h3" | "p";
  delay?: number;
}) {
  const words = text.split(" ");
  const isHot = (w: string, i: number) =>
    typeof highlight === "function"
      ? highlight(w, i)
      : (highlight ?? []).includes(i);

  const Motion = motion[Tag] as typeof motion.h1;

  return (
    <Motion
      initial="hidden"
      animate="show"
      transition={{ delayChildren: delay }}
      className={cn(className)}
      aria-label={text}
    >
      {words.map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          custom={i}
          variants={wordReveal}
          aria-hidden
          className={cn(
            "mr-[0.26em] inline-block will-change-transform",
            isHot(w, i) && "plasma-text",
            wordClassName,
          )}
        >
          {w}
        </motion.span>
      ))}
    </Motion>
  );
}

/**
 * Spring-driven numeric readout. Counts from the previous value, so a live
 * figure ticking up reads as movement rather than a repaint.
 */
export function Counter({
  value,
  className,
  prefix = "",
  suffix = "",
  decimals = 0,
  /** Start only once scrolled into view. */
  whenVisible = true,
}: {
  value: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  whenVisible?: boolean;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 74, damping: 22, mass: 0.9 });
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (reduce) {
      setShown(value);
      return;
    }
    if (whenVisible && !inView) return;
    mv.set(value);
  }, [value, inView, whenVisible, reduce, mv]);

  useEffect(() => spring.on("change", (v) => setShown(v)), [spring]);

  const text =
    prefix +
    (reduce ? value : shown).toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }) +
    suffix;

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {text}
    </span>
  );
}

/**
 * Odometer-style digit column — for the few hero figures that deserve the
 * extra weight. Each digit rolls independently.
 */
export function Odometer({
  value,
  className,
  digitClassName,
}: {
  value: number;
  className?: string;
  digitClassName?: string;
}) {
  const reduce = useReducedMotion();
  const chars = value.toLocaleString().split("");

  return (
    <span className={cn("inline-flex tabular-nums", className)}>
      {chars.map((c, i) =>
        /\d/.test(c) ? (
          <span
            key={i}
            className={cn("relative inline-block h-[1em] overflow-hidden", digitClassName)}
            style={{ width: "0.62em" }}
          >
            <motion.span
              initial={reduce ? false : { y: "-100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                duration: 0.7,
                ease: EASE_ADV,
                delay: reduce ? 0 : i * 0.04,
              }}
              className="block text-center"
            >
              {c}
            </motion.span>
          </span>
        ) : (
          <span key={i} className="inline-block opacity-60">
            {c}
          </span>
        ),
      )}
    </span>
  );
}

/** Types a string out one character at a time; loops through a list. */
export function TypeCycle({
  phrases,
  className,
  hold = 2200,
  speed = 42,
}: {
  phrases: string[];
  className?: string;
  hold?: number;
  speed?: number;
}) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [n, setN] = useState(0);
  const [erasing, setErasing] = useState(false);

  useEffect(() => {
    if (reduce) return;
    const phrase = phrases[i % phrases.length];
    if (!erasing && n < phrase.length) {
      const t = setTimeout(() => setN(n + 1), speed);
      return () => clearTimeout(t);
    }
    if (!erasing && n === phrase.length) {
      const t = setTimeout(() => setErasing(true), hold);
      return () => clearTimeout(t);
    }
    if (erasing && n > 0) {
      const t = setTimeout(() => setN(n - 1), speed / 2.2);
      return () => clearTimeout(t);
    }
    setErasing(false);
    setI((v) => v + 1);
  }, [n, erasing, i, phrases, hold, speed, reduce]);

  const phrase = phrases[i % phrases.length];
  return (
    <span className={cn("adv-caret", className)}>
      {reduce ? phrases[0] : phrase.slice(0, n)}
    </span>
  );
}
