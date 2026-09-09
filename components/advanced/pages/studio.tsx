"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Segmented } from "@/components/shared/segmented";
import { ConversationDetail } from "@/components/conversations/conversation-detail";
import { HudLabel } from "@/components/advanced/kit/hud";
import { StartAdvanced } from "./start";
import { SizerAdvanced } from "./sizer";
import { useAppStore, useMounted } from "@/lib/store";
import { bloomSoft, deckStagger } from "@/lib/advanced-motion";
import type { ConversationSession } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * ── Studio ────────────────────────────────────────────────────────────────
 *
 * The one place you plan a transfer. Two tabs sit under the bar the way the
 * overview's do:
 *
 *   · **New transfer** — the assistant chat, with your past conversations
 *     listed down its left the way a chat app keeps its history.
 *   · **Sizer** — the estimate calculator.
 *
 * This merges what used to be three separate rail entries (New transfer, Sizer,
 * Conversations) into a single destination.
 */
const TABS = ["new", "sizer"] as const;
type Tab = (typeof TABS)[number];
const TAB_LABELS: Record<Tab, string> = { new: "New transfer", sizer: "Sizer" };

export function StudioAdvanced() {
  return (
    <Suspense fallback={null}>
      <StudioInner />
    </Suspense>
  );
}

function StudioInner() {
  const params = useSearchParams();
  const wanted: Tab = params.get("tab") === "sizer" ? "sizer" : "new";
  const [tab, setTab] = useState<Tab>(wanted);
  // Bumped to start a fresh chat — remounts the intake so it resets cleanly.
  const [chatKey, setChatKey] = useState(0);

  // Follow the query when a link elsewhere asks for a specific tab
  // (e.g. "Get an estimate" points at ?tab=sizer).
  useEffect(() => {
    setTab(params.get("tab") === "sizer" ? "sizer" : "new");
  }, [params]);

  return (
    <motion.div
      variants={deckStagger(0.05, 0.04)}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      <motion.div variants={bloomSoft} className="border-b border-hair pb-3">
        <Segmented
          options={TABS}
          value={tab}
          onChange={setTab}
          labels={TAB_LABELS}
          size="sm"
          aria-label="Studio"
        />
      </motion.div>

      {tab === "new" ? (
        <motion.div
          variants={bloomSoft}
          className="grid gap-4 lg:grid-cols-[248px_minmax(0,1fr)]"
        >
          <History onNewChat={() => setChatKey((k) => k + 1)} />
          <div className="min-w-0">
            <StartAdvanced key={chatKey} />
          </div>
        </motion.div>
      ) : (
        <motion.div variants={bloomSoft}>
          <SizerAdvanced />
        </motion.div>
      )}
    </motion.div>
  );
}

/* ── History (the conversation list, chat-app style) ───────────────────────── */

function convTitle(c: ConversationSession): string {
  if (c.company) return c.company;
  if (c.facts.sizeTB) return `${c.facts.sizeTB.toLocaleString()} TB transfer`;
  return c.displayId;
}

function convSubtitle(c: ConversationSession): string {
  const from = c.facts.sourceLocation;
  const to = c.facts.destination;
  if (from && to) return `${from} to ${to}`;
  if (from) return `From ${from}`;
  return c.displayId;
}

function History({ onNewChat }: { onNewChat: () => void }) {
  const router = useRouter();
  const mounted = useMounted();
  const conversations = useAppStore((s) => s.conversations);
  const convertToProposal = useAppStore((s) => s.convertToProposal);

  const rows = mounted ? conversations : [];
  const [openId, setOpenId] = useState<string | null>(null);
  const selected = rows.find((c) => c.displayId === openId) ?? null;

  function handleConvert(session: ConversationSession) {
    const order = convertToProposal(session.displayId);
    if (!order) {
      toast.info(`${session.displayId} already has a proposal.`);
      return;
    }
    toast.success(`Proposal ${order.displayId} drafted`, {
      description: `Converted from ${session.displayId}. The draft is in Transfers at stage Proposal.`,
      action: {
        label: "Open order",
        onClick: () => router.push(`/customer/history/${order.displayId}`),
      },
    });
    setOpenId(null);
  }

  function handleTakeOver(session: ConversationSession) {
    toast.success(`Joined ${session.displayId}`, {
      description: "You're now handling this conversation.",
    });
  }

  return (
    <aside className="flex flex-col gap-3 lg:max-h-[calc(100dvh-12rem)]">
      <button
        type="button"
        onClick={onNewChat}
        className="inline-flex w-fit items-center gap-1.5 py-1 text-[13px] font-medium text-(--plasma) transition-opacity hover:opacity-75"
      >
        <Plus className="size-4" /> New chat
      </button>

      <HudLabel className="px-1 text-ink-3">History</HudLabel>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {rows.length === 0 ? (
          <p className="px-1 pt-1 text-[12px] leading-relaxed text-ink-3">
            Your conversations show up here once you start a chat.
          </p>
        ) : (
          <ul className="space-y-1">
            {rows.map((c) => {
              const active = openId === c.displayId;
              return (
                <li key={c.displayId}>
                  <button
                    type="button"
                    onClick={() => setOpenId(c.displayId)}
                    className={cn(
                      "w-full rounded-lg px-3 py-2 text-left transition-colors",
                      active ? "bg-accent" : "hover:bg-accent/60",
                    )}
                  >
                    <p className="truncate text-[13px] font-medium text-ink">
                      {convTitle(c)}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-ink-3">
                      {convSubtitle(c)}
                    </p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ConversationDetail
        session={selected}
        onOpenChange={(open) => !open && setOpenId(null)}
        onConvert={handleConvert}
        onTakeOver={handleTakeOver}
      />
    </aside>
  );
}
