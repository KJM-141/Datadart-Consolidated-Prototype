"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpRight,
  Bell,
  CalendarClock,
  ChevronDown,
  CircleMinus,
  FileSignature,
  Package,
  PanelRightClose,
  Radar,
  ShieldCheck,
  ShoppingCart,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { HudLabel, LiveDot, Pill } from "@/components/advanced/kit/hud";
import { needsYou, railSections, type RailSection } from "@/lib/rail-spec";
import { PATHS } from "@/lib/nav";
import { PRODUCTS, productStage } from "@/lib/products";
import { fmtUSD } from "@/lib/pricing";
import { stageIndex, STAGES } from "@/lib/lifecycle";
import { cartKey, useAppStore, useMounted } from "@/lib/store";
import { EASE_ADV, useSafeReducedMotion } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

/**
 * ── The right rail ────────────────────────────────────────────────────────
 *
 * Expandable. Collapsed, it is a strip of icons — one per section — so the
 * overview stays uncluttered. Press an icon and the rail opens with that
 * section's panel showing; the sections then behave as an accordion, one open
 * at a time. A collapse control returns it to the strip.
 *
 * The four sections: what needs you, what is in the cart, what is moving, and
 * the catalogue (hardware beside you on the screen you plan from).
 */

const META: Record<RailSection, { label: string; icon: LucideIcon }> = {
  "needs-you": { label: "Needs you", icon: Bell },
  cart: { label: "Cart", icon: ShoppingCart },
  active: { label: "Active transfers", icon: Radar },
  product: { label: "Hardware", icon: Package },
};

export function RightRail({
  className,
  /** The mobile sheet is always open — no icon strip there. */
  forceExpanded = false,
}: {
  className?: string;
  forceExpanded?: boolean;
}) {
  const pathname = usePathname();
  const sections = railSections(pathname);
  const mounted = useMounted();

  const [expanded, setExpanded] = useState(forceExpanded);
  const [open, setOpen] = useState<RailSection>(sections[0]);
  const isExpanded = forceExpanded || expanded;

  const openSection = (id: RailSection) => {
    setOpen(id);
    setExpanded(true);
  };

  return (
    <aside
      aria-label="Panel"
      style={
        forceExpanded
          ? undefined
          : (() => {
              const w = isExpanded ? "22rem" : "3.5rem";
              // width alone gets shrunk by the flex row here; pin min-width too.
              return { width: w, minWidth: w };
            })()
      }
      className={cn(
        // `overflow-x-hidden` clips the pre-laid content while the width grows,
        // so opening reads as a clean left-to-right reveal instead of the panel
        // reflowing from 3.5rem to 22rem — which is what made the open feel
        // abrupt next to the smooth close.
        "h-full flex-col overflow-x-hidden overflow-y-auto bg-chrome transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        className,
      )}
    >
      {isExpanded ? (
        // Fixed at the final width (not the animating container width) so text
        // is laid out once and simply revealed as the panel opens.
        <div className={cn("flex flex-col", !forceExpanded && "w-[22rem]")}>
          {!forceExpanded && (
            <div className="flex h-11 shrink-0 items-center justify-between border-b border-hair px-4">
              <HudLabel className="text-ink-3">Panel</HudLabel>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                aria-label="Collapse panel"
                className="grid size-7 place-items-center rounded-md text-ink-3 transition-colors hover:bg-accent hover:text-ink"
              >
                <PanelRightClose className="size-4" />
              </button>
            </div>
          )}
          {sections.map((s) => (
            <Accordion
              key={s}
              id={s}
              open={open === s}
              onToggle={() => setOpen((cur) => (cur === s ? cur : s))}
              badge={mounted ? <SectionBadge id={s} /> : null}
            />
          ))}
        </div>
      ) : (
        // ── Collapsed: icon strip ──────────────────────────────────────────
        <div className="flex flex-col items-center gap-1 py-3">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label="Expand panel"
            className="mb-1 grid size-10 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-accent hover:text-ink"
          >
            <PanelRightClose className="size-4 rotate-180" />
          </button>
          {sections.map((s) => {
            const { label, icon: Icon } = META[s];
            return (
              <button
                key={s}
                type="button"
                onClick={() => openSection(s)}
                title={label}
                aria-label={label}
                className="relative grid size-10 place-items-center rounded-lg text-ink-2 transition-colors hover:bg-accent hover:text-ink"
              >
                <Icon className="size-4.5" />
                {mounted && <IconBadge id={s} />}
              </button>
            );
          })}
        </div>
      )}
    </aside>
  );
}

/* ── Section registry ─────────────────────────────────────────────────────── */

function Body({ id }: { id: RailSection }) {
  switch (id) {
    case "needs-you":
      return <NeedsYouBody />;
    case "product":
      return <HardwareBody />;
    case "active":
      return <ActiveBody />;
    case "cart":
      return <CartBody />;
  }
}

/** Header accessory for the expanded accordion (count / live pill). */
function SectionBadge({ id }: { id: RailSection }) {
  const orders = useAppStore((s) => s.orders);
  const cart = useAppStore((s) => s.cart);
  if (id === "needs-you") {
    const n = needsYou(orders).length;
    return n > 0 ? <Pill tone="plasma">{n}</Pill> : null;
  }
  if (id === "cart") {
    const units = cart.reduce((n, i) => n + i.qty, 0);
    return units > 0 ? <Pill tone="plasma">{units}</Pill> : null;
  }
  if (id === "active") {
    return (
      <Pill tone="cyo">
        <LiveDot /> live
      </Pill>
    );
  }
  return null;
}

/** Small count dot on a collapsed icon. */
function IconBadge({ id }: { id: RailSection }) {
  const orders = useAppStore((s) => s.orders);
  const cart = useAppStore((s) => s.cart);
  let n = 0;
  if (id === "needs-you") n = needsYou(orders).length;
  else if (id === "cart") n = cart.reduce((a, i) => a + i.qty, 0);
  if (n <= 0) return null;
  return (
    <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full plasma-fill px-1 font-mono text-[9px] font-medium text-white">
      {n}
    </span>
  );
}

/* ── Bits ─────────────────────────────────────────────────────────────────── */

function Accordion({
  id,
  open,
  onToggle,
  badge,
}: {
  id: RailSection;
  open: boolean;
  onToggle: () => void;
  badge: React.ReactNode;
}) {
  const reduce = useSafeReducedMotion();
  const { label, icon: Icon } = META[id];

  return (
    <section className="border-b border-hair last:border-b-0">
      <div className="flex items-center justify-between gap-2 bg-sunk/70 px-4 py-2.5">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="group flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <Icon className="size-3.5 shrink-0 text-ink-3" />
          <HudLabel className="truncate">{label}</HudLabel>
          <ChevronDown
            aria-hidden
            className={cn(
              "size-3 shrink-0 text-ink-3 transition-transform duration-300 group-hover:text-ink-2",
              !open && "-rotate-90",
            )}
          />
        </button>
        {badge && <div className="shrink-0">{badge}</div>}
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.26, ease: EASE_ADV }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5 pt-1">
              <Body id={id} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] leading-relaxed text-ink-3">{children}</p>;
}

/* ══════════════════════════════ Needs you ════════════════════════════════ */

function NeedsYouBody() {
  const orders = useAppStore((s) => s.orders);
  const mounted = useMounted();
  const items = useMemo(() => (mounted ? needsYou(orders) : []), [orders, mounted]);

  const icon = {
    signature: FileSignature,
    payment: Wallet,
    document: ShieldCheck,
    stalled: CalendarClock,
  } as const;

  if (items.length === 0) {
    return (
      <Empty>
        Nothing outstanding. Every open transfer is signed, settled to its current
        stage and moving.
      </Empty>
    );
  }
  return (
    <ul className="space-y-1">
      {items.slice(0, 5).map((a) => {
        const Icon = icon[a.kind];
        return (
          <li key={a.id}>
            <Link
              href={a.href}
              className="group flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-accent"
            >
              <Icon
                className={cn(
                  "mt-0.5 size-3.5 shrink-0",
                  a.blocking ? "text-(--plasma)" : "text-ink-3",
                )}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[12.5px] leading-snug">{a.title}</span>
                <span className="mt-0.5 block font-mono text-[10.5px] text-ink-3">
                  {a.displayId}
                </span>
              </span>
              <ArrowUpRight className="mt-0.5 size-3 shrink-0 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/* ═════════════════════════════ Hardware ══════════════════════════════════ */

function HardwareBody() {
  const addToCart = useAppStore((s) => s.addToCart);

  return (
    <>
      <div className="mb-2 flex justify-end">
        <Link href={PATHS.hardware} className="text-[11px] text-(--plasma) hover:underline">
          All hardware
        </Link>
      </div>
      <ul className="space-y-2">
        {PRODUCTS.map((p) => {
          const capacity = p.capacities?.[p.capacities.length - 1];
          return (
            <li
              key={p.slug}
              className={cn("rounded-lg p-2.5 ring-1 ring-inset ring-hair", productStage(p))}
            >
              <div className="flex items-start gap-3">
                <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-sunk ring-1 ring-inset ring-hair">
                  <Image src={p.image} alt="" fill sizes="44px" className="object-contain p-1" />
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={PATHS.product(p.slug)}
                    className="block truncate text-[13px] font-medium hover:text-(--plasma)"
                  >
                    {p.name}
                  </Link>
                  <p className="mt-0.5 font-mono text-[10.5px] leading-snug text-ink-3">
                    {p.chips[0]}, {p.chips[1]}
                  </p>
                </div>
              </div>
              {capacity && (
                <button
                  type="button"
                  onClick={() =>
                    addToCart({
                      productSlug: p.slug,
                      model: p.model,
                      detail: `${capacity} TB`,
                      capacityTB: capacity,
                      qty: 1,
                      monthlyRate: p.monthlyCost,
                      image: p.image,
                    })
                  }
                  className="mt-2 text-[11.5px] font-medium text-ink-3 transition-colors hover:text-(--plasma)"
                >
                  + Add {capacity} TB
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

/* ═══════════════════════════════ Active ══════════════════════════════════ */

const ACTIVE_SHOWN = 4;

function ActiveBody() {
  const orders = useAppStore((s) => s.orders);
  const mounted = useMounted();
  const live = mounted ? orders.filter((o) => !o.closed) : [];
  const hidden = live.length - ACTIVE_SHOWN;

  return (
    <>
      <ul className="space-y-2.5">
        {live.slice(0, ACTIVE_SHOWN).map((o) => (
          <li key={o.displayId}>
            <Link href={PATHS.transfer(o.displayId)} className="group block">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-[11px] text-ink-3">{o.displayId}</span>
                <span className="font-mono text-[11px] tabular-nums">
                  {o.volumeTB.toLocaleString()} TB
                </span>
              </div>
              <p className="mt-0.5 truncate text-[12px] text-ink-2 transition-colors group-hover:text-ink">
                {o.source.label} → {o.destination.label}
              </p>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-sunk">
                <span
                  className="block h-full rounded-full plasma-fill"
                  style={{
                    width: `${((stageIndex(o.stage) + 1) / STAGES.length) * 100}%`,
                  }}
                />
              </div>
            </Link>
          </li>
        ))}
        {live.length === 0 && <Empty>No transfers in flight.</Empty>}
      </ul>
      {hidden > 0 && (
        <Link
          href={PATHS.transfers}
          className="mt-2.5 inline-block text-[11.5px] text-ink-3 transition-colors hover:text-(--plasma)"
        >
          {hidden} more →
        </Link>
      )}
    </>
  );
}

/* ════════════════════════════════ Cart ═══════════════════════════════════ */

function CartBody() {
  const cart = useAppStore((s) => s.cart);
  const removeFromCart = useAppStore((s) => s.removeFromCart);
  const mounted = useMounted();
  const items = mounted ? cart : [];
  const monthly = items.reduce((n, i) => n + i.monthlyRate * i.qty, 0);

  if (items.length === 0) {
    return (
      <>
        <Empty>Nothing on the manifest yet.</Empty>
        <Link
          href={PATHS.hardware}
          className="mt-2.5 inline-flex items-center gap-1.5 text-[12px] font-medium text-(--plasma) hover:underline"
        >
          Browse hardware <ArrowUpRight className="size-3" />
        </Link>
      </>
    );
  }
  return (
    <>
      <ul className="space-y-2">
        {items.map((i) => (
          <li
            key={cartKey(i)}
            className="group flex items-center gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-accent"
          >
            <span className="relative size-9 shrink-0 overflow-hidden rounded-md bg-sunk ring-1 ring-inset ring-hair">
              <Image src={i.image} alt="" fill sizes="36px" className="object-contain p-0.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px] leading-snug">{i.model}</span>
              <span className="mt-0.5 block font-mono text-[10.5px] text-ink-3">
                {i.detail}, ×{i.qty}
              </span>
            </span>
            <button
              type="button"
              onClick={() => removeFromCart(cartKey(i))}
              aria-label={`Remove ${i.model} from cart`}
              className="shrink-0 text-ink-3 opacity-0 transition-all hover:text-(--plasma) focus-visible:opacity-100 group-hover:opacity-100"
            >
              <CircleMinus className="size-3.5" />
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-hair pt-3">
        <span className="text-[12px] text-ink-2">Monthly</span>
        {monthly > 0 ? (
          <span className="font-mono text-[12.5px] font-medium tabular-nums">
            {fmtUSD(monthly)}
          </span>
        ) : (
          <span className="text-[11px] text-ink-3">confirmed at checkout</span>
        )}
      </div>

      <Link
        href={PATHS.checkout}
        className="btn-brand mt-3 flex h-9 items-center justify-center rounded-full text-[12px] font-semibold text-white"
      >
        Review manifest
      </Link>
    </>
  );
}
