"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { MessageSquare, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { AssistantMark } from "@/components/brand/assistant-mark";
import { Dot, Facts, Label, PageHead, Tag } from "../kit";
import { PATHS } from "@/lib/nav";
import { useDeclarePageScope } from "../page-context";
import { fmtUSD } from "@/lib/pricing";
import { useAppStore, useMounted } from "@/lib/store";
import type { ConversationSession, TransferFacts } from "@/lib/types";
import { bloomSoft, deckStagger } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

/**
 * ── Conversations ─────────────────────────────────────────────────────────
 *
 * Dialogues, shown as dialogues.
 *
 * The queue was a table with the transcript folded away behind a chevron. But
 * a conversation *is* its transcript — the reason you open one is to hear how
 * the customer described the job in their own words, and a row of extracted
 * fields is precisely the version of that with the voice removed.
 *
 * So the last exchange is on the face of the card, rendered as the two bubbles
 * it was, and the extracted facts sit beside it as chips — the agent's reading
 * next to the source it read. Expanding shows the rest of the thread rather
 * than revealing it for the first time.
 */

const STATE_TONE: Record<
  ConversationSession["state"],
  "ok" | "warn" | "info" | "mute"
> = {
  active: "info",
  "estimate-shown": "info",
  "contact-captured": "ok",
  abandoned: "mute",
};

const STATE_LABEL: Record<ConversationSession["state"], string> = {
  active: "In progress",
  "estimate-shown": "Estimate shown",
  "contact-captured": "Contact captured",
  abandoned: "Abandoned",
};

const FACT_LABELS: Record<keyof TransferFacts, string> = {
  sizeTB: "Size",
  sourceType: "Source type",
  sourceLocation: "From",
  destination: "To",
  timeline: "Timeline",
  frequency: "How often",
  serviceLevel: "Service",
  compliance: "Compliance",
};

export function ConversationsPage() {
  const conversations = useAppStore((s) => s.conversations);
  const mounted = useMounted();

  useDeclarePageScope({
    label: "Intake queue",
    suggestions: [
      "Which sessions are priced?",
      "What is in the pipeline?",
    ],
  });

  const rows = mounted ? conversations : [];
  const pipeline = rows.reduce((n, c) => n + (c.estimateRange?.min ?? 0), 0);
  const priced = rows.filter((c) => c.estimateRange).length;

  return (
    <>
      <PageHead
        eyebrow="Back office"
        title="Conversations"
        description="Live intake sessions, in the customer's own words, with the facts the agent has extracted so far."
        action={
          <Link
            href={PATHS.start}
            className="inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-[12.5px] font-medium text-ink-2 ring-1 ring-inset ring-hair transition-colors hover:text-ink"
          >
            <MessageSquare className="size-3.5" /> Open intake
          </Link>
        }
      />

      <div className="mb-4 overflow-hidden rounded-lg ring-1 ring-inset ring-hair">
        <Facts
          cols={3}
          items={[
            { label: "Sessions", value: rows.length },
            { label: "Priced", value: priced },
            { label: "Pipeline", value: pipeline ? fmtUSD(pipeline) : "—" },
          ]}
        />
      </div>

      <motion.div
        variants={deckStagger(0.05, 0.03)}
        initial="hidden"
        animate="show"
        className="space-y-3"
      >
        {rows.map((c) => (
          <motion.div key={c.displayId} variants={bloomSoft}>
            <SessionCard session={c} />
          </motion.div>
        ))}
      </motion.div>

      {mounted && !rows.length && (
        <div className="rounded-lg px-4 py-12 text-center ring-1 ring-inset ring-hair">
          <p className="text-[12.5px] text-ink-3">No intake sessions yet.</p>
        </div>
      )}
    </>
  );
}

function SessionCard({ session }: { session: ConversationSession }) {
  const convertToProposal = useAppStore((s) => s.convertToProposal);
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const transcript = session.transcript ?? [];
  // The last thing each side said — the exchange that tells you where it got to.
  const lastUser = [...transcript].reverse().find((t) => t.role === "user");
  const lastAgent = [...transcript].reverse().find((t) => t.role === "agent");
  const preview = [lastUser, lastAgent].filter(Boolean) as typeof transcript;

  const facts = Object.entries(session.facts).filter(
    ([k, v]) => v !== undefined && v !== "" && k in FACT_LABELS,
  );

  const convert = () => {
    const order = convertToProposal(session.displayId);
    if (!order) {
      toast.info(`${session.displayId} already has a proposal.`);
      return;
    }
    toast.success(`Proposal ${order.displayId} drafted`, {
      description: "The draft is in Transfers at stage Proposal.",
      action: {
        label: "Open",
        onClick: () => router.push(PATHS.transfer(order.displayId)),
      },
    });
  };

  return (
    <div className="overflow-hidden rounded-lg bg-elev ring-1 ring-inset ring-hair">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-hair px-4 py-2.5">
        {session.lastActiveAt === "live now" && <Dot tone="live" live />}
        <span className="font-mono text-[11px] text-ink-3">
          {session.displayId}
        </span>
        <Tag tone={STATE_TONE[session.state]}>{STATE_LABEL[session.state]}</Tag>
        <span className="text-[10.5px] text-ink-3">{session.lastActiveAt}</span>
        <span className="ml-auto font-mono text-[12px] tabular-nums">
          {session.estimateRange ? fmtUSD(session.estimateRange.min) : "—"}
        </span>
      </div>

      <div className="grid gap-x-5 gap-y-4 px-4 py-3.5 lg:grid-cols-[minmax(0,1fr)_15rem]">
        {/* The voice */}
        <div className="min-w-0">
          <div className="space-y-2">
            {(expanded ? transcript : preview).map((t, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-2",
                  t.role === "user" && "justify-end",
                )}
              >
                {t.role === "agent" && (
                  <AssistantMark size={16} className="mt-1 shrink-0" />
                )}
                <p
                  className={cn(
                    "max-w-[85%] rounded-xl px-3 py-1.5 text-[11.5px] leading-relaxed ring-1 ring-inset ring-hair",
                    t.role === "user"
                      ? "rounded-br-sm bg-sunk"
                      : "rounded-bl-sm bg-canvas text-ink-2",
                  )}
                >
                  {t.text}
                </p>
              </div>
            ))}
            {!transcript.length && (
              <p className="text-[11.5px] text-ink-3">No transcript captured.</p>
            )}
          </div>

          {transcript.length > preview.length && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 text-[11px] text-ink-3 transition-colors hover:text-(--plasma)"
            >
              {expanded
                ? "Show last exchange"
                : `Read all ${transcript.length} messages`}
            </button>
          )}
        </div>

        {/* The agent's reading of it */}
        <div>
          <Label className="mb-2">Extracted</Label>
          {facts.length ? (
            <div className="flex flex-wrap gap-1.5">
              {facts.map(([k, v]) => (
                <span
                  key={k}
                  className="inline-flex items-baseline gap-1.5 rounded-full bg-sunk px-2.5 py-1 text-[10.5px] ring-1 ring-inset ring-hair"
                >
                  <span className="text-ink-3">
                    {FACT_LABELS[k as keyof TransferFacts]}
                  </span>
                  <span className="font-mono">
                    {k === "sizeTB" ? `${v} TB` : String(v)}
                  </span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[11.5px] text-ink-3">Nothing captured yet.</p>
          )}

          <button
            type="button"
            onClick={convert}
            disabled={Boolean(session.convertedOrderId)}
            className="btn-plasma mt-3 inline-flex h-9 w-full items-center justify-center gap-2 text-[12px] font-medium text-white disabled:pointer-events-none disabled:opacity-40"
          >
            <Sparkles className="size-3.5" />
            {session.convertedOrderId
              ? `Converted — ${session.convertedOrderId}`
              : "Convert to proposal"}
          </button>
        </div>
      </div>
    </div>
  );
}
