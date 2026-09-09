"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { format, parseISO } from "date-fns";
import {
  ArrowLeftRight,
  ArrowUpRight,
  Gauge,
  Plus,
  Search,
  ShieldCheck,
  Truck,
} from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRangePicker } from "@/components/shared/date-picker";
import { HoloPanel } from "@/components/advanced/kit/holo-panel";
import {
  HudLabel,
  LiveDot,
  PageHeading,
  Pill,
  type Tone,
} from "@/components/advanced/kit/hud";
import { Counter } from "@/components/advanced/kit/text";
import { Spotlight } from "@/components/advanced/kit/interactions";
import { StageBar } from "@/components/advanced/kit/stage-spine";
import { STAGES, stageIndex } from "@/lib/lifecycle";
import { useAppStore, useMounted } from "@/lib/store";
import { bloomSoft, deckStagger, EASE_ADV } from "@/lib/advanced-motion";
import type { TransferOrder } from "@/lib/types";
import { cn } from "@/lib/utils";

// The 5-step wizard is heavy (forms + map + geo) and only needed on demand.
const RaiseOrderWizard = dynamic(
  () =>
    import("@/components/orders/raise-order-wizard").then(
      (m) => m.RaiseOrderWizard,
    ),
  { ssr: false },
);

/** Stage → tone, so a row's accent tells you where it is at a glance. */
function toneFor(order: TransferOrder): Tone {
  if (order.closed) return "muted";
  if (["Shipment", "DT2 Upload"].includes(order.stage)) return "cyo";
  if (order.stage === "Data Load") return "warning";
  if (["Proposal", "Onboarding", "PO & Advance"].includes(order.stage))
    return "ion";
  return "plasma";
}

/**
 * Transfers — the Advanced orders list.
 *
 * Same filters, same wizard, same query-param entry point as the Normal page.
 * Each order becomes a capsule with a route trace, a ten-segment stage bar and
 * a live progress read-out.
 */
export function OrdersAdvanced() {
  const router = useRouter();
  const params = useSearchParams();
  const orders = useAppStore((s) => s.orders);
  const mounted = useMounted();

  const [tab, setTab] = useState<"Active" | "Closed">("Active");
  const [query, setQuery] = useState("");
  const [range, setRange] = useState<DateRange>();
  const [wizardOpen, setWizardOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 550);
    return () => clearTimeout(t);
  }, []);

  // ⌘K action → /orders?raise=1
  useEffect(() => {
    if (params.get("raise") === "1") {
      setWizardOpen(true);
      router.replace("/customer/history");
    }
  }, [params, router]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const isClosed = Boolean(o.closed);
      if (tab === "Closed" ? !isClosed : isClosed) return false;
      if (query) {
        const q = query.toLowerCase();
        const hay =
          `${o.displayId} ${o.source.label} ${o.destination.label} ${o.volumeTB} ${o.stage}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (range?.from) {
        const created = parseISO(o.createdAt);
        if (created < range.from) return false;
        if (range.to && created > range.to) return false;
      }
      return true;
    });
  }, [orders, tab, query, range]);

  const activeCount = orders.filter((o) => !o.closed).length;
  const closedCount = orders.length - activeCount;
  const movingTB = orders
    .filter((o) => !o.closed)
    .reduce((n, o) => n + o.volumeTB, 0);

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="One-time transfers"
        title="Data transfer orders"
        description="Every transfer runs a ten-stage journey, from proposal through certified erasure, with an accountable owner at each handoff. Open any order to track it live."
        actions={
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search transfers"
                aria-label="Search orders"
                className="h-11 w-48 rounded-full border-transparent bg-[color-mix(in_oklab,var(--muted)_60%,transparent)] pl-10 shadow-[inset_0_0_0_1px_var(--border)] sm:w-56"
              />
            </div>
            <DateRangePicker
              value={range}
              onChange={setRange}
              placeholder="Date range"
              className="h-11 rounded-full"
            />
            <button
              type="button"
              onClick={() => setWizardOpen(true)}
              className="btn-plasma inline-flex h-11 items-center gap-2 px-5 text-[13px] font-medium"
            >
              <Plus className="size-4" /> Raise an order
            </button>
          </>
        }
      />

      {/* filter rail + fleet read-out */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label="Order status filter"
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
                    layoutId="orders-tab"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    className="absolute inset-0 -z-10 rounded-full plasma-fill shadow-[0_0_22px_-8px_color-mix(in_oklab,var(--plasma)_95%,transparent)]"
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

        <div className="flex items-center gap-5">
          <Readout icon={Truck} label="In motion" value={`${movingTB.toLocaleString()} TB`} />
          <Readout icon={Gauge} label="Showing" value={`${filtered.length}`} />
          <Readout icon={ShieldCheck} label="Custody" value="Nominal" tone="success" />
        </div>
      </div>

      {/* list */}
      {loading || !mounted ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="shimmer h-30 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <HoloPanel brackets className="flex flex-col items-center px-6 py-16 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
            <ArrowLeftRight className="size-6" />
          </span>
          <h3 className="mt-5 text-lg font-semibold tracking-tight">
            No orders found
          </h3>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            {query || range
              ? "Nothing matches your search or date filter. Try widening the range."
              : tab === "Active"
                ? "You have no active data-transfer orders. Raise one to get petabytes moving."
                : "No closed orders yet, completed transfers will land here."}
          </p>
          {!query && !range && (
            <button
              type="button"
              onClick={() => setWizardOpen(true)}
              className="btn-plasma mt-6 inline-flex h-11 items-center gap-2 px-6 text-[13px] font-medium"
            >
              <Plus className="size-4" /> Raise an order
            </button>
          )}
        </HoloPanel>
      ) : (
        <motion.div
          variants={deckStagger(0.05)}
          initial="hidden"
          animate="show"
          className="space-y-3"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((order) => (
              <OrderCapsule key={order.displayId} order={order} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <RaiseOrderWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}

/* ── Pieces ─────────────────────────────────────────────────────────────── */

function Readout({
  icon: Icon,
  label,
  value,
  tone = "plasma",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: Tone;
}) {
  return (
    <div className="hidden items-center gap-2.5 sm:flex">
      <Icon
        className={cn(
          "size-3.5",
          tone === "success" ? "text-success" : "text-(--plasma)",
        )}
      />
      <div>
        <HudLabel className="text-muted-foreground/60">{label}</HudLabel>
        <p className="mt-0.5 text-[12px] font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  );
}

function OrderCapsule({ order }: { order: TransferOrder }) {
  const tone = toneFor(order);
  const step = stageIndex(order.stage) + 1;

  return (
    <motion.div variants={bloomSoft} layout>
      <HoloPanel
        plain
        sheen
        interactive
        live={!order.closed && order.stage === "Shipment"}
        className="overflow-hidden"
      >
        <span aria-hidden className="sheen" />
        <Spotlight size={420} className="block rounded-[inherit]">
          <Link
            href={`/customer/history/${order.displayId}`}
            className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-6"
          >
            {/* id + route */}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-[15px] font-semibold tracking-tight">
                  {order.displayId}
                </span>
                <Pill tone={tone} className="gap-1.5">
                  {!order.closed && tone === "cyo" && <LiveDot tone="cyo" />}
                  {order.closed ? "Closed" : order.stage}
                </Pill>
                {order.serviceLevel === "White Glove" && (
                  <Pill tone="rose">White Glove</Pill>
                )}
              </div>

              {/* route trace */}
              <div className="mt-3 flex items-center gap-3">
                <span className="min-w-0 truncate text-[13px] font-medium">
                  {order.source.label}
                </span>
                <span className="relative hidden h-px min-w-16 flex-1 bg-border sm:block">
                  <span
                    className={cn(
                      "absolute inset-0",
                      order.closed
                        ? "bg-border"
                        : "bg-[linear-gradient(90deg,color-mix(in_oklab,var(--plasma)_70%,transparent),color-mix(in_oklab,var(--cyo)_60%,transparent))]",
                    )}
                  />
                  {!order.closed && (
                    <motion.span
                      className="absolute top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-white shadow-[0_0_10px_2px_color-mix(in_oklab,var(--cyo)_90%,transparent)]"
                      animate={{ left: ["0%", "100%"] }}
                      transition={{
                        duration: 2.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  )}
                </span>
                <span className="min-w-0 truncate text-[13px] font-medium">
                  {order.destination.label}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                <Meta label="Volume" value={`${order.volumeTB.toLocaleString()} TB`} />
                <Meta label="Raised" value={format(parseISO(order.createdAt), "dd MMM yyyy")} />
                <Meta label="Stage" value={`${step} of ${STAGES.length}`} />
                {order.stage === "Data Load" && (
                  <Meta label="Copied" value={`${order.progress}%`} />
                )}
              </div>
            </div>

            {/* stage bar + affordance */}
            <div className="flex shrink-0 items-center gap-5 sm:w-72">
              <div className="min-w-0 flex-1">
                <StageBar stage={order.stage} closed={order.closed} />
                <p className="mt-2 text-right text-[13px] font-medium text-muted-foreground/70">
                  <Counter value={Math.round((step / STAGES.length) * 100)} suffix="% complete" />
                </p>
              </div>
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted/60 text-muted-foreground transition-all duration-300 group-hover:bg-[color-mix(in_oklab,var(--plasma)_18%,transparent)] group-hover:text-(--plasma)">
                <ArrowUpRight className="size-4" />
              </span>
            </div>
          </Link>
        </Spotlight>

        {/* live copy bar for the loading stage */}
        {order.stage === "Data Load" && !order.closed && (
          <div className="relative h-0.5 w-full bg-muted">
            <motion.span
              className="absolute inset-y-0 left-0 plasma-fill"
              initial={{ width: 0 }}
              animate={{ width: `${order.progress}%` }}
              transition={{ duration: 1.2, ease: EASE_ADV }}
            />
          </div>
        )}
      </HoloPanel>
    </motion.div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-[13px] font-medium text-muted-foreground/55">
        {label}
      </span>
      <span className="text-[12px] font-semibold tabular-nums">{value}</span>
    </span>
  );
}
