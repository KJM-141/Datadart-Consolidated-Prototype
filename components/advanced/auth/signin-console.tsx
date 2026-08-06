"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useAnimate,
  useReducedMotion,
} from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Fingerprint,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MailOpen,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/shared/password-input";
import { HoloPanel } from "@/components/advanced/kit/holo-panel";
import { HudDivider, HudField, hudInputClass } from "@/components/advanced/kit/hud-field";
import { HudLabel } from "@/components/advanced/kit/hud";
import { Tilt } from "@/components/advanced/kit/interactions";
import { BOOT_REVEAL_MS, isBootPlaying } from "./boot-sequence";
import {
  EASE_ADV,
  bloomSoft,
  deckStagger,
  glitchShake,
  paneSlide,
} from "@/lib/advanced-motion";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/brand/logo-mark";

/* Identical model to the Normal build — identifier first, then whichever
   method actually fits you. Only the instrument around it changes. */
type Step = "identify" | "password" | "sso" | "magic-sent";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Progress rail captions; SSO and magic-link both terminate at "access". */
const RAIL: { key: Step[]; label: string }[] = [
  { key: ["identify"], label: "Identify" },
  { key: ["password", "sso"], label: "Verify" },
  { key: ["magic-sent"], label: "Access" },
];

export function SignInConsole() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const signIn = useAppStore((s) => s.signIn);

  const [step, setStep] = useState<Step>("identify");
  const [dir, setDir] = useState(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workspace, setWorkspace] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<
    null | "continue" | "passkey" | "password" | "sso" | "magic"
  >(null);
  const [capsOn, setCapsOn] = useState(false);
  const [start, setStart] = useState(false);
  const [shakeScope, animateShake] = useAnimate();
  const passwordRef = useRef<HTMLInputElement>(null);

  // Land the console as the boot iris opens, not before.
  useEffect(() => {
    if (!isBootPlaying()) {
      setStart(true);
      return;
    }
    const t = setTimeout(() => setStart(true), BOOT_REVEAL_MS - 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (step === "password") {
      const t = setTimeout(() => passwordRef.current?.focus(), 380);
      return () => clearTimeout(t);
    }
  }, [step]);

  const fail = (message: string) => {
    setError(message);
    animateShake(shakeScope.current, { x: glitchShake.x }, glitchShake.transition);
  };

  const go = (next: Step, direction = 1) => {
    setError(null);
    setDir(direction);
    setStep(next);
  };

  /** Simulated auth — the prototype never contacts the real portal. */
  const land = async (
    kind: NonNullable<typeof busy>,
    message: string,
    address = email,
  ) => {
    setBusy(kind);
    await new Promise((r) => setTimeout(r, 700));
    signIn(address);
    toast.success(message);
    router.push("/customer");
  };

  const submitIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      fail("Enter a valid work email address");
      return;
    }
    setBusy("continue");
    await new Promise((r) => setTimeout(r, 420));
    setBusy(null);
    go("password");
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      fail("Password is required");
      return;
    }
    await land("password", "Logged in successfully!");
  };

  const submitSso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace.trim()) {
      fail("Enter your workspace or company domain");
      return;
    }
    await land("sso", `Signed in via ${workspace.trim()} SSO`);
  };

  const domain = email.split("@")[1] ?? "";
  const railIndex = RAIL.findIndex((r) => r.key.includes(step));

  return (
    <motion.div
      variants={deckStagger(0.07, 0.05)}
      initial="hidden"
      animate={start ? "show" : "hidden"}
    >
      <Tilt strength={4} glare={false} className="group">
        <HoloPanel
          plain
          brackets
          className="overflow-hidden p-6 sm:p-8"
          style={{ background: "rgba(14,11,32,0.62)" }}
        >
          {/* ── Rail ─────────────────────────────────────────────── */}
          <motion.div variants={bloomSoft} className="flex items-center gap-2">
            {RAIL.map((r, i) => {
              const done = i < railIndex;
              const active = i === railIndex;
              return (
                <div key={r.label} className="flex flex-1 flex-col gap-1.5">
                  <span className="relative h-[3px] overflow-hidden rounded-full bg-white/10">
                    <motion.span
                      initial={false}
                      animate={{ scaleX: done ? 1 : active ? 0.55 : 0 }}
                      transition={{ duration: 0.55, ease: EASE_ADV }}
                      className="block h-full origin-left rounded-full plasma-fill"
                    />
                  </span>
                  <span
                    className={cn(
                      "hud-label transition-colors duration-400",
                      active ? "text-(--plasma)" : done ? "text-white/45" : "text-white/22",
                    )}
                  >
                    {r.label}
                  </span>
                </div>
              );
            })}
          </motion.div>

          {/* ── Heading ──────────────────────────────────────────── */}
          <motion.div variants={bloomSoft} className="mt-7">
            <HudLabel>
              {step === "identify" ? "Welcome back" : "Almost there"}
            </HudLabel>
            <h1 className="mt-2 text-[1.875rem] font-semibold leading-[1.12]">
              {step === "sso"
                ? "Company sign-in"
                : step === "magic-sent"
                  ? "Check your inbox"
                  : "Sign in"}
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
              {step === "identify" && "Your data has places to be."}
              {step === "password" && "One more step and you're in."}
              {step === "sso" && "We'll hand you to your identity provider."}
              {step === "magic-sent" && "No password needed — just tap the link."}
            </p>
          </motion.div>

          {/* ── Panes ────────────────────────────────────────────── */}
          <motion.div variants={bloomSoft} ref={shakeScope} className="relative mt-7">
            <AnimatePresence initial={false} mode="popLayout">
              {/* ══ identify ══ */}
              {step === "identify" && (
                <motion.div key="identify" {...paneSlide(dir)} className="w-full space-y-4">
                  <PasskeyPod
                    busy={busy === "passkey"}
                    disabled={busy !== null}
                    reduce={!!reduce}
                    onClick={() =>
                      land("passkey", "Signed in with your passkey", "demo.user@example.com")
                    }
                  />

                  <HudDivider>or use your email</HudDivider>

                  {/* noValidate: our HUD messages own validation. */}
                  <form onSubmit={submitIdentify} noValidate>
                    <HudField
                      label="Work email"
                      required
                      htmlFor="email"
                      icon={Mail}
                      error={error ?? undefined}
                    >
                      <Input
                        id="email"
                        type="email"
                        inputMode="email"
                        placeholder="you@company.com"
                        autoComplete="username webauthn"
                        autoFocus
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError(null);
                        }}
                        className={hudInputClass}
                      />
                    </HudField>

                    <PlasmaAction
                      id="signin-continue"
                      type="submit"
                      disabled={busy !== null}
                      busy={busy === "continue"}
                      busyLabel="Finding your workspace…"
                    >
                      Continue
                    </PlasmaAction>
                  </form>

                  <button
                    id="signin-sso"
                    type="button"
                    onClick={() => go("sso")}
                    className="flex w-full items-center justify-center gap-2 rounded-full py-3 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <Building2 className="size-3.5" /> Sign in with company SSO
                  </button>
                </motion.div>
              )}

              {/* ══ password ══ */}
              {step === "password" && (
                <motion.div key="password" {...paneSlide(dir)} className="w-full space-y-4">
                  <IdentityChip email={email} onChange={() => go("identify", -1)} />

                  <form onSubmit={submitPassword} noValidate>
                    <HudField
                      label="Password"
                      required
                      htmlFor="password"
                      icon={Lock}
                      error={error ?? undefined}
                      trailing={
                        <Link
                          href="/forgotpassword"
                          className="text-[13px] font-medium text-(--plasma) hover:underline coarse:min-h-11"
                        >
                          Forgot?
                        </Link>
                      }
                      hint={
                        capsOn ? undefined : "Any password works in the prototype"
                      }
                    >
                      <PasswordInput
                        id="password"
                        ref={passwordRef}
                        placeholder="Your password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError(null);
                        }}
                        onKeyDown={(e) =>
                          setCapsOn(e.getModifierState?.("CapsLock") ?? false)
                        }
                        onKeyUp={(e) =>
                          setCapsOn(e.getModifierState?.("CapsLock") ?? false)
                        }
                        className={hudInputClass}
                      />
                    </HudField>

                    <AnimatePresence>
                      {capsOn && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-2 flex items-center gap-1.5 overflow-hidden text-[13px] font-medium text-warning"
                        >
                          <TriangleAlert className="size-3.5" /> Caps Lock is on
                        </motion.p>
                      )}
                    </AnimatePresence>

                    <PlasmaAction
                      id="signin-submit"
                      type="submit"
                      disabled={busy !== null}
                      busy={busy === "password"}
                      busyLabel="Signing in…"
                    >
                      Sign in
                    </PlasmaAction>
                  </form>

                  <HudDivider>no password handy?</HudDivider>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <AltMethod
                      icon={MailOpen}
                      label="Email me a link"
                      onClick={() => {
                        setBusy(null);
                        go("magic-sent");
                      }}
                    />
                    <AltMethod
                      icon={KeyRound}
                      label="Use a passkey"
                      onClick={() => land("passkey", "Signed in with your passkey")}
                    />
                  </div>
                </motion.div>
              )}

              {/* ══ sso ══ */}
              {step === "sso" && (
                <motion.div key="sso" {...paneSlide(dir)} className="w-full space-y-4">
                  <form onSubmit={submitSso} noValidate>
                    <HudField
                      label="Workspace or company domain"
                      required
                      htmlFor="workspace"
                      icon={Building2}
                      error={error ?? undefined}
                      hint="e.g. acme.com — we'll redirect to your provider"
                    >
                      <Input
                        id="workspace"
                        autoFocus
                        placeholder={domain || "acme.com"}
                        value={workspace}
                        onChange={(e) => {
                          setWorkspace(e.target.value);
                          setError(null);
                        }}
                        className={hudInputClass}
                      />
                    </HudField>

                    <PlasmaAction
                      id="signin-sso-continue"
                      type="submit"
                      disabled={busy !== null}
                      busy={busy === "sso"}
                      busyLabel="Redirecting…"
                    >
                      Continue to provider
                    </PlasmaAction>
                  </form>

                  <p className="flex items-start gap-2.5 rounded-xl bg-white/[0.04] p-3.5 text-[11px] leading-relaxed text-muted-foreground ring-1 ring-inset ring-white/8">
                    <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-(--plasma)" />
                    SAML 2.0 and OIDC supported, with SCIM provisioning on
                    enterprise agreements.
                  </p>

                  <BackLink onClick={() => go("identify", -1)}>
                    Back to all sign-in options
                  </BackLink>
                </motion.div>
              )}

              {/* ══ magic link sent ══ */}
              {step === "magic-sent" && (
                <motion.div key="magic" {...paneSlide(dir)} className="w-full space-y-4">
                  <Beacon email={email} reduce={!!reduce} />

                  <PlasmaAction
                    onClick={() => land("magic", "Logged in successfully!")}
                    disabled={busy !== null}
                    busy={busy === "magic"}
                    busyLabel="Opening…"
                  >
                    Simulate opening the link
                  </PlasmaAction>

                  <BackLink onClick={() => go("password", -1)}>
                    Use my password instead
                  </BackLink>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ── Footer ───────────────────────────────────────────── */}
          <motion.div variants={bloomSoft} className="mt-7">
            <HudDivider />
            <p className="mt-5 text-center text-[13px] text-muted-foreground">
              New to DataDart?{" "}
              <Link
                href="/signup"
                className="font-semibold text-(--plasma) hover:underline coarse:min-h-11"
              >
                Provision a workspace
              </Link>
            </p>
            <div className="mt-3.5 flex justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.05] px-3.5 py-1.5 text-[13px] font-medium text-muted-foreground ring-1 ring-inset ring-white/8">
                <LogoMark size={13} />
                Prototype — every method signs you in
              </span>
            </div>
          </motion.div>
        </HoloPanel>
      </Tilt>
    </motion.div>
  );
}

/* ── Pieces ─────────────────────────────────────────────────────────────── */

/** The passkey option, framed as a biometric scanner with a sweeping laser. */
function PasskeyPod({
  onClick,
  busy,
  disabled,
  reduce,
}: {
  onClick: () => void;
  busy: boolean;
  disabled: boolean;
  reduce: boolean;
}) {
  return (
    <button
      id="signin-passkey"
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="group/pod holo-sheen relative flex w-full items-center gap-4 overflow-hidden rounded-2xl bg-white/[0.045] p-4 text-left ring-1 ring-inset ring-white/10 transition-all duration-400 hover:-translate-y-0.5 hover:bg-white/[0.075] hover:ring-[color-mix(in_oklab,var(--plasma)_55%,transparent)] disabled:pointer-events-none disabled:opacity-55"
    >
      <span aria-hidden className="sheen" />
      <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl plasma-fill text-white shadow-[0_10px_28px_-12px_rgba(142,45,226,0.9)]">
        {busy ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <Fingerprint className="size-5.5" />
        )}
        {!reduce && !busy && (
          <motion.span
            aria-hidden
            initial={{ y: "-120%" }}
            animate={{ y: "120%" }}
            transition={{ duration: 1.9, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-x-0 h-1/3 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.85),transparent)]"
          />
        )}
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="block text-sm font-semibold">
          Continue with a passkey
        </span>
        <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
          Face, fingerprint or device PIN — nothing to remember
        </span>
      </span>
      <ArrowRight className="relative size-4 shrink-0 text-muted-foreground transition-transform duration-300 group-hover/pod:translate-x-1" />
    </button>
  );
}

/** Primary submit — plasma pill with an indeterminate charge bar while busy. */
function PlasmaAction({
  children,
  busy,
  busyLabel,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  busy?: boolean;
  busyLabel?: string;
}) {
  return (
    <button
      className={cn(
        "btn-plasma group/act relative mt-1 flex h-12 w-full items-center justify-center gap-2 text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:pointer-events-none disabled:opacity-60",
        className,
      )}
      {...rest}
    >
      {busy ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          {busyLabel}
        </>
      ) : (
        <>
          {children}
          <ArrowRight className="size-4 transition-transform duration-300 group-hover/act:translate-x-1" />
        </>
      )}
    </button>
  );
}

/** Confirms who we think you are, with a one-tap correction. */
function IdentityChip({
  email,
  onChange,
}: {
  email: string;
  onChange: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 rounded-2xl bg-white/[0.04] p-3 ring-1 ring-inset ring-white/8"
    >
      <span className="relative grid size-11 shrink-0 place-items-center rounded-full">
        <span className="adv-orbit absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent,var(--plasma),var(--cyo),transparent)]" />
        <span className="absolute inset-[2px] grid place-items-center rounded-full bg-[#12102a] text-sm font-bold uppercase">
          {email.trim()[0] ?? "?"}
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.06em] text-success">
          <Check className="size-3" /> Workspace found
        </span>
        <span className="mt-0.5 block truncate text-[13px] font-medium">
          {email}
        </span>
      </span>
      <button
        type="button"
        onClick={onChange}
        className="shrink-0 rounded-full px-3 py-2 text-[13px] font-medium text-(--plasma) transition-colors hover:bg-white/8 coarse:py-3"
      >
        Change
      </button>
    </motion.div>
  );
}

function AltMethod({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof MailOpen;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/[0.04] px-3 py-3 text-[12px] font-medium ring-1 ring-inset ring-white/10 transition-all hover:-translate-y-0.5 hover:bg-white/[0.075] hover:ring-[color-mix(in_oklab,var(--plasma)_45%,transparent)]"
    >
      <Icon className="size-4 text-muted-foreground" /> {label}
    </button>
  );
}

function BackLink({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-1.5 rounded-full py-3 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-3.5" /> {children}
    </button>
  );
}

/** Magic-link sent state: a pulsing transmission beacon. */
function Beacon({ email, reduce }: { email: string; reduce: boolean }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/[0.04] p-6 text-center ring-1 ring-inset ring-white/8">
      <div className="relative mx-auto grid size-20 place-items-center">
        {!reduce &&
          [0, 1, 2].map((i) => (
            <motion.span
              key={i}
              aria-hidden
              initial={{ scale: 0.55, opacity: 0.6 }}
              animate={{ scale: 2.1, opacity: 0 }}
              transition={{
                duration: 2.6,
                repeat: Infinity,
                delay: i * 0.85,
                ease: "easeOut",
              }}
              className="absolute size-14 rounded-full ring-1 ring-(--plasma)"
            />
          ))}
        <span className="relative grid size-14 place-items-center rounded-2xl plasma-fill text-white shadow-[0_14px_36px_-12px_rgba(142,45,226,0.95)]">
          <MailOpen className="size-6" />
        </span>
      </div>
      <p className="mt-4 text-sm font-semibold">
        Link sent to {email || "your inbox"}
      </p>
      <p className="mt-1.5 text-[12px] leading-relaxed text-muted-foreground">
        It expires in 10 minutes and can only be used once.
      </p>
    </div>
  );
}
