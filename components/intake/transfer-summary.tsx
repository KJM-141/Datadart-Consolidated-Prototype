"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, Copy, Lock, PencilLine } from "lucide-react";
import { toast } from "sonner";
import { EstimateCard } from "@/components/pricing/estimate-card";
import { fmtRange, type Estimate } from "@/lib/pricing";
import { formatHours } from "@/lib/sizer-engine";
import type { TransferFacts } from "@/lib/types";
import { cn } from "@/lib/utils";

interface Row {
  key: keyof TransferFacts | "estimate";
  label: string;
  value?: string;
  /** Hint shown in place of "—" while the slot is still open (per wireframe). */
  hint?: string;
  /** Estimate row is derived, not directly editable. */
  derived?: boolean;
}

/**
 * Live Transfer Summary panel (FR-1.3). Every fact extracted in chat renders
 * here within 500 ms with a highlight animation; filled rows are editable and
 * the edit is acknowledged back in the conversation.
 */
export function TransferSummary({
  facts,
  displayId,
  estimate,
  onEdit,
  onRequestProposal,
  className,
}: {
  facts: TransferFacts;
  displayId: string;
  estimate?: Estimate;
  onEdit: (key: keyof TransferFacts) => void;
  onRequestProposal: () => void;
  className?: string;
}) {
  const rows: Row[] = [
    {
      key: "sizeTB",
      label: "Data size",
      value: facts.sizeTB ? `${facts.sizeTB.toLocaleString()} TB` : undefined,
      hint: "How much are we moving?",
    },
    {
      key: "sourceLocation",
      label: "Source",
      value: facts.sourceLocation
        ? [facts.sourceType, facts.sourceLocation].filter(Boolean).join(" — ")
        : undefined,
      hint: "Where does the data live?",
    },
    {
      key: "destination",
      label: "Destination",
      value: facts.destination,
      hint: "Where should it land?",
    },
    // Derived estimate sits inline with the facts, per the wireframe.
    {
      key: "estimate",
      label: "Estimate (ballpark)",
      value:
        estimate && !estimate.recommendOnline
          ? `${fmtRange(estimate)} · ${formatHours(estimate.sizing.timeline.totalHours)}`
          : undefined,
      hint: "Appears once size, source and destination are known",
      derived: true,
    },
    {
      key: "serviceLevel",
      label: "Service level",
      value: facts.serviceLevel,
      hint: "White Glove or self-managed?",
    },
    { key: "timeline", label: "Timeline", value: facts.timeline },
    { key: "compliance", label: "Compliance needs", value: facts.compliance },
  ];

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.12em]">
          Transfer summary
        </p>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard?.writeText(displayId);
            toast.success("Reference copied", { description: displayId });
          }}
          className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold text-accent-foreground transition-opacity hover:opacity-80"
          title="Copy reference"
        >
          DRAFT · {displayId} <Copy className="size-2.5" />
        </button>
      </div>

      <div className="space-y-2">
        {rows.map((row) => {
          const filled = Boolean(row.value);
          const editable = filled && !row.derived;
          return (
            <motion.button
              key={row.key}
              type="button"
              disabled={!editable}
              onClick={() =>
                editable && onEdit(row.key as keyof TransferFacts)
              }
              layout
              className={cn(
                "group w-full rounded-lg border border-l-[3px] bg-card px-3 py-2 text-left transition-colors",
                filled ? "border-l-success" : "border-l-border",
                editable && "hover:bg-accent/40",
                row.derived && filled && "border-l-brand-purple",
              )}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                  {row.label}
                </span>
                {editable && (
                  <PencilLine className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                )}
              </span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={row.value ?? "empty"}
                  initial={filled ? { backgroundColor: "rgba(142,45,226,0.18)" } : false}
                  animate={{ backgroundColor: "rgba(142,45,226,0)" }}
                  transition={{ duration: 1.1 }}
                  className={cn(
                    "mt-0.5 block rounded text-[13px] font-semibold leading-snug",
                    !filled && "font-normal text-muted-foreground/55",
                    row.derived && filled && "text-gradient-brand font-bold",
                  )}
                >
                  {row.value ?? row.hint ?? "—"}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence>
        {estimate && !estimate.recommendOnline && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <EstimateCard estimate={estimate} compact showHeadline={false} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* FR-1.4 — reassurance that no secrets are wanted yet */}
      <p className="flex items-start gap-2 rounded-lg border border-dashed bg-card px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
        <Lock className="mt-0.5 size-3 shrink-0" />
        No bucket names or credentials needed now — those are collected securely
        after agreement.
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onRequestProposal}
          disabled={!estimate}
          className="btn-brand h-10 flex-1 rounded-full text-xs font-bold text-white disabled:pointer-events-none disabled:opacity-40"
        >
          Get detailed proposal
        </button>
        <button
          type="button"
          onClick={() => toast.success("We'll be in touch to book a call")}
          className="h-10 rounded-full border px-4 text-xs font-semibold transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Book a call
        </button>
      </div>

      {estimate && (
        <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Check className="size-3 text-success" />
          Estimate shown before any contact details are requested.
        </p>
      )}
    </div>
  );
}
