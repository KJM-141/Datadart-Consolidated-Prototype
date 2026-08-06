"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Loader2, Mail, RadioTower } from "lucide-react";
import { Input } from "@/components/ui/input";
import { HoloPanel } from "@/components/advanced/kit/holo-panel";
import { HudDivider, HudField, hudInputClass } from "@/components/advanced/kit/hud-field";
import { HudLabel, LiveDot } from "@/components/advanced/kit/hud";
import { Tilt } from "@/components/advanced/kit/interactions";
import { EASE_ADV, bloomSoft, deckStagger } from "@/lib/advanced-motion";
import { PATHS } from "@/lib/nav";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});

/** Same recovery flow as the Normal build, staged as a transmission beacon. */
export function ForgotConsole() {
  const reduce = useReducedMotion();
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 700));
    setSentTo(values.email);
  };

  return (
    <motion.div variants={deckStagger(0.07, 0.05)} initial="hidden" animate="show">
      <Tilt strength={4} glare={false}>
        <HoloPanel
          plain
          brackets
          className="p-6 sm:p-8"
          style={{ background: "rgba(14,11,32,0.62)" }}
        >
          <AnimatePresence mode="wait">
            {sentTo ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.97, filter: "blur(8px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.5, ease: EASE_ADV }}
                className="text-center"
              >
                <div className="relative mx-auto grid size-24 place-items-center">
                  {!reduce &&
                    [0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        aria-hidden
                        initial={{ scale: 0.5, opacity: 0.65 }}
                        animate={{ scale: 2.3, opacity: 0 }}
                        transition={{
                          duration: 2.8,
                          repeat: Infinity,
                          delay: i * 0.9,
                          ease: "easeOut",
                        }}
                        className="absolute size-16 rounded-full ring-1 ring-(--cyo)"
                      />
                    ))}
                  <motion.span
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
                    className="relative grid size-16 place-items-center rounded-2xl plasma-fill text-white shadow-[0_16px_40px_-14px_rgba(142,45,226,0.95)]"
                  >
                    <RadioTower className="size-7" />
                  </motion.span>
                </div>

                <HudLabel className="mt-5">Beacon transmitted</HudLabel>
                <h1 className="mt-2 text-[1.75rem] font-semibold leading-tight tracking-tight">
                  Check your inbox
                </h1>
                <p className="mx-auto mt-2.5 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
                  If an account exists for{" "}
                  <span className="font-semibold text-foreground">{sentTo}</span>
                  , a password-reset link is on its way.
                </p>

                <Link
                  href={PATHS.signin}
                  className="btn-ghost-hud mt-6 inline-flex h-11 items-center justify-center gap-2 px-6 text-[13px] font-medium"
                >
                  <ArrowLeft className="size-4" /> Back to sign in
                </Link>
              </motion.div>
            ) : (
              <motion.div key="form" exit={{ opacity: 0, filter: "blur(6px)" }}>
                <motion.div variants={bloomSoft}>
                  <div className="flex items-center gap-2">
                    <LiveDot tone="rose" />
                    <HudLabel>Account recovery</HudLabel>
                  </div>
                  <h1 className="mt-2.5 text-[2rem] font-semibold leading-[1.05] tracking-tight">
                    Confirm email
                  </h1>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">
                    Enter the email you registered with and we&apos;ll send a
                    reset link.
                  </p>
                </motion.div>

                {/* noValidate so the Zod messages show instead of the browser's. */}
                <motion.form
                  variants={bloomSoft}
                  onSubmit={handleSubmit(onSubmit)}
                  noValidate
                  className="mt-7"
                >
                  <HudField
                    label="Email address"
                    required
                    htmlFor="email"
                    icon={Mail}
                    error={errors.email?.message}
                  >
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      autoComplete="email"
                      autoFocus
                      className={hudInputClass}
                      {...register("email")}
                    />
                  </HudField>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-plasma group/act mt-1 flex h-12 w-full items-center justify-center gap-2 text-[13px] font-medium disabled:pointer-events-none disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> Sending…
                      </>
                    ) : (
                      <>
                        Send reset link
                        <ArrowRight className="size-4 transition-transform duration-300 group-hover/act:translate-x-1" />
                      </>
                    )}
                  </button>
                </motion.form>

                <motion.div variants={bloomSoft} className="mt-7">
                  <HudDivider />
                  <Link
                    href={PATHS.signin}
                    className="mt-5 flex w-full items-center justify-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground coarse:min-h-11"
                  >
                    <ArrowLeft className="size-3.5" /> Back to sign in
                  </Link>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </HoloPanel>
      </Tilt>
    </motion.div>
  );
}
