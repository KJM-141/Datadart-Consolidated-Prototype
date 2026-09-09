"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Check, KeyRound, Loader2, ShieldCheck, X } from "lucide-react";
import { toast } from "sonner";
import { PasswordInput } from "@/components/shared/password-input";
import { HoloPanel } from "@/components/advanced/kit/holo-panel";
import { HudField, hudInputClass } from "@/components/advanced/kit/hud-field";
import { HudLabel, MetricRing, PageHeading } from "@/components/advanced/kit/hud";
import { bloomSoft, deckStagger, EASE_ADV, useSafeReducedMotion } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

/** Identical policy to the Normal build. */
const RULES: { label: string; test: (v: string) => boolean }[] = [
  { label: "Minimum 8 characters", test: (v) => v.length >= 8 },
  { label: "Minimum 1 upper case letter", test: (v) => /[A-Z]/.test(v) },
  { label: "Minimum 1 lower case letter", test: (v) => /[a-z]/.test(v) },
  { label: "Minimum 1 number", test: (v) => /\d/.test(v) },
  {
    label: "Minimum 1 non alpha-numeric character",
    test: (v) => /[^A-Za-z0-9]/.test(v),
  },
];

/**
 * Change password — the Advanced security console. Same rules, same validation
 * gate, same reset-on-success; the checklist becomes a live policy readout with
 * a compliance ring that fills as each rule is met.
 */
export function ChangePasswordAdvanced() {
  const reduce = useSafeReducedMotion();
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const rulesPassed = RULES.map((r) => r.test(newPass));
  const passedCount = rulesPassed.filter(Boolean).length;
  const allRulesPass = rulesPassed.every(Boolean);
  const confirmMatches = confirm.length > 0 && confirm === newPass;
  const valid = oldPass.length > 0 && allRulesPass && confirmMatches;

  const submit = async () => {
    if (!valid) {
      setShowErrors(true);
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 750));
    setSubmitting(false);
    setOldPass("");
    setNewPass("");
    setConfirm("");
    setShowErrors(false);
    toast.success("Password changed successfully!");
  };

  return (
    <motion.div
      variants={deckStagger(0.07)}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-xl space-y-6"
    >
      <PageHeading
        eyebrow="Security"
        title="Change password"
        description="Pick a strong password, the policy readout confirms each requirement as you type."
      />

      <motion.div variants={bloomSoft}>
        <HoloPanel plain brackets className="overflow-hidden p-6 sm:p-8">
          <span aria-hidden className="hud-dots absolute inset-0 opacity-20" />

          <div className="relative mx-auto mb-7 grid size-16 place-items-center">
            {!reduce && (
              <span className="adv-ping absolute inset-0 rounded-2xl plasma-fill opacity-30" />
            )}
            <span className="relative grid size-14 place-items-center rounded-2xl plasma-fill text-white shadow-[0_14px_36px_-14px_color-mix(in_oklab,var(--plasma)_95%,transparent)]">
              <KeyRound className="size-6" />
            </span>
          </div>

          <div className="relative">
            <HudField
              label="Enter old password"
              required
              htmlFor="cp-old"
              error={
                showErrors && !oldPass ? "Old password is required" : undefined
              }
            >
              <PasswordInput
                id="cp-old"
                placeholder="Current password"
                autoComplete="current-password"
                value={oldPass}
                onChange={(e) => setOldPass(e.target.value)}
                className={cn(hudInputClass, "pl-4")}
              />
            </HudField>

            <HudField
              label="Enter new password"
              required
              htmlFor="cp-new"
              error={
                showErrors && !allRulesPass
                  ? "New password doesn't meet the policy below"
                  : undefined
              }
            >
              <PasswordInput
                id="cp-new"
                placeholder="New password"
                autoComplete="new-password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className={cn(hudInputClass, "pl-4")}
              />
            </HudField>

            <HudField
              label="Confirm new password"
              required
              htmlFor="cp-confirm"
              error={
                showErrors && !confirmMatches
                  ? "Passwords do not match"
                  : undefined
              }
            >
              <PasswordInput
                id="cp-confirm"
                placeholder="Repeat new password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={cn(hudInputClass, "pl-4")}
              />
            </HudField>

            {/* policy readout */}
            <div className="mt-4 flex items-start gap-5 rounded-2xl bg-muted/40 p-4 ring-1 ring-inset ring-border">
              <MetricRing
                id="policy"
                value={passedCount / RULES.length}
                size={68}
                stroke={6}
                className="shrink-0"
                to={allRulesPass ? "var(--success)" : "var(--cyo)"}
              >
                <span className="text-center">
                  <span className="block text-[15px] font-semibold leading-none tabular-nums">
                    {passedCount}
                    <span className="text-muted-foreground">/{RULES.length}</span>
                  </span>
                </span>
              </MetricRing>

              <div className="min-w-0 flex-1">
                <HudLabel className="flex items-center gap-1.5">
                  <ShieldCheck className="size-3" /> Password policy
                </HudLabel>
                <ul className="mt-2.5 space-y-1.5">
                  {RULES.map((rule, i) => {
                    const ok = rulesPassed[i];
                    return (
                      <motion.li
                        key={rule.label}
                        animate={{ opacity: ok ? 1 : 0.65 }}
                        transition={{ duration: 0.25, ease: EASE_ADV }}
                        className="flex items-center gap-2 text-[12px]"
                      >
                        <span
                          className={cn(
                            "grid size-4 shrink-0 place-items-center rounded-full transition-colors",
                            ok
                              ? "bg-success text-white"
                              : "bg-muted text-muted-foreground/60",
                          )}
                        >
                          {ok ? (
                            <Check className="size-2.5" strokeWidth={3.5} />
                          ) : (
                            <X className="size-2.5" strokeWidth={3} />
                          )}
                        </span>
                        <span
                          className={cn(
                            ok ? "text-foreground" : "text-muted-foreground",
                          )}
                        >
                          {rule.label}
                        </span>
                      </motion.li>
                    );
                  })}
                </ul>
              </div>
            </div>

            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="btn-plasma mt-5 flex h-12 w-full items-center justify-center gap-2 text-[13px] font-medium disabled:pointer-events-none disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Updating…
                </>
              ) : (
                "Change password"
              )}
            </button>
          </div>
        </HoloPanel>
      </motion.div>
    </motion.div>
  );
}
