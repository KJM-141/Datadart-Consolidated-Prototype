"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  Building2,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MailOpen,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/shared/password-input";
import { AuthCard, Divider, Field, authInputClass } from "./auth-kit";
import { BOOT_REVEAL_MS, isBootPlaying } from "./boot-sequence";
import { deckStagger } from "@/lib/advanced-motion";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

/* Identifier first, then whichever method fits — password, a company SSO
   redirect, a one-time email link, or a passkey. */
type Step = "identify" | "password" | "sso" | "magic-sent";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignInConsole() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const signIn = useAppStore((s) => s.signIn);

  const [step, setStep] = useState<Step>("identify");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workspace, setWorkspace] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<
    null | "continue" | "passkey" | "password" | "sso" | "magic"
  >(null);
  const [capsOn, setCapsOn] = useState(false);
  const [start, setStart] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Land the card as the boot iris opens, not before.
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
      const t = setTimeout(() => passwordRef.current?.focus(), 320);
      return () => clearTimeout(t);
    }
  }, [step]);

  const go = (next: Step) => {
    setError(null);
    setStep(next);
  };

  /** Simulated auth — the prototype never contacts a real server. */
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
      setError("Enter a valid email address.");
      return;
    }
    setBusy("continue");
    await new Promise((r) => setTimeout(r, 400));
    setBusy(null);
    go("password");
  };

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError("Enter your password.");
      return;
    }
    await land("password", "Signed in.");
  };

  const submitSso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace.trim()) {
      setError("Enter your company domain.");
      return;
    }
    await land("sso", `Signed in with ${workspace.trim()} SSO.`);
  };

  const domain = email.split("@")[1] ?? "";

  const heading =
    step === "sso"
      ? "Company sign-in"
      : step === "magic-sent"
        ? "Check your email"
        : "Sign in";

  const sub =
    step === "identify"
      ? "Welcome back."
      : step === "password"
        ? "Enter your password to continue."
        : step === "sso"
          ? "We'll send you to your identity provider."
          : `We sent a sign-in link to ${email || "your inbox"}.`;

  return (
    <motion.div
      variants={deckStagger(0.06, 0.04)}
      initial="hidden"
      animate={start ? "show" : "hidden"}
    >
      <AuthCard>
        {/* Heading */}
        <div>
          <h1 className="text-[1.75rem] font-semibold leading-tight">{heading}</h1>
          <p className="mt-1.5 text-sm text-white/55">{sub}</p>
        </div>

        {/* Panes */}
        <div className="mt-6">
          <AnimatePresence mode="wait" initial={false}>
            {/* ── identify ── */}
            {step === "identify" && (
              <motion.div
                key="identify"
                {...fade(reduce)}
                className="space-y-4"
              >
                <PasskeyButton
                  busy={busy === "passkey"}
                  disabled={busy !== null}
                  onClick={() =>
                    land("passkey", "Signed in with your passkey.", "demo.user@example.com")
                  }
                />

                <Divider>or</Divider>

                <form onSubmit={submitIdentify} noValidate>
                  <Field
                    label="Email"
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
                      className={authInputClass}
                    />
                  </Field>

                  <SubmitButton busy={busy === "continue"} busyLabel="Checking…">
                    Continue
                  </SubmitButton>
                </form>

                <button
                  type="button"
                  onClick={() => go("sso")}
                  className="flex w-full items-center justify-center gap-2 py-2.5 text-[13px] font-medium text-white/55 transition-colors hover:text-white"
                >
                  <Building2 className="size-3.5" /> Use single sign-on
                </button>
              </motion.div>
            )}

            {/* ── password ── */}
            {step === "password" && (
              <motion.div key="password" {...fade(reduce)} className="space-y-4">
                <IdentityRow email={email} onChange={() => go("identify")} />

                <form onSubmit={submitPassword} noValidate>
                  <Field
                    label="Password"
                    required
                    htmlFor="password"
                    icon={Lock}
                    error={error ?? undefined}
                    hint={capsOn ? undefined : "Any password works in this demo."}
                    trailing={
                      <Link
                        href="/forgotpassword"
                        className="text-[13px] font-medium text-white/55 hover:text-white"
                      >
                        Forgot?
                      </Link>
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
                      className={cn(authInputClass, "pl-11")}
                    />
                  </Field>

                  {capsOn && (
                    <p className="-mt-1 mb-2 flex items-center gap-1.5 text-[13px] font-medium text-amber-400">
                      <TriangleAlert className="size-3.5" /> Caps Lock is on
                    </p>
                  )}

                  <SubmitButton busy={busy === "password"} busyLabel="Signing in…">
                    Sign in
                  </SubmitButton>
                </form>

                <Divider>or</Divider>

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
                    onClick={() => land("passkey", "Signed in with your passkey.")}
                  />
                </div>
              </motion.div>
            )}

            {/* ── sso ── */}
            {step === "sso" && (
              <motion.div key="sso" {...fade(reduce)} className="space-y-4">
                <form onSubmit={submitSso} noValidate>
                  <Field
                    label="Company domain"
                    required
                    htmlFor="workspace"
                    icon={Building2}
                    error={error ?? undefined}
                    hint="For example, acme.com"
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
                      className={authInputClass}
                    />
                  </Field>

                  <SubmitButton busy={busy === "sso"} busyLabel="Redirecting…">
                    Continue
                  </SubmitButton>
                </form>

                <BackLink onClick={() => go("identify")}>
                  Back to sign-in options
                </BackLink>
              </motion.div>
            )}

            {/* ── magic link sent ── */}
            {step === "magic-sent" && (
              <motion.div key="magic" {...fade(reduce)} className="space-y-4">
                <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[var(--plasma)]/90 text-white">
                    <MailOpen className="size-4.5" />
                  </span>
                  <p className="pt-0.5 text-[13px] leading-relaxed text-white/60">
                    Open the link in that email to finish signing in. It works
                    once and expires in 10 minutes.
                  </p>
                </div>

                <SubmitButton
                  onClick={() => land("magic", "Signed in.")}
                  busy={busy === "magic"}
                  busyLabel="Opening…"
                >
                  Open the link
                </SubmitButton>

                <BackLink onClick={() => go("password")}>
                  Use your password instead
                </BackLink>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* New account */}
        <p className="mt-7 border-t border-white/10 pt-6 text-center text-sm text-white/55">
          New to DataDart?{" "}
          <Link
            href="/signup"
            className="font-medium text-[color-mix(in_oklab,var(--plasma)_70%,white)] hover:underline"
          >
            Create an account
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

/** Passkey option — a plain secondary button, no laser scanner. */
function PasskeyButton({
  onClick,
  busy,
  disabled,
}: {
  onClick: () => void;
  busy: boolean;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex w-full items-center gap-3.5 rounded-xl border border-white/12 bg-white/[0.04] p-3.5 text-left transition-colors hover:bg-white/[0.07] disabled:pointer-events-none disabled:opacity-55"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/8 text-white/80">
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <KeyRound className="size-4.5" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-white">
          Sign in with a passkey
        </span>
        <span className="mt-0.5 block text-[12px] text-white/45">
          Use your fingerprint, face, or device PIN
        </span>
      </span>
    </button>
  );
}

/** Primary submit — the flat accent button, with a spinner while busy. */
function SubmitButton({
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
        "btn-plasma mt-1 flex h-12 w-full items-center justify-center gap-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:pointer-events-none disabled:opacity-60",
        className,
      )}
      disabled={busy || rest.disabled}
      {...rest}
    >
      {busy ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          {busyLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

/** Shows which account we're signing in, with a one-tap way to change it. */
function IdentityRow({
  email,
  onChange,
}: {
  email: string;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/8 text-sm font-semibold uppercase text-white/80">
        {email.trim()[0] ?? "?"}
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-white/85">
        {email}
      </span>
      <button
        type="button"
        onClick={onChange}
        className="shrink-0 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-white/55 transition-colors hover:bg-white/8 hover:text-white"
      >
        Change
      </button>
    </div>
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
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/12 bg-white/[0.04] px-3 py-3 text-[13px] font-medium text-white/80 transition-colors hover:bg-white/[0.07] hover:text-white"
    >
      <Icon className="size-4 text-white/50" /> {label}
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
      className="flex w-full items-center justify-center gap-1.5 py-2.5 text-[13px] font-medium text-white/55 transition-colors hover:text-white"
    >
      <ArrowLeft className="size-3.5" /> {children}
    </button>
  );
}
