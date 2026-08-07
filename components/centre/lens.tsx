"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpRight,
  Bell,
  Boxes,
  Check,
  Clock,
  FileCheck2,
  Gauge,
  Lock,
  Maximize2,
  Minimize2,
  Route as RouteIcon,
  ShieldCheck,
  Wallet,
  X,
} from "lucide-react";
import { RoutePanel } from "@/components/console/map-panel";
import { Block, Dot, Facts, Fold, Label, Note, Tag } from "./kit";
import { focusOrder, LENS_TITLE, type LensId } from "@/lib/centre";
import { STAGE_BLURB, STAGES, stageIndex } from "@/lib/lifecycle";
import { PATHS } from "@/lib/nav";
import { fmtUSD } from "@/lib/pricing";
import { needsYou } from "@/lib/rail-spec";
import { ordersToRoutes } from "@/lib/routes";
import { useAppStore } from "@/lib/store";
import type { TransferOrder } from "@/lib/types";
import { EASE_ADV } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

/**
 * ── The lens ──────────────────────────────────────────────────────────────
 *
 * The working behind a signal, opened over the workspace column rather than
 * navigated to. A route change unmounts the conversation, and the conversation
 * is the product.
 *
 * Structured on the reference's block vocabulary: each lens is one or more
 * `Block`s whose header carries the summary figure, whose body opens with a
 * `Facts` grid, and whose reference detail is folded. What that buys is that
 * every lens is scannable in the same two seconds — you learn the shape once.
 *
 * The map and the motion are this build's, unchanged. `RoutePanel` is the flat
 * projection that replaced the globe, and the panel still slides on `EASE_ADV`.
 *
 * **It opens from the left**, hard against the rail the signal was clicked in,
 * and offset past that rail on `xl` so the readout stays visible and you can
 * step through signals without closing anything. Sliding in from the right put
 * the answer at the opposite edge from the question, which meant a saccade
 * across the whole screen on every click.
 *
 * `FULL_SCREEN` lenses skip the panel entirely. A world map and a fleet
 * breakdown in a 34rem column is a map you cannot read; the shipment view takes
 * the whole frame. The rest can be promoted to full screen with the toggle, and
 * the choice is remembered for as long as the lens is open.
 */
const FULL_SCREEN: Partial<Record<LensId, true>> = { route: true };

export function Lens({
  id,
  onClose,
}: {
  id: LensId | null;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  // Each lens opens at its own natural size, so the toggle never carries over
  // from a map to a payments list.
  useEffect(() => setExpanded(false), [id]);

  const alwaysFull = id ? Boolean(FULL_SCREEN[id]) : false;
  const full = alwaysFull || expanded;

  return (
    <AnimatePresence>
      {id && (
        <>
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[55] bg-canvas/55 backdrop-blur-[2px]"
          />
          <motion.aside
            key="lens"
            role="dialog"
            aria-label={LENS_TITLE[id]}
            initial={{ opacity: 0, x: full ? 0 : -24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: full ? 0 : -24 }}
            transition={{ duration: 0.28, ease: EASE_ADV }}
            className={cn(
              // Fixed to the viewport, not to the content region: the panel
              // starts at the extreme left edge of the screen and covers the
              // sidebar. Anchoring it inside the content column made it open
              // from a seam partway across the screen, which reads as a third
              // column rather than as something surfacing over the app.
              "fixed inset-y-0 z-[56] flex flex-col bg-canvas",
              full
                ? "inset-x-0"
                : "left-0 w-full max-w-[34rem] border-r border-hair shadow-[var(--shadow-lift)]",
            )}
          >
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-hair px-4 py-3">
              <h2 className="text-[13px] font-semibold">{LENS_TITLE[id]}</h2>

              <div className="flex items-center gap-1">
                {!alwaysFull && (
                  <button
                    type="button"
                    onClick={() => setExpanded((v) => !v)}
                    aria-label={expanded ? "Collapse" : "Expand"}
                    className="grid size-7 place-items-center rounded-md text-ink-3 transition-colors hover:bg-accent hover:text-ink"
                  >
                    {expanded ? (
                      <Minimize2 className="size-3.5" />
                    ) : (
                      <Maximize2 className="size-3.5" />
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="grid size-7 place-items-center rounded-md text-ink-3 transition-colors hover:bg-accent hover:text-ink"
                >
                  <X className="size-4" />
                </button>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div
                className={cn(
                  "space-y-3",
                  full ? "mx-auto w-full max-w-7xl px-6 py-6" : "px-4 py-4",
                )}
              >
                <Body id={id} full={full} />
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Body({ id, full }: { id: LensId; full: boolean }) {
  switch (id) {
    case "attention":
      return <Attention />;
    case "route":
      return <Lanes full={full} />;
    case "progress":
      return <Progress />;
    case "payload":
      return <Payload />;
    case "documents":
      return <Documents />;
    case "payments":
      return <Payments />;
    case "renewals":
      return <Renewals />;
  }
}

/* ══════════════════════════════ Attention ════════════════════════════════ */

function Attention() {
  const orders = useAppStore((s) => s.orders);
  const items = needsYou(orders);
  const blocking = items.filter((a) => a.blocking);

  return (
    <Block
      icon={Bell}
      label="Needs you"
      action={
        <span className="text-[10px] tabular-nums text-ink-3">
          {items.length} open
        </span>
      }
    >
      <Facts
        cols={2}
        items={[
          { label: "Blocking", value: blocking.length, sub: "Holds a transfer" },
          {
            label: "For information",
            value: items.length - blocking.length,
            sub: "Ready when you are",
          },
        ]}
      />

      {items.length === 0 ? (
        <div className="flex gap-2.5 border-t border-hair px-4 py-4">
          <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklab,var(--success)_16%,transparent)]">
            <Check className="size-2.5 text-success" />
          </span>
          <div>
            <p className="text-[12px] font-medium">Nothing</p>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-3">
              Every open transfer is signed, settled to its current stage and
              moving.
            </p>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-hair border-t border-hair">
          {items.map((a) => (
            <li key={a.id}>
              <Link
                href={a.href}
                className="group flex items-start gap-2.5 px-4 py-3 transition-colors hover:bg-sunk"
              >
                <Dot tone={a.blocking ? "warn" : "mute"} className="mt-[7px]" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] leading-snug">{a.title}</span>
                  <span className="mt-0.5 block font-mono text-[10.5px] text-ink-3">
                    {a.displayId}
                  </span>
                </span>
                <ArrowUpRight className="mt-0.5 size-3 shrink-0 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Block>
  );
}

/* ═════════════════════════════════ Lanes ═════════════════════════════════ */

/**
 * The shipment view. Full screen by default — see `FULL_SCREEN`.
 *
 * At full width the map and the manifest sit side by side, which is the whole
 * point of promoting it: you can follow a lane on the map and read its stage
 * on the same screen. Narrow, they stack and the map halves in height.
 */
function Lanes({ full }: { full: boolean }) {
  const orders = useAppStore((s) => s.orders);
  const live = orders.filter((o) => !o.closed);
  const routes = ordersToRoutes(live).slice(0, 6);
  const tb = live.reduce((n, o) => n + o.volumeTB, 0);

  const manifest = (
    <Block
      icon={Boxes}
      label="Manifest"
      action={
        <span className="text-[10px] tabular-nums text-ink-3">
          {live.length} in flight
        </span>
      }
    >
      <Facts
        cols={3}
        items={[
          { label: "Active", value: live.length },
          { label: "Under way", value: `${tb.toLocaleString()} TB` },
          {
            label: "Destinations",
            value: new Set(live.map((o) => o.destination.label)).size,
          },
        ]}
      />
      <ul className="divide-y divide-hair border-t border-hair">
        {live.map((o) => (
          <li key={o.displayId}>
            <Link
              href={PATHS.transfer(o.displayId)}
              className="group block px-4 py-3 transition-colors hover:bg-sunk"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-[10.5px] text-ink-3">
                  {o.displayId}
                </span>
                <span className="font-mono text-[11px] tabular-nums">
                  {o.volumeTB.toLocaleString()} TB
                </span>
              </div>
              <p className="mt-0.5 truncate text-[12px] text-ink-2 transition-colors group-hover:text-ink">
                {o.source.label} → {o.destination.label}
              </p>
              <div className="mt-1.5 flex items-center justify-between gap-3">
                <span className="text-[10.5px] text-ink-3">{o.stage}</span>
                <span className="text-[10.5px] tabular-nums text-ink-3">
                  {stageIndex(o.stage) + 1}/{STAGES.length}
                </span>
              </div>
              <StageRule order={o} className="mt-1.5" />

              {/* Spelled out rather than left to the row being clickable —
                  on a full-screen map the manifest reads as a legend, and a
                  legend does not look like it goes anywhere. */}
              <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-(--plasma) opacity-0 transition-opacity group-hover:opacity-100">
                Open transfer <ArrowUpRight className="size-3" />
              </span>
            </Link>
          </li>
        ))}
        {!live.length && <Empty>No lanes are active.</Empty>}
      </ul>
    </Block>
  );

  const atlas = (
    <Block
      icon={RouteIcon}
      label="Live lanes"
      action={
        <span className="inline-flex items-center gap-1.5 text-[10px] text-ink-3">
          <Dot tone="live" live />
          Updated just now
        </span>
      }
    >
      {/* This build's flat projection, not the reference's globe — it shows
          every lane at once, which is the question this view answers.
          `RoutePanel` *reserves* its height and letterboxes the projection
          inside, so the figure has to be near the map's natural height at this
          width — 520 left 150px of dead panel above and below it. */}
      <div className="bg-sunk/40 px-2 py-2">
        <RoutePanel routes={routes} height={full ? 380 : 210} expandable={false} />
      </div>
    </Block>
  );

  if (!full) {
    return (
      <>
        {atlas}
        {manifest}
      </>
    );
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_24rem]">
      {atlas}
      <div>{manifest}</div>
    </div>
  );
}

/* ═══════════════════════════════ Progress ════════════════════════════════ */

function Progress() {
  const orders = useAppStore((s) => s.orders);
  const focus = focusOrder(orders);

  if (!focus) {
    return (
      <Block icon={Gauge} label="Lifecycle">
        <Empty>No transfer is in progress.</Empty>
      </Block>
    );
  }

  const at = stageIndex(focus.stage);
  const next = STAGES[at + 1];
  const done = focus.stageHistory.length;

  return (
    <Block
      icon={Gauge}
      label="Lifecycle"
      action={
        <span className="font-mono text-[10px] text-ink-3">{focus.displayId}</span>
      }
    >
      <Facts
        cols={3}
        items={[
          { label: "Stage", value: `${at + 1} of ${STAGES.length}`, sub: focus.stage },
          { label: "Volume", value: `${focus.volumeTB.toLocaleString()} TB` },
          { label: "Signed off", value: done, sub: "audited transitions" },
        ]}
      />

      {/* The ten, as a compact selector-style spine. */}
      <div className="flex flex-wrap gap-1.5 border-t border-hair px-4 py-3">
        {STAGES.map((s, i) => (
          <span
            key={s}
            title={s}
            className={cn(
              "grid h-6 min-w-6 place-items-center rounded-full px-1.5 text-[10.5px] font-medium ring-1 ring-inset",
              i < at && "text-(--plasma) ring-[color-mix(in_oklab,var(--plasma)_35%,transparent)]",
              i === at && "plasma-fill text-white ring-transparent",
              i > at && "text-ink-3 ring-hair",
            )}
          >
            {i < at ? <Check className="size-2.5" /> : i + 1}
          </span>
        ))}
      </div>

      <div className="border-t border-hair px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Label>Stage {at + 1} of {STAGES.length}</Label>
            <h3 className="mt-1.5 text-[15px] font-semibold">{focus.stage}</h3>
          </div>
          <Tag tone="info">
            <Dot tone="live" live /> In progress
          </Tag>
        </div>
        <p className="mt-3 text-[12px] leading-relaxed text-ink-2">
          {STAGE_BLURB[focus.stage]}
        </p>

        {focus.stage === "Data Load" && (
          <div className="mt-4">
            <div className="flex items-baseline justify-between">
              <Label>Copy progress</Label>
              <span className="text-[12px] font-semibold tabular-nums">
                {focus.progress}%
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sunk">
              <motion.span
                className="block h-full rounded-full plasma-fill"
                initial={{ width: 0 }}
                animate={{ width: `${focus.progress}%` }}
                transition={{ duration: 0.9, ease: EASE_ADV }}
              />
            </div>
          </div>
        )}
      </div>

      {next && (
        <div className="border-t border-hair px-4 py-4">
          <Label>Next up</Label>
          <p className="mt-1.5 text-[12px] font-medium">
            {at + 2}. {next}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-ink-3">
            {STAGE_BLURB[next]}
          </p>
        </div>
      )}

      <Fold label="Chain of custody" count={focus.stageHistory.length}>
        <ol className="divide-y divide-hair">
          {focus.stageHistory.map((e, i) => (
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
      </Fold>

      <Note icon={ShieldCheck}>
        Every transition names an accountable owner before it can start, and the
        record is append-only.
      </Note>
    </Block>
  );
}

/* ════════════════════════════════ Payload ════════════════════════════════ */

function Payload() {
  const orders = useAppStore((s) => s.orders);
  const moving = orders.filter(
    (o) => !o.closed && ["Data Load", "Shipment", "DT2 Upload"].includes(o.stage),
  );
  const tb = moving.reduce((n, o) => n + o.volumeTB, 0);

  return (
    <Block
      icon={Boxes}
      label="What is moving"
      action={
        <span className="text-[10px] tabular-nums text-ink-3">
          {tb.toLocaleString()} TB
        </span>
      }
    >
      <Facts
        cols={3}
        items={[
          { label: "Consignments", value: moving.length },
          { label: "In motion", value: `${tb.toLocaleString()} TB` },
          {
            label: "On device",
            value: `${moving
              .filter((o) => o.stage !== "DT2 Upload")
              .reduce((n, o) => n + o.volumeTB, 0)
              .toLocaleString()} TB`,
          },
        ]}
      />

      <ul className="divide-y divide-hair border-t border-hair">
        {moving.map((o) => (
          <li key={o.displayId} className="px-4 py-3.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-[10.5px] text-ink-3">
                {o.displayId}
              </span>
              <Tag tone="info">
                <Dot tone="live" live /> {o.stage}
              </Tag>
            </div>
            <p className="mt-1.5 text-[18px] font-semibold tabular-nums">
              {o.volumeTB.toLocaleString()} TB
            </p>
            <p className="mt-0.5 truncate text-[11.5px] text-ink-3">
              {o.source.label} → {o.destination.label}
            </p>
            {o.stage === "Data Load" && (
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-sunk">
                <span
                  className="block h-full rounded-full plasma-fill"
                  style={{ width: `${o.progress}%` }}
                />
              </div>
            )}
          </li>
        ))}
        {!moving.length && <Empty>Nothing is moving right now.</Empty>}
      </ul>
    </Block>
  );
}

/* ═══════════════════════════════ Documents ═══════════════════════════════ */

function Documents() {
  const orders = useAppStore((s) => s.orders);
  const live = orders.filter((o) => !o.closed);
  const all = live.flatMap((o) => o.documents);

  return (
    <Block
      icon={FileCheck2}
      label="Documents & certificates"
      action={
        <span className="text-[10px] tabular-nums text-ink-3">{all.length} total</span>
      }
    >
      <Facts
        cols={3}
        items={[
          { label: "Signed", value: all.filter((d) => d.status === "signed").length },
          {
            label: "Ready",
            value: all.filter((d) => d.status === "available").length,
            sub: "waiting on you",
          },
          { label: "Pending", value: all.filter((d) => d.status === "pending").length },
        ]}
      />

      {live.map((o) => (
        <div key={o.displayId} className="border-t border-hair">
          <div className="flex items-center justify-between gap-2 bg-sunk/60 px-4 py-2">
            <span className="font-mono text-[10.5px] text-ink-3">{o.displayId}</span>
            <span className="truncate text-[10.5px] text-ink-3">
              {o.source.label} → {o.destination.label}
            </span>
          </div>
          <ul className="divide-y divide-hair">
            {o.documents.map((d) => (
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
        </div>
      ))}
      {!live.length && <Empty>No open transfers.</Empty>}

      <Note icon={ShieldCheck}>
        Certificates are issued as each stage completes and stay downloadable for
        the life of the account.
      </Note>
    </Block>
  );
}

/* ═══════════════════════════════ Payments ════════════════════════════════ */

function Payments() {
  const orders = useAppStore((s) => s.orders);
  const live = orders.filter((o) => !o.closed);
  const all = live.flatMap((o) => o.payments);
  const paid = all.filter((p) => p.status === "paid").reduce((n, p) => n + p.amount, 0);
  const due = all.filter((p) => p.status === "due").reduce((n, p) => n + p.amount, 0);
  const later = all
    .filter((p) => p.status === "scheduled")
    .reduce((n, p) => n + p.amount, 0);

  return (
    <Block
      icon={Wallet}
      label="Payment milestones"
      action={
        <span className="text-[10px] tabular-nums text-ink-3">
          {fmtUSD(paid + due + later)} total
        </span>
      }
    >
      <Facts
        cols={3}
        items={[
          { label: "Settled", value: fmtUSD(paid) },
          { label: "Due now", value: fmtUSD(due), sub: due ? "action needed" : undefined },
          { label: "Scheduled", value: fmtUSD(later) },
        ]}
      />

      {live.map((o) => (
        <div key={o.displayId} className="border-t border-hair">
          <div className="bg-sunk/60 px-4 py-2">
            <span className="font-mono text-[10.5px] text-ink-3">{o.displayId}</span>
          </div>
          <ul className="divide-y divide-hair">
            {o.payments.map((p) => (
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
                <p className="mt-1.5 text-[17px] font-semibold tabular-nums">
                  {fmtUSD(p.amount)}
                </p>
                {/* The release condition gets equal weight to the amount — it
                    is the half that protects the customer. */}
                {p.dueAtStage && (
                  <div className="mt-2 flex gap-2 border-t border-hair pt-2">
                    <Dot tone={p.status === "paid" ? "ok" : "warn"} className="mt-1.5" />
                    <div>
                      <Label>Release condition</Label>
                      <p className="mt-1 text-[11px] leading-relaxed text-ink-2">
                        Falls due when the transfer reaches {p.dueAtStage}.
                      </p>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
      {!live.length && <Empty>No open transfers.</Empty>}

      <Note icon={Lock}>
        Line items are fixed at signature. Transit and port-hour costs do not
        re-price mid-transfer.
      </Note>
    </Block>
  );
}

/* ═══════════════════════════════ Renewals ════════════════════════════════ */

function Renewals() {
  const subs = useAppStore((s) => s.subscriptions);
  const open = subs.filter((s) => s.status !== "Closed");
  const monthly = open.reduce((n, s) => n + s.monthlyTotal, 0);
  const devices = open.reduce(
    (n, s) => n + s.items.reduce((m, i) => m + i.qty, 0),
    0,
  );

  return (
    <Block
      icon={Clock}
      label="Subscriptions"
      action={
        <span className="text-[10px] tabular-nums text-ink-3">
          {fmtUSD(monthly)}/mo
        </span>
      }
    >
      <Facts
        cols={3}
        items={[
          { label: "Active", value: open.length },
          { label: "Devices out", value: devices },
          { label: "Monthly", value: fmtUSD(monthly) },
        ]}
      />

      <ul className="divide-y divide-hair border-t border-hair">
        {open.map((s) => (
          <li key={s.id} className="px-4 py-3.5">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-mono text-[10.5px] text-ink-3">{s.id}</span>
              <Tag tone={s.status === "Active" ? "ok" : "mute"}>{s.status}</Tag>
            </div>
            <p className="mt-1.5 text-[12.5px]">
              {s.items.map((i) => `${i.qty}× ${i.model}`).join(", ")}
            </p>
            <p className="mt-1 font-mono text-[10.5px] text-ink-3">
              {s.startDate} → {s.endDate} · {fmtUSD(s.monthlyTotal)}/mo
            </p>
          </li>
        ))}
        {!open.length && <Empty>No device subscriptions are running.</Empty>}
      </ul>

      <div className="border-t border-hair px-4 py-3">
        <Link
          href={PATHS.subscriptions}
          className="inline-flex items-center gap-1.5 text-[12px] font-medium text-(--plasma) hover:underline"
        >
          Manage subscriptions <ArrowUpRight className="size-3" />
        </Link>
      </div>
    </Block>
  );
}

/* ══════════════════════════════════ Bits ═════════════════════════════════ */

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <li className="list-none px-4 py-4 text-[12px] leading-relaxed text-ink-3">
      {children}
    </li>
  );
}

function StageRule({
  order,
  className,
}: {
  order: TransferOrder;
  className?: string;
}) {
  const at = stageIndex(order.stage);
  return (
    <span className={cn("flex items-center gap-[2px]", className)}>
      {STAGES.map((s, i) => (
        <span
          key={s}
          className={cn(
            "h-[3px] flex-1 rounded-full",
            i < at
              ? "bg-[color-mix(in_oklab,var(--plasma)_55%,transparent)]"
              : i === at
                ? "plasma-fill"
                : "bg-hair",
          )}
        />
      ))}
    </span>
  );
}
