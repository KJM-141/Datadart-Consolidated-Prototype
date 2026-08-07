"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  ArrowLeftRight,
  BookOpen,
  Calculator,
  CalendarClock,
  Inbox,
  LayoutDashboard,
  type LucideIcon,
  Package,
  ShoppingCart,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Label } from "./kit";
import { isActivePath, PATHS } from "@/lib/nav";
import { useAppStore, useMounted } from "@/lib/store";
import { deckStagger, driftIn, springSnap } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

/**
 * ── The sidebar ───────────────────────────────────────────────────────────
 *
 * Open, labelled, and the only persistent column on the left.
 *
 * It replaces two things at once: a 52px icon strip whose labels lived in
 * tooltips, and a 208px readout standing beside it. Together those were 260px
 * of chrome in which the *navigation* — the part you use on every visit — was
 * the half you could not read.
 *
 * The readout did not survive the trade, and should not have. A permanent
 * column of seven figures is a dashboard bolted to the side of every page,
 * and most of them were repeating what the page you were already on says
 * better. What was genuinely cross-cutting — what is waiting on you — is now
 * `AttentionMenu` in the bar and an inline strip on the page it concerns.
 *
 * Grouped in three because a flat list of nine reads as a pile: what you are
 * running, what you can buy, and what you can learn.
 */

interface Dest {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: "cart";
}

const GROUPS: { label: string; items: Dest[] }[] = [
  {
    label: "Operate",
    items: [
      { href: PATHS.dashboard, label: "Command centre", icon: LayoutDashboard },
      { href: PATHS.transfers, label: "Transfers", icon: ArrowLeftRight },
      { href: PATHS.subscriptions, label: "Subscriptions", icon: CalendarClock },
      { href: PATHS.conversations, label: "Conversations", icon: Inbox },
    ],
  },
  {
    label: "Order",
    items: [
      { href: PATHS.hardware, label: "Hardware", icon: Package },
      { href: PATHS.sizer, label: "Sizer", icon: Calculator },
      { href: PATHS.checkout, label: "Cart", icon: ShoppingCart, badge: "cart" },
    ],
  },
  {
    label: "Learn",
    items: [{ href: PATHS.resources, label: "Resources", icon: BookOpen }],
  },
];

export function Sidebar({
  onNavigate,
  className,
  showBrand = true,
}: {
  onNavigate?: () => void;
  className?: string;
  /** The sheet has its own header, so it hides the brand block. */
  showBrand?: boolean;
}) {
  const pathname = usePathname();
  const cartCount = useAppStore((s) => s.cart.reduce((n, i) => n + i.qty, 0));
  const mounted = useMounted();

  return (
    <motion.nav
      variants={deckStagger(0.03, 0.05)}
      initial="hidden"
      animate="show"
      aria-label="Primary"
      className={cn("relative h-full flex-col overflow-y-auto bg-canvas/60", className)}
    >
      {/* A whisper of plasma at the head of the column, not a wash. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[radial-gradient(80%_60%_at_50%_0%,color-mix(in_oklab,var(--plasma)_8%,transparent),transparent_72%)]"
      />

      {showBrand && (
        <div className="relative flex h-13 shrink-0 items-center border-b border-hair px-4">
          <Logo size="sm" href={PATHS.dashboard} />
        </div>
      )}

      <div className="relative flex-1 space-y-5 px-2.5 py-4">
        {GROUPS.map((group) => (
          <div key={group.label}>
            <motion.div variants={driftIn}>
              <Label className="px-2 pb-1.5">{group.label}</Label>
            </motion.div>

            <div className="space-y-px">
              {group.items.map((d) => {
                const here = isActivePath(pathname, d.href);
                const count = d.badge === "cart" && mounted ? cartCount : 0;

                return (
                  <motion.div key={d.href} variants={driftIn}>
                    <Link
                      href={d.href}
                      onClick={onNavigate}
                      aria-current={here ? "page" : undefined}
                      data-cart-target={d.badge === "cart" ? "" : undefined}
                      className={cn(
                        "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[12.5px] outline-none transition-colors",
                        "focus-visible:ring-2 focus-visible:ring-ring",
                        here ? "text-ink" : "text-ink-2 hover:text-ink",
                      )}
                    >
                      {/* One capsule for the whole sidebar — `layoutId` slides
                          it between destinations instead of cross-fading. */}
                      {here && (
                        <motion.span
                          layoutId="sidebar-capsule"
                          transition={springSnap}
                          aria-hidden
                          className="absolute inset-0 rounded-lg bg-[color-mix(in_oklab,var(--plasma)_13%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--plasma)_26%,transparent)]"
                        />
                      )}
                      {here && (
                        <motion.span
                          layoutId="sidebar-edge"
                          transition={springSnap}
                          aria-hidden
                          className="absolute inset-y-1.5 -left-2.5 w-[2px] rounded-full plasma-fill"
                        />
                      )}

                      <d.icon
                        className={cn(
                          "relative size-4 shrink-0 transition-colors",
                          here ? "text-(--plasma)" : "text-ink-3",
                        )}
                      />
                      <span className={cn("relative truncate", here && "font-medium")}>
                        {d.label}
                      </span>

                      {count > 0 && (
                        <span className="relative ml-auto grid h-[17px] min-w-[17px] place-items-center rounded-full plasma-fill px-1 font-mono text-[9px] text-white">
                          {count}
                        </span>
                      )}
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </motion.nav>
  );
}
