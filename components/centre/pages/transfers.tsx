"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { format, parseISO } from "date-fns";
import { ArrowUpRight, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Facts, PageHead, Tag } from "../kit";
import { RaiseOrder, RaiseOrderButton } from "../raise-order";
import { useDeclarePageScope } from "../page-context";
import { RouteLine } from "../route-line";
import { STAGE_BLURB, STAGES, stageIndex } from "@/lib/lifecycle";
import { PATHS } from "@/lib/nav";
import { fmtUSD } from "@/lib/pricing";
import { useAppStore, useMounted } from "@/lib/store";
import type { TransferOrder } from "@/lib/types";
import { bloomSoft, deckStagger } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

/**
 * ── Transfers ─────────────────────────────────────────────────────────────
 *
 * Journeys, drawn as journeys.
 *
 * The last version was a divided list — dense, tidy, and completely wrong for
 * what this page is about. A row of cells says "here are five records"; these
 * are five shipments crossing the world with your data on them, and the thing
 * you want at a glance is *where each one is*, not what fields it has.
 *
 * So each transfer gets a lane with the two endpoints named at its ends and the
 * consignment sitting somewhere along it. The stage, the payload and the money
 * hang off that line rather than the line being one column among many. Two up
 * on a wide screen, because a lane needs width to read as a distance.
 */
export function TransfersPage() {
  const orders = useAppStore((s) => s.orders);
  const mounted = useMounted();

  const [tab, setTab] = useState<"active" | "closed">("active");
  const [query, setQuery] = useState("");
  const [raising, setRaising] = useState(false);

  useDeclarePageScope({
    label: "Your transfers",
    suggestions: [
      "Where is my shipment right now?",
      "What's waiting on me?",
      "How much is outstanding?",
    ],
  });

  // Memoised so the arrays are referentially stable — `rows` depends on them,
  // and freshly-filtered arrays every render would recompute it every render.
  const { active, closed } = useMemo(() => {
    const list = mounted ? orders : [];
    return {
      active: list.filter((o) => !o.closed),
      closed: list.filter((o) => o.closed),
    };
  }, [orders, mounted]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = tab === "active" ? active : closed;
    if (!q) return base;
    return base.filter((o) =>
      `${o.displayId} ${o.source.label} ${o.destination.label} ${o.stage}`
        .toLowerCase()
        .includes(q),
    );
  }, [active, closed, tab, query]);

  const inMotion = active.reduce((n, o) => n + o.volumeTB, 0);
  const outstanding = active
    .flatMap((o) => o.payments)
    .filter((p) => p.status !== "paid")
    .reduce((n, p) => n + p.amount, 0);

  return (
    <>
      <PageHead
        eyebrow="One-time transfers"
        title="Transfers"
        description="Every transfer runs a ten-stage journey with an accountable owner at each handoff."
        action={<RaiseOrderButton onClick={() => setRaising(true)} />}
      />

      <div className="mb-4 overflow-hidden rounded-lg ring-1 ring-inset ring-hair">
        <Facts
          cols={3}
          items={[
            { label: "In flight", value: active.length },
            { label: "Under way", value: `${inMotion.toLocaleString()} TB` },
            {
              label: "Outstanding",
              value: outstanding ? fmtUSD(outstanding) : "Settled",
            },
          ]}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-0.5">
          {(
            [
              ["active", "In flight", active.length],
              ["closed", "Delivered", closed.length],
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

        <div className="relative ml-auto min-w-40 max-w-56 flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-3" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search lanes"
            aria-label="Search transfers"
            className="h-8 pl-8 pr-8 text-[12px]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-ink-3 transition-colors hover:text-ink"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      </div>

      <motion.div
        variants={deckStagger(0.05, 0.03)}
        initial="hidden"
        animate="show"
        className="grid gap-3 xl:grid-cols-2"
      >
        {rows.map((o) => (
          <motion.div key={o.displayId} variants={bloomSoft}>
            <JourneyCard order={o} />
          </motion.div>
        ))}
      </motion.div>

      {mounted && !rows.length && (
        <div className="rounded-lg px-4 py-12 text-center ring-1 ring-inset ring-hair">
          <p className="text-[12.5px] text-ink-3">
            {query
              ? "No lane matches that search."
              : tab === "active"
                ? "Nothing in flight."
                : "Nothing delivered yet."}
          </p>
          {!query && tab === "active" && (
            <button
              type="button"
              onClick={() => setRaising(true)}
              className="mt-2 text-[12.5px] font-medium text-(--plasma) hover:underline"
            >
              Raise your first order
            </button>
          )}
        </div>
      )}

      <RaiseOrder open={raising} onOpenChange={setRaising} />
    </>
  );
}

const MOVING = ["Data Load", "Shipment", "DT2 Upload"];

function JourneyCard({ order: o }: { order: TransferOrder }) {
  const at = stageIndex(o.stage);
  const progress = (at + 1) / STAGES.length;
  const live = !o.closed && MOVING.includes(o.stage);
  const due = o.payments.find((p) => p.status === "due");

  const raised = safeDate(o.createdAt);
  const lands = safeDate(o.moveBy);

  return (
    <Link
      href={PATHS.transfer(o.displayId)}
      className="group block overflow-hidden rounded-lg bg-elev ring-1 ring-inset ring-hair transition-colors hover:ring-[color-mix(in_oklab,var(--plasma)_38%,transparent)]"
    >
      <div className="flex items-center justify-between gap-3 border-b border-hair px-4 py-2.5">
        <span className="flex min-w-0 items-center gap-2">
          <span className="font-mono text-[11px] text-ink-3">{o.displayId}</span>
          {o.serviceLevel === "White Glove" && <Tag tone="info">White Glove</Tag>}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <Tag tone={o.closed ? "mute" : live ? "info" : "warn"}>{o.stage}</Tag>
          <ArrowUpRight className="size-3.5 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100" />
        </span>
      </div>

      {/* The lane. Endpoints named at the ends, consignment on the line. */}
      <div className="px-4 pb-1 pt-4">
        <div className="flex items-baseline justify-between gap-4">
          <span className="min-w-0 truncate text-[12.5px] font-medium">
            {o.source.label}
          </span>
          <span className="min-w-0 truncate text-right text-[12.5px] font-medium">
            {o.destination.label}
          </span>
        </div>

        <RouteLine progress={progress} live={live} className="mt-2.5" />

        <div className="mt-1.5 flex items-baseline justify-between gap-4">
          <span className="font-mono text-[10px] text-ink-3">{raised}</span>
          <span className="truncate text-[10.5px] text-ink-3">
            {o.stage === "Data Load"
              ? `${o.progress}% copied`
              : STAGE_BLURB[o.stage].split(";")[0].split(",")[0]}
          </span>
          <span className="font-mono text-[10px] text-ink-3">{lands}</span>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-px border-t border-hair bg-hair">
        <Cell k="Payload" v={`${o.volumeTB.toLocaleString()} TB`} />
        <Cell k="Stage" v={`${at + 1} of ${STAGES.length}`} />
        <Cell
          k={due ? "Due now" : "Value"}
          v={
            due
              ? fmtUSD(due.amount)
              : o.estimate
                ? fmtUSD(o.estimate.min)
                : "N/A"
          }
          tone={due ? "warn" : undefined}
        />
      </dl>
    </Link>
  );
}

function Cell({
  k,
  v,
  tone,
}: {
  k: string;
  v: string;
  tone?: "warn";
}) {
  return (
    <div className="bg-elev px-4 py-2.5">
      <dt className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ink-3">
        {k}
      </dt>
      <dd
        className={cn(
          "mt-1 truncate text-[12.5px] font-medium tabular-nums",
          tone === "warn" && "text-warning",
        )}
      >
        {v}
      </dd>
    </div>
  );
}

/** Fixture dates are ISO strings; a bad one should not take the page down. */
function safeDate(value: string): string {
  try {
    return format(parseISO(value), "dd MMM");
  } catch {
    return value;
  }
}
