"use client";

import { motion } from "motion/react";
import { LiveDot } from "@/components/advanced/kit/hud";
import { focusOrder } from "@/lib/centre";
import { STAGES, stageIndex } from "@/lib/lifecycle";
import { fmtUSD } from "@/lib/pricing";
import { needsYou } from "@/lib/rail-spec";
import { useAppStore } from "@/lib/store";
import { EASE_ADV } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

/**
 * ── The strip ─────────────────────────────────────────────────────────────
 *
 * Four figures across the head of the conversation.
 *
 * The left rail already carries the full readout, so the test for earning a
 * place here is narrow: it has to be something you would want to know *before*
 * deciding what to ask. That is the state of the one transfer in focus, how
 * much is moving, what you owe, and whether anything is blocked — nothing that
 * needs a second glance to interpret.
 *
 * `Needs you` is the only cell that changes colour, and only when the count is
 * non-zero. A strip where everything can go amber is a strip nobody reads.
 */
export function StatStrip({
  onOpenLens,
}: {
  onOpenLens: (
    id: "progress" | "payload" | "payments" | "attention" | "route",
  ) => void;
}) {
  const orders = useAppStore((s) => s.orders);
  const focus = focusOrder(orders);
  const live = orders.filter((o) => !o.closed);

  const inMotion = live
    .filter((o) => ["Data Load", "Shipment", "DT2 Upload"].includes(o.stage))
    .reduce((n, o) => n + o.volumeTB, 0);

  const outstanding = live
    .flatMap((o) => o.payments)
    .filter((p) => p.status !== "paid")
    .reduce((n, p) => n + p.amount, 0);

  const waiting = needsYou(orders).length;
  const at = focus ? stageIndex(focus.stage) : -1;

  // Distinct destinations, not just distinct labels — two lanes landing in the
  // same region are one place to look at on a map.
  const places = new Set(
    live.flatMap((o) => [o.source.label, o.destination.label]),
  ).size;

  const cells = [
    {
      id: "progress" as const,
      label: focus ? focus.displayId : "In focus",
      value: focus ? focus.stage : "N/A",
      sub: focus ? `Stage ${at + 1} of ${STAGES.length}` : "No active transfer",
      bar: focus ? (at + 1) / STAGES.length : undefined,
      live: Boolean(focus),
    },
    {
      // The one cell that opens a map. It leads the group after the focus
      // because "where is everything" is the question this console is for.
      id: "route" as const,
      label: "Live locations",
      value: live.length ? `${live.length} in flight` : "None",
      sub: places ? `${places} sites and regions` : "nothing on the map",
      live: live.length > 0,
    },
    {
      id: "payload" as const,
      label: "In motion",
      value: inMotion ? `${inMotion.toLocaleString()} TB` : "N/A",
      sub: `across ${live.length} transfer${live.length === 1 ? "" : "s"}`,
    },
    {
      id: "payments" as const,
      label: "Outstanding",
      value: outstanding ? fmtUSD(outstanding) : "Settled",
      sub: outstanding ? "billed at milestones" : "nothing owed",
    },
    {
      id: "attention" as const,
      label: "Needs you",
      value: waiting ? String(waiting) : "Clear",
      sub: waiting ? "open item" + (waiting === 1 ? "" : "s") : "nothing waiting",
      warn: waiting > 0,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_ADV }}
      className="grid shrink-0 grid-cols-2 gap-px border-b border-hair bg-hair sm:grid-cols-3 xl:grid-cols-5"
    >
      {cells.map((c) => (
        <button
          key={c.id}
          type="button"
          onClick={() => onOpenLens(c.id)}
          className="group bg-canvas px-3.5 py-2.5 text-left transition-colors hover:bg-sunk"
        >
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[9px] font-semibold uppercase tracking-[0.14em] text-ink-3">
              {c.label}
            </span>
            {c.live && <LiveDot />}
            {c.warn && <span className="size-1.5 shrink-0 rounded-full bg-warning" />}
          </span>
          <span
            className={cn(
              "mt-1 block truncate text-[13px] font-semibold tabular-nums",
              c.warn && "text-warning",
            )}
          >
            {c.value}
          </span>
          <span className="mt-0.5 block truncate text-[10px] text-ink-3">
            {c.sub}
          </span>
          {c.bar !== undefined && (
            <span className="mt-1.5 block h-[3px] w-full overflow-hidden rounded-full bg-sunk">
              <span
                className="block h-full rounded-full plasma-fill"
                style={{ width: `${Math.round(c.bar * 100)}%` }}
              />
            </span>
          )}
        </button>
      ))}
    </motion.div>
  );
}
