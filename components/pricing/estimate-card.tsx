"use client";

import { motion } from "motion/react";
import { Boxes, Clock, Lock, Wifi } from "lucide-react";
import { fmtRange, type Estimate } from "@/lib/pricing";
import { formatHours, formatMultiplier } from "@/lib/sizer-engine";
import { cn } from "@/lib/utils";

/**
 * Ballpark estimate presentation (FR-2.1). Always a min–max range — never a
 * single number; single-number pricing is a proposal-stage artifact only.
 * Shared by the Sizer (WF-2) and the chat agent (WF-1).
 */
export function EstimateCard({
  estimate,
  compact = false,
  /** Hide the big range when the caller already shows it (e.g. the summary
   *  panel's inline estimate row) — keeps the card complementary, not a repeat. */
  showHeadline = true,
  className,
}: {
  estimate: Estimate;
  compact?: boolean;
  showHeadline?: boolean;
  className?: string;
}) {
  const t = estimate.sizing.timeline;
  const c = estimate.sizing.comparison;

  return (
    <div className={cn("rounded-2xl border bg-card p-4 sm:p-5", className)}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {showHeadline ? "Ballpark estimate" : "How the time is spent"}
      </p>
      {showHeadline && (
        <motion.p
          key={`${estimate.min}-${estimate.max}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-2xl font-extrabold tracking-tight text-gradient-brand sm:text-[1.75rem]"
        >
          {fmtRange(estimate)}
        </motion.p>
      )}
      <p className="mt-1 text-xs text-muted-foreground">
        ≈ ${estimate.perTBMin}–{estimate.perTBMax} / TB · door-to-door{" "}
        <span className="font-semibold text-foreground">
          {formatHours(t.totalHours)}
        </span>{" "}
        on {estimate.deviceLabel}
      </p>

      {/* journey rail — proportioned from the real engine timeline */}
      <div className="mt-3.5 flex h-1.5 gap-0.5 overflow-hidden rounded-full">
        {(
          [
            ["Ingress", t.ingressHours],
            ["Travel", t.travelHours],
            ["Egress", t.egressHours],
          ] as const
        ).map(([label, hrs]) => (
          <span
            key={label}
            className={cn(
              "h-full",
              label.toLowerCase() === t.bottleneck ? "bg-warning" : "bg-gradient-brand",
            )}
            style={{ flexGrow: Math.max(hrs, t.totalHours * 0.05) }}
            title={`${label}: ${formatHours(hrs)}`}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[9px] text-muted-foreground">
        <span>Ingress {formatHours(t.ingressHours)}</span>
        <span>Travel {formatHours(t.travelHours)}</span>
        <span>Egress {formatHours(t.egressHours)}</span>
      </div>

      {!compact && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Kpi
            icon={Clock}
            value={formatHours(c.dataDartHours)}
            label="with DataDart"
          />
          <Kpi
            icon={Wifi}
            value={formatHours(c.wireHours)}
            label={`over ${estimate.lineSpeedMbps} Mbps line`}
            dim
          />
          <Kpi icon={Boxes} value={estimate.deviceLabel} label="recommended fleet" />
          <Kpi
            icon={Lock}
            value={
              c.dataDartFaster ? `${formatMultiplier(c.speedup)} faster` : "AES-256"
            }
            label={c.dataDartFaster ? "vs your network" : "encrypted end-to-end"}
          />
        </div>
      )}

      <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
        Final pricing is confirmed in your proposal. A range is shown so there
        are no surprises later.
      </p>
    </div>
  );
}

function Kpi({
  icon: Icon,
  value,
  label,
  dim,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
  dim?: boolean;
}) {
  return (
    <div className={cn("rounded-xl border bg-card px-3 py-2.5", dim && "opacity-70")}>
      <Icon className="size-3.5 text-primary" />
      <p className="mt-1 text-sm font-bold leading-tight">{value}</p>
      <p className="text-[9px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
