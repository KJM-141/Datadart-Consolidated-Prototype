"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { format } from "date-fns";
import { ArrowRight, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/shared/date-picker";
import { Label } from "./kit";
import { nextDisplayId } from "@/lib/lifecycle";
import { PATHS } from "@/lib/nav";
import { estimate as priceIt, fmtRange } from "@/lib/pricing";
import { useAppStore } from "@/lib/store";
import type { EndpointDetails, TransferOrder } from "@/lib/types";
import { emptyAddress } from "@/components/shared/address-fields";
import { emptyContact } from "@/components/shared/contact-fields";
import { EASE_ADV } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

/**
 * ── Raise an order ────────────────────────────────────────────────────────
 *
 * One screen, five fields, one button.
 *
 * This replaces a five-step wizard that asked for a full postal address, a
 * named contact, rack space, network interface, NIC port availability, port
 * count, PCIe and RDMA — for *both* endpoints — before it would let you raise
 * anything. Twenty-odd required fields and four "Next" clicks to reach a stage
 * called **Proposal**.
 *
 * None of that belongs here. The lifecycle already has a stage whose entire
 * job is collecting it: Onboarding is "site readiness, shipping windows and
 * secure credential collection", and it runs *after* the proposal is accepted.
 * Asking for RDMA availability before anyone has agreed a price is asking the
 * customer to do the work of qualifying themselves out.
 *
 * So this collects only what pricing genuinely needs — volume, both ends, the
 * window, and whether our engineers are on site — quotes immediately as you
 * type, and hands the rest to Onboarding. The estimate updating live is the
 * point: you can see the number move before you commit to anything.
 */

type Service = "Self-managed" | "White Glove";

/** A minimal endpoint. The address and contact are filled at Onboarding. */
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

export function RaiseOrder({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const addOrder = useAppStore((s) => s.addOrder);
  const router = useRouter();

  const [volume, setVolume] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [moveBy, setMoveBy] = useState<Date>();
  const [service, setService] = useState<Service>("Self-managed");
  const [busy, setBusy] = useState(false);

  const sizeTB = Number(volume);
  const priced = sizeTB > 0;

  const est = useMemo(
    () =>
      priced
        ? priceIt({ sizeTB, source: from, destination: to, serviceLevel: service })
        : undefined,
    [priced, sizeTB, from, to, service],
  );

  const valid = priced && from.trim() && to.trim() && moveBy;

  const reset = () => {
    setVolume("");
    setFrom("");
    setTo("");
    setMoveBy(undefined);
    setService("Self-managed");
  };

  const submit = async () => {
    if (!valid || !est) return;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 650));

    const displayId = nextDisplayId();
    const today = format(new Date(), "yyyy-MM-dd");

    const order: TransferOrder = {
      id: crypto.randomUUID(),
      displayId,
      createdAt: today,
      volumeTB: sizeTB,
      availableFrom: today,
      moveBy: format(moveBy!, "yyyy-MM-dd"),
      inPersonAssist: service === "White Glove",
      serviceLevel: service,
      source: endpoint(from),
      destination: endpoint(to),
      stage: "Proposal",
      stageHistory: [
        { stage: "Proposal", at: today, owner: "Sales — awaiting review" },
      ],
      progress: 0,
      estimate: { min: est.min, max: est.max, ratesVersion: est.ratesVersion },
      documents: [
        { type: "Proposal", status: "pending", availableAtStage: "Proposal" },
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
        { label: "Advance (50%)", amount: Math.round(est.min / 2), status: "scheduled" },
        {
          label: "Balance (50%)",
          amount: Math.round(est.min / 2),
          status: "scheduled",
          dueAtStage: "Verification",
        },
      ],
      source_attribution: "direct",
    };

    addOrder(order);
    setBusy(false);
    reset();
    onOpenChange(false);

    toast.success(`${displayId} raised`, {
      description: "We'll collect site and network detail at Onboarding.",
      action: {
        label: "Track",
        onClick: () => router.push(PATHS.transfer(displayId)),
      },
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-[60] bg-canvas/65 backdrop-blur-[2px]"
          />
          <motion.div
            role="dialog"
            aria-label="Raise an order"
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.985 }}
            transition={{ duration: 0.26, ease: EASE_ADV }}
            className="fixed left-1/2 top-1/2 z-[61] w-[min(34rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl bg-elev shadow-[var(--shadow-lift)] ring-1 ring-inset ring-hair"
          >
            <header className="flex items-center justify-between gap-3 border-b border-hair px-4 py-3">
              <h2 className="text-[13px] font-semibold">Raise an order</h2>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                aria-label="Close"
                className="grid size-7 place-items-center rounded-md text-ink-3 transition-colors hover:bg-sunk hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </header>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
              className="px-4 py-4"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label className="mb-1.5">How much</Label>
                  <div className="relative">
                    <Input
                      autoFocus
                      inputMode="numeric"
                      value={volume}
                      onChange={(e) =>
                        setVolume(e.target.value.replace(/[^\d.]/g, ""))
                      }
                      placeholder="800"
                      aria-label="Volume in terabytes"
                      className="pr-10"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[11px] text-ink-3">
                      TB
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="mb-1.5">From</Label>
                  <Input
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    placeholder="Bengaluru, IN"
                    aria-label="Source"
                  />
                </div>

                <div>
                  <Label className="mb-1.5">To</Label>
                  <Input
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    placeholder="AWS — us-east-1"
                    aria-label="Destination"
                  />
                </div>

                <div>
                  <Label className="mb-1.5">Needed by</Label>
                  <DatePicker
                    value={moveBy}
                    onChange={setMoveBy}
                    placeholder="Pick a date"
                    disabled={(d) => d < new Date()}
                    className="w-full"
                  />
                </div>

                <div>
                  <Label className="mb-1.5">Service</Label>
                  <div className="flex h-9 gap-1">
                    {(["Self-managed", "White Glove"] as Service[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setService(s)}
                        className={cn(
                          "flex-1 rounded-lg px-2 text-[11.5px] font-medium ring-1 ring-inset transition-colors",
                          service === s
                            ? "bg-accent text-ink ring-[color-mix(in_oklab,var(--plasma)_38%,transparent)]"
                            : "text-ink-3 ring-hair hover:text-ink",
                        )}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Priced as you type. The number moving is what makes this one
                  screen rather than a form you submit and wait on. */}
              <div className="mt-4 flex items-center justify-between gap-3 rounded-lg bg-sunk px-3 py-2.5 ring-1 ring-inset ring-hair">
                <div className="min-w-0">
                  <Label>Ballpark</Label>
                  <p className="mt-1 truncate text-[15px] font-semibold tabular-nums">
                    {est ? fmtRange(est) : "—"}
                  </p>
                </div>
                {est && (
                  <p className="shrink-0 text-right font-mono text-[10.5px] text-ink-3">
                    {est.deviceLabel}
                    <br />
                    {est.weeks} week{est.weeks === 1 ? "" : "s"} door to door
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={!valid || busy}
                className="btn-plasma mt-4 inline-flex h-11 w-full items-center justify-center gap-2 text-[13px] font-medium text-white disabled:pointer-events-none disabled:opacity-40"
              >
                {busy ? (
                  "Raising…"
                ) : (
                  <>
                    <Check className="size-4" /> Raise order
                  </>
                )}
              </button>

              <p className="mt-2.5 text-center text-[10.5px] leading-relaxed text-ink-3">
                Site addresses, contacts and network detail are collected at
                Onboarding, once you accept the proposal.
              </p>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** The trigger, so callers do not each invent their own button. */
export function RaiseOrderButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn-plasma inline-flex h-9 items-center gap-2 px-4 text-[12.5px] font-medium text-white"
    >
      Raise an order
      <ArrowRight className="size-3.5" />
    </button>
  );
}
