"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { format } from "date-fns";
import {
  ArrowRight,
  Building2,
  Check,
  Cloud,
  Database,
  Loader2,
  PartyPopper,
  ServerCog,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/shared/field";
import { Segmented } from "@/components/shared/segmented";
import { DatePicker } from "@/components/shared/date-picker";
import { WizardStepper } from "@/components/shared/wizard-stepper";
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
import { RouteArc } from "@/components/brand/route-arc";
import { WorldMap } from "@/components/brand/world-map";
import { citiesToRoute } from "@/lib/routes";
import { CLOUD_PROVIDERS, getCountry } from "@/lib/geo";
import { nextDisplayId } from "@/lib/lifecycle";
import { estimate as priceIt } from "@/lib/pricing";
import { useAppStore } from "@/lib/store";
import { stepSlide } from "@/lib/motion";
import type {
  Address,
  CloudProvider,
  ContactPerson,
  EnvironmentDetails,
  LocationKind,
  TransferOrder,
} from "@/lib/types";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

interface EndpointState {
  kind?: LocationKind;
  cloud?: CloudProvider;
  endpointSupport?: "Yes" | "No";
  address: Address;
  contact: ContactPerson;
}

interface EnvState {
  rack?: string;
  netIface?: string;
  nicPort?: string;
  ports?: string;
  pcie?: string;
  rdma?: string;
}

const emptyEndpoint = (): EndpointState => ({
  address: emptyAddress(),
  contact: emptyContact(),
});

const STEPS = [
  "Data Details",
  "Data source location",
  "Data destination location",
  "Data source environment details",
  "Data destination environment details",
];

const endpointLabel = (e: EndpointState): string => {
  if (e.kind === "Public cloud")
    return `${e.cloud ?? "Cloud"} · ${e.address.city || "cloud"}`;
  const code = e.address.country
    ? (getCountry(e.address.country)?.code ?? "")
    : "";
  return e.address.city ? `${e.address.city}${code ? `, ${code}` : ""}` : "";
};

/* ------------------------------------------------------------------ */
/* Wizard                                                              */
/* ------------------------------------------------------------------ */

export function RaiseOrderWizard({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const addOrder = useAppStore((s) => s.addOrder);

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [placedId, setPlacedId] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  const [volume, setVolume] = useState("");
  const [availableFrom, setAvailableFrom] = useState<Date>();
  const [moveBy, setMoveBy] = useState<Date>();
  const [assist, setAssist] = useState<"Yes" | "No">();

  const [source, setSource] = useState<EndpointState>(emptyEndpoint());
  const [destination, setDestination] = useState<EndpointState>(emptyEndpoint());
  const [sourceEnv, setSourceEnv] = useState<EnvState>({});
  const [destEnv, setDestEnv] = useState<EnvState>({});

  const reset = () => {
    setStep(0);
    setDirection(1);
    setPlacedId(null);
    setShowErrors(false);
    setVolume("");
    setAvailableFrom(undefined);
    setMoveBy(undefined);
    setAssist(undefined);
    setSource(emptyEndpoint());
    setDestination(emptyEndpoint());
    setSourceEnv({});
    setDestEnv({});
  };

  /* ---------------- validation ---------------- */

  const stepValid = useMemo(() => {
    const endpointValid = (e: EndpointState) =>
      !!e.kind &&
      (e.kind === "Private data centre" || (!!e.cloud && !!e.endpointSupport)) &&
      !validateAddress(e.address) &&
      !validateContact(e.contact);
    const envValid = (e: EnvState) =>
      !!e.rack && !!e.netIface && !!e.nicPort && !!e.ports;

    switch (step) {
      case 0:
        return (
          Number(volume) > 0 &&
          !!availableFrom &&
          !!moveBy &&
          !!assist &&
          (!availableFrom || !moveBy || moveBy >= availableFrom)
        );
      case 1:
        return endpointValid(source);
      case 2:
        return endpointValid(destination);
      case 3:
        return envValid(sourceEnv);
      case 4:
        return envValid(destEnv);
      default:
        return false;
    }
  }, [step, volume, availableFrom, moveBy, assist, source, destination, sourceEnv, destEnv]);

  const goNext = () => {
    if (!stepValid) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setDirection(1);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setShowErrors(false);
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  const submit = async () => {
    if (!stepValid) {
      setShowErrors(true);
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 900));

    const id = nextDisplayId();
    const toEnv = (e: EnvState): EnvironmentDetails => ({
      rackSpace: e.rack ?? "N/A",
      networkInterface: e.netIface ?? "N/A",
      nicPortAvailable: e.nicPort ?? "N/A",
      networkPorts: e.ports ?? "N/A",
      pcieAvailable: e.pcie ?? "N/A",
      rdmaAvailable: e.rdma ?? "N/A",
    });
    const toEndpoint = (e: EndpointState) => ({
      kind: e.kind!,
      cloudProvider: e.kind === "Public cloud" ? e.cloud : undefined,
      cloudEndpointSupport:
        e.kind === "Public cloud" ? e.endpointSupport === "Yes" : undefined,
      location: e.address,
      contact: e.contact,
      label: endpointLabel(e),
    });

    const sizeTB = Number(volume);
    const quote = priceIt({
      sizeTB,
      serviceLevel: assist === "Yes" ? "White Glove" : "Self-managed",
    });

    const order: TransferOrder = {
      id: crypto.randomUUID(),
      displayId: id,
      createdAt: format(new Date(), "yyyy-MM-dd"),
      volumeTB: sizeTB,
      availableFrom: format(availableFrom!, "yyyy-MM-dd"),
      moveBy: format(moveBy!, "yyyy-MM-dd"),
      inPersonAssist: assist === "Yes",
      serviceLevel: assist === "Yes" ? "White Glove" : "Self-managed",
      source: toEndpoint(source),
      destination: toEndpoint(destination),
      sourceEnv: toEnv(sourceEnv),
      destinationEnv: toEnv(destEnv),
      stage: "Proposal",
      stageHistory: [
        {
          stage: "Proposal",
          at: format(new Date(), "yyyy-MM-dd"),
          owner: "Sales — awaiting review",
        },
      ],
      progress: 0,
      estimate: { min: quote.min, max: quote.max, ratesVersion: quote.ratesVersion },
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
        { label: "Advance (50%)", amount: Math.round(quote.min / 2), status: "scheduled" },
        {
          label: "Balance (50%)",
          amount: Math.round(quote.min / 2),
          status: "scheduled",
          dueAtStage: "Verification",
        },
      ],
      source_attribution: "direct",
    };
    addOrder(order);
    setSubmitting(false);
    setPlacedId(id);
    toast.success("Order raised successfully!", {
      description: `${id} · ${volume} TB · ${endpointLabel(source)} → ${endpointLabel(destination)}`,
    });
  };

  const close = (next: boolean) => {
    onOpenChange(next);
    if (!next && placedId) reset();
  };

  const routeFrom = endpointLabel(source);
  const routeTo = endpointLabel(destination);
  const previewRoute =
    source.address.city && destination.address.city
      ? citiesToRoute(
          "preview",
          source.address.city,
          destination.address.city,
          routeFrom,
          routeTo,
        )
      : null;

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[min(780px,94dvh)] w-[min(1120px,96vw)] max-w-none flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-none sm:rounded-3xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4 sm:px-7">
          <div>
            <DialogTitle className="text-lg font-semibold">
              Raise an Order
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              {placedId
                ? "Request submitted"
                : `Step ${step + 1} of ${STEPS.length} — ${STEPS[step]}`}
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
          <SuccessPane id={placedId} onClose={() => close(false)} />
        ) : (
          <>
            {/* Mobile stepper */}
            <div className="border-b px-5 py-3 lg:hidden">
              <WizardStepper
                steps={STEPS.map((s) =>
                  s
                    .replace("Data source ", "Source ")
                    .replace("Data destination ", "Destination ")
                    .replace(" details", ""),
                )}
                current={step}
                orientation="horizontal"
              />
            </div>

            {/* Body */}
            <div className="grid min-h-0 flex-1 lg:grid-cols-[230px_minmax(0,1fr)] xl:grid-cols-[230px_minmax(0,1fr)_290px]">
              {/* Rail */}
              <aside className="hidden border-r bg-muted/30 p-6 lg:block">
                <WizardStepper
                  steps={STEPS}
                  current={step}
                  onStepClick={(i) => {
                    setDirection(-1);
                    setStep(i);
                  }}
                />
                <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
                  All fields marked with an asterisk (*) are mandatory.
                </p>
              </aside>

              {/* Content */}
              <div className="min-h-0 overflow-y-auto px-5 py-6 sm:px-7">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div key={step} {...stepSlide(direction)}>
                    {step === 0 && (
                      <StepDataDetails
                        volume={volume}
                        setVolume={setVolume}
                        availableFrom={availableFrom}
                        setAvailableFrom={setAvailableFrom}
                        moveBy={moveBy}
                        setMoveBy={setMoveBy}
                        assist={assist}
                        setAssist={setAssist}
                        showErrors={showErrors}
                      />
                    )}
                    {step === 1 && (
                      <StepEndpoint
                        title="Where your data resides?"
                        value={source}
                        onChange={setSource}
                        showErrors={showErrors}
                        idPrefix="src"
                      />
                    )}
                    {step === 2 && (
                      <StepEndpoint
                        title="Where your data will be moved to?"
                        value={destination}
                        onChange={setDestination}
                        showErrors={showErrors}
                        idPrefix="dst"
                      />
                    )}
                    {step === 3 && (
                      <StepEnvironment
                        subject="source"
                        value={sourceEnv}
                        onChange={setSourceEnv}
                        showErrors={showErrors}
                      />
                    )}
                    {step === 4 && (
                      <StepEnvironment
                        subject="destination"
                        value={destEnv}
                        onChange={setDestEnv}
                        showErrors={showErrors}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Live summary */}
              <aside className="hidden min-h-0 flex-col overflow-y-auto border-l bg-muted/30 p-6 xl:flex">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Order summary
                </p>

                <div className="mt-4 space-y-3 text-[13px]">
                  <SummaryRow
                    label="Volume"
                    value={Number(volume) > 0 ? `${volume} TB` : undefined}
                    icon={<Database className="size-3.5" />}
                  />
                  <SummaryRow
                    label="Window"
                    value={
                      availableFrom && moveBy
                        ? `${format(availableFrom, "dd MMM")} → ${format(moveBy, "dd MMM yy")}`
                        : undefined
                    }
                  />
                  <SummaryRow
                    label="Tsecond assist"
                    value={assist === "Yes" ? "In-person" : assist === "No" ? "Not needed" : undefined}
                  />
                  <SummaryRow label="Source" value={routeFrom || undefined} />
                  <SummaryRow label="Destination" value={routeTo || undefined} />
                </div>

                <AnimatePresence>
                  {routeFrom && routeTo && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                      className="mt-6 rounded-xl border bg-card p-4"
                    >
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Your route
                      </p>
                      {previewRoute ? (
                        <>
                          <WorldMap routes={[previewRoute]} compact labelMode="none" expandable />
                          <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
                            <span className="max-w-[46%] truncate font-medium">
                              {routeFrom}
                            </span>
                            <span className="max-w-[46%] truncate text-right font-medium">
                              {routeTo}
                            </span>
                          </div>
                        </>
                      ) : (
                        <RouteArc from={routeFrom} to={routeTo} />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                <p className="mt-auto pt-6 text-[11px] leading-relaxed text-muted-foreground">
                  Our support team reviews every order and recommends the right
                  hardware for your volume and timeframe.
                </p>
              </aside>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t px-5 py-4 sm:px-7">
              <p className="hidden text-xs text-muted-foreground sm:block">
                All fields marked with an asterisk (*) are mandatory.
              </p>
              <div className="flex w-full justify-end gap-3 sm:w-auto">
                <Button
                  variant="outline"
                  onClick={step === 0 ? () => close(false) : goBack}
                  className="rounded-full px-6"
                >
                  {step === 0 ? "Cancel" : "Back"}
                </Button>
                {step < STEPS.length - 1 ? (
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
                      "ORDER"
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

/* ------------------------------------------------------------------ */
/* Steps                                                               */
/* ------------------------------------------------------------------ */

function SectionCard({
  title,
  required,
  children,
}: {
  title: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-card p-5">
      <h3 className="mb-4 text-sm font-semibold">
        {title}
        {required && <span className="text-destructive"> *</span>}
      </h3>
      {children}
    </section>
  );
}

function StepDataDetails(props: {
  volume: string;
  setVolume: (v: string) => void;
  availableFrom?: Date;
  setAvailableFrom: (d?: Date) => void;
  moveBy?: Date;
  setMoveBy: (d?: Date) => void;
  assist?: "Yes" | "No";
  setAssist: (v: "Yes" | "No") => void;
  showErrors: boolean;
}) {
  const {
    volume,
    setVolume,
    availableFrom,
    setAvailableFrom,
    moveBy,
    setMoveBy,
    assist,
    setAssist,
    showErrors,
  } = props;

  const windowInvalid =
    availableFrom && moveBy ? moveBy < availableFrom : false;

  return (
    <div className="space-y-4">
      <SectionCard title="Amount of data" required>
        <Field
          label="Capacity (in TB)"
          required
          htmlFor="ro-volume"
          error={
            showErrors && !(Number(volume) > 0)
              ? "Enter the data volume in TB"
              : undefined
          }
        >
          <div className="relative max-w-xs">
            <Input
              id="ro-volume"
              type="number"
              min={1}
              inputMode="numeric"
              placeholder="e.g. 512"
              value={volume}
              onChange={(e) => setVolume(e.target.value)}
              className="h-12 pr-12 text-lg font-semibold tabular-nums"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
              TB
            </span>
          </div>
        </Field>
      </SectionCard>

      <SectionCard title="Duration available for transfer" required>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="By when data will be available?"
            required
            error={
              showErrors && !availableFrom ? "Select a date" : undefined
            }
          >
            <DatePicker
              value={availableFrom}
              onChange={setAvailableFrom}
              placeholder="Select Date"
              className="w-full"
            />
          </Field>
          <Field
            label="By when data has to be moved?"
            required
            error={
              showErrors && !moveBy
                ? "Select a date"
                : windowInvalid
                  ? "Must be after the availability date"
                  : undefined
            }
          >
            <DatePicker
              value={moveBy}
              onChange={setMoveBy}
              placeholder="Select Date"
              disabled={
                availableFrom ? (d) => d < availableFrom : undefined
              }
              className="w-full"
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Tsecond support" required>
        <Field
          label="Do you need in-person assist from Tsecond?"
          required
          error={showErrors && !assist ? "Choose an option" : undefined}
        >
          <Segmented
            options={["Yes", "No"] as const}
            value={assist}
            onChange={setAssist}
            aria-label="In-person assistance"
          />
        </Field>
      </SectionCard>
    </div>
  );
}

function StepEndpoint({
  title,
  value,
  onChange,
  showErrors,
  idPrefix,
}: {
  title: string;
  value: EndpointState;
  onChange: (v: EndpointState) => void;
  showErrors: boolean;
  idPrefix: string;
}) {
  const set = (patch: Partial<EndpointState>) =>
    onChange({ ...value, ...patch });

  const addressErrors = showErrors
    ? (validateAddress(value.address) ?? undefined)
    : undefined;
  const contactErrors = showErrors
    ? (validateContact(value.contact) ?? undefined)
    : undefined;

  return (
    <div className="space-y-4">
      <SectionCard title={title} required>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              {
                kind: "Private data centre" as LocationKind,
                icon: Building2,
                sub: "Your own facility or a colocation site",
              },
              {
                kind: "Public cloud" as LocationKind,
                icon: Cloud,
                sub: "AWS, Azure, GCP, IBM Cloud or OCI",
              },
            ] as const
          ).map(({ kind, icon: Icon, sub }) => {
            const active = value.kind === kind;
            return (
              <button
                key={kind}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => set({ kind })}
                className={cn(
                  "relative flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
                  active
                    ? "card-gradient-border shadow-brand-sm"
                    : "hover:border-primary/40 hover:bg-muted/50",
                )}
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                    active
                      ? "bg-gradient-brand text-white"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="size-4.5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{kind}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {sub}
                  </span>
                </span>
                {active && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-3 top-3 flex size-5 items-center justify-center rounded-full bg-gradient-brand text-white"
                  >
                    <Check className="size-3" strokeWidth={3} />
                  </motion.span>
                )}
              </button>
            );
          })}
        </div>
        {showErrors && !value.kind && (
          <p className="mt-2 text-xs font-medium text-destructive">
            Choose where the data lives
          </p>
        )}
      </SectionCard>

      <AnimatePresence initial={false}>
        {value.kind === "Public cloud" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <SectionCard title="Which public cloud?" required>
              <div className="flex flex-wrap gap-2">
                {CLOUD_PROVIDERS.map((p) => {
                  const active = value.cloud === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => set({ cloud: p })}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                        active
                          ? "border-transparent bg-gradient-brand text-white shadow-brand-sm"
                          : "hover:border-primary/40 hover:bg-muted/50",
                      )}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              {showErrors && !value.cloud && (
                <p className="mt-2 text-xs font-medium text-destructive">
                  Select a provider
                </p>
              )}
              <Field
                label="DataDart cloud end point support needed?"
                required
                className="mt-4"
                error={
                  showErrors && !value.endpointSupport
                    ? "Choose an option"
                    : undefined
                }
              >
                <Segmented
                  options={["Yes", "No"] as const}
                  value={value.endpointSupport}
                  onChange={(v) => set({ endpointSupport: v })}
                  aria-label="Cloud endpoint support"
                />
              </Field>
            </SectionCard>
          </motion.div>
        )}
      </AnimatePresence>

      {value.kind && (
        <>
          <SectionCard
            title={`Location of accessing ${value.kind === "Public cloud" ? "public cloud" : "private data centre"}`}
            required
          >
            <AddressFields
              value={value.address}
              onChange={(address) => set({ address })}
              errors={addressErrors}
              idPrefix={idPrefix}
            />
          </SectionCard>

          <SectionCard title="Contact person" required>
            <ContactFields
              value={value.contact}
              onChange={(contact) => set({ contact })}
              errors={contactErrors}
              idPrefix={`${idPrefix}-c`}
            />
          </SectionCard>
        </>
      )}
    </div>
  );
}

const ENV_QUESTIONS: {
  key: keyof EnvState;
  label: string;
  options: string[];
  required: boolean;
}[] = [
  {
    key: "rack",
    label: "Do you have 6U RAC space available?",
    options: ["Yes", "No", "N/A"],
    required: true,
  },
  {
    key: "netIface",
    label: "Network interface available in server which has data?",
    options: ["10gb", "25gb", "40gb", "100gb", "N/A"],
    required: true,
  },
  {
    key: "nicPort",
    label: "Is there a port available to install a 100gb network interface card?",
    options: ["Yes", "No", "N/A"],
    required: true,
  },
  {
    key: "ports",
    label: "How many network ports available?",
    options: ["0", "1", "2", "3", ">3", "N/A"],
    required: true,
  },
  {
    key: "pcie",
    label: "Is there a PCIE interface available in server?",
    options: ["Yes", "No", "N/A"],
    required: false,
  },
  {
    key: "rdma",
    label: "Is there a RDMA interface available in server?",
    options: ["Yes", "No", "N/A"],
    required: false,
  },
];

function StepEnvironment({
  subject,
  value,
  onChange,
  showErrors,
}: {
  subject: "source" | "destination";
  value: EnvState;
  onChange: (v: EnvState) => void;
  showErrors: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-2xl bg-accent px-4 py-3">
        <ServerCog className="mt-0.5 size-4 shrink-0 text-accent-foreground" />
        <p className="text-xs leading-relaxed text-accent-foreground">
          Tell us about the technical readiness at the {subject}. This helps our
          team pre-stage the right connectivity for your transfer.
        </p>
      </div>
      <SectionCard title={`${subject === "source" ? "Source" : "Destination"} environment`}>
        <div className="space-y-5">
          {ENV_QUESTIONS.map((q) => (
            <Field
              key={q.key}
              label={q.label}
              required={q.required}
              error={
                showErrors && q.required && !value[q.key]
                  ? "Choose an option"
                  : undefined
              }
            >
              <Segmented
                options={q.options}
                value={value[q.key]}
                onChange={(v) => onChange({ ...value, [q.key]: v })}
                size="sm"
                aria-label={q.label}
              />
            </Field>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Bits                                                                */
/* ------------------------------------------------------------------ */

function SummaryRow({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <AnimatePresence mode="popLayout">
        {value ? (
          <motion.span
            key={value}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="inline-flex max-w-[60%] items-center gap-1.5 truncate text-right font-medium"
          >
            {icon}
            {value}
          </motion.span>
        ) : (
          <span className="text-border">—</span>
        )}
      </AnimatePresence>
    </div>
  );
}

function SuccessPane({ id, onClose }: { id: string; onClose: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-14 text-center">
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 16 }}
        className="relative"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-brand opacity-30 blur-2xl" />
        <div className="relative flex size-20 items-center justify-center rounded-full bg-gradient-brand text-white shadow-brand">
          <Check className="size-9" strokeWidth={2.6} />
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-1.5"
      >
        <h3 className="flex items-center justify-center gap-2 text-xl font-semibold">
          Order {id} raised <PartyPopper className="size-5 text-warning" />
        </h3>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          Our support team will review your transfer and get back with a
          hardware recommendation for your volume and timeframe.
        </p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <Button onClick={onClose} className="btn-brand mt-2 rounded-full px-8 font-semibold">
          View my orders
        </Button>
      </motion.div>
    </div>
  );
}
