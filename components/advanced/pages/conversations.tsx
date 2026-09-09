"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import {
  ArrowRight,
  Bot,
  ChevronRight,
  FileCheck2,
  MailCheck,
  MessageSquare,
  Radio,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { ConversationDetail } from "@/components/conversations/conversation-detail";
import { HoloPanel } from "@/components/advanced/kit/holo-panel";
import {
  HudLabel,
  LiveDot,
  PageHeading,
  Pill,
  type Tone,
} from "@/components/advanced/kit/hud";
import { Counter } from "@/components/advanced/kit/text";
import { Spotlight } from "@/components/advanced/kit/interactions";
import { useAppStore, useMounted } from "@/lib/store";
import { fmtUSD } from "@/lib/pricing";
import type { ConversationSession } from "@/lib/types";
import { bloomSoft, deckStagger } from "@/lib/advanced-motion";

const STATE_META: Record<
  ConversationSession["state"],
  { label: string; tone: Tone; icon: typeof Bot; live?: boolean }
> = {
  active: { label: "Agent chatting", tone: "cyo", icon: Radio, live: true },
  "estimate-shown": { label: "Estimate shown", tone: "ion", icon: Bot },
  "contact-captured": { label: "Needs proposal", tone: "warning", icon: UserCheck },
  abandoned: { label: "Follow up", tone: "rose", icon: MailCheck },
};

const SOURCE_LABEL = {
  awsmp: "AWS Marketplace",
  direct: "Direct",
  partner: "Partner",
} as const;

/**
 * Conversations — the Advanced intake queue.
 *
 * Same back-office actions (open transcript, take over, convert to proposal)
 * and the same shared `ConversationDetail` sheet. The queue becomes a channel
 * monitor: each session is a card with a live beacon and a signal read-out.
 */
export function ConversationsAdvanced() {
  const router = useRouter();
  const mounted = useMounted();
  const conversations = useAppStore((s) => s.conversations);
  const convertToProposal = useAppStore((s) => s.convertToProposal);
  const [openId, setOpenId] = useState<string | null>(null);

  // Persisted state only settles client-side; hold the queue empty until then
  // so it never flashes the seed shape.
  const rows = mounted ? conversations : [];
  const selected = rows.find((c) => c.displayId === openId) ?? null;
  const pipeline = rows.reduce((sum, c) => sum + (c.estimateRange?.min ?? 0), 0);

  function handleConvert(session: ConversationSession) {
    const order = convertToProposal(session.displayId);
    if (!order) {
      toast.info(`${session.displayId} already has a proposal.`);
      return;
    }
    toast.success(`Proposal ${order.displayId} drafted`, {
      description: `${session.displayId} converted, the draft is in Orders at stage Proposal.`,
      action: {
        label: "Open order",
        onClick: () => router.push(`/customer/history/${order.displayId}`),
      },
    });
  }

  function handleTakeOver(session: ConversationSession) {
    toast.success(`Joined ${session.displayId}`, {
      description: "You're now handling this conversation.",
    });
  }

  return (
    <motion.div
      variants={deckStagger(0.055)}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <PageHeading
        eyebrow="Back office"
        title="Conversations"
        description="Live intake sessions with the facts the agent has extracted so far. Open one to read the transcript, take over the chat, or convert an estimate into a proposal."
        actions={
          <Link
            href="/customer/start"
            className="btn-ghost-hud inline-flex h-11 items-center gap-2 px-5 text-[13px] font-medium"
          >
            <MessageSquare className="size-4" /> Open customer intake
          </Link>
        }
      />

      {/* channel read-outs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label="Live conversations"
          value={rows.filter((c) => c.state !== "abandoned").length}
          tone="cyo"
          live
        />
        <Kpi
          label="Needs proposal"
          value={
            rows.filter(
              (c) => c.state === "contact-captured" && !c.convertedOrderId,
            ).length
          }
          tone="warning"
        />
        <Kpi
          label="Abandoned w/ email"
          value={rows.filter((c) => c.state === "abandoned").length}
          tone="rose"
        />
        <Kpi label="Pipeline (est.)" text={fmtUSD(pipeline)} tone="plasma" />
      </div>

      {/* queue */}
      <div className="space-y-3">
        {rows.length === 0 ? (
          <HoloPanel brackets className="flex flex-col items-center px-6 py-16 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
              <MessageSquare className="size-6" />
            </span>
            <h3 className="mt-5 text-lg font-semibold tracking-tight">
              No conversations yet
            </h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
              Sessions appear here the moment someone starts a chat at the
              customer intake.
            </p>
            <Link
              href="/customer/start"
              className="btn-plasma mt-6 inline-flex h-11 items-center px-6 text-[13px] font-medium"
            >
              Open customer intake
            </Link>
          </HoloPanel>
        ) : (
          rows.map((c) => {
            const meta = STATE_META[c.state];
            const Icon = meta.icon;
            return (
              <motion.div key={c.displayId} variants={bloomSoft}>
                <HoloPanel plain live={meta.live} className="group/conv overflow-hidden">
                  <Spotlight size={420} className="block rounded-[inherit]">
                    <button
                      type="button"
                      onClick={() => setOpenId(c.displayId)}
                      aria-label={`Open conversation ${c.displayId}`}
                      className="relative flex w-full flex-wrap items-start justify-between gap-4 p-5 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    >
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2">
                          <span className="text-[15px] font-semibold tracking-tight">
                            {c.displayId}
                          </span>
                          <Pill tone="muted">{SOURCE_LABEL[c.source]}</Pill>
                          {c.convertedOrderId && (
                            <Pill tone="success" icon={FileCheck2}>
                              {c.convertedOrderId}
                            </Pill>
                          )}
                        </p>
                        <p className="mt-2 text-[13px] font-medium">
                          {c.facts.sizeTB
                            ? `${c.facts.sizeTB.toLocaleString()} TB`
                            : "Volume pending"}
                          <span aria-hidden className="mx-1.5 inline-block h-3 w-px translate-y-[1px] bg-muted-foreground/30" />
                          {c.facts.sourceLocation ?? "Source pending"}
                          <span className="mx-1.5 text-(--plasma)">→</span>
                          {c.facts.destination ?? "Destination pending"}
                          {c.facts.serviceLevel === "White Glove" && (
                            <span className="ml-1.5 text-(--rose)">
                             , White Glove
                            </span>
                          )}
                        </p>
                        {c.contactEmail && (
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {c.company}, {c.contactEmail}
                          </p>
                        )}
                      </div>
                      <span className="flex shrink-0 items-center gap-2.5">
                        <Pill tone={meta.tone} className="gap-1.5">
                          {meta.live ? (
                            <LiveDot tone={meta.tone} />
                          ) : (
                            <Icon className="size-3" />
                          )}
                          {meta.label}
                        </Pill>
                        <ChevronRight className="size-4 text-muted-foreground transition-transform duration-300 group-hover/conv:translate-x-1" />
                      </span>
                    </button>
                  </Spotlight>

                  <div className="mx-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 py-3.5">
                    <p className="text-[11px] text-muted-foreground">
                      {c.estimateRange && (
                        <span className="font-semibold tabular-nums text-foreground">
                          Est. {fmtUSD(c.estimateRange.min)}–
                          {fmtUSD(c.estimateRange.max)}
                        </span>
                      )}
                      {c.estimateRange && ", "}
                      {c.lastActiveAt}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setOpenId(c.displayId)}
                        className="btn-ghost-hud inline-flex h-9 items-center px-4 text-[13px] font-medium"
                      >
                        Open
                      </button>
                      {!c.convertedOrderId && (
                        <button
                          type="button"
                          onClick={() => handleConvert(c)}
                          className="btn-plasma inline-flex h-9 items-center gap-1.5 px-4 text-[13px] font-medium"
                        >
                          Convert to proposal
                          <ArrowRight className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </HoloPanel>
              </motion.div>
            );
          })
        )}
      </div>

      <ConversationDetail
        session={selected}
        onOpenChange={(open) => !open && setOpenId(null)}
        onConvert={handleConvert}
        onTakeOver={handleTakeOver}
      />
    </motion.div>
  );
}

function Kpi({
  label,
  value,
  text,
  tone,
  live,
}: {
  label: string;
  value?: number;
  text?: string;
  tone: Tone;
  live?: boolean;
}) {
  return (
    <HoloPanel className="p-4">
      <div className="flex items-center gap-2">
        {live && <LiveDot tone={tone} />}
        <p className="text-[26px] font-semibold leading-none tracking-tight tabular-nums">
          {text ?? <Counter value={value ?? 0} />}
        </p>
      </div>
      <HudLabel className="mt-2.5">{label}</HudLabel>
    </HoloPanel>
  );
}
