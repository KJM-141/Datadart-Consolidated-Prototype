"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Logo } from "@/components/brand/logo";
import { HudLabel } from "@/components/advanced/kit/hud";
import { Magnetic } from "@/components/advanced/kit/interactions";
import { isActivePath, NAV_GROUPS, PATHS } from "@/lib/nav";
import { useAppStore, useMounted } from "@/lib/store";
import { deckStagger, driftIn, springSnap } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

/**
 * ── The nav rail ──────────────────────────────────────────────────────────
 *
 * Derived from the Aurora Deck's orbital rail, but seated rather than floating.
 * The deck's version was a `holo` card inset by 12px with an animated width —
 * beautiful in isolation, and wrong for a console, where the rail is a *wall*
 * of the frame and needs a hard edge against the working surface.
 *
 * What survives from the deck is everything that made it feel alive: the
 * magnetic pods, the capsule that slides between destinations on a shared
 * `layoutId`, the plasma edge on the active item, and the stagger on entry.
 */
export function NavRail({
  onNavigate,
  className,
}: {
  onNavigate?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const cartCount = useAppStore((s) => s.cart.reduce((n, i) => n + i.qty, 0));
  const mounted = useMounted();

  return (
    <motion.nav
      variants={deckStagger(0.03, 0.08)}
      initial="hidden"
      animate="show"
      aria-label="Primary"
      className={cn(
        "relative flex h-full flex-col overflow-y-auto bg-chrome",
        className,
      )}
    >
      {/* A whisper of plasma at the head of the rail, not a wash. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(80%_60%_at_50%_0%,color-mix(in_oklab,var(--plasma)_9%,transparent),transparent_72%)]"
      />

      {/* Brand sits at the same 56px as the top bar so the two align exactly,
          and centred in the column rather than hung off its left edge. */}
      <div className="relative flex h-14 shrink-0 items-center justify-center border-b border-hair px-4">
        {/* `md` rather than `sm`: the gradient lockup is a 4.5:1 letterbox, so
            a 22px height left it floating in a 56px bar. */}
        <Logo size="md" href={PATHS.dashboard} />
      </div>

      <div className="relative flex-1 space-y-6 px-3 py-5">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1">
            <motion.div variants={driftIn} className="px-2 pb-1.5">
              <HudLabel className="text-ink-3">{group.label}</HudLabel>
            </motion.div>

            {group.items.map((item) => {
              const active = isActivePath(pathname, item.href);
              const count = item.badge === "cart" && mounted ? cartCount : 0;

              return (
                <motion.div key={item.href} variants={driftIn}>
                  <Magnetic strength={0.14} radius={64} className="w-full">
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      data-cart-target={item.badge === "cart" ? "" : undefined}
                      className={cn(
                        "group/pod relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium outline-none transition-colors duration-300",
                        "focus-visible:ring-2 focus-visible:ring-ring",
                        active ? "text-ink" : "text-ink-2 hover:text-ink",
                      )}
                    >
                      {/* One capsule for the whole rail — `layoutId` slides it
                          between destinations instead of cross-fading two. */}
                      {active && (
                        <motion.span
                          layoutId="nav-capsule"
                          transition={springSnap}
                          aria-hidden
                          className="absolute inset-0 rounded-lg bg-[color-mix(in_oklab,var(--plasma)_13%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--plasma)_26%,transparent)]"
                        />
                      )}
                      {active && (
                        <motion.span
                          layoutId="nav-edge"
                          transition={springSnap}
                          aria-hidden
                          className="absolute inset-y-1.5 -left-3 w-[2px] rounded-full plasma-fill"
                        />
                      )}

                      <item.icon
                        className={cn(
                          "relative size-4 shrink-0 transition-colors",
                          active && "text-(--plasma)",
                        )}
                      />
                      <span className="relative truncate">{item.label}</span>

                      {count > 0 && (
                        <span className="relative ml-auto grid h-[17px] min-w-[17px] place-items-center rounded-full plasma-fill px-1 font-mono text-[9px] font-medium text-white">
                          {count}
                        </span>
                      )}
                    </Link>
                  </Magnetic>
                </motion.div>
              );
            })}
          </div>
        ))}
      </div>
    </motion.nav>
  );
}
