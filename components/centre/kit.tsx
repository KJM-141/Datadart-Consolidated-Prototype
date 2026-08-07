"use client";

import { useState } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ── The block vocabulary ──────────────────────────────────────────────────
 *
 * Ported from the DataDart reference, in this build's palette.
 *
 * The whole idea is that a dense screen stays quiet if every panel is built
 * from the same four parts:
 *
 *   · `Block`  — a card whose header is a boxed icon, a small-caps label and
 *                one right-aligned figure. Never a heading with a paragraph.
 *   · `Facts`  — a `gap-px` grid on a hairline background, so the dividers are
 *                the *gaps* rather than borders on each cell. This is the
 *                signature move: it makes a run of numbers read as one object.
 *   · `Fold`   — reference detail, collapsed. A narrow panel becomes a wall of
 *                text without it.
 *   · `Label`  — 10px, uppercase, 0.14em. Every field name on the canvas.
 *
 * Sections inside a Block go edge to edge and separate with `border-t`, never
 * with margin — the card has one continuous surface and the rules sit on it.
 */

export function Label({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "block text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-3",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** A 5px status dot. Colour is the only signal — no filled badges anywhere. */
const DOT: Record<string, string> = {
  ok: "bg-success",
  warn: "bg-warning",
  err: "bg-destructive",
  info: "plasma-fill",
  live: "bg-(--cyo)",
  mute: "bg-ink-3",
};

export function Dot({
  tone = "ok",
  live = false,
  className,
}: {
  tone?: keyof typeof DOT;
  live?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-block size-[5px] shrink-0 rounded-full",
        DOT[tone] ?? DOT.mute,
        live && "adv-ping",
        className,
      )}
    />
  );
}

export function Block({
  icon: Icon,
  label,
  action,
  children,
  className,
}: {
  icon?: LucideIcon;
  label?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg bg-elev ring-1 ring-inset ring-hair",
        className,
      )}
    >
      {label && (
        <header className="flex items-center justify-between gap-3 border-b border-hair px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            {Icon && (
              <span className="grid size-5 shrink-0 place-items-center rounded-md bg-sunk text-ink-3 ring-1 ring-inset ring-hair">
                <Icon className="size-3" />
              </span>
            )}
            <Label className="truncate">{label}</Label>
          </div>
          {action}
        </header>
      )}
      {children}
    </div>
  );
}

export interface FactItem {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}

/**
 * A run of figures as one object.
 *
 * `gap-px` over a hairline background means the rules are the gaps: no cell
 * owns a border, so nothing double-draws at the seams and the grid reflows at
 * any column count without the edges going ragged.
 */
export function Facts({
  items,
  cols = 4,
  className,
}: {
  items: FactItem[];
  cols?: 2 | 3 | 4;
  className?: string;
}) {
  const grid =
    cols === 2
      ? "grid-cols-2"
      : cols === 3
        ? "grid-cols-2 sm:grid-cols-3"
        : "grid-cols-2 sm:grid-cols-4";

  return (
    <dl className={cn("grid gap-px bg-hair", grid, className)}>
      {items.map((f) => (
        <div key={f.label} className="bg-elev px-4 py-3.5">
          <dt className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ink-3">
            {f.label}
          </dt>
          <dd className="mt-1.5 text-[13px] font-medium tabular-nums">{f.value}</dd>
          {f.sub && (
            <dd className="mt-1 text-[10.5px] leading-snug text-ink-3">{f.sub}</dd>
          )}
        </div>
      ))}
    </dl>
  );
}

/** Secondary detail, one click away instead of adding to the wall of text. */
export function Fold({
  label,
  count,
  defaultOpen = false,
  children,
}: {
  label: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-hair">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-sunk"
      >
        <ChevronDown
          className={cn(
            "size-3 shrink-0 text-ink-3 transition-transform duration-200",
            !open && "-rotate-90",
          )}
        />
        <span className="flex-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-3">
          {label}
        </span>
        {typeof count === "number" && (
          <span className="text-[10px] tabular-nums text-ink-3">{count}</span>
        )}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

/** A status chip. Outlined, never filled — the tone is the whole message. */
export function Tag({
  tone = "mute",
  icon: Icon,
  children,
}: {
  tone?: "ok" | "warn" | "info" | "mute";
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  const ring = {
    ok: "text-success ring-[color-mix(in_oklab,var(--success)_28%,transparent)]",
    warn: "text-warning ring-[color-mix(in_oklab,var(--warning)_30%,transparent)]",
    info: "text-(--plasma) ring-[color-mix(in_oklab,var(--plasma)_30%,transparent)]",
    mute: "text-ink-3 ring-hair",
  }[tone];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset",
        ring,
      )}
    >
      {Icon && <Icon className="size-2.5" />}
      {children}
    </span>
  );
}

/** A quiet footnote strip at the foot of a Block. */
export function Note({
  icon: Icon,
  children,
}: {
  icon?: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-2.5 border-t border-hair bg-sunk px-4 py-3">
      {Icon && <Icon className="mt-px size-3.5 shrink-0 text-ink-3" />}
      <p className="text-[11px] leading-relaxed text-ink-2">{children}</p>
    </div>
  );
}

/**
 * A minimal page header for the inner routes.
 *
 * Replaces the deck's `PageHeading`, which paired a 2.5rem title with an
 * accent-ruled eyebrow and a paragraph — three weights of type before any
 * content on every page. One line, one sub-line, one rule.
 */
export function PageHead({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-5 border-b border-hair pb-4">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
        <div className="min-w-0">
          {eyebrow && <Label className="mb-1.5">{eyebrow}</Label>}
          <h1 className="text-[19px] font-semibold leading-tight">{title}</h1>
          {description && (
            <p className="mt-1.5 max-w-2xl text-[12.5px] leading-relaxed text-ink-3">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
    </header>
  );
}
