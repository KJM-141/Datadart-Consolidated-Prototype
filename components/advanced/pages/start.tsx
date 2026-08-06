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
import { ArrowUp, Headphones, ShieldCheck, Terminal } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AssistantMark } from "@/components/brand/assistant-mark";
import { Markdown } from "@/components/shared/markdown";
import { TransferSummary } from "@/components/intake/transfer-summary";
import { EstimateCard } from "@/components/pricing/estimate-card";
import { HoloPanel } from "@/components/advanced/kit/holo-panel";
import { HudLabel, LiveDot } from "@/components/advanced/kit/hud";
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
import { LogoMark } from "@/components/brand/logo-mark";

/* Agent copy per slot — identical script to the Normal build; the rules engine
   in lib/agent picks the question, this only renders it. */
const ASK: Record<Slot, (f: TransferFacts) => string> = {
  size: () =>
    "Hi! I'm the DataDart assistant. I help move large datasets into the cloud — fast, secure, fully tracked. **How much data are you looking to move?**",
  sourceLocation: (f) =>
    `Got it — **${f.sizeTB?.toLocaleString()} TB**. Where does that data live today?`,
  destination: () => "And where should it land?",
  serviceLevel: () =>
    "Want our **White Glove** service, where our engineers handle the data load on site?",
  timeline: () => "When do you need this completed by?",
  compliance: () =>
    "Last one — does this data carry any compliance requirements?",
  complete: () =>
    "That's everything I need. I've saved your draft — you can request a detailed proposal whenever you're ready, and I'll email you a link to pick this up later.",
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
  const [displayId, setDisplayId] = useState("DD-2026-····");
  useEffect(() => setDisplayId(nextDisplayId()), []);
  const [facts, setFacts] = useState<TransferFacts>({});
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [typing, setTyping] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
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
        `Welcome back — I've carried over your sizer inputs: **${size.toLocaleString()} TB** from **${source}** to **${dest}**. Let's refine it.`,
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
          "I've **redacted that from the transcript** — please don't share keys or bucket paths here. We collect technical details only after your agreement is signed, through a secure, audited channel.",
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
          "We move the data itself — schema conversion stays on your side, though we're happy to introduce a partner. Shall I keep scoping the transfer?",
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
    if (displayId.includes("····")) return;
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
        agentSay("No problem — what should it be instead?", { delay: 400 });
      }}
      onRequestProposal={() => {
        setProposalRequested(true);
        toast.success("Draft saved", {
          description: `${displayId} — we'll email a resumable link and your proposal.`,
        });
      }}
    />
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-7">
      {/* intro */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="size-3.5 text-(--plasma)" />
            <HudLabel>New transfer · session {displayId}</HudLabel>
          </div>
          <h1 className="mt-2 text-[1.9rem] font-semibold leading-[1.05] tracking-tight sm:text-[2.3rem]">
            Let&apos;s scope your move
          </h1>
        </div>
        <p className="max-w-sm text-[13px] leading-relaxed text-muted-foreground">
          Answer a few questions and you&apos;ll have a priced, sized estimate in
          about two minutes — no account required.
        </p>
      </div>

      <HoloPanel
        plain
        className="grid overflow-hidden lg:h-[calc(100dvh-16rem)] lg:min-h-140 lg:grid-cols-[1.35fr_1fr]"
      >
        {/* ── Terminal ─────────────────────────────────────────── */}
        <div className="flex min-h-0 flex-col border-border/60 lg:border-r">
          <div className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-3.5 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <span className="relative grid size-9 shrink-0 place-items-center rounded-full">
                {!reduce && (
                  <span className="adv-orbit absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent,var(--plasma),var(--cyo),transparent)]" />
                )}
                <span className="absolute inset-[2px] grid place-items-center rounded-full bg-card">
                  <AssistantMark size={20} />
                </span>
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold">
                  DataDart assistant
                </p>
                <p className="mt-0.5 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
                  <LiveDot tone="success" />
                  {typing ? "composing" : "online"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                toast.success("Connecting you to a specialist", {
                  description: "Someone from the team will join this chat shortly.",
                })
              }
              className="btn-ghost-hud inline-flex shrink-0 items-center gap-1.5 px-3.5 py-2 text-[13px] font-medium"
            >
              <Headphones className="size-3.5" /> Talk to a human
            </button>
          </div>

          <div
            ref={scrollRef}
            className="min-h-0 flex-1 space-y-3.5 overflow-y-auto px-5 py-5 sm:px-6"
          >
            <AnimatePresence initial={false}>
              {turns.map((turn) => (
                <motion.div
                  key={turn.id}
                  initial={{ opacity: 0, y: 12, filter: "blur(6px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ duration: 0.4, ease: EASE_ADV }}
                  className={cn(
                    "flex flex-col gap-2",
                    turn.role === "user" && "items-end",
                  )}
                >
                  {turn.role === "agent" ? (
                    <div className="flex max-w-[92%] items-start gap-2.5">
                      <AssistantMark size={22} className="mt-2 shrink-0" />
                      <div className="relative overflow-hidden rounded-2xl rounded-tl-sm bg-muted/60 px-4 py-3 text-[13px] leading-relaxed ring-1 ring-inset ring-border">
                        <span
                          aria-hidden
                          className="absolute inset-y-0 left-0 w-[2px] plasma-fill"
                        />
                        <Markdown text={turn.text} />
                      </div>
                    </div>
                  ) : (
                    <div className="relative max-w-[88%] overflow-hidden rounded-2xl rounded-tr-sm plasma-fill px-4 py-3 text-[13px] leading-relaxed text-white shadow-[0_10px_28px_-14px_color-mix(in_oklab,var(--plasma)_95%,transparent)]">
                      <Markdown text={turn.text} />
                    </div>
                  )}

                  {turn.estimate && est && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.18, ease: EASE_ADV }}
                      className="w-full max-w-[88%] lg:hidden"
                    >
                      <EstimateCard estimate={est} compact />
                    </motion.div>
                  )}

                  {turn.chips && turn.chips.length > 0 && (
                    <div className="flex max-w-[92%] flex-wrap gap-1.5 pl-8">
                      {turn.chips.map((chip, i) => (
                        <motion.button
                          key={chip}
                          type="button"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.1 + i * 0.05, ease: EASE_ADV }}
                          onClick={() => send(chip)}
                          className="rounded-full bg-[color-mix(in_oklab,var(--plasma)_12%,transparent)] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-(--plasma) ring-1 ring-inset ring-[color-mix(in_oklab,var(--plasma)_38%,transparent)] transition-all hover:bg-[color-mix(in_oklab,var(--plasma)_22%,transparent)] hover:shadow-[0_0_18px_-6px_color-mix(in_oklab,var(--plasma)_95%,transparent)]"
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
                className="flex items-center gap-2 pl-8"
              >
                <span className="flex h-4 items-end gap-0.5">
                  {[0, 1, 2, 3, 4].map((n) => (
                    <motion.span
                      key={n}
                      animate={
                        reduce
                          ? undefined
                          : { scaleY: [0.3, 1, 0.3], opacity: [0.4, 1, 0.4] }
                      }
                      transition={{
                        duration: 1.1,
                        repeat: Infinity,
                        delay: n * 0.11,
                      }}
                      className="h-3 w-[3px] origin-bottom rounded-full plasma-fill"
                    />
                  ))}
                </span>
                <span className="text-[13px] font-medium text-muted-foreground">
                  agent composing
                </span>
              </motion.div>
            )}

            {turns.length <= 1 && !typing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, ease: EASE_ADV }}
                className="pl-8 pt-2"
              >
                <HudLabel className="flex items-center gap-1.5">
                  <LogoMark size={13} /> Or start from a common move
                </HudLabel>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {STARTERS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-full bg-muted/60 px-3.5 py-2 text-[11px] font-medium text-muted-foreground ring-1 ring-inset ring-border transition-all hover:text-foreground hover:ring-[color-mix(in_oklab,var(--plasma)_45%,transparent)] coarse:py-3"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* composer */}
          <div className="px-5 pb-5 sm:px-6">
            <div className="mb-2 lg:hidden">
              <Sheet>
                <SheetTrigger className="btn-ghost-hud w-full py-2.5 text-[13px] font-medium coarse:py-3">
                  View transfer summary
                  {est ? ` · ${fmtRange(est)}` : ""}
                </SheetTrigger>
                <SheetContent
                  side="bottom"
                  className="max-h-[85dvh] overflow-y-auto p-5"
                >
                  <SheetTitle className="sr-only">Transfer summary</SheetTitle>
                  {summary}
                </SheetContent>
              </Sheet>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="group/composer flex items-center gap-2.5 rounded-full bg-[color-mix(in_oklab,var(--muted)_65%,transparent)] px-4 py-2 shadow-[inset_0_0_0_1px_var(--border)] transition-shadow duration-300 focus-within:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--plasma)_60%,transparent),0_0_26px_-10px_color-mix(in_oklab,var(--plasma)_95%,transparent)]"
            >
              <span className="shrink-0 font-mono text-sm font-bold text-(--plasma)">
                ›
              </span>
              <input
                id="intake-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your answer…"
                aria-label="Message the DataDart assistant"
                className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground/70 coarse:py-3"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                aria-label="Send"
                className="btn-plasma flex size-9 shrink-0 items-center justify-center text-white disabled:pointer-events-none disabled:opacity-40 coarse:size-11"
              >
                <ArrowUp className="size-4" />
              </button>
            </form>
            <p className="mt-2.5 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
              <ShieldCheck className="size-3 text-(--cyo)" />
              Never share credentials or bucket paths in chat — they&apos;re
              redacted automatically.
            </p>
          </div>
        </div>

        {/* ── Live scoping panel ───────────────────────────────── */}
        <aside className="relative hidden min-h-0 overflow-y-auto bg-muted/30 p-5 lg:block">
          <span aria-hidden className="hud-dots pointer-events-none absolute inset-0 opacity-25" />
          {!reduce && (
            <span className="adv-scan pointer-events-none absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,transparent,color-mix(in_oklab,var(--cyo)_12%,transparent),transparent)]" />
          )}
          <div className="relative">{summary}</div>
        </aside>
      </HoloPanel>
    </div>
  );
}
