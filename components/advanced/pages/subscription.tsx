"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { format, parseISO } from "date-fns";
import {
  Ban,
  CalendarClock,
  CalendarRange,
  ChevronDown,
  MapPin,
  Plus,
  RefreshCw,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import type { DateRange } from "react-day-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRangePicker } from "@/components/shared/date-picker";
import { HoloPanel } from "@/components/advanced/kit/holo-panel";
import { HudLabel, PageHeading, Pill } from "@/components/advanced/kit/hud";
import { Counter } from "@/components/advanced/kit/text";
import { Spotlight } from "@/components/advanced/kit/interactions";
import { useAppStore, useMounted } from "@/lib/store";
import { getProduct } from "@/lib/products";
import { bloomSoft, deckStagger, EASE_ADV } from "@/lib/advanced-motion";
import type { DeviceSubscription } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Rate } from "@/components/advanced/kit/rate";
import { PATHS } from "@/lib/nav";

const fmtDate = (iso: string) => format(parseISO(iso), "dd MMM yy");

/**
 * Subscriptions — the Advanced device-rental register.
 *
 * Same filters, same expand-to-detail interaction and the same cancel action.
 * Each rental becomes a billing capsule with a term progress rail, so where a
 * subscription sits in its cycle is legible without opening it.
 */
export function SubscriptionAdvanced() {
  const subscriptions = useAppStore((s) => s.subscriptions);
  const mounted = useMounted();

  const [tab, setTab] = useState<"Active" | "Closed">("Active");
  const [range, setRange] = useState<DateRange>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 550);
    return () => clearTimeout(t);
  }, []);

  const filtered = useMemo(() => {
    return subscriptions.filter((s) => {
      const inTab =
        tab === "Closed" ? s.status === "Closed" : s.status !== "Closed";
      if (!inTab) return false;
      if (range?.from) {
        const created = parseISO(s.createdAt);
        if (created < range.from) return false;
        if (range.to && created > range.to) return false;
      }
      return true;
    });
  }, [subscriptions, tab, range]);

  const activeCount = subscriptions.filter((s) => s.status !== "Closed").length;
  const closedCount = subscriptions.length - activeCount;
  const monthlyRun = subscriptions
    .filter((s) => s.status !== "Closed")
    .reduce((n, s) => n + s.monthlyTotal, 0);

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Device rental"
        title="Subscriptions"
        description="Month-to-month rental of devices — ideal for recurring or unpredictable transfers, with optional DataDart cloud endpoints for public-cloud moves. Discounts apply to longer terms; simply select hardware and provide a shipping destination."
        actions={
          <>
            <DateRangePicker
              value={range}
              onChange={setRange}
              placeholder="Date range"
              className="h-11 rounded-full"
            />
            <Link
              href={`${PATHS.hardware}?mode=subscribe`}
              className="btn-plasma inline-flex h-11 items-center gap-2 px-5 text-[13px] font-medium"
            >
              <Plus className="size-4" /> Subscribe
            </Link>
          </>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label="Subscription status filter"
          className="holo inline-flex items-center gap-1 rounded-full p-1"
        >
          {(["Active", "Closed"] as const).map((t) => {
            const on = tab === t;
            const n = t === "Active" ? activeCount : closedCount;
            return (
              <button
                key={t}
                role="tab"
                aria-selected={on}
                onClick={() => setTab(t)}
                className={cn(
                  "relative rounded-full px-5 py-2 text-[13px] font-medium transition-colors duration-300",
                  on ? "text-white" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {on && (
                  <motion.span
                    layoutId="subs-tab"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    className="absolute inset-0 -z-10 rounded-full plasma-fill"
                  />
                )}
                {t}
                {mounted && (
                  <span className={cn("ml-1.5", on ? "text-white/70" : "opacity-60")}>
                    {n}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {mounted && (
          <div className="flex items-center gap-2.5">
            <HudLabel className="text-muted-foreground/60">Monthly run rate</HudLabel>
            <span className="text-[17px] font-semibold tabular-nums plasma-text">
              <Counter value={monthlyRun} prefix="$" suffix="/mo" />
            </span>
          </div>
        )}
      </div>

      {loading || !mounted ? (
        <div className="space-y-3">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="shimmer h-26 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <HoloPanel brackets className="flex flex-col items-center px-6 py-16 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
            <CalendarClock className="size-6" />
          </span>
          <h3 className="mt-5 text-lg font-semibold tracking-tight">
            No subscriptions found
          </h3>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            {range
              ? "Nothing in this date range — try widening it."
              : tab === "Active"
                ? "You have no active device rentals. Subscribe to hardware and we'll ship it to you."
                : "No closed subscriptions yet — completed rentals will land here."}
          </p>
          {!range && (
            <Link
              href={`${PATHS.hardware}?mode=subscribe`}
              className="btn-plasma mt-6 inline-flex h-11 items-center gap-2 px-6 text-[13px] font-medium"
            >
              <Plus className="size-4" /> Subscribe
            </Link>
          )}
        </HoloPanel>
      ) : (
        <motion.div
          variants={deckStagger(0.06)}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          {filtered.map((sub) => (
            <SubscriptionCapsule key={sub.id} sub={sub} />
          ))}
        </motion.div>
      )}
    </div>
  );
}

/* ── Capsule ────────────────────────────────────────────────────────────── */

function SubscriptionCapsule({ sub }: { sub: DeviceSubscription }) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const cancelSubscription = useAppStore((s) => s.cancelSubscription);
  const deviceCount = sub.items.reduce((n, i) => n + i.qty, 0);

  // Where the rental sits inside its own term, clamped so a lapsed end date
  // reads as "complete" rather than overflowing the rail.
  const start = parseISO(sub.startDate).getTime();
  const end = parseISO(sub.endDate).getTime();
  const now = Date.now();
  const elapsed =
    end > start ? Math.min(1, Math.max(0, (now - start) / (end - start))) : 0;
  const closed = sub.status === "Closed";

  return (
    <motion.div variants={bloomSoft} layout>
      <HoloPanel plain className="overflow-hidden">
        <Spotlight size={420} className="block rounded-[inherit]">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="relative grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-3 px-5 py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:grid-cols-[160px_minmax(0,1fr)_auto_auto_auto]"
          >
            <div className="min-w-0">
              <p className="text-[15px] font-semibold tracking-tight">{sub.id}</p>
              <p className="mt-0.5 text-[13px] font-medium text-muted-foreground/70">
                Raised {fmtDate(sub.createdAt)}
              </p>
            </div>

            <div className="col-span-2 row-start-2 flex min-w-0 items-center gap-3.5 sm:col-span-1 sm:row-start-auto">
              {/* stacked device thumbs */}
              <div className="flex -space-x-3.5">
                {sub.items.slice(0, 3).map((item, i) => {
                  const product = getProduct(item.productSlug);
                  return (
                    <span
                      key={`${item.productSlug}-${i}`}
                      className="relative grid size-11 place-items-center overflow-hidden rounded-full bg-product-stage ring-2 ring-card"
                      style={{ zIndex: 3 - i }}
                    >
                      {product && (
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="44px"
                          className="object-contain p-1"
                        />
                      )}
                    </span>
                  );
                })}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-semibold">
                  {sub.items.map((i) => `${i.qty}× ${i.model}`).join(" + ")}
                </p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <CalendarRange className="size-3" />
                  {fmtDate(sub.startDate)} → {fmtDate(sub.endDate)}
                </p>
                {/* term rail */}
                <span className="mt-1.5 block h-1 w-full max-w-48 overflow-hidden rounded-full bg-muted">
                  <motion.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: closed ? 1 : elapsed }}
                    transition={{ duration: 0.9, ease: EASE_ADV }}
                    className={cn(
                      "block h-full origin-left rounded-full",
                      closed ? "bg-muted-foreground/40" : "plasma-fill",
                    )}
                  />
                </span>
              </div>
            </div>

            <span className="hidden items-center gap-1.5 text-[15px] font-semibold tabular-nums sm:flex">
              {!closed && !reduce && (
                <RefreshCw className="nav-spin size-3.5 text-(--cyo)" />
              )}
              <Rate
                usd={sub.monthlyTotal}
                unitClassName="text-[11px] font-normal text-muted-foreground"
              />
            </span>

            <Pill tone={closed ? "muted" : "success"}>{sub.status}</Pill>

            <ChevronDown
              className={cn(
                "size-4 text-muted-foreground transition-transform duration-400",
                open && "rotate-180",
              )}
            />
          </button>
        </Spotlight>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.36, ease: EASE_ADV }}
            >
              <div className="grid gap-4 border-t border-border/60 bg-muted/25 px-5 py-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
                {/* line items */}
                <div className="overflow-hidden rounded-xl bg-card/70 ring-1 ring-inset ring-border">
                  <div className="grid grid-cols-[minmax(0,1fr)_70px_100px] gap-2 border-b border-border/60 bg-muted/50 px-4 py-2.5">
                    <HudLabel>Device</HudLabel>
                    <HudLabel className="text-center">Qty</HudLabel>
                    <HudLabel className="text-right">Rate</HudLabel>
                  </div>
                  {sub.items.map((item, i) => (
                    <div
                      key={`${item.productSlug}-${i}`}
                      className="grid grid-cols-[minmax(0,1fr)_70px_100px] items-center gap-2 border-b border-border/40 px-4 py-2.5 text-sm last:border-0"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">
                          {item.model}
                        </span>
                        {item.capacityTB && (
                          <span className="text-[11px] text-muted-foreground">
                            {item.capacityTB} TB
                          </span>
                        )}
                      </span>
                      <span className="text-center tabular-nums">{item.qty}</span>
                      <span className="text-right font-medium tabular-nums">
                        <Rate usd={item.monthlyRate} />
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between bg-muted/40 px-4 py-3">
                    <span className="text-[12px] text-muted-foreground">
                      {deviceCount} device{deviceCount > 1 ? "s" : ""} · monthly
                      total
                    </span>
                    <span className="text-[15px] font-semibold tabular-nums plasma-text">
                      <Rate usd={sub.monthlyTotal} />
                    </span>
                  </div>
                </div>

                {/* shipping */}
                <div className="rounded-xl bg-card/70 p-4 ring-1 ring-inset ring-border">
                  <HudLabel>Shipping destination</HudLabel>
                  <div className="mt-2.5 space-y-2 text-[12.5px]">
                    <p className="inline-flex items-start gap-2 leading-snug">
                      <MapPin className="mt-0.5 size-3.5 shrink-0 text-(--plasma)" />
                      {sub.shipping.address}, {sub.shipping.city},{" "}
                      {sub.shipping.state}, {sub.shipping.country} —{" "}
                      {sub.shipping.pincode}
                    </p>
                    <p className="inline-flex items-center gap-2 text-muted-foreground">
                      <UserRound className="size-3.5" /> {sub.contact.name} ·{" "}
                      {sub.contact.phone}
                    </p>
                  </div>
                  {!closed && (
                    <div className="mt-4 border-t border-border/60 pt-3.5">
                      <button
                        type="button"
                        onClick={() => {
                          cancelSubscription(sub.id);
                          toast.success(`Subscription ${sub.id} cancelled`, {
                            description: "Moved to Closed.",
                          });
                        }}
                        className="btn-ghost-hud inline-flex h-10 w-full items-center justify-center gap-2 text-[13px] font-medium text-destructive hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--destructive)_50%,transparent)]"
                      >
                        <Ban className="size-3.5" /> Cancel subscription
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </HoloPanel>
    </motion.div>
  );
}
