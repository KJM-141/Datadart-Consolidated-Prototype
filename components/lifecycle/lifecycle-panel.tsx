"use client";

import { motion } from "motion/react";
import { Check, Gauge, ShieldCheck } from "lucide-react";
import { Block, Dot, Facts, Fold, Label, Note, Tag } from "./block-kit";
import { STAGE_BLURB, STAGES, stageIndex } from "@/lib/lifecycle";
import type { TransferOrder } from "@/lib/types";
import { EASE_ADV } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

/**
 * ── The lifecycle, as one object ──────────────────────────────────────────
 *
 * Every transfer runs the same ten stages, and until now that fact was spread
 * across four places that each knew a slice of it: a segmented bar on the
 * dashboard, a bullet list in the rail, a stage history on the detail page and
 * a `Pill` with the stage name in half a dozen headers. None of them told you
 * where you were, what happens next, and who signed off — which is the whole
 * question.
 *
 * This is that question answered once, in the flat block vocabulary: three
 * figures, the ten as a selector spine, the current stage in full, the next one
 * named, and the audit trail folded away underneath.
 *
 * Adapted from the DataDart reference build's lifecycle lens.
 */
export function LifecyclePanel({
  order,
  showCustody = true,
  className,
}: {
  order: TransferOrder;
  /** Drop the custody fold where the surrounding page already prints the log
   *  in full — the transfer detail does, and two of it is one too many. */
  showCustody?: boolean;
  className?: string;
}) {
  const at = stageIndex(order.stage);
  const next = STAGES[at + 1];
  const signedOff = order.stageHistory.length;

  return (
    <Block
      icon={Gauge}
      label="Lifecycle"
      className={className}
      action={
        <span className="inline-flex items-center gap-2">
          <span className="font-mono text-[10px] text-ink-3">
            {order.displayId}
          </span>
          <span className="hidden text-[10px] font-semibold tabular-nums text-(--plasma) sm:inline">
            {Math.round(((at + 1) / STAGES.length) * 100)}%
          </span>
        </span>
      }
    >
      <Facts
        cols={3}
        items={[
          {
            label: "Stage",
            value: `${at + 1} of ${STAGES.length}`,
            sub: order.stage,
          },
          { label: "Volume", value: `${order.volumeTB.toLocaleString()} TB` },
          {
            label: "Signed off",
            value: signedOff,
            sub: "audited transitions",
          },
        ]}
      />

      {/*
        The ten, as a track rather than a row of loose pills.

        A rule runs behind the nodes and is filled to the current one, so the
        distance travelled is a length you can see rather than a count you have
        to do. Each node keeps its stage name as a title and for screen readers.
      */}
      <div className="relative border-t border-hair px-4 py-4">
        <ol className="relative flex items-center justify-between gap-1">
          <span
            aria-hidden
            className="absolute inset-x-3 top-1/2 h-px -translate-y-1/2 bg-hair"
          />
          <motion.span
            aria-hidden
            className="absolute left-3 top-1/2 h-px -translate-y-1/2 plasma-fill"
            initial={{ width: 0 }}
            animate={{
              width: `calc((100% - 1.5rem) * ${at / (STAGES.length - 1)})`,
            }}
            transition={{ duration: 0.8, ease: EASE_ADV }}
          />

          {STAGES.map((s, i) => (
            <li
              key={s}
              title={s}
              aria-current={i === at ? "step" : undefined}
              className={cn(
                "relative grid size-7 place-items-center rounded-full text-[10.5px] font-medium ring-1 ring-inset transition-colors",
                i < at &&
                  "bg-elev text-(--plasma) ring-[color-mix(in_oklab,var(--plasma)_45%,transparent)]",
                i === at &&
                  "plasma-fill text-white ring-transparent shadow-[0_0_0_4px_color-mix(in_oklab,var(--plasma)_14%,transparent)]",
                i > at && "bg-elev text-ink-3 ring-hair",
              )}
            >
              {i < at ? <Check className="size-3" /> : i + 1}
              <span className="sr-only">{s}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* The stage you are on, given the weight of a headline and a plasma
          margin rule so the eye lands here first. */}
      <div className="relative border-t border-hair px-4 py-4">
        <span
          aria-hidden
          className="absolute inset-y-4 left-0 w-0.5 rounded-r-full plasma-fill"
        />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Label>
              Stage {at + 1} of {STAGES.length}
            </Label>
            <h3 className="mt-1.5 text-[17px] font-semibold tracking-tight">
              {order.stage}
            </h3>
          </div>
          {order.closed ? (
            <Tag tone="mute">Closed</Tag>
          ) : (
            <Tag tone="info">
              <Dot tone="live" live /> In progress
            </Tag>
          )}
        </div>
        <p className="mt-2.5 max-w-prose text-[12.5px] leading-relaxed text-ink-2">
          {STAGE_BLURB[order.stage]}
        </p>

        {order.stage === "Data Load" && (
          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <Label>Copy progress</Label>
              <span className="text-[12px] font-semibold tabular-nums">
                {order.progress}%
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sunk">
              <motion.span
                className="block h-full rounded-full plasma-fill"
                initial={{ width: 0 }}
                animate={{ width: `${order.progress}%` }}
                transition={{ duration: 0.9, ease: EASE_ADV }}
              />
            </div>
          </div>
        )}
      </div>

      {next && !order.closed && (
        <div className="flex items-start gap-3 border-t border-hair bg-sunk/40 px-4 py-3.5">
          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-elev text-[10.5px] font-medium text-ink-3 ring-1 ring-inset ring-hair">
            {at + 2}
          </span>
          <div className="min-w-0">
            <Label>Next up</Label>
            <p className="mt-1 text-[12.5px] font-medium">{next}</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-ink-3">
              {STAGE_BLURB[next]}
            </p>
          </div>
        </div>
      )}

      {showCustody && (
      <Fold label="Chain of custody" count={signedOff}>
        {signedOff ? (
          <ol className="divide-y divide-hair">
            {order.stageHistory.map((e, i) => (
              <li key={i} className="flex items-baseline gap-2.5 py-2">
                <Dot tone="info" className="mt-1.5" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[11.5px]">{e.stage}</span>
                  <span className="font-mono text-[10px] text-ink-3">
                    {e.at.slice(0, 10)} · {e.owner}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="py-2 text-[11.5px] text-ink-3">
            No transitions recorded yet.
          </p>
        )}
      </Fold>
      )}

      <Note icon={ShieldCheck}>
        Every transition names an accountable owner before it can start, and the
        record is append-only.
      </Note>
    </Block>
  );
}

/**
 * The lifecycle at a glance — "Stage 6/10 · Shipment".
 *
 * The compact form for headers and table rows, where the full block would be
 * three times the height of the thing it is annotating. A live dot only when
 * the transfer is actually moving.
 */
export function StagePill({
  order,
  className,
}: {
  order: Pick<TransferOrder, "stage" | "closed">;
  className?: string;
}) {
  const at = stageIndex(order.stage);
  const moving =
    !order.closed &&
    (["Data Load", "Shipment", "DT2 Upload"] as const).includes(
      order.stage as "Data Load" | "Shipment" | "DT2 Upload",
    );

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset",
        order.closed
          ? "text-ink-3 ring-hair"
          : "text-ink-2 ring-[color-mix(in_oklab,var(--plasma)_28%,transparent)]",
        className,
      )}
    >
      <Dot tone={order.closed ? "mute" : moving ? "live" : "info"} live={moving} />
      <span className="tabular-nums">
        Stage {at + 1}/{STAGES.length}
      </span>
      <span aria-hidden className="text-ink-3">
        ·
      </span>
      <span>{order.stage}</span>
    </span>
  );
}
