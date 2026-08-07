"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpRight,
  CalendarClock,
  ChevronDown,
  CircleMinus,
  FileSignature,
  ShieldCheck,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import { HudLabel, LiveDot, Pill } from "@/components/advanced/kit/hud";
import { needsYou, railSections, type RailSection } from "@/lib/rail-spec";
import { PATHS } from "@/lib/nav";
import { PRODUCTS, productStage } from "@/lib/products";
import { fmtUSD } from "@/lib/pricing";
import { stageIndex, STAGES } from "@/lib/lifecycle";
import { cartKey, useAppStore, useMounted } from "@/lib/store";
import {
  bloomSoft,
  deckStagger,
  EASE_ADV,
  useSafeReducedMotion,
} from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

/**
 * ── The right rail ────────────────────────────────────────────────────────
 *
 * 352px, and the overview's alone — see `lib/rail-spec.ts` for why it stopped
 * following you onto every route. Four sections: what is in the cart, what
 * needs you, what is moving, and the catalogue.
 *
 * The catalogue is the Vercel app's contribution to the blend: hardware stays
 * beside you on the screen you plan from, instead of being a place you navigate
 * to.
 *
 * Every section folds, and the choice persists.
 */
export function RightRail({ className }: { className?: string }) {
  const pathname = usePathname();
  const sections = railSections(pathname);

  return (
    <motion.aside
      variants={deckStagger(0.04, 0.06)}
      initial="hidden"
      animate="show"
      aria-label="Panel"
      className={cn("h-full flex-col overflow-y-auto bg-chrome", className)}
    >
      {sections.map((s) => (
        <Section key={s} id={s} />
      ))}
    </motion.aside>
  );
}

function Section({ id }: { id: RailSection }) {
  switch (id) {
    case "needs-you":
      return <NeedsYou />;
    case "product":
      return <ProductPanel />;
    case "active":
      return <ActiveTransfers />;
    case "cart":
      return <CartPanel />;
  }
}

/* ══════════════════════════════ Needs you ════════════════════════════════ */

function NeedsYou() {
  const orders = useAppStore((s) => s.orders);
  const mounted = useMounted();
  const items = useMemo(() => (mounted ? needsYou(orders) : []), [orders, mounted]);

  const icon = {
    signature: FileSignature,
    payment: Wallet,
    document: ShieldCheck,
    stalled: CalendarClock,
  } as const;

  return (
    <Panel
      id="needs-you"
      label="Needs you"
      head={items.length > 0 && <Pill tone="plasma">{items.length}</Pill>}
    >
      {items.length === 0 ? (
        <p className="mt-3 text-[12.5px] leading-relaxed text-ink-2">
          Nothing outstanding. Every open transfer is signed, settled to its
          current stage and moving.
        </p>
      ) : (
        <ul className="mt-3 space-y-1">
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
                    <span className="block text-[12.5px] leading-snug">
                      {a.title}
                    </span>
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
      )}
    </Panel>
  );
}

/* ═════════════════════════════ Product panel ═════════════════════════════ */

/**
 * The catalogue, docked. This is the Vercel app's contribution to the blend:
 * hardware stays beside you while you size, price and check out, instead of
 * being somewhere you have to go.
 */
function ProductPanel() {
  const addToCart = useAppStore((s) => s.addToCart);

  return (
    <Panel
      id="product"
      label="Hardware"
      head={
        <Link
          href={PATHS.hardware}
          className="text-[11px] text-(--plasma) hover:underline"
        >
          All
        </Link>
      }
    >
      <ul className="mt-3 space-y-2">
        {PRODUCTS.map((p) => {
          const capacity = p.capacities?.[p.capacities.length - 1];
          return (
            <li
              key={p.slug}
              className={cn("rounded-lg p-2.5 ring-1 ring-inset ring-hair", productStage(p))}
            >
              <div className="flex items-start gap-3">
                {/* The hardware, actually shown. A catalogue of names is a list;
                    a catalogue with the objects on it is a catalogue. */}
                <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-sunk ring-1 ring-inset ring-hair">
                  <Image
                    src={p.image}
                    alt=""
                    fill
                    sizes="44px"
                    className="object-contain p-1"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={PATHS.product(p.slug)}
                    className="block truncate text-[13px] font-medium hover:text-(--plasma)"
                  >
                    {p.name}
                  </Link>
                  <p className="mt-0.5 font-mono text-[10.5px] leading-snug text-ink-3">
                    {p.chips[0]} · {p.chips[1]}
                  </p>
                </div>
              </div>

              {/* Was a full-width filled bar per card, which made three stacked
                  catalogue tiles read as three competing CTAs. A text action
                  carries the same affordance at a third of the weight. */}
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
    </Panel>
  );
}

/* ═══════════════════════════════ Operations ══════════════════════════════ */

/**
 * Was "Signals", which named the mechanism rather than the content — the list
 * is simply the transfers currently in flight, so it says that now.
 *
 * Capped at four. The rail is a glance, not the transfers table: an uncapped
 * list pushed every section below it off-screen as the book grew, and the
 * remainder is one click away in the header.
 */
const ACTIVE_SHOWN = 4;

function ActiveTransfers() {
  const orders = useAppStore((s) => s.orders);
  const mounted = useMounted();
  const live = mounted ? orders.filter((o) => !o.closed) : [];
  const hidden = live.length - ACTIVE_SHOWN;

  return (
    <Panel
      id="active"
      label="Active transfers"
      head={
        <Pill tone="cyo">
          <LiveDot /> live
        </Pill>
      }
    >
      <ul className="mt-3 space-y-2.5">
        {live.slice(0, ACTIVE_SHOWN).map((o) => (
          <li key={o.displayId}>
            <Link href={PATHS.transfer(o.displayId)} className="group block">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-[11px] text-ink-3">{o.displayId}</span>
                <span className="font-mono text-[11px] tabular-nums">
                  {o.volumeTB.toLocaleString()} TB
                </span>
              </div>
              {/* No pin icon: the arrow already says "route", and a marker on
                  every row was three dozen pixels of decoration per screen. */}
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
    </Panel>
  );
}

/* ════════════════════════════════ Cart ═══════════════════════════════════ */

/**
 * The manifest, docked at the head of the rail.
 *
 * It replaced a static Assistant blurb that repeated the same three sentences on
 * every route — and before it existed, the only acknowledgement that you had
 * added anything was a badge in a nav rail two columns away.
 *
 * Seated first because it is the section whose contents you changed most
 * recently. At the foot of the rail it fell below whatever the route added, so
 * on the hardware pages the confirmation sat underneath the catalogue that
 * produced it, off-screen at the moment you pressed the button.
 */
function CartPanel() {
  const cart = useAppStore((s) => s.cart);
  const removeFromCart = useAppStore((s) => s.removeFromCart);
  const mounted = useMounted();
  const items = mounted ? cart : [];

  const units = items.reduce((n, i) => n + i.qty, 0);
  const monthly = items.reduce((n, i) => n + i.monthlyRate * i.qty, 0);

  return (
    <Panel
      id="cart"
      label="Cart"
      icon={ShoppingCart}
      head={units > 0 && <Pill tone="plasma">{units}</Pill>}
    >
      {items.length === 0 ? (
        <>
          <Empty>Nothing on the manifest yet.</Empty>
          <Link
            href={PATHS.hardware}
            className="mt-2.5 inline-flex items-center gap-1.5 text-[12px] font-medium text-(--plasma) hover:underline"
          >
            Browse hardware <ArrowUpRight className="size-3" />
          </Link>
        </>
      ) : (
        <>
          <ul className="mt-3 space-y-2">
            {items.map((i) => (
              <li
                key={cartKey(i)}
                className="group flex items-center gap-2.5 rounded-lg p-1.5 transition-colors hover:bg-accent"
              >
                <span className="relative size-9 shrink-0 overflow-hidden rounded-md bg-sunk ring-1 ring-inset ring-hair">
                  <Image
                    src={i.image}
                    alt=""
                    fill
                    sizes="36px"
                    className="object-contain p-0.5"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12.5px] leading-snug">
                    {i.model}
                  </span>
                  <span className="mt-0.5 block font-mono text-[10.5px] text-ink-3">
                    {i.detail} · ×{i.qty}
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

          {/* Two of the three catalogue entries carry no list rate, so a
              confident "$0 / month" would be a lie. Show the figure only when
              there is one. */}
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
      )}
    </Panel>
  );
}

/* ══════════════════════════════════ Bits ═════════════════════════════════ */

/**
 * A rail section: banded header that folds the body away.
 *
 * The rail previously separated its sections with a hairline and nothing else,
 * so eight stacked panels read as one long undifferentiated column. A sunk band
 * bled to both edges gives each section a lid — the same device a table header
 * uses, and for the same reason. The lid is now a control, and what it does is
 * remembered.
 *
 * `head` sits *outside* the disclosure button rather than inside it: several
 * sections put a link there, and an anchor nested in a button is invalid markup
 * that React refuses to hydrate.
 */
function Panel({
  id,
  label,
  icon: Icon,
  head,
  children,
}: {
  id: RailSection;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  head?: React.ReactNode;
  children: React.ReactNode;
}) {
  const collapsed = useAppStore((s) => Boolean(s.railCollapsed[id]));
  const toggleRailSection = useAppStore((s) => s.toggleRailSection);
  const mounted = useMounted();
  const reduce = useSafeReducedMotion();

  // The collapse map is persisted, and persisted state is not available during
  // SSR or the first client paint. Gating on `mounted` keeps both renders
  // expanded so the markup matches, then folds once the store has rehydrated.
  const isCollapsed = mounted && collapsed;

  return (
    <motion.section
      variants={bloomSoft}
      className="border-b border-hair last:border-b-0"
    >
      <div className="flex items-center justify-between gap-2 border-b border-hair bg-sunk/70 px-4 py-2.5">
        <button
          type="button"
          onClick={() => toggleRailSection(id)}
          aria-expanded={!isCollapsed}
          className="group flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <ChevronDown
            aria-hidden
            className={cn(
              "size-3 shrink-0 text-ink-3 transition-transform duration-300 group-hover:text-ink-2",
              isCollapsed && "-rotate-90",
            )}
          />
          {Icon && <Icon className="size-3 shrink-0 text-ink-3" />}
          <HudLabel className="truncate">{label}</HudLabel>
        </button>
        {head && <div className="shrink-0">{head}</div>}
      </div>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.26, ease: EASE_ADV }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-[12px] leading-relaxed text-ink-3">{children}</p>;
}
