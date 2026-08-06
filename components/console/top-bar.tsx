"use client";

import { usePathname } from "next/navigation";
import { Activity, Gauge, Menu, PanelRight, Radio, Search } from "lucide-react";
import { LiveDot } from "@/components/advanced/kit/hud";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { isActivePath, NAV_GROUPS, offNavTitle } from "@/lib/nav";
import { useAppStore, useMounted } from "@/lib/store";
import { cn } from "@/lib/utils";

/**
 * ── The top bar ───────────────────────────────────────────────────────────
 *
 * 56px, edge to edge, sitting above all three columns — the console's one
 * horizontal member. The deck's HUD bar floated as a rounded `holo` capsule
 * inset from the viewport; here it is a structural rail with a hairline under
 * it, which is what lets the three columns below read as one frame.
 *
 * The three live figures are kept from the deck. They are the only numbers on
 * screen that are true regardless of which route you are on, which is exactly
 * what belongs in persistent chrome.
 */
export function TopBar({
  onOpenPalette,
  onOpenNav,
  onToggleRail,
  className,
}: {
  onOpenPalette: () => void;
  onOpenNav: () => void;
  onToggleRail: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const orders = useAppStore((s) => s.orders);
  const subs = useAppStore((s) => s.subscriptions);
  const mounted = useMounted();

  const active = orders.filter((o) => !o.closed);
  const inTransitTB = active
    .filter((o) => ["Data Load", "Shipment", "DT2 Upload"].includes(o.stage))
    .reduce((n, o) => n + o.volumeTB, 0);

  // Longest match wins: `/customer` is a prefix of every console route, so a
  // first-match search would label every page "Overview". Routes reachable
  // without a rail entry — the profile, an agreement — fall through to
  // `OFF_NAV_TITLES`; without it they all read "Console", which is what the
  // profile page shipped as.
  const label =
    NAV_GROUPS.flatMap((g) => g.items)
      .filter((i) => isActivePath(pathname, i.href))
      .sort((a, b) => b.href.length - a.href.length)[0]?.label ??
    offNavTitle(pathname);

  return (
    <header className={cn("bg-canvas/72", className)} style={{ boxShadow: "var(--shadow-bar)" }}>
      {/* Nav trigger only exists below lg, where the rail has become a sheet. */}
      <button
        type="button"
        onClick={onOpenNav}
        aria-label="Open navigation"
        className="grid size-9 shrink-0 place-items-center rounded-lg text-ink-2 transition-colors hover:bg-accent hover:text-ink lg:hidden"
      >
        <Menu className="size-4.5" />
      </button>

      <span className="truncate text-[13px] font-medium">{label}</span>

      {/* The three figures that are true on every route. */}
      <div className="hidden min-w-0 flex-1 items-center justify-center gap-7 lg:flex">
        {mounted && (
          <>
            <Figure
              icon={Activity}
              value={String(active.length)}
              unit={`active transfer${active.length === 1 ? "" : "s"}`}
              live={active.length > 0}
            />
            <Divider />
            <Figure
              icon={Gauge}
              value={inTransitTB.toLocaleString()}
              unit="TB in motion"
            />
            <Divider />
            <Figure
              icon={Radio}
              value={String(subs.filter((s) => s.status !== "Closed").length)}
              unit="subscriptions"
            />
          </>
        )}
      </div>
      <div className="flex-1 lg:hidden" />

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onOpenPalette}
          className="group hidden items-center gap-2 rounded-lg bg-sunk py-1.5 pl-3 pr-1.5 text-[12px] text-ink-2 shadow-[inset_0_0_0_1px_var(--hair)] transition-colors duration-300 hover:text-ink hover:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--plasma)_32%,transparent)] sm:inline-flex"
        >
          <Search className="size-3.5" />
          <span>Search</span>
          <kbd className="rounded bg-canvas/70 px-1.5 py-0.5 font-mono text-[10px] ring-1 ring-inset ring-hair">
            ⌘K
          </kbd>
        </button>
        <button
          type="button"
          onClick={onOpenPalette}
          aria-label="Search"
          className="grid size-9 place-items-center rounded-lg text-ink-2 transition-colors hover:bg-accent hover:text-ink sm:hidden"
        >
          <Search className="size-4.5" />
        </button>

        {/* Below xl the rail is a sheet, so it needs a trigger of its own. */}
        <button
          type="button"
          onClick={onToggleRail}
          aria-label="Toggle panel"
          className="grid size-9 place-items-center rounded-lg text-ink-2 transition-colors hover:bg-accent hover:text-ink xl:hidden"
        >
          <PanelRight className="size-4.5" />
        </button>

        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}

/** Number first, unit second, both on one baseline. */
function Figure({
  icon: Icon,
  value,
  unit,
  live,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  unit: string;
  live?: boolean;
}) {
  return (
    <span className="flex items-baseline gap-2 whitespace-nowrap">
      <Icon className="size-3.5 shrink-0 translate-y-0.5 text-ink-3" />
      {live && <LiveDot />}
      <span className="font-mono text-[13px] font-medium tabular-nums">{value}</span>
      <span className="text-[11.5px] text-ink-2">{unit}</span>
    </span>
  );
}

function Divider() {
  return <span aria-hidden className="h-3.5 w-px bg-hair" />;
}

/**
 * The account glyph: an orbiting plasma ring around the user's initial.
 *
 * Lives here rather than in `user-menu.tsx` because the profile page renders it
 * standalone at a larger size, and it was the one piece of the old HUD bar
 * worth keeping when that file was replaced.
 */
export function DeckAvatar({ size = 34 }: { size?: number }) {
  const profile = useAppStore((s) => s.profile);
  const mounted = useMounted();
  const initial = mounted ? (profile.firstName[0] ?? "U") : "";

  return (
    <span
      className="relative grid shrink-0 place-items-center rounded-full"
      style={{ width: size, height: size }}
    >
      <span className="adv-orbit absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent,var(--plasma),var(--cyo),transparent)]" />
      <span className="absolute inset-[2px] grid place-items-center rounded-full bg-elev text-[13px] font-bold text-ink">
        {initial}
      </span>
    </span>
  );
}
