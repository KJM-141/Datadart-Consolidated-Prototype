"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { format } from "date-fns";
import { Check, Download, Printer, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { Block, Facts, Label, Note } from "./kit";
import { nextDisplayId, STAGES } from "@/lib/lifecycle";
import { PATHS } from "@/lib/nav";
import { fmtRange, fmtUSD, type Estimate } from "@/lib/pricing";
import {
  capacityLabel,
  formatCapacityTB,
  formatHours,
  formatThroughputGBs,
  RAID_LABEL,
  type Sizing,
} from "@/lib/sizer-engine";
import { useAppStore } from "@/lib/store";
import type { EndpointDetails, TransferOrder } from "@/lib/types";
import { emptyAddress } from "@/components/shared/address-fields";
import { emptyContact } from "@/components/shared/contact-fields";
import { EASE_ADV } from "@/lib/advanced-motion";

/**
 * ── The proposal ──────────────────────────────────────────────────────────
 *
 * What the sizer was always one step short of producing.
 *
 * The sizer ended at a price range and a breakdown scattered across three
 * panels — enough to satisfy curiosity, not enough to take to anyone. A
 * proposal is a different artefact: it restates the brief in the customer's own
 * terms so they can check we understood it, commits to a fleet and a timeline,
 * itemises the money, and can be accepted.
 *
 * Everything on it is derived from what the user actually entered. Nothing is
 * asked for twice, and the accept action raises the order directly rather than
 * handing them back to a form.
 */

export interface ProposalInput {
  sizing: Sizing;
  estimate: Estimate;
  source: string;
  destination: string;
  serviceLevel: "Self-managed" | "White Glove";
}

function endpoint(label: string): EndpointDetails {
  const cloud = /aws|azure|gcp|google|oci|ibm/i.test(label);
  return {
    kind: cloud ? "Public cloud" : "Private data centre",
    cloudProvider: cloud
      ? /azure/i.test(label)
        ? "Azure"
        : /gcp|google/i.test(label)
          ? "GCP"
          : /oci/i.test(label)
            ? "OCI"
            : /ibm/i.test(label)
              ? "IBM Cloud"
              : "AWS"
      : undefined,
    location: emptyAddress(),
    contact: emptyContact(),
    label: label.trim(),
  };
}

export function ProposalModal({
  open,
  onOpenChange,
  input,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  input: ProposalInput | null;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onOpenChange(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onOpenChange]);

  if (!mounted) return null;

  /**
   * Portalled to `<body>`, not rendered in place.
   *
   * The sizer's root is a `motion.div`, and Framer sets a `transform` on it —
   * which makes it the containing block for any `position: fixed` descendant.
   * Rendered inline, this "full-screen" modal was clipped to the sizer's own
   * column with the sidebar and bar still showing beside it. Any overlay
   * mounted from inside page content needs this.
   */
  return createPortal(
    <AnimatePresence>
      {open && input && (
        <motion.div
          role="dialog"
          aria-label="Proposal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-[70] flex flex-col bg-canvas"
        >
          <header className="flex shrink-0 items-center justify-between gap-4 border-b border-hair px-5 py-3">
            <Label>Proposal</Label>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
              className="grid size-7 place-items-center rounded-md text-ink-3 transition-colors hover:bg-sunk hover:text-ink"
            >
              <X className="size-4" />
            </button>
          </header>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE_ADV, delay: 0.05 }}
            className="min-h-0 flex-1 overflow-y-auto"
          >
            <div className="mx-auto w-full max-w-4xl px-5 py-8">
              <ProposalDoc input={input} onDone={() => onOpenChange(false)} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function ProposalDoc({
  input,
  onDone,
}: {
  input: ProposalInput;
  onDone?: () => void;
}) {
  const { sizing, estimate: est, source, destination, serviceLevel } = input;
  const { fleet, timeline, comparison, equipment, config, normalized } = sizing;

  const profile = useAppStore((s) => s.profile);
  const addOrder = useAppStore((s) => s.addOrder);
  const router = useRouter();

  // Minted once per mounted proposal, not per render — the reference has to
  // stay the same while someone is reading the document.
  const [reference] = useState(() => nextDisplayId());
  const [issued] = useState(() => new Date());
  const [accepting, setAccepting] = useState(false);

  const advance = Math.round(est.min / 2);
  const validUntil = new Date(issued);
  validUntil.setDate(validUntil.getDate() + 30);

  const accept = async () => {
    setAccepting(true);
    await new Promise((r) => setTimeout(r, 700));

    const today = format(new Date(), "yyyy-MM-dd");
    const order: TransferOrder = {
      id: crypto.randomUUID(),
      displayId: reference,
      createdAt: today,
      volumeTB: Math.round(normalized.dataTB),
      availableFrom: today,
      moveBy: format(validUntil, "yyyy-MM-dd"),
      inPersonAssist: serviceLevel === "White Glove",
      serviceLevel,
      source: endpoint(source),
      destination: endpoint(destination),
      stage: "Proposal",
      stageHistory: [
        { stage: "Proposal", at: today, owner: "Sales — accepted by customer" },
      ],
      progress: 0,
      estimate: { min: est.min, max: est.max, ratesVersion: est.ratesVersion },
      documents: [
        { type: "Proposal", status: "available", availableAtStage: "Proposal" },
        { type: "Rental agreement", status: "pending", availableAtStage: "Onboarding" },
        { type: "Chain of custody", status: "pending", availableAtStage: "Shipment" },
        { type: "Checksum report", status: "pending", availableAtStage: "Verification" },
        {
          type: "Erasure certificate",
          status: "pending",
          availableAtStage: "Certified Erase",
        },
      ],
      payments: [
        { label: "Advance (50%)", amount: advance, status: "due" },
        {
          label: "Balance (50%)",
          amount: est.min - advance,
          status: "scheduled",
          dueAtStage: "Verification",
        },
      ],
      source_attribution: "direct",
    };

    addOrder(order);
    setAccepting(false);
    onDone?.();
    toast.success(`${reference} accepted`, {
      description: "Onboarding starts next — we'll collect site detail there.",
      action: {
        label: "Track",
        onClick: () => router.push(PATHS.transfer(reference)),
      },
    });
    router.push(PATHS.agreement(reference));
  };

  return (
    <div className="space-y-3">
      {/* ── Letterhead ─────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-hair pb-5">
        <div>
          <Logo size="md" href={null} />
          <p className="mt-3 text-[19px] font-semibold leading-tight">
            Proposal for a one-time data transfer
          </p>
          <p className="mt-1 text-[12px] text-ink-3">
            Prepared for {profile.firstName} {profile.lastName}
            {profile.email ? ` · ${profile.email}` : ""}
          </p>
        </div>
        <dl className="text-right text-[11px]">
          <dt className="text-ink-3">Reference</dt>
          <dd className="font-mono text-[13px] font-medium">{reference}</dd>
          <dt className="mt-2 text-ink-3">Issued</dt>
          <dd className="font-mono">{format(issued, "dd MMM yyyy")}</dd>
          <dt className="mt-2 text-ink-3">Valid until</dt>
          <dd className="font-mono">{format(validUntil, "dd MMM yyyy")}</dd>
        </dl>
      </div>

      {/* ── The brief, restated ────────────────────────────────────── */}
      <Block icon={Check} label="What you asked for">
        <Facts
          cols={4}
          items={[
            { label: "Volume", value: formatCapacityTB(normalized.dataTB) },
            { label: "From", value: source },
            { label: "To", value: destination },
            { label: "Service", value: serviceLevel },
          ]}
        />
        <Note>
          If any of this is wrong, change it in the sizer and the proposal
          re-issues — nothing here is locked until you accept.
        </Note>
      </Block>

      {/* ── What we will do ────────────────────────────────────────── */}
      <Block
        icon={ShieldCheck}
        label="What we will do"
        action={
          <span className="text-[10px] text-ink-3">
            {fleet.grouped
              .map((g) => `${g.count}×${capacityLabel(g.capacityTB)}`)
              .join(" + ")}
          </span>
        }
      >
        <Facts
          cols={4}
          items={[
            { label: "Fleet", value: `${fleet.count}× ${equipment.name}` },
            { label: "Usable", value: formatCapacityTB(fleet.usableTB) },
            { label: "Protection", value: RAID_LABEL[config.raidConfig] },
            {
              label: "Throughput",
              value: formatThroughputGBs(
                config.encryptionEnabled
                  ? config.effectiveThroughputGBs
                  : config.baseThroughputGBs,
              ),
            },
          ]}
        />

        <div className="border-t border-hair px-4 py-3.5">
          <Label className="mb-2">Timeline</Label>
          <ul className="space-y-1.5">
            {[
              ["Ingress — writing to the device", timeline.ingressHours],
              ["Transit", timeline.travelHours],
              ["Egress — landing in your cloud", timeline.egressHours],
            ].map(([label, hours]) => (
              <li
                key={label as string}
                className="flex items-baseline justify-between gap-3 text-[12px]"
              >
                <span className="text-ink-2">{label as string}</span>
                <span className="font-mono tabular-nums">
                  {formatHours(hours as number)}
                </span>
              </li>
            ))}
            <li className="flex items-baseline justify-between gap-3 border-t border-hair pt-1.5 text-[12px] font-medium">
              <span>Door to door</span>
              <span className="font-mono tabular-nums">
                {formatHours(timeline.totalHours)}
              </span>
            </li>
          </ul>

          <p className="mt-3 text-[11.5px] leading-relaxed text-ink-3">
            Over a {est.lineSpeedMbps} Mbps line the same payload would take{" "}
            {formatHours(comparison.wireHours)}.
          </p>
        </div>

        <Fold10 />
      </Block>

      {/* ── Commercials ────────────────────────────────────────────── */}
      <Block
        icon={Printer}
        label="Commercials"
        action={
          <span className="text-[10px] text-ink-3">
            Rate card {est.ratesVersion}
          </span>
        }
      >
        <ul className="divide-y divide-hair">
          {est.breakdown.map((b) => (
            <li
              key={b.label}
              className="flex items-baseline justify-between gap-4 px-4 py-2.5"
            >
              <span className="min-w-0 text-[12.5px] text-ink-2">{b.label}</span>
              <span className="shrink-0 font-mono text-[12.5px] tabular-nums">
                {fmtUSD(b.amount)}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex items-baseline justify-between gap-4 border-t border-hair px-4 py-3">
          <span className="text-[12.5px] font-medium">Quoted range</span>
          <span className="text-[16px] font-semibold tabular-nums">
            {fmtRange(est)}
          </span>
        </div>

        <div className="border-t border-hair px-4 py-3.5">
          <Label className="mb-2">Payment schedule</Label>
          <ul className="space-y-1.5">
            <li className="flex items-baseline justify-between gap-3 text-[12px]">
              <span className="text-ink-2">Advance (50%) — on acceptance</span>
              <span className="font-mono tabular-nums">{fmtUSD(advance)}</span>
            </li>
            <li className="flex items-baseline justify-between gap-3 text-[12px]">
              <span className="text-ink-2">
                Balance (50%) — at {STAGES[7]}
              </span>
              <span className="font-mono tabular-nums">
                {fmtUSD(est.min - advance)}
              </span>
            </li>
          </ul>
        </div>

        <Note icon={ShieldCheck}>
          Line items are fixed at signature. Transit and port-hour costs do not
          re-price mid-transfer, including if a round runs long.
        </Note>
      </Block>

      {sizing.warnings.length > 0 && (
        <div className="rounded-lg bg-[color-mix(in_oklab,var(--warning)_8%,transparent)] px-4 py-3 ring-1 ring-inset ring-[color-mix(in_oklab,var(--warning)_32%,transparent)]">
          <Label className="mb-1">Worth knowing</Label>
          <p className="text-[12px] leading-relaxed text-ink-2">
            {sizing.warnings[0]}
          </p>
        </div>
      )}

      {/* ── Accept ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="button"
          onClick={accept}
          disabled={accepting}
          className="btn-plasma inline-flex h-11 items-center gap-2 px-6 text-[13px] font-medium text-white disabled:opacity-50"
        >
          {accepting ? "Accepting…" : "Accept and continue"}
        </button>
        <button
          type="button"
          onClick={() =>
            toast.success("Proposal sent", {
              description: `${reference} is on its way to ${profile.email || "your inbox"}.`,
            })
          }
          className="inline-flex h-11 items-center gap-2 rounded-lg px-4 text-[12.5px] font-medium text-ink-2 ring-1 ring-inset ring-hair transition-colors hover:text-ink"
        >
          <Download className="size-3.5" /> Email me a copy
        </button>
        <p className="text-[11px] text-ink-3">
          Accepting raises {reference} and moves you to signature.
        </p>
      </div>
    </div>
  );
}

/** The ten stages, folded — reference rather than news. */
function Fold10() {
  return (
    <div className="border-t border-hair px-4 py-3.5">
      <Label className="mb-2">The ten stages</Label>
      <ol className="flex flex-wrap gap-x-3 gap-y-1">
        {STAGES.map((s, i) => (
          <li key={s} className="text-[11px] text-ink-3">
            <span className="font-mono">{i + 1}</span> {s}
            {i < STAGES.length - 1 && <span className="ml-3 text-hair">·</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}
