"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import {
  isActivePath,
  NAV_GROUPS,
  PATHS,
  type NavGroup,
  type NavItem,
} from "@/lib/nav";
import { useAppStore, useMounted } from "@/lib/store";
import { deckStagger, driftIn, springSnap, EASE_ADV } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

/**
 * ── The nav rail ──────────────────────────────────────────────────────────
 *
 * A wall of the frame, seated against the working surface with a hard edge.
 * `Workspace` and `Catalog` are collapsible groups — click the heading to fold
 * one away — and `Studio` sits between them as a single destination.
 *
 * What carries the affordance: the capsule that slides between destinations on
 * a shared `layoutId`, the plasma edge on the active item, and the stagger on
 * entry.
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

  // Which collapsible groups are folded. Default: all open. Kept in the rail so
  // a fold survives navigation (the rail lives in the console layout and does
  // not remount between routes).
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const itemLink = (item: NavItem) => {
    const active = isActivePath(pathname, item.href);
    const count = item.badge === "cart" && mounted ? cartCount : 0;
    return (
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
    );
  };

  const renderGroup = (group: NavGroup) => {
    // A single destination: one row, no folding.
    if (group.standalone) {
      return (
        <div key={group.label}>
          <motion.div variants={driftIn}>{itemLink(group.items[0])}</motion.div>
        </div>
      );
    }

    const isCollapsed = !!collapsed[group.label];
    return (
      <div key={group.label} className="space-y-1">
        <motion.button
          variants={driftIn}
          type="button"
          onClick={() =>
            setCollapsed((c) => ({ ...c, [group.label]: !c[group.label] }))
          }
          aria-expanded={!isCollapsed}
          className="group/head flex w-full items-center justify-between rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-3 transition-colors hover:text-ink-2"
        >
          <span>{group.label}</span>
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform duration-300",
              isCollapsed && "-rotate-90",
            )}
          />
        </motion.button>

        <AnimatePresence initial={false}>
          {!isCollapsed && (
            <motion.div
              key="items"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.24, ease: EASE_ADV }}
              className="space-y-1 overflow-hidden"
            >
              {group.items.map((item) => (
                <div key={item.href}>{itemLink(item)}</div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

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
      <div className="relative flex h-14 shrink-0 items-center justify-center border-b border-hair px-4">
        <Logo size="md" href={PATHS.dashboard} />
      </div>

      <div className="relative flex-1 space-y-5 px-3 py-5">
        {NAV_GROUPS.map(renderGroup)}
      </div>
    </motion.nav>
  );
}
