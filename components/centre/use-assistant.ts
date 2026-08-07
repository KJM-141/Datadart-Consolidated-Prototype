"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  canEstimate,
  containsSecret,
  extractFacts,
  nextSlot,
  redactSecrets,
  SLOT_CHIPS,
  type Slot,
} from "@/lib/agent";
import { buildSignals, resolveAsk, type LensId } from "@/lib/centre";
import { estimate as priceIt, fmtRange, type Estimate } from "@/lib/pricing";
import { formatHours } from "@/lib/sizer-engine";
import { useAppStore } from "@/lib/store";
import type { TransferFacts } from "@/lib/types";
import { usePageScope } from "./page-context";

/**
 * ── The assistant, as a hook ──────────────────────────────────────────────
 *
 * One engine, two rooms. The command centre runs it as its middle column; every
 * other route runs it in a docked panel. Extracting it was the only way to have
 * both without two copies of the slot-filling, the redaction and the estimate
 * trigger drifting apart.
 *
 * It answers two kinds of question and picks per message:
 *
 *   · **Scoping a new move** — `lib/agent.ts`, unchanged.
 *   · **The book you already have** — `resolveAsk`, scoped to whatever transfer
 *     the current page declared. That scoping is the reason the docked version
 *     is worth having: on a transfer page "when does it land" is about *that*
 *     transfer without anyone having to say which.
 *
 * An answer never opens a panel by itself. It carries a link and you decide.
 */

const ASK: Record<Slot, (f: TransferFacts) => string> = {
  size: () =>
    "Tell me roughly **how much data** you need to move and I'll size it.",
  sourceLocation: (f) =>
    `**${f.sizeTB?.toLocaleString()} TB** — where does that live today?`,
  destination: () => "And where should it land?",
  serviceLevel: () =>
    "Do you want **White Glove**, where our engineers run the load on site?",
  timeline: () => "When does it need to be done by?",
  compliance: () => "Last one — any compliance requirements on this data?",
  complete: () =>
    "That's everything I need. Your draft is saved — request a detailed proposal whenever you're ready.",
};

export interface Turn {
  id: string;
  role: "agent" | "user";
  text: string;
  chips?: string[];
  estimate?: boolean;
  lens?: LensId;
  lensLabel?: string;
}

let seq = 0;
const uid = () => `t${seq++}`;

export interface Assistant {
  turns: Turn[];
  typing: boolean;
  send: (text: string) => void;
  estimate?: Estimate;
  /** The transfer the current page is about, for the panel's subject line. */
  subject: string | null;
  /** Openers the current page thinks are worth offering. */
  suggestions: string[];
  started: boolean;
}

const GENERAL_SUGGESTIONS = [
  "Where is my shipment right now?",
  "What's waiting on me?",
  "I need to move 800 TB out of Bengaluru",
  "What would 2 PB cost?",
];

export function useAssistant(): Assistant {
  const orders = useAppStore((s) => s.orders);
  const subscriptions = useAppStore((s) => s.subscriptions);
  const upsertConversation = useAppStore((s) => s.upsertConversation);
  const pageScope = usePageScope();

  const [turns, setTurns] = useState<Turn[]>([]);
  const [typing, setTyping] = useState(false);
  const [facts, setFacts] = useState<TransferFacts>({});

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
    },
    [],
  );

  const signals = useMemo(
    () => buildSignals({ orders, subscriptions }),
    [orders, subscriptions],
  );

  const scopedOrder = useMemo(
    () =>
      pageScope?.orderId
        ? orders.find((o) => o.displayId === pageScope.orderId)
        : undefined,
    [pageScope?.orderId, orders],
  );

  const estimate = useMemo(
    () =>
      canEstimate(facts)
        ? priceIt({
            sizeTB: facts.sizeTB!,
            source: facts.sourceLocation,
            destination: facts.destination,
            serviceLevel: facts.serviceLevel,
          })
        : undefined,
    [facts],
  );

  const say = useCallback((turn: Omit<Turn, "id">, delay = 620) => {
    setTyping(true);
    timers.current.push(
      setTimeout(() => {
        setTyping(false);
        setTurns((prev) => [...prev, { id: uid(), ...turn }]);
      }, delay),
    );
  }, []);

  /* Mirror a scoping session into the staff Conversations queue. */
  useEffect(() => {
    if (!turns.some((t) => t.role === "user")) return;
    if (!facts.sizeTB) return;
    upsertConversation({
      displayId: "DD-2026-0201",
      source: "direct",
      state: estimate ? "estimate-shown" : "active",
      facts,
      lastActiveAt: "live now",
      estimateRange: estimate
        ? { min: estimate.min, max: estimate.max }
        : undefined,
      transcript: turns.map((t) => ({ role: t.role, text: t.text })),
    });
  }, [turns, facts, estimate, upsertConversation]);

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return;

      const hadSecret = containsSecret(text);
      const stored = hadSecret ? redactSecrets(text) : text;
      setTurns((prev) => [...prev, { id: uid(), role: "user", text: stored }]);

      if (hadSecret) {
        say(
          {
            role: "agent",
            text: "I've **redacted that from the transcript** — please don't share keys or bucket paths here. Technical details are collected after your agreement is signed, through an audited channel.",
          },
          720,
        );
        return;
      }

      const asked = resolveAsk(text, signals, scopedOrder);
      const describesMove = /\b\d+\s*(tb|pb|terabyte|petabyte)/i.test(text);
      if (asked && !describesMove) {
        say({
          role: "agent",
          text: asked.answer,
          lens: asked.lens,
          lensLabel: asked.label,
        });
        return;
      }

      const before = facts;
      const after = extractFacts(text, before);
      setFacts(after);

      const gained = !canEstimate(before) && canEstimate(after);
      const slot = nextSlot(after);

      if (gained) {
        const e = priceIt({
          sizeTB: after.sizeTB!,
          source: after.sourceLocation,
          destination: after.destination,
          serviceLevel: after.serviceLevel,
        });

        if (e.recommendOnline) {
          say({
            role: "agent",
            text: "Under a terabyte you'll be faster over your own connection than waiting on a shipped device. I'd rather tell you that than sell you a transfer.",
          });
          return;
        }

        say(
          {
            role: "agent",
            text: `Ballpark: **${fmtRange(e)}**, done in **${formatHours(
              e.sizing.timeline.totalHours,
            )}** door to door — against ${formatHours(
              e.sizing.comparison.wireHours,
            )} over a ${e.lineSpeedMbps} Mbps line, on **${e.deviceLabel}**.`,
            estimate: true,
          },
          880,
        );
        timers.current.push(
          setTimeout(
            () =>
              say(
                { role: "agent", text: ASK[slot](after), chips: SLOT_CHIPS[slot] },
                700,
              ),
            1000,
          ),
        );
        return;
      }

      say({ role: "agent", text: ASK[slot](after), chips: SLOT_CHIPS[slot] }, 680);
    },
    [facts, say, signals, scopedOrder],
  );

  return {
    turns,
    typing,
    send,
    estimate,
    subject: pageScope?.label ?? null,
    suggestions: pageScope?.suggestions?.length
      ? pageScope.suggestions
      : GENERAL_SUGGESTIONS,
    started: turns.length > 0,
  };
}
