"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Facts, Label, PageHead, Tag } from "../kit";
import { TermRing } from "../route-line";
import { useDeclarePageScope } from "../page-context";
import { PATHS } from "@/lib/nav";
import { fmtUSD } from "@/lib/pricing";
import { getProduct, productStage } from "@/lib/products";
import { useAppStore, useMounted } from "@/lib/store";
import type { DeviceSubscription } from "@/lib/types";
import { bloomSoft, deckStagger } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

/**
 * ── Subscriptions ─────────────────────────────────────────────────────────
 *
 * Hardware you have out in the world, shown as hardware.
 *
 * A rental is a physical object sitting in someone's rack on a clock. The list
 * version reported that as an ID, a date range and a rate — three strings that
 * could have described an insurance policy. The two things you actually want
 * are *which device* and *how long is left*, so the render leads and the term
 * is a ring that empties.
 *
 * Cancelling stays inline and two-state. It is the one destructive action here
 * and it should cost one click plus a confirmation, not a disclosure first.
 */
export function SubscriptionsPage() {
  const subscriptions = useAppStore((s) => s.subscriptions);
  const mounted = useMounted();
  const [tab, setTab] = useState<"active" | "closed">("active");

  useDeclarePageScope({
    label: "Your device rentals",
    suggestions: [
      "When does my rental end?",
      "What am I paying each month?",
      "How do I return a device?",
    ],
  });

  const open = mounted ? subscriptions.filter((s) => s.status !== "Closed") : [];
  const closed = mounted ? subscriptions.filter((s) => s.status === "Closed") : [];
  const rows = tab === "active" ? open : closed;

  const monthly = open.reduce((n, s) => n + s.monthlyTotal, 0);
  const devices = open.reduce(
    (n, s) => n + s.items.reduce((m, i) => m + i.qty, 0),
    0,
  );

  return (
    <>
      <PageHead
        eyebrow="Device rental"
        title="Subscriptions"
        description="Month-to-month rental shipped to your site, for recurring or unpredictable transfers."
        action={
          <Link
            href={`${PATHS.hardware}?mode=subscribe`}
            className="btn-plasma inline-flex h-9 items-center gap-2 px-4 text-[12.5px] font-medium text-white"
          >
            <Plus className="size-3.5" />
            Subscribe
          </Link>
        }
      />

      <div className="mb-4 overflow-hidden rounded-lg ring-1 ring-inset ring-hair">
        <Facts
          cols={3}
          items={[
            { label: "On rental", value: open.length },
            { label: "Devices out", value: devices },
            {
              label: "Run rate",
              value: monthly ? `${fmtUSD(monthly)}/mo` : "At proposal",
            },
          ]}
        />
      </div>

      <div className="mb-4 flex gap-0.5">
        {(
          [
            ["active", "On rental", open.length],
            ["closed", "Returned", closed.length],
          ] as const
        ).map(([id, label, n]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11.5px] font-medium transition-colors",
              tab === id ? "bg-accent text-ink" : "text-ink-3 hover:text-ink",
            )}
          >
            {label}
            <span className="tabular-nums text-ink-3">{n}</span>
          </button>
        ))}
      </div>

      <motion.div
        variants={deckStagger(0.05, 0.03)}
        initial="hidden"
        animate="show"
        className="grid gap-3 lg:grid-cols-2"
      >
        {rows.map((s) => (
          <motion.div key={s.id} variants={bloomSoft}>
            <RentalCard sub={s} />
          </motion.div>
        ))}
      </motion.div>

      {mounted && !rows.length && (
        <div className="rounded-lg px-4 py-12 text-center ring-1 ring-inset ring-hair">
          <p className="text-[12.5px] text-ink-3">
            {tab === "active" ? "No devices on rental." : "Nothing returned yet."}
          </p>
          {tab === "active" && (
            <Link
              href={`${PATHS.hardware}?mode=subscribe`}
              className="mt-2 inline-block text-[12.5px] font-medium text-(--plasma) hover:underline"
            >
              Browse hardware
            </Link>
          )}
        </div>
      )}
    </>
  );
}

/**
 * Term dates.
 *
 * The fixtures store ISO `yyyy-MM-dd`; an earlier pass here assumed the
 * `dd MMM yy` the old list *rendered* and every ring came out empty with
 * "Term dates unavailable" under it. Parse the stored format, format for
 * display separately.
 */
function day(value: string): Date | null {
  const d = parseISO(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

const showDay = (value: string) => {
  const d = day(value);
  return d ? format(d, "dd MMM yy") : value;
};

/** 0‥1 of the term elapsed, or null if the dates make no sense. */
function elapsed(start: string, end: string): number | null {
  const s = day(start);
  const e = day(end);
  if (!s || !e) return null;
  const total = differenceInCalendarDays(e, s);
  if (total <= 0) return null;
  const gone = differenceInCalendarDays(new Date(), s);
  return Math.min(1, Math.max(0, gone / total));
}

function daysLeft(end: string): number | null {
  const e = day(end);
  return e ? differenceInCalendarDays(e, new Date()) : null;
}

function RentalCard({ sub }: { sub: DeviceSubscription }) {
  const cancelSubscription = useAppStore((s) => s.cancelSubscription);
  const [confirming, setConfirming] = useState(false);
  const live = sub.status !== "Closed";

  const used = useMemo(
    () => elapsed(sub.startDate, sub.endDate),
    [sub.startDate, sub.endDate],
  );
  const left = useMemo(() => daysLeft(sub.endDate), [sub.endDate]);

  return (
    <div className="overflow-hidden rounded-lg bg-elev ring-1 ring-inset ring-hair">
      <div className="flex items-center justify-between gap-3 border-b border-hair px-4 py-2.5">
        <span className="font-mono text-[11px] text-ink-3">{sub.id}</span>
        <Tag tone={live ? "ok" : "mute"}>{sub.status}</Tag>
      </div>

      {/* The devices themselves, one row each. */}
      <ul className="divide-y divide-hair">
        {sub.items.map((i) => {
          const p = getProduct(i.productSlug);
          return (
            <li key={`${i.productSlug}-${i.capacityTB}`} className="flex items-center gap-3 px-4 py-3">
              <span
                className={cn(
                  "relative size-14 shrink-0 overflow-hidden rounded-md ring-1 ring-inset ring-hair",
                  p ? productStage(p) : "bg-sunk",
                )}
              >
                {p && (
                  <Image
                    src={p.image}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-contain p-1.5"
                  />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium">
                  {p?.name ?? i.model}
                </p>
                <p className="mt-0.5 font-mono text-[10.5px] text-ink-3">
                  {i.qty}× {i.capacityTB ? `${i.capacityTB} TB` : i.model}
                  {i.monthlyRate
                    ? `, ${fmtUSD(i.monthlyRate)}/mo each`
                    : ", priced at proposal"}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Term as a ring — "how much is left" is a circular question. */}
      <div className="flex items-center gap-3.5 border-t border-hair px-4 py-3">
        <TermRing value={used ?? 0} size={44}>
          {used === null ? "N/A" : `${Math.round(used * 100)}%`}
        </TermRing>

        <div className="min-w-0 flex-1">
          <Label>Term</Label>
          <p className="mt-0.5 truncate font-mono text-[11.5px] tabular-nums text-ink-2">
            {showDay(sub.startDate)} → {showDay(sub.endDate)}
          </p>
          <p className="mt-0.5 text-[10.5px] text-ink-3">
            {left === null
              ? "Term dates unavailable"
              : left > 0
                ? `${left} day${left === 1 ? "" : "s"} remaining`
                : "Term complete, collection due"}
          </p>
        </div>

        {/* BRYCK and the Mini carry no list rate — they are quoted at
            proposal, so the fixture total is a real 0. Printing "$0" reads as
            free rather than as not-yet-priced. */}
        <div className="shrink-0 text-right">
          {sub.monthlyTotal > 0 ? (
            <>
              <p className="font-mono text-[14px] font-semibold tabular-nums">
                {fmtUSD(sub.monthlyTotal)}
              </p>
              <p className="text-[10px] text-ink-3">per month</p>
            </>
          ) : (
            <>
              <p className="text-[12px] font-medium">At proposal</p>
              <p className="text-[10px] text-ink-3">rate on quote</p>
            </>
          )}
        </div>
      </div>

      {live && (
        <div className="flex items-center justify-end gap-2 border-t border-hair bg-sunk/50 px-4 py-2">
          {confirming ? (
            <>
              <span className="mr-auto text-[11px] text-ink-3">
                Cancel this rental? We&apos;ll arrange collection.
              </span>
              <button
                type="button"
                onClick={() => {
                  cancelSubscription(sub.id);
                  setConfirming(false);
                  toast.success(`${sub.id} cancelled`, {
                    description: "Our team has been notified to arrange collection.",
                  });
                }}
                className="rounded-md px-2.5 py-1 text-[11px] font-medium text-destructive ring-1 ring-inset ring-[color-mix(in_oklab,var(--destructive)_35%,transparent)] transition-colors hover:bg-[color-mix(in_oklab,var(--destructive)_10%,transparent)]"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="px-1.5 text-[11px] text-ink-3 transition-colors hover:text-ink"
              >
                Keep
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="text-[11px] text-ink-3 transition-colors hover:text-destructive"
            >
              Cancel rental
            </button>
          )}
        </div>
      )}
    </div>
  );
}
