"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CreditCard,
  Download,
  FileSignature,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { HoloPanel } from "@/components/advanced/kit/holo-panel";
import { HudLabel, LiveDot, Pill } from "@/components/advanced/kit/hud";
import { Counter } from "@/components/advanced/kit/text";
import { useAppStore, useMounted } from "@/lib/store";
import { bloomSoft, deckStagger, EASE_ADV, useSafeReducedMotion } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

type DocState = "signed" | "open";

/**
 * Proposal, agreement & onboarding — the Advanced signing ceremony.
 *
 * The same three sequential acts as the Normal flow (review → e-sign → pay),
 * the same auto-added DPA when the conversation flagged regulated data, and
 * the same unlock ordering. Acts are staged as ignition modules with a plasma
 * progress spine, and activation fires a seal animation.
 */
export function AgreementAdvanced({ displayId }: { displayId: string }) {
  const orders = useAppStore((s) => s.orders);
  const mounted = useMounted();
  const reduce = useSafeReducedMotion();
  const order = orders.find((o) => o.displayId === displayId);

  const [reviewed, setReviewed] = useState(false);
  const [docs, setDocs] = useState<Record<string, DocState>>(() => ({
    "Rental agreement": "open",
    "Service SLA": "open",
  }));
  const [paid, setPaid] = useState(false);

  if (!mounted) return null;

  if (!order) {
    return (
      <HoloPanel brackets className="mx-auto max-w-2xl px-6 py-20 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
          <FileSignature className="size-6" />
        </span>
        <h1 className="mt-5 text-xl font-semibold tracking-tight">
          Agreement not found
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          No agreement exists for {displayId}.
        </p>
        <Link
          href="/customer/history"
          className="btn-plasma mt-6 inline-flex h-11 items-center px-6 text-[13px] font-medium"
        >
          Back to transfers
        </Link>
      </HoloPanel>
    );
  }

  const allDocs = order.complianceFlags?.length
    ? { ...docs, DPA: docs.DPA ?? "open" }
    : docs;
  const signedAll = Object.values(allDocs).every((s) => s === "signed");
  const total = order.contractValue ?? order.estimate?.min ?? 0;
  const advance = Math.round(total / 2);
  const act = paid ? 3 : signedAll ? 2 : reviewed ? 1 : 0;

  const signNext = () => {
    const next = Object.entries(allDocs).find(([, s]) => s === "open")?.[0];
    if (!next) return;
    setDocs((d) => ({ ...allDocs, ...d, [next]: "signed" }));
    toast.success(`${next} signed`);
  };

  return (
    <motion.div
      variants={deckStagger(0.06)}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-5xl space-y-4"
    >
      {/* header */}
      <motion.div variants={bloomSoft}>
        <Link
          href={`/customer/history/${order.displayId}`}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground coarse:min-h-11"
        >
          <ArrowLeft className="size-3.5" /> {order.displayId}
        </Link>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="text-[2rem] font-semibold leading-none tracking-tight sm:text-[2.4rem]">
            Your proposal
          </h1>
          <Pill tone={paid ? "success" : "warning"} className="gap-1.5">
            {!paid && <LiveDot tone="warning" />}
            {paid
              ? "Active"
              : signedAll
                ? "Awaiting payment"
                : "Awaiting signature"}
          </Pill>
        </div>
        <p className="mt-2 text-[13px] font-medium">
          {order.volumeTB.toLocaleString()} TB
          <span className="mx-1.5 text-muted-foreground/50">·</span>
          {order.source.label}
          <span className="mx-1.5 text-(--plasma)">→</span>
          {order.destination.label}
        </p>

        {/* ceremony spine */}
        <div className="mt-5 flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-1 items-center gap-2">
              <span className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-muted">
                <motion.span
                  initial={false}
                  animate={{ scaleX: act > i ? 1 : act === i ? 0.4 : 0 }}
                  transition={{ duration: 0.6, ease: EASE_ADV }}
                  className="block h-full origin-left rounded-full plasma-fill"
                />
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* ① review */}
        <Act n={1} title="Review proposal" active={!reviewed} done={reviewed}>
          <ul className="space-y-1.5 text-[12.5px] text-muted-foreground">
            <li>Device rental ({order.serviceLevel})</li>
            <li>Protection &amp; insurance</li>
            <li>DT2 port-hours</li>
            <li>Round-trip logistics</li>
          </ul>
          <p className="mt-4 text-[1.6rem] font-semibold leading-none tabular-nums plasma-text">
            <Counter value={total} prefix="$" />
          </p>
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Valid for 30 days · rate card {order.estimate?.ratesVersion}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => toast.success("Proposal PDF downloaded")}
              className="btn-ghost-hud inline-flex h-9 items-center gap-1.5 px-4 text-[13px] font-medium"
            >
              <Download className="size-3.5" /> PDF
            </button>
            {!reviewed && (
              <button
                type="button"
                onClick={() => setReviewed(true)}
                className="btn-plasma inline-flex h-9 items-center gap-1.5 px-4 text-[13px] font-medium"
              >
                Accept &amp; continue <ArrowRight className="size-3.5" />
              </button>
            )}
          </div>
        </Act>

        {/* ② sign */}
        <Act
          n={2}
          title="Sign agreements"
          active={reviewed && !signedAll}
          done={signedAll}
          locked={!reviewed}
        >
          <ul className="space-y-2">
            {Object.entries(allDocs).map(([name, state]) => (
              <li
                key={name}
                className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-3 py-2 ring-1 ring-inset ring-border/60"
              >
                <span className="min-w-0 truncate text-[12.5px] font-medium">
                  {name}
                  {name === "DPA" && (
                    <span className="ml-1.5 text-[10px] text-muted-foreground">
                      (auto-added)
                    </span>
                  )}
                </span>
                <Pill tone={state === "signed" ? "success" : "warning"}>
                  {state}
                </Pill>
              </li>
            ))}
          </ul>
          {reviewed && !signedAll && (
            <button
              type="button"
              onClick={signNext}
              className="btn-plasma mt-4 inline-flex h-10 w-full items-center justify-center gap-2 text-[13px] font-medium"
            >
              <FileSignature className="size-3.5" /> Sign next document
            </button>
          )}
          <p className="mt-3.5 text-[10px] leading-relaxed text-muted-foreground">
            E-signature handled by our signing provider; signed copies land on
            your Documents tab.
          </p>
        </Act>

        {/* ③ pay */}
        <Act
          n={3}
          title="Pay advance & activate"
          active={signedAll && !paid}
          done={paid}
          locked={!signedAll}
        >
          <p className="text-[12.5px] text-muted-foreground">
            50% advance — invoice auto-issued on final signature.
          </p>
          <p className="mt-3 text-[1.6rem] font-semibold leading-none tabular-nums plasma-text">
            <Counter value={advance} prefix="$" />
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            Unlocks device provisioning, shipment scheduling and secure
            credential collection.
          </p>
          {signedAll && !paid && (
            <button
              type="button"
              onClick={() => {
                setPaid(true);
                toast.success("Payment received — order activated", {
                  description: "Provisioning starts now.",
                });
              }}
              className="btn-plasma mt-4 inline-flex h-10 w-full items-center justify-center gap-2 text-[13px] font-medium"
            >
              <CreditCard className="size-3.5" /> Pay invoice
            </button>
          )}
        </Act>
      </div>

      {/* credentials-after-activation notice */}
      <motion.div variants={bloomSoft}>
        <HoloPanel className="flex items-start gap-3 p-4">
          <Lock className="mt-0.5 size-4 shrink-0 text-(--plasma)" />
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">
              Only after activation
            </span>{" "}
            do we collect technical details — endpoints, credentials and site
            readiness — through a secure onboarding checklist with an encrypted,
            audited vault. Never in chat, never by email.
          </p>
        </HoloPanel>
      </motion.div>

      {/* activation seal */}
      <AnimatePresence>
        {paid && (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: EASE_ADV }}
          >
            <HoloPanel
              plain
              variant="plasma"
              sheen
              className="relative flex flex-wrap items-center justify-between gap-4 overflow-hidden p-6 text-white"
            >
              <span aria-hidden className="sheen" />
              <span aria-hidden className="hud-dots absolute inset-0 opacity-20" />
              <p className="relative flex items-center gap-3 text-sm font-semibold">
                <span className="relative grid size-11 place-items-center rounded-full bg-white/15 ring-1 ring-inset ring-white/30">
                  {!reduce && (
                    <span className="adv-ping absolute inset-0 rounded-full bg-white/40" />
                  )}
                  <ShieldCheck className="relative size-5" />
                </span>
                Order active — provisioning has started.
              </p>
              <Link
                href={`/customer/history/${order.displayId}`}
                className="relative inline-flex h-11 items-center gap-2 rounded-full bg-white/12 px-6 text-[13px] font-medium ring-1 ring-inset ring-white/35 transition-colors hover:bg-white/22"
              >
                Track your transfer <ArrowRight className="size-4" />
              </Link>
            </HoloPanel>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** One ignition module in the ceremony. */
function Act({
  n,
  title,
  active,
  done,
  locked,
  children,
}: {
  n: number;
  title: string;
  active?: boolean;
  done?: boolean;
  locked?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.div variants={bloomSoft}>
      <HoloPanel
        plain
        live={active}
        className={cn(
          "flex h-full flex-col p-5 transition-opacity duration-500",
          locked && "opacity-50",
        )}
      >
        <div className="mb-4 flex items-center gap-2.5">
          <span
            className={cn(
              "grid size-7 shrink-0 place-items-center rounded-full text-[11px] font-bold transition-colors",
              done || active
                ? "plasma-fill text-white shadow-[0_0_18px_-4px_color-mix(in_oklab,var(--plasma)_95%,transparent)]"
                : "bg-muted text-muted-foreground",
            )}
          >
            {done ? <Check className="size-3.5" strokeWidth={3} /> : n}
          </span>
          <HudLabel className={cn(active && "text-(--plasma)")}>
            {title}
          </HudLabel>
        </div>
        {children}
      </HoloPanel>
    </motion.div>
  );
}
