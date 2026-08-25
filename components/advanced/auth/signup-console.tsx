"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PasswordInput } from "@/components/shared/password-input";
import {
  AddressFields,
  emptyAddress,
  validateAddress,
} from "@/components/shared/address-fields";
import { HoloPanel } from "@/components/advanced/kit/holo-panel";
import { HudDivider, HudField, hudInputClass } from "@/components/advanced/kit/hud-field";
import { HudLabel, LiveDot } from "@/components/advanced/kit/hud";
import { Tilt } from "@/components/advanced/kit/interactions";
import { COUNTRIES, getCountry } from "@/lib/geo";
import { useAppStore } from "@/lib/store";
import {
  EASE_ADV,
  bloomSoft,
  deckStagger,
  paneSlide,
} from "@/lib/advanced-motion";
import type { Address } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PATHS } from "@/lib/nav";
import { takeIntent } from "@/lib/intent";

interface Step1 {
  email: string;
  name: string;
  password: string;
  password2: string;
  country: string;
  phone: string;
}

const STEPS = ["Identity", "Location"];

/** Same two-step registration as the Normal build, staged as a provisioning
 *  console with a credential card that assembles itself as you type. */
export function SignUpConsole() {
  const router = useRouter();
  const signIn = useAppStore((s) => s.signIn);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const profile = useAppStore((s) => s.profile);

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // A question the visitor asked on the landing hero (or the sizer) rides in
  // via sessionStorage, so the account screen picks up the thread rather than
  // greeting them cold. `takeIntent` reads *and clears*, so the ref guard makes
  // it fire exactly once — otherwise StrictMode's double-invoked effect reads
  // the value on the first pass and `null` on the second, wiping the banner.
  const [carried, setCarried] = useState<string | null>(null);
  const took = useRef(false);
  useEffect(() => {
    if (took.current) return;
    took.current = true;
    setCarried(takeIntent());
  }, []);

  const [basic, setBasic] = useState<Step1>({
    email: "",
    name: "",
    password: "",
    password2: "",
    country: "",
    phone: "",
  });
  const [basicErrors, setBasicErrors] = useState<
    Partial<Record<keyof Step1, string>>
  >({});

  const [address, setAddress] = useState<Address>(emptyAddress());
  const [addressErrors, setAddressErrors] = useState<ReturnType<
    typeof validateAddress
  > | null>(null);

  const setB = (patch: Partial<Step1>) => setBasic((b) => ({ ...b, ...patch }));

  const validateStep1 = () => {
    const e: Partial<Record<keyof Step1, string>> = {};
    if (!/^\S+@\S+\.\S+$/.test(basic.email)) e.email = "Enter a valid email";
    if (!basic.name.trim()) e.name = "Name is required";
    if (basic.password.length < 8) e.password = "Minimum 8 characters";
    if (basic.password2 !== basic.password)
      e.password2 = "Passwords do not match";
    if (!basic.country) e.country = "Country is required";
    if (!basic.phone.trim()) e.phone = "Contact number is required";
    setBasicErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (!validateStep1()) return;
    setAddress((a) => ({ ...a, country: basic.country }));
    setDirection(1);
    setStep(1);
  };

  const goBack = () => {
    setDirection(-1);
    setStep(0);
  };

  const submit = async () => {
    const errs = validateAddress({ ...address, country: basic.country });
    // Country comes from step 1, so it can never be an error here.
    if (errs) {
      setAddressErrors(errs);
      return;
    }
    setAddressErrors(null);
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 750));
    const [firstName, ...rest] = basic.name.trim().split(/\s+/);
    updateProfile({
      ...profile,
      firstName: firstName || basic.name,
      lastName: rest.join(" "),
      email: basic.email,
      countryCode: getCountry(basic.country)?.dial ?? "",
      phone: basic.phone,
      address: { ...address, country: basic.country },
    });
    signIn(basic.email);
    toast.success("Account created — welcome to DataDart!");
    router.push("/customer");
  };

  const dial = basic.country ? getCountry(basic.country)?.dial : undefined;
  const strength = passwordStrength(basic.password);

  return (
    <motion.div
      variants={deckStagger(0.07, 0.05)}
      initial="hidden"
      animate="show"
      className="w-full"
    >
      <Tilt strength={3} glare={false}>
        <HoloPanel
          plain
          brackets
          className="p-6 sm:p-8"
          style={{ background: "rgba(14,11,32,0.62)" }}
        >
          {/* rail */}
          <motion.div variants={bloomSoft} className="flex items-center gap-2">
            {STEPS.map((label, i) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  if (i < step) {
                    setDirection(-1);
                    setStep(i);
                  }
                }}
                className="flex flex-1 flex-col gap-1.5 text-left"
              >
                <span className="relative h-[3px] overflow-hidden rounded-full bg-white/10">
                  <motion.span
                    initial={false}
                    animate={{ scaleX: i < step ? 1 : i === step ? 0.55 : 0 }}
                    transition={{ duration: 0.55, ease: EASE_ADV }}
                    className="block h-full origin-left rounded-full plasma-fill"
                  />
                </span>
                <span
                  className={cn(
                    "hud-label transition-colors duration-400",
                    i === step
                      ? "text-(--plasma)"
                      : i < step
                        ? "text-white/45"
                        : "text-white/22",
                  )}
                >
                  {label}
                </span>
              </button>
            ))}
          </motion.div>

          {/* heading */}
          <motion.div variants={bloomSoft} className="mt-7">
            <div className="flex items-center gap-2">
              <LiveDot tone="plasma" />
              <HudLabel>Provision workspace</HudLabel>
            </div>
            <h1 className="mt-2.5 text-[2rem] font-semibold leading-[1.05] tracking-tight">
              Create account
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              Two quick steps and you&apos;re moving data.
            </p>
          </motion.div>

          {/* Carried question from the landing — continuity, not a cold start. */}
          {carried && (
            <motion.div
              variants={bloomSoft}
              className="mt-5 flex items-start gap-2.5 rounded-xl bg-white/[0.04] p-3.5 text-[12px] leading-relaxed text-muted-foreground ring-1 ring-inset ring-white/8"
            >
              <MessageSquare className="mt-0.5 size-3.5 shrink-0 text-(--plasma)" />
              <span>
                Picking up from your question —{" "}
                <span className="font-medium text-foreground">
                  &ldquo;{carried}&rdquo;
                </span>
                . Create your account and the assistant carries on where you left
                off.
              </span>
            </motion.div>
          )}

          {/* live credential card */}
          <motion.div variants={bloomSoft} className="mt-6">
            <CredentialCard
              name={basic.name}
              email={basic.email}
              country={basic.country}
              complete={step > 0}
            />
          </motion.div>

          {/* panes */}
          <motion.div variants={bloomSoft} className="relative mt-6 overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              {step === 0 ? (
                <motion.div key="step1" {...paneSlide(direction)} className="w-full">
                  <HudField
                    label="Email address"
                    required
                    htmlFor="su-email"
                    icon={Mail}
                    error={basicErrors.email}
                  >
                    <Input
                      id="su-email"
                      type="email"
                      placeholder="name@company.com"
                      autoComplete="email"
                      value={basic.email}
                      onChange={(e) => setB({ email: e.target.value })}
                      className={hudInputClass}
                    />
                  </HudField>

                  <HudField
                    label="Name"
                    required
                    htmlFor="su-name"
                    icon={User}
                    error={basicErrors.name}
                  >
                    <Input
                      id="su-name"
                      placeholder="Full name"
                      autoComplete="name"
                      value={basic.name}
                      onChange={(e) => setB({ name: e.target.value })}
                      className={hudInputClass}
                    />
                  </HudField>

                  <div className="grid gap-x-4 sm:grid-cols-2">
                    <HudField
                      label="Password"
                      required
                      htmlFor="su-pass"
                      error={basicErrors.password}
                    >
                      <PasswordInput
                        id="su-pass"
                        placeholder="Min 8 characters"
                        autoComplete="new-password"
                        value={basic.password}
                        onChange={(e) => setB({ password: e.target.value })}
                        className={cn(hudInputClass, "pl-4")}
                      />
                    </HudField>
                    <HudField
                      label="Re-enter password"
                      required
                      htmlFor="su-pass2"
                      error={basicErrors.password2}
                    >
                      <PasswordInput
                        id="su-pass2"
                        placeholder="Repeat password"
                        autoComplete="new-password"
                        value={basic.password2}
                        onChange={(e) => setB({ password2: e.target.value })}
                        className={cn(hudInputClass, "pl-4")}
                      />
                    </HudField>
                  </div>

                  <StrengthMeter score={strength} />

                  <HudField
                    label="Country"
                    required
                    error={basicErrors.country}
                    className="mt-4"
                  >
                    <Select
                      value={basic.country || null}
                      onValueChange={(country) => setB({ country: country ?? "" })}
                    >
                      <SelectTrigger className="h-12! w-full rounded-xl border-transparent bg-[color-mix(in_oklab,var(--muted)_65%,transparent)] shadow-[inset_0_0_0_1px_var(--border)]">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {COUNTRIES.map((c) => (
                          <SelectItem key={c.code} value={c.name}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </HudField>

                  <HudField
                    label="Contact number"
                    required
                    htmlFor="su-phone"
                    error={basicErrors.phone}
                  >
                    <div className="flex gap-2">
                      {dial && (
                        <span className="flex h-12 shrink-0 items-center rounded-xl bg-[color-mix(in_oklab,var(--muted)_65%,transparent)] px-3.5 text-sm font-medium text-muted-foreground shadow-[inset_0_0_0_1px_var(--border)]">
                          {dial}
                        </span>
                      )}
                      <div className="relative flex-1">
                        <Phone className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="su-phone"
                          type="tel"
                          placeholder="Phone number"
                          autoComplete="tel"
                          value={basic.phone}
                          onChange={(e) => setB({ phone: e.target.value })}
                          className={hudInputClass}
                        />
                      </div>
                    </div>
                  </HudField>

                  <button
                    type="button"
                    onClick={goNext}
                    className="btn-plasma group/act mt-2 flex h-12 w-full items-center justify-center gap-2 text-[13px] font-medium"
                  >
                    Continue
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover/act:translate-x-1" />
                  </button>
                </motion.div>
              ) : (
                <motion.div key="step2" {...paneSlide(direction)} className="w-full space-y-4">
                  <p className="flex items-start gap-2.5 rounded-xl bg-white/[0.04] p-3.5 text-[11px] leading-relaxed text-muted-foreground ring-1 ring-inset ring-white/8">
                    <MapPin className="mt-0.5 size-3.5 shrink-0 text-(--cyo)" />
                    Registering in{" "}
                    <span className="font-semibold text-foreground">
                      {basic.country}
                    </span>{" "}
                    — state and city options follow your country.
                  </p>

                  <AddressFields
                    value={address}
                    onChange={setAddress}
                    errors={addressErrors ?? undefined}
                    idPrefix="su-addr"
                    hideCountry
                  />

                  <HudDivider />

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={goBack}
                      className="btn-ghost-hud inline-flex h-12 flex-1 items-center justify-center gap-2 text-[13px] font-medium"
                    >
                      <ArrowLeft className="size-4" /> Back
                    </button>
                    <button
                      type="button"
                      onClick={submit}
                      disabled={submitting}
                      className="btn-plasma group/act inline-flex h-12 flex-2 items-center justify-center gap-2 text-[13px] font-medium disabled:pointer-events-none disabled:opacity-60"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="size-4 animate-spin" /> Creating…
                        </>
                      ) : (
                        <>
                          Sign up
                          <ArrowRight className="size-4 transition-transform duration-300 group-hover/act:translate-x-1" />
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          <motion.div variants={bloomSoft} className="mt-7">
            <HudDivider />
            <p className="mt-5 text-center text-[13px] text-muted-foreground">
              Already have an account?{" "}
              <Link
                href={PATHS.signin}
                className="font-semibold text-(--plasma) hover:underline coarse:min-h-11"
              >
                Sign in
              </Link>
            </p>
          </motion.div>
        </HoloPanel>
      </Tilt>
    </motion.div>
  );
}

/* ── Pieces ─────────────────────────────────────────────────────────────── */

/** Fills in live as the form is completed — the account made visible. */
function CredentialCard({
  name,
  email,
  country,
  complete,
}: {
  name: string;
  email: string;
  country: string;
  complete: boolean;
}) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "—";

  return (
    <div className="holo-sheen relative overflow-hidden rounded-2xl bg-[linear-gradient(120deg,rgba(142,45,226,0.24),rgba(67,97,238,0.16)_55%,rgba(34,211,238,0.14))] p-4 ring-1 ring-inset ring-white/12">
      <span aria-hidden className="sheen" />
      <span aria-hidden className="hud-dots absolute inset-0 opacity-25" />
      <div className="relative flex items-center gap-3.5">
        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/10 text-sm font-bold tracking-wide backdrop-blur-md ring-1 ring-inset ring-white/20">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">
            {name.trim() || "Your name"}
          </p>
          <p className="truncate text-[11px] text-white/55">
            {email.trim() || "name@company.com"}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="hud-label text-white/45">Region</p>
          <p className="mt-1 truncate text-[11px] font-semibold">
            {country || "—"}
          </p>
        </div>
      </div>
      <div className="relative mt-3.5 flex items-center justify-between gap-2 border-t border-white/12 pt-3">
        <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white/50">
          <ShieldCheck className="size-3" /> Encrypted at rest
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-[13px] font-medium transition-colors",
            complete ? "text-success" : "text-white/35",
          )}
        >
          {complete ? <Check className="size-3" /> : <Building2 className="size-3" />}
          {complete ? "Identity set" : "Draft"}
        </span>
      </div>
    </div>
  );
}

function passwordStrength(pw: string): number {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^\w\s]/.test(pw)) s++;
  return Math.min(s, 4);
}

const STRENGTH = ["", "Weak", "Fair", "Strong", "Excellent"];

function StrengthMeter({ score }: { score: number }) {
  if (!score) return null;
  return (
    <div className="-mt-1 mb-1 flex items-center gap-2">
      <span className="flex flex-1 gap-1">
        {[1, 2, 3, 4].map((i) => (
          <motion.span
            key={i}
            initial={false}
            animate={{ opacity: i <= score ? 1 : 0.16 }}
            className={cn(
              "h-1 flex-1 rounded-full",
              i <= score ? "plasma-fill" : "bg-white/40",
            )}
          />
        ))}
      </span>
      <span className="hud-label text-(--plasma)">{STRENGTH[score]}</span>
    </div>
  );
}
