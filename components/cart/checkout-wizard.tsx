"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { addMonths, differenceInCalendarDays, format, subDays } from "date-fns";
import { ArrowRight, Check, Loader2, Truck, X } from "lucide-react";
import { toast } from "sonner";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/shared/field";
import { WizardStepper } from "@/components/shared/wizard-stepper";
import { DateRangePicker } from "@/components/shared/date-picker";
import {
  AddressFields,
  emptyAddress,
  validateAddress,
} from "@/components/shared/address-fields";
import {
  ContactFields,
  emptyContact,
  validateContact,
} from "@/components/shared/contact-fields";
import { useAppStore } from "@/lib/store";
import { stepSlide } from "@/lib/motion";
import type { DeviceSubscription } from "@/lib/types";
import { Rate } from "@/components/advanced/kit/rate";

const STEPS = ["Time duration", "Shipping location"];

export function CheckoutWizard({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const cart = useAppStore((s) => s.cart);
  const profile = useAppStore((s) => s.profile);
  const addSubscription = useAppStore((s) => s.addSubscription);
  const clearCart = useAppStore((s) => s.clearCart);

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [showErrors, setShowErrors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [placedId, setPlacedId] = useState<string | null>(null);

  const defaultRange: DateRange = useMemo(() => {
    const from = addMonths(new Date(), 0);
    return { from, to: subDays(addMonths(from, 1), 1) };
  }, []);
  const [range, setRange] = useState<DateRange | undefined>(defaultRange);

  const [address, setAddress] = useState(() => ({
    ...emptyAddress(),
    ...profile.address,
  }));
  const [contact, setContact] = useState(() => ({
    ...emptyContact(),
    name: `${profile.firstName} ${profile.lastName}`.trim(),
    email: profile.email,
    phone: `${profile.countryCode} ${profile.phone}`.trim(),
  }));

  const monthlyTotal = cart.reduce((sum, i) => sum + i.monthlyRate * i.qty, 0);
  const days =
    range?.from && range?.to
      ? differenceInCalendarDays(range.to, range.from) + 1
      : 0;
  const months = days > 0 ? Math.max(1, Math.ceil(days / 30)) : 0;

  const stepValid =
    step === 0
      ? !!range?.from && !!range?.to
      : !validateAddress(address) && !validateContact(contact);

  const goNext = () => {
    if (!stepValid) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setDirection(1);
    setStep(1);
  };

  const submit = async () => {
    if (!stepValid) {
      setShowErrors(true);
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));

    const id = `SUB-${Math.floor(1100 + Math.random() * 90)}`;
    const sub: DeviceSubscription = {
      id,
      createdAt: format(new Date(), "yyyy-MM-dd"),
      items: cart.map((c) => ({
        productSlug: c.productSlug,
        model: c.model,
        capacityTB: c.capacityTB,
        qty: c.qty,
        monthlyRate: c.monthlyRate,
      })),
      startDate: format(range!.from!, "yyyy-MM-dd"),
      endDate: format(range!.to!, "yyyy-MM-dd"),
      shipping: address,
      contact,
      monthlyTotal,
      status: "Processing",
    };
    addSubscription(sub);
    clearCart();
    setSubmitting(false);
    setPlacedId(id);
    toast.success("Subscription raised successfully!", {
      description: `${id}, ${format(range!.from!, "dd MMM")} → ${format(range!.to!, "dd MMM yy")}`,
    });
  };

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next && placedId) {
      setPlacedId(null);
      setStep(0);
      setShowErrors(false);
      setRange(defaultRange);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[min(680px,94dvh)] w-[min(880px,96vw)] max-w-none flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-none sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b px-5 py-4 sm:px-7">
          <div>
            <DialogTitle className="text-lg font-semibold">
              Raise Subscription
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              {placedId
                ? "Subscription submitted"
                : `Step ${step + 1} of 2, ${STEPS[step]}`}
            </p>
          </div>
          <button
            onClick={() => close(false)}
            aria-label="Close"
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4.5" />
          </button>
        </div>

        {placedId ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-14 text-center">
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 16 }}
              className="relative"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-brand opacity-30 blur-2xl" />
              <div className="relative flex size-20 items-center justify-center rounded-full bg-gradient-brand text-white shadow-brand">
                <Truck className="size-8" strokeWidth={2.2} />
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="space-y-1.5"
            >
              <h3 className="text-xl font-semibold">
                Subscription {placedId} raised
              </h3>
              <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                Your devices are being prepared for shipment to{" "}
                {address.city || "your destination"}. Track it under
                Subscription → Active.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                onClick={() => close(false)}
                className="btn-brand mt-2 rounded-full px-8 font-semibold"
              >
                Done
              </Button>
            </motion.div>
          </div>
        ) : (
          <>
            <div className="border-b px-5 py-3 sm:px-7">
              <WizardStepper
                steps={STEPS}
                current={step}
                orientation="horizontal"
                onStepClick={(i) => {
                  setDirection(-1);
                  setStep(i);
                }}
                className="mx-auto max-w-sm"
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-7">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div key={step} {...stepSlide(direction)}>
                  {step === 0 ? (
                    <div className="mx-auto max-w-lg space-y-5">
                      <Field
                        label="Time duration"
                        required
                        hint="Rental period for all devices in this subscription. Defaults to one month."
                        error={
                          showErrors && !(range?.from && range?.to)
                            ? "Select the rental period"
                            : undefined
                        }
                      >
                        <DateRangePicker
                          value={range}
                          onChange={setRange}
                          className="w-full"
                        />
                      </Field>

                      <div className="rounded-2xl border bg-card p-4">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Estimated cost
                        </p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Monthly rate ({cart.length} item
                              {cart.length !== 1 ? "s" : ""})
                            </span>
                            <span className="font-medium tabular-nums">
                              <Rate usd={monthlyTotal} />
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Duration
                            </span>
                            <span className="font-medium tabular-nums">
                              {days > 0
                                ? `${days} days (${months} billing month${months !== 1 ? "s" : ""})`
                                : "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between border-t pt-2 text-base">
                            <span className="font-semibold">Estimated total</span>
                            <motion.span
                              key={monthlyTotal * months}
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="font-semibold tabular-nums text-gradient-brand"
                            >
                              <Rate usd={monthlyTotal * months} unit="" />
                            </motion.span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <section className="rounded-2xl border bg-card p-5">
                        <h3 className="mb-4 text-sm font-semibold">
                          Shipping Location Details
                        </h3>
                        <AddressFields
                          value={address}
                          onChange={setAddress}
                          errors={
                            showErrors
                              ? (validateAddress(address) ?? undefined)
                              : undefined
                          }
                          idPrefix="ship"
                        />
                      </section>
                      <section className="rounded-2xl border bg-card p-5">
                        <h3 className="mb-4 text-sm font-semibold">
                          Contact person <span className="text-destructive">*</span>
                        </h3>
                        <ContactFields
                          value={contact}
                          onChange={setContact}
                          errors={
                            showErrors
                              ? (validateContact(contact) ?? undefined)
                              : undefined
                          }
                          idPrefix="ship-c"
                        />
                      </section>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-between gap-3 border-t px-5 py-4 sm:px-7">
              <p className="hidden text-xs text-muted-foreground sm:block">
                All fields marked with an asterisk (*) are mandatory.
              </p>
              <div className="flex w-full justify-end gap-3 sm:w-auto">
                <Button
                  variant="outline"
                  onClick={
                    step === 0
                      ? () => close(false)
                      : () => {
                          setDirection(-1);
                          setStep(0);
                        }
                  }
                  className="rounded-full px-6"
                >
                  {step === 0 ? "Cancel" : "Back"}
                </Button>
                {step === 0 ? (
                  <Button
                    onClick={goNext}
                    className="btn-brand rounded-full px-7 font-semibold"
                  >
                    Continue <ArrowRight className="size-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={submit}
                    disabled={submitting}
                    className="btn-brand rounded-full px-8 font-semibold tracking-wide"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> Placing…
                      </>
                    ) : (
                      <>
                        <Check className="size-4" /> ORDER
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
