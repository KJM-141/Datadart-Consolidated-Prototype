"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { EASE_ADV, bloomSoft, deck } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

/* ── Micro-typography ─────────────────────────────────────────────────────
   `.hud-label` carries the tracking now (0.08em, not 0.28em). Kept as a
   component so the eyebrow rhythm is defined in one place. */

export function HudLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={cn("hud-label", className)}>{children}</p>;
}

/** Eyebrow with a short accent rule — the deck's one recurring flourish. */
export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        aria-hidden
        className="h-px w-4 shrink-0 rounded-full plasma-fill opacity-80"
      />
      <HudLabel>{children}</HudLabel>
    </div>
  );
}

export function HudRule({ className }: { className?: string }) {
  return <div aria-hidden className={cn("hud-rule w-full", className)} />;
}

/* ── Status atoms ───────────────────────────────────────────────────────── */

const TONES = {
  plasma:
    "text-(--plasma) bg-[color-mix(in_oklab,var(--plasma)_11%,transparent)] ring-[color-mix(in_oklab,var(--plasma)_24%,transparent)]",
  ion: "text-(--ion) bg-[color-mix(in_oklab,var(--ion)_11%,transparent)] ring-[color-mix(in_oklab,var(--ion)_24%,transparent)]",
  cyo: "text-(--cyo) bg-[color-mix(in_oklab,var(--cyo)_11%,transparent)] ring-[color-mix(in_oklab,var(--cyo)_24%,transparent)]",
  rose: "text-(--rose) bg-[color-mix(in_oklab,var(--rose)_11%,transparent)] ring-[color-mix(in_oklab,var(--rose)_24%,transparent)]",
  success:
    "text-success bg-[color-mix(in_oklab,var(--success)_11%,transparent)] ring-[color-mix(in_oklab,var(--success)_24%,transparent)]",
  warning:
    "text-warning bg-[color-mix(in_oklab,var(--warning)_13%,transparent)] ring-[color-mix(in_oklab,var(--warning)_26%,transparent)]",
  muted:
    "text-muted-foreground bg-[color-mix(in_oklab,var(--muted-foreground)_8%,transparent)] ring-border",
} as const;

export type Tone = keyof typeof TONES;

export function toneColor(tone: Tone): string {
  if (tone === "success") return "var(--success)";
  if (tone === "warning") return "var(--warning)";
  if (tone === "muted") return "var(--muted-foreground)";
  return `var(--${tone})`;
}

export function Pill({
  children,
  tone = "plasma",
  icon: Icon,
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium leading-none ring-1 ring-inset",
        TONES[tone],
        className,
      )}
    >
      {Icon && <Icon className="size-3" />}
      {children}
    </span>
  );
}

/** Pulsing beacon. Reserve for state that is actually changing. */
export function LiveDot({
  tone = "cyo",
  className,
}: {
  tone?: Tone;
  className?: string;
}) {
  const color = toneColor(tone);
  return (
    <span className={cn("relative inline-flex size-1.5", className)}>
      <span
        className="adv-ping absolute inset-0 rounded-full opacity-70"
        style={{ background: color }}
      />
      <span
        className="relative inline-flex size-1.5 rounded-full"
        style={{ background: color }}
      />
    </span>
  );
}

/* ── Metric ring ────────────────────────────────────────────────────────── */

/**
 * Gauge ring with a gradient stroke. `value` is 0‥1. The gradient id is
 * derived from the caller-supplied `id` so several rings can coexist without
 * their defs colliding.
 */
export function MetricRing({
  value,
  size = 76,
  stroke = 5,
  id,
  children,
  className,
  from = "var(--plasma)",
  to = "var(--ion)",
  delay = 0,
}: {
  value: number;
  size?: number;
  stroke?: number;
  id: string;
  children?: ReactNode;
  className?: string;
  from?: string;
  to?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, value));

  return (
    <div
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <defs>
          <linearGradient id={`ring-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-border"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#ring-${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={reduce ? false : { strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - clamped) }}
          transition={{ duration: 1.1, ease: EASE_ADV, delay }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        {children}
      </div>
    </div>
  );
}

/* ── Stat block ─────────────────────────────────────────────────────────── */

export function StatBlock({
  label,
  value,
  hint,
  icon: Icon,
  tone = "plasma",
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: Tone;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <HudLabel>{label}</HudLabel>
        {Icon && (
          <span
            className={cn(
              "grid size-8 place-items-center rounded-lg ring-1 ring-inset",
              TONES[tone],
            )}
          >
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <div className="text-[26px] font-semibold leading-none tracking-tight">
        {value}
      </div>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

/* ── Telemetry ticker ───────────────────────────────────────────────────── */

/** Seamless marquee. Content is duplicated so the -50% translate loops cleanly. */
export function Ticker({
  items,
  className,
}: {
  items: ReactNode[];
  className?: string;
}) {
  const run = (key: string) => (
    <div className="flex shrink-0 items-center gap-9 px-5" key={key}>
      {items.map((item, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-2 whitespace-nowrap text-[11px] text-muted-foreground"
        >
          {item}
        </span>
      ))}
    </div>
  );

  return (
    <div
      className={cn(
        "relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]",
        className,
      )}
    >
      <div className="adv-marquee flex w-max">
        {run("a")}
        {run("b")}
      </div>
    </div>
  );
}

/* ── Connector beam ─────────────────────────────────────────────────────── */

export function Beam({
  className,
  vertical,
  active = true,
}: {
  className?: string;
  vertical?: boolean;
  active?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative block overflow-hidden",
        vertical ? "w-px" : "h-px",
        className,
      )}
      style={{
        background: active
          ? "linear-gradient(var(--dir,90deg), color-mix(in oklab, var(--plasma) 42%, transparent), color-mix(in oklab, var(--cyo) 34%, transparent))"
          : "var(--border)",
        ["--dir" as string]: vertical ? "180deg" : "90deg",
      }}
    >
      {active && (
        <motion.span
          className="absolute inset-0 bg-white/50"
          initial={{ [vertical ? "y" : "x"]: "-100%" }}
          animate={{ [vertical ? "y" : "x"]: "100%" }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
          style={{ [vertical ? "height" : "width"]: "34%" }}
        />
      )}
    </span>
  );
}

/* ── Page heading ───────────────────────────────────────────────────────── */

/**
 * Every Advanced route opens with this. Deliberately plain: an eyebrow, a
 * display-size title and a hairline. Earlier revisions decoded the title
 * character by character and hung a gradient full-stop off the end — a tic
 * that made every page look like the same generated template.
 */
export function PageHeading({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <motion.header
      variants={deck}
      initial="hidden"
      animate="show"
      className={cn("relative", className)}
    >
      <motion.div
        variants={bloomSoft}
        className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4"
      >
        <div className="min-w-0">
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          {/* Was 1.75rem rising to 2.125rem. A 34px title above a 13.5px lead
              paragraph put two display weights in front of every page before
              any content, on a console where the content is the point. The
              inner pages now open at the same scale as the command centre's
              panel heads, which is what makes them read as one product. */}
          <h1 className="mt-2 text-[19px] font-semibold leading-tight sm:text-[21px]">
            {title}
          </h1>
          {description && (
            <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </motion.div>
      <motion.div variants={bloomSoft} className="mt-4">
        <HudRule />
      </motion.div>
    </motion.header>
  );
}

/* ── Actions ────────────────────────────────────────────────────────────── */

/** Shared sizing for the deck's buttons. Sentence case, normal tracking. */
export const actionClass =
  "inline-flex h-10 items-center justify-center gap-2 px-5 text-[13px] font-medium " +
  "outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring " +
  "disabled:pointer-events-none disabled:opacity-55";

export function DeckButton({
  children,
  variant = "plasma",
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "plasma" | "ghost";
}) {
  return (
    <button
      className={cn(
        actionClass,
        variant === "plasma" ? "btn-plasma" : "btn-ghost-hud",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
