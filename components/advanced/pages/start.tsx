"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUp, FileText, Headphones, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { AssistantMark } from "@/components/brand/assistant-mark";
import { Markdown } from "@/components/shared/markdown";
import { TransferSummary } from "@/components/intake/transfer-summary";
import { EstimateCard } from "@/components/pricing/estimate-card";
import { LiveDot } from "@/components/advanced/kit/hud";
import {
  canEstimate,
  containsSecret,
  extractFacts,
  nextSlot,
  redactSecrets,
  SLOT_CHIPS,
  type Slot,
} from "@/lib/agent";
import { estimate as priceIt, fmtRange } from "@/lib/pricing";
import { formatHours } from "@/lib/sizer-engine";
import { nextDisplayId } from "@/lib/lifecycle";
import { useAppStore } from "@/lib/store";
import type { ChatTurn, TransferFacts } from "@/lib/types";
import { EASE_ADV, useSafeReducedMotion } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

/* Agent copy per slot — identical script to the Normal build; the rules engine
   in lib/agent picks the question, this only renders it. */
const ASK: Record<Slot, (f: TransferFacts) => string> = {
  size: () =>
    "Hi! I'm the DataDart assistant. I help move large datasets into the cloud, fast, secure and fully tracked. **How much data are you looking to move?**",
  sourceLocation: (f) =>
    `Got it. **${f.sizeTB?.toLocaleString()} TB**. Where does that data live today?`,
  destination: () => "And where should it land?",
  serviceLevel: () =>
    "Want our **White Glove** service, where our engineers handle the data load on site?",
  timeline: () => "When do you need this completed by?",
  frequency: () =>
    "**How often do you run a move like this?** If it repeats, renting the fleet usually beats shipping it back and forth.",
  compliance: () =>
    "Last one. Does this data carry any compliance requirements?",
  complete: () =>
    "That's everything I need. I've saved your draft. You can request a detailed proposal whenever you're ready, and I'll email you a link to pick this up later.",
};

const STARTERS = [
  "800 TB from a data center in Bengaluru to AWS us-east-1",
  "2 PB on-prem to Azure",
  "60 TB from a remote site",
];

export function StartAdvanced() {
  return (
    <Suspense fallback={null}>
      <IntakeConsole />
    </Suspense>
  );
}

/**
 * New transfer — the Advanced intake terminal.
 *
 * Every behaviour is the Normal build's: the same slot-filling agent, the same
 * secret redaction guard, the same estimate trigger, the same mirror into the
 * staff Conversations queue. What changes is the room it happens in — a
 * holographic console with a live scoping panel bolted to its side.
 */
function IntakeConsole() {
  const params = useSearchParams();
  const reduce = useSafeReducedMotion();

  // Generated after mount — nextDisplayId() is random, so deriving it during
  // render would differ between server and client and break hydration.
  const [displayId, setDisplayId] = useState("DD-2026-0000");
  useEffect(() => setDisplayId(nextDisplayId()), []);
  const [facts, setFacts] = useState<TransferFacts>({});
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const seeded = useRef(false);

  const est = useMemo(
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

  const push = useCallback((turn: Omit<ChatTurn, "id" | "at">) => {
    setTurns((t) => [
      ...t,
      { ...turn, id: `${Date.now()}-${Math.random()}`, at: Date.now() },
    ]);
  }, []);

  const pending = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearPending = useCallback(() => {
    pending.current.forEach(clearTimeout);
    pending.current = [];
  }, []);

  const agentSay = useCallback(
    (
      text: string,
      opts?: { chips?: string[]; estimate?: boolean; delay?: number },
    ) => {
      clearPending();
      setTyping(true);
      pending.current.push(
        setTimeout(() => {
          setTyping(false);
          setTurns((prev) => {
            const lastAgent = [...prev].reverse().find((t) => t.role === "agent");
            if (lastAgent?.text === text) return prev;
            return [
              ...prev,
              {
                id: `${Date.now()}-${Math.random()}`,
                role: "agent",
                text,
                chips: opts?.chips,
                estimate: opts?.estimate,
                at: Date.now(),
              },
            ];
          });
        }, opts?.delay ?? 700),
      );
    },
    [clearPending],
  );

  const agentThen = useCallback((after: number, fn: () => void) => {
    pending.current.push(setTimeout(fn, after));
  }, []);

  /* Seed — greeting, or context deep-linked from the Sizer. */
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;

    const size = Number(params.get("size"));
    const source = params.get("source");
    const dest = params.get("dest");
    const sl = params.get("sl") as TransferFacts["serviceLevel"] | null;

    if (size && source && dest) {
      const pre: TransferFacts = {
        sizeTB: size,
        sourceLocation: source,
        destination: dest,
        serviceLevel: sl ?? undefined,
      };
      setFacts(pre);
      agentSay(
        `Welcome back. I've carried over your sizer inputs: **${size.toLocaleString()} TB** from **${source}** to **${dest}**. Let's refine it.`,
        { delay: 400 },
      );
      const slot = nextSlot(pre);
      agentThen(900, () =>
        agentSay(ASK[slot](pre), { chips: SLOT_CHIPS[slot], delay: 900 }),
      );
    } else {
      agentSay(ASK.size({}), { delay: 400 });
    }
  }, [params, agentSay, agentThen]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [turns, typing]);

  // Grow the composer with its content (up to a cap), the way every modern
  // chat does, instead of a single fixed-height line.
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [input]);

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return;
      setInput("");
      clearPending();

      const hadSecret = containsSecret(text);
      const stored = hadSecret ? redactSecrets(text) : text;
      push({ role: "user", text: stored });

      if (hadSecret) {
        agentSay(
          "I've **redacted that from the transcript**. Please don't share keys or bucket paths here. We collect technical details only after your agreement is signed, through a secure, audited channel.",
          { delay: 800 },
        );
        return;
      }

      const before = facts;
      const after = extractFacts(text, before);
      setFacts(after);

      const gainedEstimate = !canEstimate(before) && canEstimate(after);
      const slot = nextSlot(after);

      if (gainedEstimate) {
        const e = priceIt({
          sizeTB: after.sizeTB!,
          source: after.sourceLocation,
          destination: after.destination,
          serviceLevel: after.serviceLevel,
        });

        if (e.recommendOnline) {
          agentSay(
            "Honestly, at under 1 TB you'll be faster over your own connection than waiting on a shipped device. I'd rather tell you that than sell you a transfer. Want me to email a short summary instead?",
            { delay: 900 },
          );
          return;
        }

        agentSay(
          `Here's your ballpark 👉 **${fmtRange(e)}**, completed in **${formatHours(e.sizing.timeline.totalHours)}** door-to-door (vs ${formatHours(e.sizing.comparison.wireHours)} over a ${e.lineSpeedMbps} Mbps line) on **${e.deviceLabel}**.`,
          { estimate: true, delay: 1000 },
        );
        agentThen(1100, () =>
          agentSay(ASK[slot](after), { chips: SLOT_CHIPS[slot], delay: 800 }),
        );
        return;
      }

      if (/schema|oracle|database migration|convert/i.test(text)) {
        agentSay(
          "We move the data itself. Schema conversion stays on your side, though we're happy to introduce a partner. Shall I keep scoping the transfer?",
          { delay: 800 },
        );
        return;
      }

      agentSay(ASK[slot](after), { chips: SLOT_CHIPS[slot], delay: 750 });
    },
    [facts, push, agentSay, agentThen, clearPending],
  );

  /* Mirror the live session into the staff Conversations queue. */
  const upsertConversation = useAppStore((s) => s.upsertConversation);
  const [proposalRequested, setProposalRequested] = useState(false);

  useEffect(() => {
    if (displayId === "DD-2026-0000") return;
    if (!turns.some((t) => t.role === "user")) return;

    upsertConversation({
      displayId,
      source: params.get("src") === "awsmp" ? "awsmp" : "direct",
      state: proposalRequested
        ? "contact-captured"
        : est
          ? "estimate-shown"
          : "active",
      facts,
      lastActiveAt: "live now",
      estimateRange: est ? { min: est.min, max: est.max } : undefined,
      summary: est
        ? {
            deviceLabel: est.deviceLabel,
            totalHours: Math.round(est.sizing.timeline.totalHours),
          }
        : undefined,
      transcript: turns.map((t) => ({ role: t.role, text: t.text })),
    });
  }, [displayId, facts, turns, est, proposalRequested, params, upsertConversation]);

  const summary = (
    <TransferSummary
      facts={facts}
      displayId={displayId}
      estimate={est}
      onEdit={(key) => {
        setFacts((f) => ({ ...f, [key]: undefined }));
        agentSay("No problem, what should it be instead?", { delay: 400 });
      }}
      /* Routed through `send` rather than setting the fact directly: choosing a
         cadence in the panel is the same answer as typing it, so it should
         leave the same trace in the transcript and advance the same slot. */
      onCadence={(cadence) => send(cadence)}
      onRequestProposal={() => {
        setProposalRequested(true);
        toast.success("Draft saved", {
          description: `${displayId}: we'll email a resumable link and your proposal.`,
        });
      }}
    />
  );

  return (
    <div className="flex h-[calc(100dvh-12rem)] min-h-[34rem] flex-col">
      {/* Header */}
      <header className="flex items-center justify-between gap-3 border-b border-hair pb-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <AssistantMark size={30} className="shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold">DataDart assistant</p>
            <p className="mt-0.5 inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <LiveDot tone="success" />
              {typing ? "typing" : "online"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setSummaryOpen(true)}
            className="btn-ghost-hud inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium"
          >
            <FileText className="size-3.5" /> Transfer summary
            {est ? ` (${fmtRange(est)})` : ""}
          </button>
          <button
            type="button"
            onClick={() =>
              toast.success("Connecting you to a specialist", {
                description: "Someone from the team will join this chat shortly.",
              })
            }
            className="btn-ghost-hud hidden items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium sm:inline-flex"
          >
            <Headphones className="size-3.5" /> Talk to a human
          </button>
        </div>
      </header>

      {/* Conversation */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-1 py-6">
          <AnimatePresence initial={false}>
            {turns.map((turn) => (
              <motion.div
                key={turn.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: EASE_ADV }}
                className={cn(
                  "flex flex-col gap-3",
                  turn.role === "user" ? "items-end" : "items-start",
                )}
              >
                {turn.role === "agent" ? (
                  <div className="flex w-full items-start gap-3">
                    <AssistantMark size={26} className="mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1 pt-0.5 text-[14px] leading-relaxed text-ink">
                      <Markdown text={turn.text} />
                    </div>
                  </div>
                ) : (
                  <div className="max-w-[85%] rounded-2xl bg-[color-mix(in_oklab,var(--plasma)_13%,transparent)] px-4 py-2.5 text-[14px] leading-relaxed text-ink ring-1 ring-inset ring-[color-mix(in_oklab,var(--plasma)_24%,transparent)]">
                    <Markdown text={turn.text} />
                  </div>
                )}

                {turn.estimate && est && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, ease: EASE_ADV }}
                    className="w-full max-w-md pl-9"
                  >
                    <EstimateCard estimate={est} compact />
                  </motion.div>
                )}

                {turn.chips && turn.chips.length > 0 && (
                  <div className="flex flex-wrap gap-2 pl-9">
                    {turn.chips.map((chip, i) => (
                      <motion.button
                        key={chip}
                        type="button"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.08 + i * 0.04, ease: EASE_ADV }}
                        onClick={() => send(chip)}
                        className="rounded-full bg-[color-mix(in_oklab,var(--plasma)_10%,transparent)] px-3.5 py-1.5 text-[12px] font-medium text-(--plasma) ring-1 ring-inset ring-[color-mix(in_oklab,var(--plasma)_30%,transparent)] transition-colors hover:bg-[color-mix(in_oklab,var(--plasma)_18%,transparent)]"
                      >
                        {chip}
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {typing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3"
            >
              <AssistantMark size={26} className="shrink-0" />
              <span className="flex items-center gap-1">
                {[0, 1, 2].map((n) => (
                  <motion.span
                    key={n}
                    animate={
                      reduce ? undefined : { y: [0, -3, 0], opacity: [0.4, 1, 0.4] }
                    }
                    transition={{ duration: 0.9, repeat: Infinity, delay: n * 0.15 }}
                    className="size-1.5 rounded-full bg-muted-foreground"
                  />
                ))}
              </span>
            </motion.div>
          )}

          {turns.length <= 1 && !typing && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, ease: EASE_ADV }}
              className="pl-9"
            >
              <p className="text-[12px] font-medium text-muted-foreground">
                Or start from a common move
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {STARTERS.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => send(sug)}
                    className="rounded-full bg-muted/60 px-3.5 py-2 text-[12px] font-medium text-muted-foreground ring-1 ring-inset ring-border transition-colors hover:text-foreground hover:ring-[color-mix(in_oklab,var(--plasma)_40%,transparent)]"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Composer */}
      <div className="border-t border-hair pt-3">
        <div className="mx-auto w-full max-w-3xl">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-end gap-2 rounded-2xl bg-[color-mix(in_oklab,var(--muted)_60%,transparent)] px-3 py-2 shadow-[inset_0_0_0_1px_var(--border)] transition-shadow focus-within:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--plasma)_55%,transparent)]"
          >
            <textarea
              ref={taRef}
              id="intake-input"
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  // Read the live value, not the closed-over state, so a fast
                  // type-then-Enter never sends an empty string.
                  send(e.currentTarget.value);
                }
              }}
              placeholder="Message the assistant"
              aria-label="Message the DataDart assistant"
              className="max-h-40 min-h-[2.5rem] min-w-0 flex-1 resize-none bg-transparent px-2 py-2 text-[14px] leading-relaxed outline-none placeholder:text-muted-foreground/70"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send"
              className="btn-plasma mb-0.5 flex size-9 shrink-0 items-center justify-center text-white disabled:pointer-events-none disabled:opacity-40"
            >
              <ArrowUp className="size-4" />
            </button>
          </form>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
            <ShieldCheck className="size-3 text-(--cyo)" />
            Never share credentials or bucket paths in chat, they&apos;re redacted
            automatically.
          </p>
        </div>
      </div>

      {/* Transfer summary lives in a drawer instead of a permanent side panel. */}
      <Sheet open={summaryOpen} onOpenChange={setSummaryOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto p-5 sm:max-w-md">
          <SheetTitle className="sr-only">Transfer summary</SheetTitle>
          {summary}
        </SheetContent>
      </Sheet>
    </div>
  );
}
