"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * ── Auth form kit ─────────────────────────────────────────────────────────
 *
 * A small, quiet set of form pieces for the sign-in / sign-up cards. These
 * deliberately don't use the portal's HUD kit (corner brackets, scanning
 * underlines, plasma glow): a login is a threshold people cross every day, so
 * the field should read as a plain, well-made form — not an instrument panel.
 */

/** Input skin for the auth cards: a calm dark field. Icon sits at pl-11; use
 *  `authInputClass.replace("pl-11", "pl-4")` — or just override — when there's
 *  no leading icon. */
export const authInputClass =
  "h-12 rounded-lg border border-white/12 bg-white/[0.04] pl-11 text-[15px] text-white " +
  "placeholder:text-white/35 transition-colors " +
  "focus-visible:border-[color-mix(in_oklab,var(--plasma)_55%,transparent)] " +
  "focus-visible:ring-3 focus-visible:ring-[color-mix(in_oklab,var(--plasma)_22%,transparent)]";

export function Field({
  label,
  htmlFor,
  required,
  error,
  hint,
  icon: Icon,
  trailing,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  trailing?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <label
          htmlFor={htmlFor}
          className={cn(
            "text-[13px] font-medium text-white/70",
            error && "text-[color-mix(in_oklab,var(--rose)_78%,white)]",
          )}
        >
          {label}
          {required && <span className="ml-0.5 text-white/30">*</span>}
        </label>
        {trailing}
      </div>

      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-white/40" />
        )}
        {children}
      </div>

      <div className="min-h-[18px] pt-1" aria-live="polite">
        {error ? (
          <p className="text-[12px] text-[color-mix(in_oklab,var(--rose)_82%,white)]">
            {error}
          </p>
        ) : hint ? (
          <p className="text-[12px] text-white/40">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}

/** A plain hairline, optionally with a short caption centred in it. */
export function Divider({ children }: { children?: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-white/10" />
      {children && (
        <span className="whitespace-nowrap text-[12px] text-white/35">
          {children}
        </span>
      )}
      <span className="h-px flex-1 bg-white/10" />
    </div>
  );
}

/** The card the form sits in — a calm pane of dark glass over the globe. */
export function AuthCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-[#0b0a18]/72 p-6 backdrop-blur-xl sm:p-8",
        "shadow-[0_30px_90px_-45px_rgba(0,0,0,0.9)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
