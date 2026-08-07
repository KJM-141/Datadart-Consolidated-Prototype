"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Ban,
  Building2,
  CheckCircle2,
  Cloud,
  Copy,
  Download,
  FileSignature,
  FileText,
  Headphones,
  Lock,
  MoveRight,
  Radar,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { formatAddressLine } from "@/components/shared/address-fields";
import { RoutePanel } from "@/components/console/map-panel";
import { HoloPanel, PanelHead } from "@/components/advanced/kit/holo-panel";
import {
  HudLabel,
  LiveDot,
  MetricRing,
  Pill,
  type Tone,
} from "@/components/advanced/kit/hud";
import { Counter } from "@/components/advanced/kit/text";
import {
  LifecyclePanel,
  StagePill,
} from "@/components/lifecycle/lifecycle-panel";
import { Spotlight } from "@/components/advanced/kit/interactions";
import { orderToRoute } from "@/lib/routes";
import { STAGE_BLURB, STAGES, stageIndex } from "@/lib/lifecycle";
import { fmtUSD } from "@/lib/pricing";
import { useAppStore, useMounted } from "@/lib/store";
import type { EndpointDetails } from "@/lib/types";
import { bloomSoft, deckStagger, EASE_ADV } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

/**
 * Order tracking, deck edition.
 *
 * Same data, same actions (agreement, help, cancel) and the same ten-stage
 * model as the Normal detail page. Presented as a mission readout: a sticky
 * command header, an ignition spine, a scanning route panel and vault-style
 * document rows.
 */
export function OrderDetailAdvanced({ displayId }: { displayId: string }) {
  const orders = useAppStore((s) => s.orders);
  const cancelOrder = useAppStore((s) => s.cancelOrder);
  const mounted = useMounted();

  const order = orders.find((o) => o.displayId === displayId);

  if (!mounted) return null;

  if (!order) {
    return (
      <HoloPanel brackets className="flex flex-col items-center px-6 py-20 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
          <FileText className="size-6" />
        </span>
        <h1 className="mt-5 text-xl font-semibold tracking-tight">
          Order not found
        </h1>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          We couldn&apos;t find {displayId} on your account. It may have been
          closed or belongs to another workspace.
        </p>
        <Link
          href="/customer/history"
          className="btn-plasma mt-6 inline-flex h-11 items-center px-6 text-[13px] font-medium"
        >
          Back to transfers
        </Link>
      </HoloPanel>
    );
  }

  const route = orderToRoute(order);
  const stageNo = stageIndex(order.stage) + 1;
  const written = Math.round((order.volumeTB * order.progress) / 100);

  return (
    <motion.div
      variants={deckStagger(0.05)}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      <motion.div variants={bloomSoft}>
        <Link
          href="/customer/history"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground coarse:min-h-11"
        >
          <ArrowLeft className="size-3.5" /> All transfers
        </Link>
      </motion.div>

      {/* ══ Command header ════════════════════════════════════════════ */}
      <HoloPanel
        live={!order.closed}
        className="overflow-hidden p-5 sm:p-6"
      >
        <span aria-hidden className="hud-dots absolute inset-0 opacity-[0.35]" />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <LiveDot tone={order.closed ? "muted" : "cyo"} />
              <HudLabel>
                Transfer order · raised{" "}
                {format(parseISO(order.createdAt), "dd MMM yyyy")}
              </HudLabel>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2.5">
              <h1 className="text-[2rem] font-semibold leading-none tracking-tight sm:text-[2.4rem]">
                {order.displayId}
              </h1>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(order.id);
                  toast.success("Internal reference copied");
                }}
                title="Copy internal reference"
                aria-label="Copy internal reference"
                className="grid size-7 place-items-center rounded-full text-muted-foreground ring-1 ring-inset ring-border transition-colors hover:bg-accent hover:text-accent-foreground coarse:size-11"
              >
                <Copy className="size-3" />
              </button>
              {/* Was a bare stage name. The pill carries the position too, so
                  the header answers "how far along" without the eye having to
                  find the spine below it. */}
              <StagePill order={order} />
              {order.serviceLevel === "White Glove" && (
                <Pill tone="rose">White Glove</Pill>
              )}
            </div>

            <p className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px]">
              <span className="font-semibold tabular-nums">
                {order.volumeTB.toLocaleString()} TB
              </span>
              <span className="text-muted-foreground/50">·</span>
              <span className="inline-flex items-center gap-2 font-medium">
                {order.source.label}
                <MoveRight className="size-3.5 text-(--plasma)" />
                {order.destination.label}
              </span>
            </p>
          </div>

          {/* actions + gauge */}
          <div className="flex items-center gap-5">
            <MetricRing
              id="order-gauge"
              value={stageNo / STAGES.length}
              size={86}
              stroke={6}
            >
              <span className="text-center">
                <span className="block text-xl font-semibold leading-none tabular-nums">
                  {stageNo}
                </span>
                <span className="mt-1 block text-[9px] font-medium text-muted-foreground">
                  of {STAGES.length}
                </span>
              </span>
            </MetricRing>

            <div className="flex flex-col gap-2">
              {!order.closed && stageIndex(order.stage) <= 2 && (
                <Link
                  href={`/customer/agreement/${order.displayId}`}
                  className="btn-plasma inline-flex h-10 items-center gap-2 px-5 text-[13px] font-medium"
                >
                  <FileSignature className="size-4" /> Agreement
                </Link>
              )}
              <button
                type="button"
                onClick={() =>
                  toast.success("Support notified", {
                    description: `${order.projectManager ?? "Your PM"} will reach out shortly.`,
                  })
                }
                className="btn-ghost-hud inline-flex h-10 items-center gap-2 px-5 text-[13px] font-medium"
              >
                <Headphones className="size-4" /> Get help
              </button>
              {!order.closed && (
                <button
                  type="button"
                  onClick={() => {
                    cancelOrder(order.displayId);
                    toast.success(`${order.displayId} cancelled`);
                  }}
                  className="btn-ghost-hud inline-flex h-10 items-center gap-2 px-5 text-[13px] font-medium text-destructive hover:shadow-[0_0_0_1px_color-mix(in_oklab,var(--destructive)_50%,transparent)]"
                >
                  <Ban className="size-4" /> Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </HoloPanel>

      {/*
        ══ Lifecycle ═══════════════════════════════════════════════════
        The ten stages as one object — position, the current stage in full, the
        next one named, and the audit trail folded underneath. It replaced a
        headline-plus-spine panel that showed where you were and nothing else,
        and it now also carries the custody log the right rail used to hold,
        since the rail is scoped to the overview.
      */}
      <LifecyclePanel order={order} showCustody={false} />

      {/* Live copy telemetry stays separate: it is a reading off the device,
          not a property of the lifecycle — and it only exists while the device
          is filling. */}
      {order.stage === "Data Load" && !order.closed && (
        <HoloPanel className="p-5 sm:p-6">
          <div className="overflow-hidden rounded-2xl bg-muted/40 p-4 ring-1 ring-inset ring-border">
            <div className="flex items-baseline justify-between">
              <HudLabel>BRYCK live copy progress</HudLabel>
              <p className="text-lg font-semibold tabular-nums">
                <Counter value={order.progress} suffix="%" />
              </p>
            </div>
            <div className="relative mt-2.5 h-3 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="relative h-full rounded-full plasma-fill"
                initial={{ width: 0 }}
                animate={{ width: `${order.progress}%` }}
                transition={{ duration: 1.2, ease: EASE_ADV }}
              >
                <motion.span
                  className="absolute inset-y-0 w-10 bg-white/55 blur-[6px]"
                  animate={{ x: ["-120%", "500%"] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
                />
              </motion.div>
            </div>
            <p className="mt-2.5 text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground tabular-nums">
                {written.toLocaleString()} TB
              </span>{" "}
              of {order.volumeTB.toLocaleString()} TB written · live from the
              device
            </p>
          </div>
        </HoloPanel>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* ── left ── */}
        <div className="space-y-4">
          {/* route */}
          <HoloPanel scan className="overflow-hidden p-0">
            <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-5">
              <div>
                <div className="flex items-center gap-2">
                  <Radar className="size-3.5 text-(--cyo)" />
                  <HudLabel>
                    {order.stage === "Shipment" ? "In transit" : "Route"}
                  </HudLabel>
                </div>
                {order.stage === "Shipment" && (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Sealed device en route to the DT2 transfer facility
                  </p>
                )}
              </div>
              {!order.closed && (
                <Pill tone="cyo" className="gap-1.5">
                  <LiveDot tone="cyo" /> tracking
                </Pill>
              )}
            </div>
            {route && (
              <div className="px-3 pb-3">
                <RoutePanel routes={[route]} height={330} />
              </div>
            )}
            <div className="flex items-center justify-between gap-2 border-t border-border/60 px-5 py-3 text-[12px]">
              <span className="truncate font-semibold">{order.source.label}</span>
              <MoveRight className="size-3.5 shrink-0 text-(--plasma)" />
              <span className="truncate text-right font-semibold">
                {order.destination.label}
              </span>
            </div>
            {order.stage === "Shipment" && (
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 border-t border-border/60 px-5 py-3">
                {[
                  ["Sealed", "26 Jul 09:12"],
                  ["Picked up", "26 Jul 15:40"],
                  ["Customs cleared", "27 Jul 03:05"],
                ].map(([label, when]) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"
                  >
                    <CheckCircle2 className="size-3 text-success" />
                    <span className="font-medium text-foreground/80">{label}</span>
                    {when}
                  </span>
                ))}
              </div>
            )}
          </HoloPanel>

          {/* endpoints */}
          <div className="grid gap-4 sm:grid-cols-2">
            <EndpointPod title="Source" endpoint={order.source} tone="plasma" />
            <EndpointPod title="Destination" endpoint={order.destination} tone="cyo" />
          </div>

          {/* lifecycle log */}
          <HoloPanel className="p-5">
            <PanelHead label="History" title="Lifecycle log" />
            <ol className="relative mt-4 space-y-4 pl-6">
              <span
                aria-hidden
                className="absolute bottom-2 left-[7px] top-2 w-px bg-border"
              />
              {order.stageHistory.map((ev, i) => (
                <motion.li
                  key={`${ev.stage}-${ev.at}`}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, ease: EASE_ADV, delay: 0.08 + i * 0.05 }}
                  className="relative"
                >
                  <span className="absolute -left-6 top-1 grid size-3.5 place-items-center rounded-full plasma-fill ring-4 ring-card">
                    <CheckCircle2 className="size-2.5 text-white" strokeWidth={3} />
                  </span>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-[13px] font-semibold">{ev.stage}</p>
                    <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground/70">
                      {format(parseISO(ev.at), "dd MMM yyyy · HH:mm")}
                    </p>
                  </div>
                  <p className="mt-0.5 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <UserRound className="size-3" /> {ev.owner}
                  </p>
                </motion.li>
              ))}
              {!order.closed && (
                <li className="relative">
                  <span className="absolute -left-6 top-1 grid size-3.5 place-items-center rounded-full bg-warning ring-4 ring-card">
                    <span className="size-1.5 rounded-full bg-[#12102a]" />
                  </span>
                  <p className="text-[13px] font-semibold text-warning">
                    {order.stage} — in progress
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {STAGE_BLURB[order.stage]}
                  </p>
                </li>
              )}
            </ol>
          </HoloPanel>
        </div>

        {/* ── right ── */}
        <div className="space-y-4">
          {/* documents vault */}
          <HoloPanel className="p-5">
            <PanelHead
              label="Documents"
              title="Documents & certificates"
              hint="Downloadable the moment they exist — never emailed as attachments."
            />
            <ul className="mt-4 space-y-1.5">
              {order.documents.map((doc, i) => {
                const locked = doc.status === "pending";
                return (
                  <motion.li
                    key={doc.type}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: EASE_ADV, delay: 0.06 * i }}
                  >
                    <Spotlight size={220} className="rounded-xl">
                      <div
                        className={cn(
                          "relative flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 ring-1 ring-inset transition-colors",
                          locked
                            ? "bg-muted/30 ring-border/50"
                            : "bg-muted/50 ring-border hover:ring-[color-mix(in_oklab,var(--plasma)_35%,transparent)]",
                        )}
                      >
                        <span className="flex min-w-0 items-center gap-2.5">
                          <span
                            className={cn(
                              "grid size-8 shrink-0 place-items-center rounded-lg",
                              locked
                                ? "bg-muted text-muted-foreground/50"
                                : "bg-[color-mix(in_oklab,var(--plasma)_16%,transparent)] text-(--plasma)",
                            )}
                          >
                            <FileText className="size-3.5" />
                          </span>
                          <span className="min-w-0">
                            <span
                              className={cn(
                                "block truncate text-[13px]",
                                locked
                                  ? "text-muted-foreground"
                                  : "font-semibold",
                              )}
                            >
                              {doc.type}
                            </span>
                            {locked && doc.availableAtStage && (
                              <span className="block text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">
                                unlocks at {doc.availableAtStage}
                              </span>
                            )}
                          </span>
                        </span>
                        {locked ? (
                          <Lock className="size-3.5 shrink-0 text-muted-foreground/50" />
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              toast.success(`${doc.type} downloaded`, {
                                description: order.displayId,
                              })
                            }
                            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[color-mix(in_oklab,var(--plasma)_16%,transparent)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-(--plasma) transition-opacity hover:opacity-75 coarse:px-3.5 coarse:py-3"
                          >
                            {doc.status === "signed" && (
                              <CheckCircle2 className="size-2.5" />
                            )}
                            <Download className="size-2.5" />
                            {doc.status === "signed" ? "Signed" : "Get"}
                          </button>
                        )}
                      </div>
                    </Spotlight>
                  </motion.li>
                );
              })}
            </ul>
          </HoloPanel>

          {/* ledger */}
          <HoloPanel className="p-5">
            <PanelHead label="Billing" title="Payments" />
            <ul className="mt-4 space-y-2.5">
              {order.payments.map((p) => (
                <li
                  key={p.label}
                  className="flex items-center justify-between gap-3 border-b border-border/50 pb-2.5 last:border-0 last:pb-0"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium">
                      {p.label}
                    </span>
                    <span className="mt-0.5 block text-[15px] font-semibold tabular-nums">
                      {fmtUSD(p.amount)}
                    </span>
                  </span>
                  <Pill
                    tone={
                      p.status === "paid"
                        ? "success"
                        : p.status === "due"
                          ? "warning"
                          : "muted"
                    }
                  >
                    {p.status === "scheduled" && p.dueAtStage
                      ? `Due at ${p.dueAtStage}`
                      : p.status}
                  </Pill>
                </li>
              ))}
            </ul>
            {order.estimate && (
              <p className="mt-4 border-t border-border/60 pt-3 text-[11px] leading-relaxed text-muted-foreground">
                Quoted {fmtUSD(order.estimate.min)}–{fmtUSD(order.estimate.max)}{" "}
                (rate card {order.estimate.ratesVersion})
                {order.contractValue && (
                  <>
                    {" · contracted "}
                    <span className="font-semibold text-foreground">
                      {fmtUSD(order.contractValue)}
                    </span>
                  </>
                )}
              </p>
            )}
          </HoloPanel>

          {/* team */}
          <HoloPanel className="p-5">
            <PanelHead label="Contacts" title="Your team" />
            <div className="mt-4 flex items-center gap-3">
              <span className="relative grid size-11 shrink-0 place-items-center rounded-full">
                <span className="adv-orbit absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent,var(--plasma),var(--cyo),transparent)]" />
                <span className="absolute inset-[2px] grid place-items-center rounded-full bg-card text-sm font-bold">
                  {(order.projectManager ?? "DD")[0]}
                </span>
              </span>
              <span>
                <span className="block text-[13px] font-semibold">
                  {order.projectManager ?? "DataDart Ops"}
                </span>
                <span className="block text-[13px] font-medium text-muted-foreground">
                  Project manager
                </span>
              </span>
            </div>

            {order.complianceFlags && order.complianceFlags.length > 0 && (
              <div className="mt-5 border-t border-border/60 pt-3.5">
                <HudLabel className="flex items-center gap-1.5">
                  <ShieldCheck className="size-3" /> Compliance
                </HudLabel>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {order.complianceFlags.map((f) => (
                    <Pill key={f} tone="ion">
                      {f}
                    </Pill>
                  ))}
                </div>
              </div>
            )}
          </HoloPanel>
        </div>
      </div>
    </motion.div>
  );
}

function EndpointPod({
  title,
  endpoint,
  tone,
}: {
  title: string;
  endpoint: EndpointDetails;
  tone: Tone;
}) {
  const Icon = endpoint.kind === "Public cloud" ? Cloud : Building2;
  const accent = tone === "cyo" ? "var(--cyo)" : "var(--plasma)";

  return (
    <HoloPanel className="p-4">
      <HudLabel>{title}</HudLabel>
      <div className="mt-3 flex items-start gap-3">
        <span
          className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl ring-1 ring-inset"
          style={{
            color: accent,
            background: `color-mix(in oklab, ${accent} 14%, transparent)`,
            borderColor: "transparent",
            boxShadow: `inset 0 0 0 1px color-mix(in oklab, ${accent} 32%, transparent)`,
          }}
        >
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 space-y-1 text-[12.5px]">
          <p className="font-semibold leading-tight">
            {endpoint.kind}
            {endpoint.cloudProvider && ` · ${endpoint.cloudProvider}`}
          </p>
          <p className="leading-snug text-muted-foreground">
            {formatAddressLine(endpoint.location)}
          </p>
          <p className="inline-flex items-center gap-1.5 text-muted-foreground">
            <UserRound className="size-3" /> {endpoint.contact.name}
          </p>
        </div>
      </div>
    </HoloPanel>
  );
}
