import {
  BellRing,
  Boxes,
  FileCheck2,
  Gauge,
  type LucideIcon,
  Route,
  Wallet,
} from "lucide-react";
import { stageIndex, STAGES } from "./lifecycle";
import { fmtUSD } from "./pricing";
import { needsYou } from "./rail-spec";
import type { TransferOrder, DeviceSubscription } from "./types";

/**
 * ── The command centre's model ────────────────────────────────────────────
 *
 * The centre is one screen: a conversation with the standing readout on its
 * left and the catalogue on its right. Nothing here decides *how* any of that
 * looks — this module answers two questions and nothing else:
 *
 *   1. What is currently true about the order book, as a short list of one-line
 *      signals? (`buildSignals`)
 *   2. When someone types a question at the assistant, which of those signals
 *      answers it? (`resolveAsk`)
 *
 * Both are pure functions of the store, so the rail, the lens and the
 * transcript can never contradict each other — they are three renderings of
 * the same list.
 *
 * This deliberately replaces the dashboard's grid of panels. A gauge pod, an
 * atlas, a lifecycle spine, a timeline and a library card all competing for the
 * same screen is the information overload the centre exists to undo: each of
 * those is now either one line in the rail or one lens behind it.
 */

/** The lenses a signal can open. Detail is an overlay, never a route. */
export type LensId =
  | "attention"
  | "route"
  | "progress"
  | "payload"
  | "documents"
  | "payments"
  | "renewals";

export type SignalTone = "ok" | "warn" | "live";

export interface Signal {
  id: LensId;
  group: "Attention" | "In flight" | "Your side";
  icon: LucideIcon;
  /** What the number is. */
  label: string;
  /** The number itself, already formatted. */
  value: string;
  tone?: SignalTone;
  /** 0‥1, drawn as a hairline under the row when present. */
  bar?: number;
  /** One sentence the assistant can say when asked about this. */
  answer: string;
}

export interface CentreInput {
  orders: TransferOrder[];
  subscriptions: DeviceSubscription[];
}

/** The transfer the centre is "about" — furthest along and still moving. */
export function focusOrder(orders: TransferOrder[]): TransferOrder | undefined {
  const live = orders.filter((o) => !o.closed);
  return (
    live.find((o) => o.stage === "Shipment") ??
    live.find((o) => o.stage === "Data Load") ??
    live[0]
  );
}

export function buildSignals({ orders, subscriptions }: CentreInput): Signal[] {
  const live = orders.filter((o) => !o.closed);
  const focus = focusOrder(orders);
  const attention = needsYou(orders);
  const blocking = attention.filter((a) => a.blocking).length;

  const inMotionTB = live
    .filter((o) => ["Data Load", "Shipment", "DT2 Upload"].includes(o.stage))
    .reduce((n, o) => n + o.volumeTB, 0);

  const docs = live.flatMap((o) => o.documents);
  const ready = docs.filter((d) => d.status === "available").length;
  const signed = docs.filter((d) => d.status === "signed").length;

  const outstanding = live
    .flatMap((o) => o.payments)
    .filter((p) => p.status !== "paid")
    .reduce((n, p) => n + p.amount, 0);

  const openSubs = subscriptions.filter((s) => s.status !== "Closed");

  const at = focus ? stageIndex(focus.stage) : -1;

  return [
    {
      id: "attention",
      group: "Attention",
      icon: BellRing,
      label: attention.length ? "Needs a decision" : "All clear",
      value: attention.length
        ? `${attention.length} open${blocking ? `, ${blocking} blocking` : ""}`
        : "Nothing outstanding",
      tone: blocking ? "warn" : attention.length ? undefined : "ok",
      answer: attention.length
        ? `${attention.length} item${attention.length === 1 ? "" : "s"} are waiting on you${
            blocking ? `, ${blocking} of which block a transfer from moving` : ""
          }.`
        : "Nothing is waiting on you. Every open transfer is signed, settled to its current stage and moving.",
    },
    {
      id: "route",
      group: "In flight",
      icon: Route,
      label: "Lanes",
      value: live.length
        ? `${live.length} route${live.length === 1 ? "" : "s"} active`
        : "Nothing in flight",
      tone: live.length ? "live" : undefined,
      answer: live.length
        ? `${live.length} transfer${live.length === 1 ? " is" : "s are"} in flight right now. The map has every lane on it.`
        : "No transfers are in flight. Describe a move and I'll scope it.",
    },
    {
      id: "progress",
      group: "In flight",
      icon: Gauge,
      label: "Progress",
      value: focus
        ? `Stage ${at + 1}/${STAGES.length}, ${focus.stage}`
        : "No transfer in focus",
      bar: focus ? (at + 1) / STAGES.length : undefined,
      answer: focus
        ? `${focus.displayId} is at stage ${at + 1} of ${STAGES.length}, ${focus.stage.toLowerCase()}${
            focus.stage === "Data Load" ? `, ${focus.progress}% copied` : ""
          }.`
        : "Nothing is in progress at the moment.",
    },
    {
      id: "payload",
      group: "In flight",
      icon: Boxes,
      label: "Payload",
      value: inMotionTB ? `${inMotionTB.toLocaleString()} TB in motion` : "N/A",
      answer: inMotionTB
        ? `${inMotionTB.toLocaleString()} TB is on a device or uploading right now.`
        : "Nothing is moving at the moment.",
    },
    {
      id: "documents",
      group: "Your side",
      icon: FileCheck2,
      label: "Certificates",
      value: `${signed} signed, ${ready} ready`,
      tone: ready ? "warn" : undefined,
      answer: ready
        ? `${ready} document${ready === 1 ? " is" : "s are"} released and waiting on you; ${signed} already signed.`
        : `${signed} document${signed === 1 ? "" : "s"} signed, nothing outstanding.`,
    },
    {
      id: "payments",
      group: "Your side",
      icon: Wallet,
      label: "Balance",
      value: outstanding ? `${fmtUSD(outstanding)} outstanding` : "Settled",
      tone: outstanding ? "warn" : "ok",
      answer: outstanding
        ? `${fmtUSD(outstanding)} is outstanding across your open transfers, billed at the milestones below.`
        : "Every milestone on your open transfers is settled.",
    },
    {
      id: "renewals",
      group: "Your side",
      icon: BellRing,
      label: "Subscriptions",
      value: openSubs.length
        ? `${openSubs.length} active`
        : "None active",
      answer: openSubs.length
        ? `You have ${openSubs.length} device subscription${openSubs.length === 1 ? "" : "s"} running.`
        : "You have no device subscriptions running.",
    },
  ];
}

/* ── Asking ───────────────────────────────────────────────────────────────
   The assistant's other job. `lib/agent.ts` handles scoping a *new* transfer;
   this handles questions about the ones you already have, which is the half
   the intake agent has no opinion about. Keyword matching, deliberately — the
   answers come from `buildSignals`, so a question can never invent a figure
   the rail is not also showing. */

/**
 * Order matters — the first pattern to match wins, so the narrow topics come
 * before the broad ones. "Which certificates are ready" mentions no money, but
 * "what's outstanding" is about both attention and payments, and payments is
 * the more useful answer.
 *
 * Phrasings are deliberately generous. An earlier version matched "when will"
 * but not "when does", and "arrive" but not "land" — so the single most
 * obvious question on a shipment page ("when does it land?") missed every
 * pattern and fell through to the scoping agent, which asked how much data the
 * user wanted to move. That failure is worse than no answer.
 */
const ASK_PATTERNS: [RegExp, LensId][] = [
  [/certificate|document|erasure|checksum|custody|report|paperwork|sign/i, "documents"],
  [
    /pay|invoice|balance|owe|owing|outstanding|cost|price|bill|milestone|due|advance/i,
    "payments",
  ],
  [/subscription|rental|renew|return the device|lease/i, "renewals"],
  [/where|position|located|lane|map|route|shipment|transit|journey/i, "route"],
  [
    /progress|stage|status|how far|when (?:will|does|is|do)|eta|arriv|land|deliver|complete|finish|ready by|on time|late|delay/i,
    "progress",
  ],
  [/how much data|payload|terabyte|petabyte|\btb\b|\bpb\b|volume|capacity/i, "payload"],
  [/attention|decision|waiting|blocked|action|to.?do|need from me/i, "attention"],
];

/** A question, roughly. Used only to decide whether to fall back to a summary. */
const LOOKS_LIKE_A_QUESTION =
  /\?|^\s*(what|when|where|which|who|why|how|is|are|can|do|does|did|will|should|has|have)\b/i;

export interface AskResult {
  answer: string;
  /** The lens that shows the working, if there is one. */
  lens?: LensId;
  label?: string;
}

/**
 * The lenses whose answer changes depending on *which* transfer you mean.
 * "What's outstanding" across the book and on one order are different numbers,
 * and on an order's own page the second is always the one being asked for.
 */
const ORDER_SCOPED: LensId[] = [
  "route",
  "progress",
  "payload",
  "documents",
  "payments",
];

/** The same question, answered about one transfer rather than all of them. */
function answerForOrder(id: LensId, o: TransferOrder): string | null {
  const at = stageIndex(o.stage);
  switch (id) {
    case "route":
      return `${o.displayId} is running ${o.source.label} → ${o.destination.label}, currently at ${o.stage.toLowerCase()}.`;
    case "progress":
      return `${o.displayId} is at stage ${at + 1} of ${STAGES.length}, ${o.stage.toLowerCase()}${
        o.stage === "Data Load" ? `, ${o.progress}% copied` : ""
      }.`;
    case "payload":
      return `${o.displayId} is moving ${o.volumeTB.toLocaleString()} TB from ${o.source.label} to ${o.destination.label}.`;
    case "documents": {
      const ready = o.documents.filter((d) => d.status === "available").length;
      const signed = o.documents.filter((d) => d.status === "signed").length;
      return ready
        ? `On ${o.displayId}, ${ready} document${ready === 1 ? " is" : "s are"} released and waiting on you; ${signed} already signed.`
        : `On ${o.displayId}, ${signed} document${signed === 1 ? " is" : "s are"} signed and nothing is outstanding.`;
    }
    case "payments": {
      const owed = o.payments
        .filter((p) => p.status !== "paid")
        .reduce((n, p) => n + p.amount, 0);
      const due = o.payments.find((p) => p.status === "due");
      return owed
        ? `${fmtUSD(owed)} is outstanding on ${o.displayId}${
            due ? `, of which ${fmtUSD(due.amount)} is due now (${due.label})` : ""
          }.`
        : `Everything on ${o.displayId} is settled.`;
    }
    default:
      return null;
  }
}

export function resolveAsk(
  text: string,
  signals: Signal[],
  /** The transfer the current page is about, if any. */
  scope?: TransferOrder,
): AskResult | null {
  for (const [re, id] of ASK_PATTERNS) {
    if (!re.test(text)) continue;
    const signal = signals.find((s) => s.id === id);
    if (!signal) continue;

    const scoped =
      scope && ORDER_SCOPED.includes(id) ? answerForOrder(id, scope) : null;

    return {
      answer: scoped ?? signal.answer,
      lens: id,
      label: signal.label,
    };
  }

  /**
   * Scoped fallback. On a page that is about one transfer, an unmatched
   * *question* is still a question about that transfer — answering it with the
   * transfer's status beats handing the user to the scoping agent, which would
   * reply by asking how much data they want to move. Only questions, so that
   * "move 900 TB to Azure" on a transfer page still starts a new scope.
   */
  if (scope && LOOKS_LIKE_A_QUESTION.test(text)) {
    const signal = signals.find((s) => s.id === "progress");
    return {
      answer: `${answerForOrder("progress", scope)} Ask me about its route, payload, documents or payments and I'll pull the detail.`,
      lens: "progress",
      label: signal?.label ?? "Progress",
    };
  }

  return null;
}

export const LENS_TITLE: Record<LensId, string> = {
  attention: "Needs you",
  route: "Live lanes",
  progress: "Lifecycle",
  payload: "What is moving",
  documents: "Documents & certificates",
  payments: "Payment milestones",
  renewals: "Subscriptions",
};
