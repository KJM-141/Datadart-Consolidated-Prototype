"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { CalendarClock, Check, Package, Repeat } from "lucide-react";
import { toast } from "sonner";
import { fmtUSD, type Estimate } from "@/lib/pricing";
import { PATHS } from "@/lib/nav";
import { recommendPlan } from "@/lib/plan-recommendation";
import { useAppStore, useMounted } from "@/lib/store";
import type { Cadence, TransferFacts } from "@/lib/types";
import { EASE_ADV } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

const CADENCES: Cadence[] = ["One-off", "Monthly", "Quarterly", "Ongoing"];

/**
 * ── The subscription half of the intake panel ─────────────────────────────
 *
 * Not a suggestion that appears once the conversation happens to mention a
 * cadence. It is a standing destination beside the transfer summary that is
 * always answerable: pick how often the move repeats and the plan builds itself
 * out of the sizing already on screen.
 *
 * That distinction matters because the two are genuinely different products.
 * A one-off is an order; anything that repeats is a rental, and the rental is
 * the thing this panel exists to reach. Before it, the conversational pipeline
 * could only ever produce the former.
 *
 * The cadence buttons write back into the conversation rather than mutating
 * state behind its back, so the transcript and the panel never disagree about
 * what was decided.
 */
export function SubscriptionPanel({
  facts,
  estimate,
  onCadence,
  className,
}: {
  facts: TransferFacts;
  estimate?: Estimate;
  onCadence: (cadence: Cadence) => void;
  className?: string;
}) {
  const addToCart = useAppStore((s) => s.addToCart);
  const mounted = useMounted();

  const plan = estimate ? recommendPlan(estimate, facts.frequency) : null;
  const needed: [string, boolean][] = [
    ["Data size", Boolean(facts.sizeTB)],
    ["Source", Boolean(facts.sourceLocation)],
    ["Destination", Boolean(facts.destination)],
  ];

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <CadencePicker value={facts.frequency} onCadence={onCadence} />

      {!estimate ? (
        <Empty
          title="Waiting on the basics"
          body="A plan is priced off the same sizing as your estimate. Three answers and it builds itself:"
        >
          <ul className="mt-2.5 space-y-1.5">
            {needed.map(([label, done]) => (
              <li key={label} className="flex items-center gap-2 text-[12px]">
                <span
                  className={cn(
                    "grid size-3.5 shrink-0 place-items-center rounded-full",
                    done
                      ? "plasma-fill text-white"
                      : "bg-muted ring-1 ring-inset ring-border",
                  )}
                >
                  {done && <Check className="size-2" />}
                </span>
                <span className={done ? "text-foreground" : "text-muted-foreground"}>
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </Empty>
      ) : !facts.frequency ? (
        <Empty
          title="How often does this move repeat?"
          body="Pick a cadence above. If it runs more than once, renting the fleet costs less than shipping it back and forth each time."
        />
      ) : facts.frequency === "One-off" ? (
        <Empty
          title="A one-off needs no rental"
          body="You'll be quoted for a single move, the devices go back when the data lands. Change the cadence above if it turns out to repeat."
        />
      ) : plan ? (
        <Plan plan={plan} onAdd={addToCart} mounted={mounted} />
      ) : (
        <Empty
          title="Nothing to rent here"
          body="At this size you're faster over your own connection than waiting on a shipped device."
        />
      )}
    </div>
  );
}

/* ── Cadence ────────────────────────────────────────────────────────────── */

function CadencePicker({
  value,
  onCadence,
}: {
  value?: Cadence;
  onCadence: (c: Cadence) => void;
}) {
  return (
    <div>
      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
        How often
      </p>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {CADENCES.map((c) => {
          const active = value === c;
          return (
            <button
              key={c}
              type="button"
              onClick={() => onCadence(c)}
              aria-pressed={active}
              className={cn(
                "relative rounded-lg px-3 py-2 text-[12px] font-semibold transition-all",
                active
                  ? "bg-gradient-brand text-white shadow-brand-sm"
                  : "bg-card text-muted-foreground ring-1 ring-inset ring-border hover:text-foreground hover:ring-[color-mix(in_oklab,var(--plasma)_45%,transparent)]",
              )}
            >
              {c}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── The plan ───────────────────────────────────────────────────────────── */

function Plan({
  plan,
  onAdd,
  mounted,
}: {
  plan: NonNullable<ReturnType<typeof recommendPlan>>;
  onAdd: (item: (typeof plan.items)[number]) => void;
  mounted: boolean;
}) {
  const add = () => {
    plan.items.forEach(onAdd);
    toast.success("Plan added to your manifest", {
      description: `${plan.units} device${plan.units === 1 ? "" : "s"}, ${fmtUSD(
        plan.monthlyTotal,
      )}/month, ${plan.termMonths}-month term`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, ease: EASE_ADV }}
      className="overflow-hidden rounded-xl border bg-card"
    >
      <div className="flex items-center gap-2 border-b bg-muted/40 px-3.5 py-2.5">
        <Repeat className="size-3.5 shrink-0 text-(--plasma)" />
        <p className="text-[10px] font-bold uppercase tracking-[0.12em]">
          Your {plan.cadence.toLowerCase()} plan
        </p>
      </div>

      <div className="space-y-2.5 px-3.5 py-3">
        {plan.items.map((item) => (
          <div
            key={`${item.productSlug}-${item.capacityTB}`}
            className="flex items-center gap-2.5"
          >
            <span className="relative size-9 shrink-0 overflow-hidden rounded-md bg-muted ring-1 ring-inset ring-border">
              <Image
                src={item.image}
                alt=""
                fill
                sizes="36px"
                className="object-contain p-0.5"
              />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px] font-medium">
                {item.qty}× {item.model}
              </span>
              <span className="mt-0.5 block font-mono text-[10.5px] text-muted-foreground">
                {item.detail} each
              </span>
            </span>
            <span className="shrink-0 font-mono text-[11.5px] tabular-nums text-muted-foreground">
              {fmtUSD(item.monthlyRate * item.qty)}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-baseline justify-between gap-3 border-t px-3.5 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <CalendarClock className="size-3" />
          {plan.termMonths}-month term
        </span>
        <span className="text-[15px] font-bold tabular-nums text-gradient-brand">
          {fmtUSD(plan.monthlyTotal)}
          <span className="text-[11px] font-medium text-muted-foreground"> / month</span>
        </span>
      </div>

      <p className="border-t px-3.5 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
        {plan.rationale}
      </p>

      <div className="space-y-1.5 px-3.5 pb-3.5 pt-1">
        <button
          type="button"
          onClick={add}
          disabled={!mounted}
          className="btn-brand flex h-9 w-full items-center justify-center gap-1.5 rounded-full text-[12px] font-bold text-white disabled:pointer-events-none disabled:opacity-40"
        >
          <Package className="size-3.5" /> Add plan to cart
        </button>
        <Link
          href={PATHS.checkout}
          className="flex h-8 items-center justify-center rounded-full text-[11.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Review the manifest
        </Link>
      </div>
    </motion.div>
  );
}

function Empty({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed bg-card px-3.5 py-3">
      <p className="text-[12.5px] font-semibold">{title}</p>
      <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted-foreground">
        {body}
      </p>
      {children}
    </div>
  );
}
