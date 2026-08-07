"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowLeft, Check, KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { PasswordInput } from "@/components/shared/password-input";
import { Block, Label, Note, PageHead } from "../kit";
import { PATHS } from "@/lib/nav";
import { bloomSoft, deckStagger } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

/**
 * ── Change password ───────────────────────────────────────────────────────
 *
 * Three fields in one block.
 *
 * The previous version put a live strength gauge ring beside the form. A
 * circular gauge implies a continuous measure with a meaningful maximum, and
 * password strength here is four booleans — so the ring was an animation of a
 * checklist. The checklist is the honest rendering, and it ticks.
 */

const RULES: { label: string; test: (v: string) => boolean }[] = [
  { label: "At least 8 characters", test: (v) => v.length >= 8 },
  { label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "One number", test: (v) => /\d/.test(v) },
  { label: "One symbol", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

export function ChangePasswordPage() {
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const passed = RULES.filter((r) => r.test(newPass)).length;
  const strongEnough = passed === RULES.length;
  const matches = confirm.length > 0 && confirm === newPass;
  const valid = oldPass.length > 0 && strongEnough && matches;

  const submit = async () => {
    if (!valid) {
      setShowErrors(true);
      return;
    }
    setBusy(true);
    await new Promise((r) => setTimeout(r, 600));
    setBusy(false);
    setOldPass("");
    setNewPass("");
    setConfirm("");
    setShowErrors(false);
    toast.success("Password changed");
  };

  return (
    <>
      <Link
        href={PATHS.profile}
        className="mb-4 inline-flex items-center gap-1.5 text-[12px] text-ink-3 transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" /> My profile
      </Link>

      <PageHead
        eyebrow="Security"
        title="Change password"
        description="Sets a new password for this account. You will stay signed in on this device."
      />

      <motion.div
        variants={deckStagger(0.05, 0.04)}
        initial="hidden"
        animate="show"
        className="max-w-xl"
      >
        <motion.div variants={bloomSoft}>
          <Block icon={KeyRound} label="New password">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
              className="space-y-3 px-4 py-4"
            >
              <div>
                <Label className="mb-1.5">Current password</Label>
                <PasswordInput
                  value={oldPass}
                  onChange={(e) => setOldPass(e.target.value)}
                  aria-label="Current password"
                />
                {showErrors && !oldPass && (
                  <p className="mt-1 text-[11px] text-destructive">
                    Enter your current password.
                  </p>
                )}
              </div>

              <div>
                <Label className="mb-1.5">New password</Label>
                <PasswordInput
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  aria-label="New password"
                />

                {/* Four booleans, rendered as four booleans. */}
                <ul className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {RULES.map((r) => {
                    const ok = r.test(newPass);
                    return (
                      <li
                        key={r.label}
                        className="flex items-center gap-1.5 text-[11px]"
                      >
                        <span
                          className={cn(
                            "grid size-3.5 shrink-0 place-items-center rounded-full transition-colors",
                            ok
                              ? "bg-[color-mix(in_oklab,var(--success)_18%,transparent)]"
                              : "bg-sunk",
                          )}
                        >
                          {ok && <Check className="size-2 text-success" />}
                        </span>
                        <span className={ok ? "text-ink-2" : "text-ink-3"}>
                          {r.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div>
                <Label className="mb-1.5">Confirm new password</Label>
                <PasswordInput
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  aria-label="Confirm new password"
                />
                {confirm.length > 0 && !matches && (
                  <p className="mt-1 text-[11px] text-destructive">
                    The two passwords do not match.
                  </p>
                )}
              </div>

              <div className="border-t border-hair pt-3">
                <button
                  type="submit"
                  disabled={!valid || busy}
                  className="btn-plasma inline-flex h-10 items-center px-5 text-[12.5px] font-medium text-white disabled:pointer-events-none disabled:opacity-40"
                >
                  {busy ? "Saving…" : "Change password"}
                </button>
              </div>
            </form>

            <Note icon={ShieldCheck}>
              We never ask for your password over chat, email or phone.
            </Note>
          </Block>
        </motion.div>
      </motion.div>
    </>
  );
}
