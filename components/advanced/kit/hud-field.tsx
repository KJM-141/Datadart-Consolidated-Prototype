"use client";

import { useId, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { TriangleAlert } from "lucide-react";
import { EASE_ADV } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

/**
 * Shared class for text controls on the deck. Applied to the existing Input /
 * PasswordInput primitives rather than reimplementing them — the eye toggle,
 * autocomplete hints and iOS font-size guard all keep working, and only the
 * skin changes.
 */
export const hudInputClass =
  "h-12 rounded-xl border-transparent bg-[color-mix(in_oklab,var(--muted)_65%,transparent)] pl-11 text-[15px] " +
  "shadow-[inset_0_0_0_1px_var(--border)] transition-shadow duration-300 " +
  "focus-visible:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--plasma)_65%,transparent),0_0_22px_-8px_color-mix(in_oklab,var(--plasma)_90%,transparent)]";

/**
 * A form control framed like an instrument readout: micro-label, four corner
 * brackets that ignite on focus, and a scanning underline.
 */
export function HudField({
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
  const [focused, setFocused] = useState(false);
  const fallbackId = useId();
  const describedBy = `${htmlFor ?? fallbackId}-msg`;

  return (
    <div className={cn("group/field", className)}>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <label
          htmlFor={htmlFor}
          className={cn(
            "hud-label transition-colors duration-300",
            focused && "text-(--plasma)",
            error && "text-destructive",
          )}
        >
          {label}
          {required && <span className="ml-1 text-(--rose)">*</span>}
        </label>
        {trailing}
      </div>

      <div
        className="relative"
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={() => setFocused(false)}
      >
        {Icon && (
          <Icon
            className={cn(
              "pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 transition-colors duration-300",
              focused ? "text-(--plasma)" : "text-muted-foreground",
              error && "text-destructive",
            )}
          />
        )}
        {children}

        {/* corner brackets */}
        <AnimatePresence>
          {focused && (
            <motion.span
              aria-hidden
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.24, ease: EASE_ADV }}
              className="pointer-events-none absolute -inset-1 rounded-[14px]"
              style={{
                background: `
                  linear-gradient(var(--plasma),var(--plasma)) 0 0/10px 1.5px no-repeat,
                  linear-gradient(var(--plasma),var(--plasma)) 0 0/1.5px 10px no-repeat,
                  linear-gradient(var(--plasma),var(--plasma)) 100% 0/10px 1.5px no-repeat,
                  linear-gradient(var(--plasma),var(--plasma)) 100% 0/1.5px 10px no-repeat,
                  linear-gradient(var(--cyo),var(--cyo)) 0 100%/10px 1.5px no-repeat,
                  linear-gradient(var(--cyo),var(--cyo)) 0 100%/1.5px 10px no-repeat,
                  linear-gradient(var(--cyo),var(--cyo)) 100% 100%/10px 1.5px no-repeat,
                  linear-gradient(var(--cyo),var(--cyo)) 100% 100%/1.5px 10px no-repeat`,
              }}
            />
          )}
        </AnimatePresence>
      </div>

      <div className="min-h-5 pt-1.5" id={describedBy} aria-live="polite">
        <AnimatePresence mode="wait">
          {error ? (
            <motion.p
              key="err"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-1.5 text-[11px] font-medium text-destructive"
            >
              <TriangleAlert className="size-3" />
              {error}
            </motion.p>
          ) : hint ? (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[11px] text-muted-foreground"
            >
              {hint}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** Divider with an engraved caption — used between auth methods. */
export function HudDivider({ children }: { children?: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="hud-rule flex-1" />
      {children && (
        <span className="hud-label whitespace-nowrap">{children}</span>
      )}
      <span className="hud-rule flex-1 rotate-180" />
    </div>
  );
}
