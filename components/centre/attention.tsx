"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpRight,
  Bell,
  CalendarClock,
  Check,
  FileSignature,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Label } from "./kit";
import { needsYou, type Attention, type AttentionKind } from "@/lib/rail-spec";
import { PATHS } from "@/lib/nav";
import { useAppStore, useMounted } from "@/lib/store";
import { EASE_ADV } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

/**
 * ── Attention ─────────────────────────────────────────────────────────────
 *
 * What is waiting on you, in two places — neither of them a permanent column.
 *
 * It used to be the first row of a signal rail that stood beside every page.
 * That gave a count that is usually 0–2 the same real estate as the navigation,
 * and it sat in the corner of your eye on pages it had nothing to do with.
 *
 *   · `AttentionMenu` — one glyph in the bar, dotted only when something is
 *     actually open. Reachable everywhere, prominent nowhere.
 *   · `AttentionStrip` — the items that belong to *this* page, inline above
 *     the content. On Transfers that is the unsigned agreement; on the cart it
 *     is nothing, and it renders nothing.
 *
 * Both read `needsYou()`, so they cannot disagree with each other or with the
 * order book.
 */

const ICON: Record<AttentionKind, typeof Bell> = {
  signature: FileSignature,
  payment: Wallet,
  document: ShieldCheck,
  stalled: CalendarClock,
};

/** Which attention kinds belong on which route. */
function relevantTo(pathname: string, items: Attention[]): Attention[] {
  const bare = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;

  // A transfer's own page shows only its own items.
  if (bare.startsWith(`${PATHS.transfers}/`)) {
    const id = bare.split("/").pop();
    return items.filter((a) => a.displayId === id);
  }
  // The order book shows everything that blocks an order.
  if (bare.startsWith(PATHS.transfers)) return items;
  // The command centre already has the stat strip, and the rest of the
  // console has nothing to do with signatures and invoices.
  return [];
}

/* ══════════════════════════════ Bar glyph ════════════════════════════════ */

export function AttentionMenu() {
  const orders = useAppStore((s) => s.orders);
  const mounted = useMounted();
  const [open, setOpen] = useState(false);

  const items = useMemo(() => (mounted ? needsYou(orders) : []), [orders, mounted]);
  const blocking = items.filter((a) => a.blocking).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={
          items.length ? `${items.length} items need you` : "Nothing needs you"
        }
        aria-expanded={open}
        className={cn(
          "relative grid size-8 place-items-center rounded-md transition-colors",
          open ? "bg-accent text-ink" : "text-ink-2 hover:bg-accent hover:text-ink",
        )}
      >
        <Bell className="size-4" />
        {items.length > 0 && (
          <span
            aria-hidden
            className={cn(
              "absolute right-1 top-1 size-1.5 rounded-full",
              blocking ? "bg-warning" : "plasma-fill",
            )}
          />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <button
              type="button"
              aria-hidden
              tabIndex={-1}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 cursor-default"
            />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.2, ease: EASE_ADV }}
              className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-80 overflow-hidden rounded-xl bg-elev shadow-[var(--shadow-lift)] ring-1 ring-inset ring-hair"
            >
              <div className="flex items-center justify-between gap-2 border-b border-hair px-3.5 py-2.5">
                <Label>Needs you</Label>
                <span className="text-[10px] tabular-nums text-ink-3">
                  {items.length}
                </span>
              </div>

              {items.length === 0 ? (
                <div className="flex items-start gap-2.5 px-3.5 py-4">
                  <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklab,var(--success)_16%,transparent)]">
                    <Check className="size-2.5 text-success" />
                  </span>
                  <p className="text-[11.5px] leading-relaxed text-ink-3">
                    Nothing outstanding. Every open transfer is signed, settled to
                    its current stage and moving.
                  </p>
                </div>
              ) : (
                <ul className="max-h-80 divide-y divide-hair overflow-y-auto">
                  {items.map((a) => {
                    const Icon = ICON[a.kind];
                    return (
                      <li key={a.id}>
                        <Link
                          href={a.href}
                          onClick={() => setOpen(false)}
                          className="group flex items-start gap-2.5 px-3.5 py-2.5 transition-colors hover:bg-sunk"
                        >
                          <Icon
                            className={cn(
                              "mt-0.5 size-3.5 shrink-0",
                              a.blocking ? "text-warning" : "text-ink-3",
                            )}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block text-[12px] leading-snug">
                              {a.title}
                            </span>
                            <span className="mt-0.5 block font-mono text-[10px] text-ink-3">
                              {a.displayId}
                            </span>
                          </span>
                          <ArrowUpRight className="mt-0.5 size-3 shrink-0 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ════════════════════════════ Inline strip ═══════════════════════════════ */

/**
 * The items this page is about, as a slim band above the content.
 *
 * Renders nothing when the route has no claim on any of them, which is most of
 * them — that is the point. An always-present empty "nothing to do" panel is
 * exactly the noise this replaced.
 */
export function AttentionStrip({ className }: { className?: string }) {
  const pathname = usePathname();
  const orders = useAppStore((s) => s.orders);
  const mounted = useMounted();

  const items = useMemo(
    () => (mounted ? relevantTo(pathname, needsYou(orders)) : []),
    [pathname, orders, mounted],
  );

  if (!items.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE_ADV }}
      className={cn(
        "mb-4 overflow-hidden rounded-lg ring-1 ring-inset",
        items.some((a) => a.blocking)
          ? "ring-[color-mix(in_oklab,var(--warning)_32%,transparent)]"
          : "ring-hair",
        className,
      )}
    >
      <ul className="divide-y divide-hair">
        {items.map((a) => {
          const Icon = ICON[a.kind];
          return (
            <li key={a.id}>
              <Link
                href={a.href}
                className="group flex items-center gap-2.5 bg-[color-mix(in_oklab,var(--warning)_5%,transparent)] px-3.5 py-2.5 transition-colors hover:bg-[color-mix(in_oklab,var(--warning)_9%,transparent)]"
              >
                <Icon
                  className={cn(
                    "size-3.5 shrink-0",
                    a.blocking ? "text-warning" : "text-ink-3",
                  )}
                />
                <span className="min-w-0 flex-1 truncate text-[12px]">
                  {a.title}
                </span>
                <span className="shrink-0 font-mono text-[10.5px] text-ink-3">
                  {a.displayId}
                </span>
                <ArrowUpRight className="size-3 shrink-0 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            </li>
          );
        })}
      </ul>
    </motion.div>
  );
}
