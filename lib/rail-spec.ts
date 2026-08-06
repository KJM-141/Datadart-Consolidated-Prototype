import { PATHS } from "./nav";
import { STAGES, stageIndex } from "./lifecycle";
import type { TransferOrder } from "./types";

/**
 * ── What the right rail shows, and why ────────────────────────────────────
 *
 * A persistent 352px panel has to justify itself on every route or the layout
 * is worse than the centred column it replaced. So the rail has a contract:
 *
 *   · **Needs you** is always first, and is computed from the real order book —
 *     unsigned agreements, released-but-unsigned documents, unpaid milestones.
 *     If the console has one reason to exist, this is it.
 *   · A **route section** in the middle, which is the thing you would otherwise
 *     have had to navigate away to find.
 *   · **Assistant** is always last, docked rather than floating.
 *
 * Because the first and last are unconditional, the rail is never empty — the
 * failure mode that would make the whole three-column layout feel like padding.
 *
 * This module is pure. It decides *what* appears; `right-rail.tsx` renders it.
 */

export type RailSection =
  | "needs-you"
  | "signals"
  | "watchers"
  | "custody"
  | "checkpoints"
  | "payments"
  | "documents"
  | "product"
  | "estimate"
  | "draft"
  | "renewals"
  | "account"
  | "assistant";

/** Ordered, and always bracketed by the two permanent sections. */
export function railSections(pathname: string): RailSection[] {
  const middle = routeSections(pathname);
  return ["needs-you", ...middle, "assistant"];
}

function routeSections(pathname: string): RailSection[] {
  // Order matters: the product detail is a prefix-match on the hardware list.
  if (pathname.startsWith(PATHS.product(""))) return ["product"];
  if (pathname.startsWith(PATHS.hardware)) return ["product"];
  if (pathname.startsWith(PATHS.transfer(""))) {
    return ["custody", "checkpoints", "payments", "documents"];
  }
  if (pathname.startsWith(PATHS.transfers)) return ["signals", "watchers"];
  if (pathname.startsWith(PATHS.sizer)) return ["estimate"];
  if (pathname.startsWith(PATHS.start)) return ["draft"];
  if (pathname.startsWith(PATHS.conversations)) return ["draft"];
  if (pathname.startsWith(PATHS.subscriptions)) return ["renewals"];
  if (pathname.startsWith(PATHS.profile)) return ["account"];
  if (pathname.startsWith(PATHS.checkout)) return ["estimate"];
  // The dashboard, and anything unrecognised, gets the operational view plus
  // the catalogue — the hardware tile used to sit in the centre column, where
  // it was reachable from exactly one route. In the rail it is always there.
  return ["signals", "product", "watchers"];
}

/* ═══════════════════════════════ Needs you ═══════════════════════════════ */

export type AttentionKind = "signature" | "payment" | "document" | "stalled";

export interface Attention {
  id: string;
  kind: AttentionKind;
  /** What is wrong, in the customer's language. */
  title: string;
  /** Which order it belongs to. */
  displayId: string;
  href: string;
  /** Blocking items sort above merely-due ones. */
  blocking: boolean;
}

/**
 * Everything across the book that is waiting on the customer.
 *
 * Reads the same `documents` / `payments` / `stage` shapes the order detail
 * renders, so the rail can never disagree with the page it links to.
 */
export function needsYou(orders: TransferOrder[]): Attention[] {
  const out: Attention[] = [];

  for (const order of orders) {
    if (order.closed) continue;
    const at = stageIndex(order.stage);

    for (const doc of order.documents) {
      const released =
        doc.availableAtStage !== undefined &&
        stageIndex(doc.availableAtStage) <= at;
      if (released && doc.status === "available") {
        out.push({
          id: `${order.displayId}-doc-${doc.type}`,
          kind: doc.type === "Rental agreement" ? "signature" : "document",
          title:
            doc.type === "Rental agreement"
              ? "Rental agreement is waiting on your signature"
              : `${doc.type} is ready to download`,
          displayId: order.displayId,
          href:
            doc.type === "Rental agreement"
              ? PATHS.agreement(order.displayId)
              : PATHS.transfer(order.displayId),
          blocking: doc.type === "Rental agreement",
        });
      }
    }

    for (const pay of order.payments) {
      if (pay.status !== "due") continue;
      out.push({
        id: `${order.displayId}-pay-${pay.label}`,
        kind: "payment",
        title: `${pay.label} is due`,
        displayId: order.displayId,
        href: PATHS.transfer(order.displayId),
        blocking: true,
      });
    }

    // A transfer that has not moved off Proposal is waiting on the customer to
    // accept it, not on operations to progress it.
    if (order.stage === STAGES[0]) {
      out.push({
        id: `${order.displayId}-proposal`,
        kind: "stalled",
        title: "Proposal is waiting for your decision",
        displayId: order.displayId,
        href: PATHS.transfer(order.displayId),
        blocking: false,
      });
    }
  }

  return out.sort((a, b) => Number(b.blocking) - Number(a.blocking));
}
