import { PATHS } from "./nav";
import { STAGES, stageIndex } from "./lifecycle";
import type { TransferOrder } from "./types";

/**
 * ── What the right rail shows, and why ────────────────────────────────────
 *
 * **The rail belongs to the overview, and to nothing else.**
 *
 * It used to follow you onto every route, swapping its middle for whatever the
 * pathname was about — custody on a transfer, the rate card on the sizer, the
 * catalogue on hardware. The problem with that is what it did to the pages it
 * was helping: each one already prints its own subject at full width, so the
 * rail spent 352px restating it in miniature, and on a route like the transfer
 * detail you read the same payment milestones twice, once in a panel and once
 * in a column beside it.
 *
 * Scoped to the overview, it becomes what it is good at — a standing readout
 * next to a screen whose job is the whole book rather than one record:
 *
 *   · **Cart** first, directly under the top bar: what you have open right now.
 *   · **Needs you**, computed from the real order book — unsigned agreements,
 *     released-but-unsigned documents, unpaid milestones. If the console has
 *     one reason to exist, this is it.
 *   · **Active transfers** and the **catalogue**, which is the thing the deck
 *     used to make you navigate to.
 *
 * Everything the old route sections carried now lives on the page it describes:
 * custody and progress in `components/lifecycle/lifecycle-panel.tsx`, payments
 * and documents in their own panels on the transfer detail, renewals on
 * Subscriptions, the account on Profile.
 *
 * This module is pure. It decides *what* appears; `right-rail.tsx` renders it,
 * and `console-shell.tsx` asks `railVisible()` whether to mount it at all.
 */

export type RailSection = "cart" | "needs-you" | "active" | "product";

const OVERVIEW_RAIL: RailSection[] = ["cart", "needs-you", "active", "product"];

/**
 * True only on the overview.
 *
 * Compared against a trailing-slash-stripped pathname because
 * `trailingSlash: true` in next.config means the router reports "/customer/",
 * and an exact match on "/customer" silently never fires — the same trap
 * `isActivePath` documents in `lib/nav.ts`.
 */
export function railVisible(pathname: string): boolean {
  const trim = (v: string) => (v.length > 1 ? v.replace(/\/+$/, "") : v);
  return trim(pathname) === trim(PATHS.dashboard);
}

export function railSections(pathname: string): RailSection[] {
  return railVisible(pathname) ? OVERVIEW_RAIL : [];
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
