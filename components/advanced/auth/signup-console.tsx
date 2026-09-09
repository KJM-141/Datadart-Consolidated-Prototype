"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
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
import { AuthCard, Divider, Field, authInputClass } from "./auth-kit";
import { COUNTRIES, getCountry } from "@/lib/geo";
import { useAppStore } from "@/lib/store";
import { deckStagger } from "@/lib/advanced-motion";
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

/** Two-step sign-up: who you are, then where to register the account. */
export function SignUpConsole() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const signIn = useAppStore((s) => s.signIn);
  const updateProfile = useAppStore((s) => s.updateProfile);
  const profile = useAppStore((s) => s.profile);

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // A question the visitor asked on the landing (or the sizer) rides in via
  // sessionStorage, so the account screen picks up the thread. `takeIntent`
  // reads and clears, so the ref guard makes it fire exactly once.
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
    if (!/^\S+@\S+\.\S+$/.test(basic.email)) e.email = "Enter a valid email.";
    if (!basic.name.trim()) e.name = "Enter your name.";
    if (basic.password.length < 8) e.password = "At least 8 characters.";
    if (basic.password2 !== basic.password)
      e.password2 = "Passwords don't match.";
    if (!basic.country) e.country = "Select your country.";
    if (!basic.phone.trim()) e.phone = "Enter a contact number.";
    setBasicErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => {
    if (!validateStep1()) return;
    setAddress((a) => ({ ...a, country: basic.country }));
    setStep(1);
  };

  const goBack = () => setStep(0);

  const submit = async () => {
    const errs = validateAddress({ ...address, country: basic.country });
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
    toast.success("Account created, welcome to DataDart.");
    router.push("/customer");
  };

  const dial = basic.country ? getCountry(basic.country)?.dial : undefined;
  const strength = passwordStrength(basic.password);

  return (
    <motion.div
      variants={deckStagger(0.06, 0.04)}
      initial="hidden"
      animate="show"
      className="w-full"
    >
      <AuthCard>
        {/* Heading */}
        <div>
          <p className="text-[12px] font-medium uppercase tracking-wide text-white/40">
            Step {step + 1} of 2
          </p>
          <h1 className="mt-2 text-[1.75rem] font-semibold leading-tight">
            Create your account
          </h1>
          <p className="mt-1.5 text-sm text-white/55">
            {step === 0
              ? "A few details to set up your workspace."
              : "Where should we register your account?"}
          </p>
        </div>

        {/* Carried question from the landing — continuity, not a cold start. */}
        {carried && step === 0 && (
          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] p-3.5 text-[13px] leading-relaxed text-white/60">
            <MessageSquare className="mt-0.5 size-4 shrink-0 text-[color-mix(in_oklab,var(--plasma)_70%,white)]" />
            <span>
              Picking up where you left off,{" "}
              <span className="font-medium text-white/85">
                &ldquo;{carried}&rdquo;
              </span>
              . Create your account and the assistant carries on.
            </span>
          </div>
        )}

        {/* Panes */}
        <div className="mt-6">
          <AnimatePresence mode="wait" initial={false}>
            {step === 0 ? (
              <motion.div key="step1" {...fade(reduce)}>
                <Field
                  label="Email"
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
                    className={authInputClass}
                  />
                </Field>

                <Field
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
                    className={authInputClass}
                  />
                </Field>

                <div className="grid gap-x-4 sm:grid-cols-2">
                  <Field
                    label="Password"
                    required
                    htmlFor="su-pass"
                    error={basicErrors.password}
                  >
                    <PasswordInput
                      id="su-pass"
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      value={basic.password}
                      onChange={(e) => setB({ password: e.target.value })}
                      className={cn(authInputClass, "pl-4")}
                    />
                  </Field>
                  <Field
                    label="Confirm password"
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
                      className={cn(authInputClass, "pl-4")}
                    />
                  </Field>
                </div>

                <StrengthMeter score={strength} />

                <Field
                  label="Country"
                  required
                  error={basicErrors.country}
                  className="mt-4"
                >
                  <Select
                    value={basic.country || null}
                    onValueChange={(country) => setB({ country: country ?? "" })}
                  >
                    <SelectTrigger className="h-12! w-full rounded-lg border border-white/12 bg-white/[0.04] text-white data-[placeholder]:text-white/35">
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
                </Field>

                <Field
                  label="Contact number"
                  required
                  htmlFor="su-phone"
                  error={basicErrors.phone}
                >
                  <div className="flex gap-2">
                    {dial && (
                      <span className="flex h-12 shrink-0 items-center rounded-lg border border-white/12 bg-white/[0.04] px-3.5 text-sm font-medium text-white/70">
                        {dial}
                      </span>
                    )}
                    <div className="relative flex-1">
                      <Phone className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-white/40" />
                      <Input
                        id="su-phone"
                        type="tel"
                        placeholder="Phone number"
                        autoComplete="tel"
                        value={basic.phone}
                        onChange={(e) => setB({ phone: e.target.value })}
                        className={authInputClass}
                      />
                    </div>
                  </div>
                </Field>

                <button
                  type="button"
                  onClick={goNext}
                  className="btn-plasma mt-2 flex h-12 w-full items-center justify-center gap-2 text-sm font-medium"
                >
                  Continue
                </button>
              </motion.div>
            ) : (
              <motion.div key="step2" {...fade(reduce)} className="space-y-4">
                <p className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] p-3.5 text-[13px] leading-relaxed text-white/60">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-[color-mix(in_oklab,var(--cyo)_75%,white)]" />
                  Registering in{" "}
                  <span className="font-medium text-white/85">{basic.country}</span>
                  . State and city options follow your country.
                </p>

                <AddressFields
                  value={address}
                  onChange={setAddress}
                  errors={addressErrors ?? undefined}
                  idPrefix="su-addr"
                  hideCountry
                />

                <Divider />

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={goBack}
                    className="btn-ghost-hud inline-flex h-12 flex-1 items-center justify-center gap-2 text-sm font-medium"
                  >
                    <ArrowLeft className="size-4" /> Back
                  </button>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={submitting}
                    className="btn-plasma inline-flex h-12 flex-[2] items-center justify-center gap-2 text-sm font-medium disabled:pointer-events-none disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> Creating…
                      </>
                    ) : (
                      "Create account"
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-7 border-t border-white/10 pt-6 text-center text-sm text-white/55">
          Already have an account?{" "}
          <Link
            href={PATHS.signin}
            className="font-medium text-[color-mix(in_oklab,var(--plasma)_70%,white)] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </AuthCard>
    </motion.div>
  );
}

/* ── Pieces ─────────────────────────────────────────────────────────────── */

const fade = (reduce: boolean | null) =>
  reduce
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: 0.22 },
      };

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
const STRENGTH_COLOR = [
  "bg-white/20",
  "bg-red-400",
  "bg-amber-400",
  "bg-lime-400",
  "bg-emerald-400",
];

function StrengthMeter({ score }: { score: number }) {
  if (!score) return null;
  return (
    <div className="-mt-1 mb-1 flex items-center gap-2.5">
      <span className="flex flex-1 gap-1">
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i <= score ? STRENGTH_COLOR[score] : "bg-white/12",
            )}
          />
        ))}
      </span>
      <span className="text-[12px] font-medium text-white/60">
        {STRENGTH[score]}
      </span>
    </div>
  );
}
