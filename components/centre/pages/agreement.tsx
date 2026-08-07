"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Check,
  Download,
  FileSignature,
  FileText,
  Lock,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Block, Dot, Facts, Note, PageHead, Tag } from "../kit";
import { PATHS } from "@/lib/nav";
import { fmtUSD } from "@/lib/pricing";
import { useAppStore, useMounted } from "@/lib/store";
import { bloomSoft, deckStagger, EASE_ADV } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

/**
 * ── Proposal, agreement and activation ────────────────────────────────────
 *
 * Three acts in order: review it, sign it, pay the advance.
 *
 * The sequence is the point and the page should show it, so each act is a
 * block that unlocks the next. What changed from the previous version is only
 * the register — the display title and the "ignition module" staging are gone,
 * and the acts are blocks like everything else in the console. The gating,
 * the auto-added DPA for regulated data and the activation are unchanged.
 */

type DocState = "signed" | "open";

export function AgreementPage({ displayId }: { displayId: string }) {
  const orders = useAppStore((s) => s.orders);
  const mounted = useMounted();

  const [reviewed, setReviewed] = useState(false);
  const [docs, setDocs] = useState<Record<string, DocState>>({
    "Rental agreement": "open",
    "Service SLA": "open",
  });
  const [paid, setPaid] = useState(false);

  if (!mounted) return null;

  const order = orders.find((o) => o.displayId === displayId);

  if (!order) {
    return (
      <div className="rounded-lg px-6 py-16 text-center ring-1 ring-inset ring-hair">
        <h1 className="text-[17px] font-semibold">Agreement not found</h1>
        <p className="mt-2 text-[12.5px] text-ink-3">
          No agreement exists for {displayId}.
        </p>
        <Link
          href={PATHS.transfers}
          className="btn-plasma mt-5 inline-flex h-10 items-center px-5 text-[12.5px] font-medium text-white"
        >
          Back to transfers
        </Link>
      </div>
    );
  }

  // Regulated data pulls a DPA into the pack automatically.
  const pack: Record<string, DocState> = order.complianceFlags?.length
    ? { ...docs, DPA: docs.DPA ?? "open" }
    : docs;

  const signedAll = Object.values(pack).every((s) => s === "signed");
  const total = order.contractValue ?? order.estimate?.min ?? 0;
  const advance = Math.round(total / 2);
  const act = paid ? 3 : signedAll ? 2 : reviewed ? 1 : 0;

  const signNext = () => {
    const next = Object.entries(pack).find(([, s]) => s === "open")?.[0];
    if (!next) return;
    setDocs({ ...pack, [next]: "signed" });
    toast.success(`${next} signed`);
  };

  return (
    <>
      <Link
        href={PATHS.transfer(order.displayId)}
        className="mb-4 inline-flex items-center gap-1.5 text-[12px] text-ink-3 transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" /> {order.displayId}
      </Link>

      <PageHead
        eyebrow="Proposal & agreement"
        title="Your proposal"
        description={`${order.volumeTB.toLocaleString()} TB · ${order.source.label} → ${order.destination.label}`}
        action={
          <Tag tone={paid ? "ok" : signedAll ? "info" : "warn"}>
            {paid ? "Active" : signedAll ? "Awaiting payment" : "Awaiting signature"}
          </Tag>
        }
      />

      {/* Three acts, three segments. */}
      <div className="mb-4 flex items-center gap-2">
        {["Review", "Sign", "Activate"].map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <span className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-sunk">
              <motion.span
                initial={false}
                animate={{ scaleX: act > i ? 1 : act === i ? 0.4 : 0 }}
                transition={{ duration: 0.6, ease: EASE_ADV }}
                className="absolute inset-0 origin-left rounded-full plasma-fill"
              />
            </span>
            <span
              className={cn(
                "shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em]",
                act > i ? "text-(--plasma)" : "text-ink-3",
              )}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      <motion.div
        variants={deckStagger(0.05, 0.04)}
        initial="hidden"
        animate="show"
        className="space-y-3"
      >
        {/* ── Act one: review ───────────────────────────────────────── */}
        <motion.div variants={bloomSoft}>
          <Block
            icon={FileText}
            label="The proposal"
            action={
              reviewed ? (
                <Tag tone="ok" icon={Check}>Reviewed</Tag>
              ) : (
                <Tag tone="warn">Step 1</Tag>
              )
            }
          >
            <Facts
              cols={3}
              items={[
                { label: "Volume", value: `${order.volumeTB.toLocaleString()} TB` },
                { label: "Service", value: order.serviceLevel },
                { label: "Contract", value: total ? fmtUSD(total) : "—" },
              ]}
            />

            <div className="flex flex-wrap items-center gap-3 border-t border-hair px-4 py-3">
              <button
                type="button"
                onClick={() => toast.success("Proposal PDF downloaded")}
                className="inline-flex h-9 items-center gap-2 rounded-lg px-3.5 text-[12px] font-medium text-ink-2 ring-1 ring-inset ring-hair transition-colors hover:text-ink"
              >
                <Download className="size-3.5" /> Download PDF
              </button>

              {!reviewed && (
                <button
                  type="button"
                  onClick={() => setReviewed(true)}
                  className="btn-plasma inline-flex h-9 items-center px-4 text-[12px] font-medium text-white"
                >
                  I&apos;ve reviewed this
                </button>
              )}
            </div>
          </Block>
        </motion.div>

        {/* ── Act two: sign ─────────────────────────────────────────── */}
        <motion.div variants={bloomSoft}>
          <Block
            icon={FileSignature}
            label="Signature pack"
            action={
              signedAll ? (
                <Tag tone="ok" icon={Check}>Signed</Tag>
              ) : reviewed ? (
                <Tag tone="warn">Step 2</Tag>
              ) : (
                <Tag tone="mute" icon={Lock}>Locked</Tag>
              )
            }
            className={cn(!reviewed && "opacity-55")}
          >
            <ul className="divide-y divide-hair">
              {Object.entries(pack).map(([name, state]) => (
                <li
                  key={name}
                  className="flex items-center justify-between gap-3 px-4 py-2.5"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Dot tone={state === "signed" ? "ok" : "mute"} />
                    <span className="truncate text-[12.5px]">{name}</span>
                  </span>
                  {state === "signed" ? (
                    <Tag tone="ok" icon={Check}>Signed</Tag>
                  ) : (
                    <Tag tone="mute">Awaiting</Tag>
                  )}
                </li>
              ))}
            </ul>

            {reviewed && !signedAll && (
              <div className="border-t border-hair px-4 py-3">
                <button
                  type="button"
                  onClick={signNext}
                  className="btn-plasma inline-flex h-9 items-center gap-2 px-4 text-[12px] font-medium text-white"
                >
                  <FileSignature className="size-3.5" /> Sign next document
                </button>
              </div>
            )}

            <Note icon={ShieldCheck}>
              E-signatures are timestamped and bound to your account. A
              countersigned copy lands in Documents the moment we sign.
            </Note>
          </Block>
        </motion.div>

        {/* ── Act three: activate ───────────────────────────────────── */}
        <motion.div variants={bloomSoft}>
          <Block
            icon={Wallet}
            label="Advance payment"
            action={
              paid ? (
                <Tag tone="ok" icon={Check}>Settled</Tag>
              ) : signedAll ? (
                <Tag tone="warn">Step 3</Tag>
              ) : (
                <Tag tone="mute" icon={Lock}>Locked</Tag>
              )
            }
            className={cn(!signedAll && "opacity-55")}
          >
            <Facts
              cols={2}
              items={[
                { label: "Advance (50%)", value: advance ? fmtUSD(advance) : "—" },
                {
                  label: "Balance (50%)",
                  value: advance ? fmtUSD(total - advance) : "—",
                  sub: "at Verification",
                },
              ]}
            />

            <div className="border-t border-hair px-4 py-3">
              {paid ? (
                <p className="flex items-center gap-2 text-[12px] text-ink-2">
                  <Check className="size-3.5 text-success" />
                  Paid — this transfer is active and provisioning has started.
                </p>
              ) : (
                <button
                  type="button"
                  disabled={!signedAll}
                  onClick={() => {
                    setPaid(true);
                    toast.success("Payment received — transfer activated", {
                      description: "Provisioning starts today.",
                    });
                  }}
                  className="btn-plasma inline-flex h-10 items-center px-5 text-[12.5px] font-medium text-white disabled:pointer-events-none disabled:opacity-40"
                >
                  Pay {advance ? fmtUSD(advance) : "advance"}
                </button>
              )}
            </div>
          </Block>
        </motion.div>

        {paid && (
          <motion.div variants={bloomSoft}>
            <Link
              href={PATHS.transfer(order.displayId)}
              className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-(--plasma) hover:underline"
            >
              Track {order.displayId}
            </Link>
          </motion.div>
        )}
      </motion.div>
    </>
  );
}
