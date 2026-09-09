"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft,
  Check,
  Copy,
  FileCheck2,
  Gauge,
  Lock,
  MapPin,
  Route as RouteIcon,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { RoutePanel } from "@/components/console/map-panel";
import { Block, Dot, Facts, Fold, Label, Note, Tag } from "../kit";
import { useDeclarePageScope } from "../page-context";
import { RouteLine } from "../route-line";
import { STAGE_BLURB, STAGES, stageIndex } from "@/lib/lifecycle";
import { PATHS } from "@/lib/nav";
import { fmtUSD } from "@/lib/pricing";
import { orderToRoute } from "@/lib/routes";
import { useAppStore, useMounted } from "@/lib/store";
import type { EndpointDetails } from "@/lib/types";
import { bloomSoft, deckStagger } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

/**
 * ── A transfer ────────────────────────────────────────────────────────────
 *
 * The page behind every journey card, in the same vocabulary as the card.
 *
 * The version this replaces opened with a 38px display number over a dotted
 * HUD overlay, an 86px gauge ring and a conic-orbiting avatar — a command
 * header for a record that is mostly dates and money. It was also the loudest
 * page in the console while being the one you reach by clicking the quietest
 * thing on it.
 *
 * Now it opens the way the card that linked here closed: the lane, then the
 * figures, then the evidence. Blocks throughout, so arriving here from
 * Transfers is a zoom rather than a scene change.
 */

const MOVING = ["Data Load", "Shipment", "DT2 Upload"];

export function OrderDetailPage({ displayId }: { displayId: string }) {
  const orders = useAppStore((s) => s.orders);
  const mounted = useMounted();

  // Declared before the early returns — hooks cannot be conditional, and the
  // assistant should know which transfer you meant even on the not-found page.
  useDeclarePageScope({
    label: `Transfer ${displayId}`,
    orderId: displayId,
    suggestions: [
      "Where is it right now?",
      "When does it land?",
      "What's outstanding on this?",
      "Which certificates are ready?",
    ],
  });

  if (!mounted) return null;

  const order = orders.find((o) => o.displayId === displayId);

  if (!order) {
    return (
      <div className="rounded-lg px-6 py-16 text-center ring-1 ring-inset ring-hair">
        <h1 className="text-[17px] font-semibold">Transfer not found</h1>
        <p className="mx-auto mt-2 max-w-md text-[12.5px] leading-relaxed text-ink-3">
          We couldn&apos;t find {displayId} on your account. It may have been
          closed, or it belongs to another workspace.
        </p>
        <Link
          href={PATHS.transfers}
          className="btn-plasma mt-5 inline-flex h-10 items-center px-5 text-[12.5px] font-medium text-white"
        >
          Back to transfers
        </Link>
      </div>
    );
  }

  const at = stageIndex(order.stage);
  const progress = (at + 1) / STAGES.length;
  const live = !order.closed && MOVING.includes(order.stage);
  const route = orderToRoute(order);
  const written = Math.round((order.volumeTB * order.progress) / 100);
  const due = order.payments.find((p) => p.status === "due");

  return (
    <>
      <Link
        href={PATHS.transfers}
        className="mb-4 inline-flex items-center gap-1.5 text-[12px] text-ink-3 transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" /> All transfers
      </Link>

      <motion.div
        variants={deckStagger(0.05, 0.035)}
        initial="hidden"
        animate="show"
        className="space-y-3"
      >
        {/* ── The lane ─────────────────────────────────────────────── */}
        <motion.div variants={bloomSoft}>
          <Block
            icon={RouteIcon}
            label={`Raised ${safeDate(order.createdAt)}`}
            action={
              <span className="flex items-center gap-2">
                {order.serviceLevel === "White Glove" && (
                  <Tag tone="info">White Glove</Tag>
                )}
                <Tag tone={order.closed ? "mute" : live ? "info" : "warn"}>
                  {order.closed ? "Closed" : order.stage}
                </Tag>
              </span>
            }
          >
            <div className="px-4 pb-4 pt-4">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-[20px] font-semibold leading-none">
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
                  className="grid size-6 place-items-center rounded-md text-ink-3 ring-1 ring-inset ring-hair transition-colors hover:text-ink"
                >
                  <Copy className="size-3" />
                </button>
              </div>

              <div className="mt-4 flex items-baseline justify-between gap-4">
                <span className="min-w-0 truncate text-[13px] font-medium">
                  {order.source.label}
                </span>
                <span className="min-w-0 truncate text-right text-[13px] font-medium">
                  {order.destination.label}
                </span>
              </div>
              <RouteLine progress={progress} live={live} className="mt-2.5" />
              <div className="mt-1.5 flex items-baseline justify-between gap-4">
                <span className="font-mono text-[10px] text-ink-3">
                  {safeDate(order.createdAt)}
                </span>
                <span className="font-mono text-[10px] text-ink-3">
                  {safeDate(order.moveBy)}
                </span>
              </div>
            </div>

            <Facts
              cols={4}
              items={[
                { label: "Payload", value: `${order.volumeTB.toLocaleString()} TB` },
                { label: "Stage", value: `${at + 1} of ${STAGES.length}`, sub: order.stage },
                {
                  label: due ? "Due now" : "Value",
                  value: due
                    ? fmtUSD(due.amount)
                    : order.estimate
                      ? fmtUSD(order.estimate.min)
                      : "N/A",
                },
                { label: "Service", value: order.serviceLevel },
              ]}
              className="border-t border-hair"
            />
          </Block>
        </motion.div>

        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
          <div className="space-y-3">
            {/* ── Where it is ───────────────────────────────────────── */}
            {route && (
              <motion.div variants={bloomSoft}>
                <Block
                  icon={MapPin}
                  label={order.stage === "Shipment" ? "In transit" : "Route"}
                  action={
                    live ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] text-ink-3">
                        <Dot tone="live" live /> Live
                      </span>
                    ) : undefined
                  }
                >
                  <div className="bg-sunk/40 px-2 py-2">
                    <RoutePanel routes={[route]} height={240} expandable={false} />
                  </div>
                </Block>
              </motion.div>
            )}

            {/* ── Lifecycle ─────────────────────────────────────────── */}
            <motion.div variants={bloomSoft}>
              <Block
                icon={Gauge}
                label="Lifecycle"
                action={
                  <span className="font-mono text-[10px] text-ink-3">
                    {at + 1}/{STAGES.length}
                  </span>
                }
              >
                <div className="flex flex-wrap gap-1.5 px-4 py-3">
                  {STAGES.map((s, i) => (
                    <span
                      key={s}
                      title={s}
                      className={cn(
                        "grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-[10.5px] font-medium ring-1 ring-inset",
                        i < at &&
                          "text-(--plasma) ring-[color-mix(in_oklab,var(--plasma)_35%,transparent)]",
                        i === at && "plasma-fill text-white ring-transparent",
                        i > at && "text-ink-3 ring-hair",
                      )}
                    >
                      {i < at ? <Check className="size-2.5" /> : i + 1}
                    </span>
                  ))}
                </div>

                <div className="border-t border-hair px-4 py-3.5">
                  <Label>Stage {at + 1}, {order.stage}</Label>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-ink-2">
                    {STAGE_BLURB[order.stage]}
                  </p>

                  {order.stage === "Data Load" && !order.closed && (
                    <div className="mt-3.5">
                      <div className="flex items-baseline justify-between">
                        <Label>Live copy progress</Label>
                        <span className="text-[13px] font-semibold tabular-nums">
                          {order.progress}%
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-sunk">
                        <motion.span
                          className="block h-full rounded-full plasma-fill"
                          initial={{ width: 0 }}
                          animate={{ width: `${order.progress}%` }}
                          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        />
                      </div>
                      <p className="mt-2 text-[11px] text-ink-3">
                        <span className="font-medium text-ink tabular-nums">
                          {written.toLocaleString()} TB
                        </span>{" "}
                        of {order.volumeTB.toLocaleString()} TB written, live from
                        the device
                      </p>
                    </div>
                  )}
                </div>

                <Fold label="Lifecycle log" count={order.stageHistory.length}>
                  <ol className="divide-y divide-hair">
                    {order.stageHistory.map((ev, i) => (
                      <li key={i} className="flex items-baseline gap-2.5 py-2">
                        <Dot tone="info" className="mt-1.5" />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[11.5px]">{ev.stage}</span>
                          <span className="font-mono text-[10px] text-ink-3">
                            {ev.at}, {ev.owner}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </Fold>

                <Note icon={ShieldCheck}>
                  Every transition names an accountable owner before it can start,
                  and the record is append-only.
                </Note>
              </Block>
            </motion.div>

            {/* ── Endpoints ─────────────────────────────────────────── */}
            <motion.div variants={bloomSoft} className="grid gap-3 sm:grid-cols-2">
              <Endpoint title="Source" endpoint={order.source} />
              <Endpoint title="Destination" endpoint={order.destination} />
            </motion.div>
          </div>

          <div className="space-y-3">
            {/* ── Documents ─────────────────────────────────────────── */}
            <motion.div variants={bloomSoft}>
              <Block
                icon={FileCheck2}
                label="Documents & certificates"
                action={
                  <span className="text-[10px] tabular-nums text-ink-3">
                    {order.documents.length}
                  </span>
                }
              >
                <ul className="divide-y divide-hair">
                  {order.documents.map((d) => (
                    <li
                      key={d.type}
                      className="flex items-center justify-between gap-3 px-4 py-2.5"
                    >
                      <span className="min-w-0 flex-1 truncate text-[12px] text-ink-2">
                        {d.type}
                      </span>
                      {d.status === "signed" ? (
                        <Tag tone="ok" icon={Check}>Signed</Tag>
                      ) : d.status === "available" ? (
                        <Tag tone="info">Ready</Tag>
                      ) : (
                        <Tag tone="mute" icon={Lock}>
                          at {d.availableAtStage}
                        </Tag>
                      )}
                    </li>
                  ))}
                </ul>
                <Note>
                  Downloadable the moment they exist, never emailed as
                  attachments.
                </Note>
              </Block>
            </motion.div>

            {/* ── Payments ──────────────────────────────────────────── */}
            <motion.div variants={bloomSoft}>
              <Block
                icon={Wallet}
                label="Payments"
                action={
                  <span className="text-[10px] tabular-nums text-ink-3">
                    {fmtUSD(order.payments.reduce((n, p) => n + p.amount, 0))}
                  </span>
                }
              >
                <ul className="divide-y divide-hair">
                  {order.payments.map((p) => (
                    <li key={p.label} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <Label>{p.label}</Label>
                        {p.status === "paid" ? (
                          <Tag tone="ok" icon={Check}>Settled</Tag>
                        ) : p.status === "due" ? (
                          <Tag tone="warn">Due</Tag>
                        ) : (
                          <Tag tone="mute" icon={Lock}>Locked</Tag>
                        )}
                      </div>
                      <p className="mt-1.5 text-[16px] font-semibold tabular-nums">
                        {fmtUSD(p.amount)}
                      </p>
                      {p.dueAtStage && p.status !== "paid" && (
                        <p className="mt-1 text-[11px] text-ink-3">
                          Falls due at {p.dueAtStage}.
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </Block>
            </motion.div>

            {/* ── Team ──────────────────────────────────────────────── */}
            <motion.div variants={bloomSoft}>
              <Block icon={Users} label="Your team">
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sunk text-[12px] font-semibold ring-1 ring-inset ring-hair">
                    {(order.projectManager ?? "DD")[0]}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-medium">
                      {order.projectManager ?? "DataDart Ops"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-3">
                      Accountable for this transfer
                    </p>
                  </div>
                </div>
              </Block>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

function Endpoint({
  title,
  endpoint,
}: {
  title: string;
  endpoint: EndpointDetails;
}) {
  const a = endpoint.location;
  const lines = [a.address, a.city, a.state, a.pincode, a.country].filter(Boolean);

  return (
    <Block icon={MapPin} label={title}>
      <div className="px-4 py-3.5">
        <p className="text-[13px] font-medium">{endpoint.label}</p>
        <p className="mt-0.5 text-[11px] text-ink-3">
          {endpoint.kind}
          {endpoint.cloudProvider ? `, ${endpoint.cloudProvider}` : ""}
        </p>

        {lines.length > 0 && (
          <p className="mt-2.5 text-[11.5px] leading-relaxed text-ink-2">
            {lines.join(", ")}
          </p>
        )}

        {endpoint.contact.name && (
          <div className="mt-2.5 border-t border-hair pt-2.5">
            <Label>Site contact</Label>
            <p className="mt-1 text-[11.5px]">{endpoint.contact.name}</p>
            <p className="font-mono text-[10.5px] text-ink-3">
              {endpoint.contact.email}
            </p>
          </div>
        )}

        {!lines.length && !endpoint.contact.name && (
          <p className="mt-2.5 text-[11.5px] leading-relaxed text-ink-3">
            Site address and contact are collected at Onboarding.
          </p>
        )}
      </div>
    </Block>
  );
}

/** Fixture dates are ISO; a bad one should not take the page down. */
function safeDate(value: string): string {
  const d = parseISO(value);
  return Number.isNaN(d.getTime()) ? value : format(d, "dd MMM yyyy");
}
