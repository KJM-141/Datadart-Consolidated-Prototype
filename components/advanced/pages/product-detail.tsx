"use client";

import { Suspense, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Box,
  Cpu,
  Database,
  ExternalLink,
  MemoryStick,
  Network,
  Ruler,
  Server,
  ShoppingCart,
  Weight,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { QtyStepper } from "@/components/shared/qty-stepper";
import { useFlyToCart } from "@/components/products/fly-to-cart";
import { HoloPanel } from "@/components/advanced/kit/holo-panel";
import { HudLabel, Pill } from "@/components/advanced/kit/hud";
import { Tilt } from "@/components/advanced/kit/interactions";
import { useAppStore } from "@/lib/store";
import { productStage, type Product } from "@/lib/products";
import { bloomSoft, deckStagger, EASE_ADV, useSafeReducedMotion } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";
import { Rate } from "@/components/advanced/kit/rate";
import { PATHS } from "@/lib/nav";

const SPEC_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  server: Server,
  box: Box,
  weight: Weight,
  zap: Zap,
  database: Database,
  cpu: Cpu,
  memory: MemoryStick,
  network: Network,
  ruler: Ruler,
};

export function ProductDetailAdvanced({ product }: { product: Product }) {
  return (
    <Suspense fallback={null}>
      <Content product={product} />
    </Suspense>
  );
}

/**
 * Device detail — the Advanced showroom.
 *
 * Same capacity selector, quantity stepper, cart action and fly-to-cart
 * animation as the Normal page. The device is staged on a lit plinth with
 * counter-rotating orbit rings, and specs are read out as HUD tables.
 */
function Content({ product }: { product: Product }) {
  const params = useSearchParams();
  const reduce = useSafeReducedMotion();
  const subscribeMode = params.get("mode") === "subscribe";
  const addToCart = useAppStore((s) => s.addToCart);
  const flyToCart = useFlyToCart();
  const addBtnRef = useRef<HTMLButtonElement>(null);

  const [capacity, setCapacity] = useState<string | undefined>(
    product.capacities?.length ? String(product.capacities[0]) : undefined,
  );
  const [qty, setQty] = useState(1);

  const backHref = subscribeMode ? `${PATHS.hardware}?mode=subscribe` : "/customer/hardware";

  const handleAdd = () => {
    const bryckRow = product.specs[0]?.rows.find((r) =>
      r.label.toLowerCase().includes("bryck supported"),
    )?.value;
    addToCart({
      productSlug: product.slug,
      model: product.model,
      detail: capacity
        ? `${capacity} TB`
        : bryckRow
          ? `${bryckRow} Bryck supported`
          : product.tagline,
      capacityTB: capacity ? Number(capacity) : undefined,
      qty,
      monthlyRate: product.monthlyCost,
      image: product.image,
    });
    flyToCart(addBtnRef.current);
    toast.success("Added to cart", {
      description: `${product.model}${capacity ? ` · ${capacity} TB` : ""} × ${qty}`,
    });
  };

  return (
    <motion.div
      variants={deckStagger(0.06)}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={bloomSoft}>
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground coarse:min-h-11"
        >
          <ArrowLeft className="size-3.5" /> Back to{" "}
          {subscribeMode ? "hardware selection" : "products"}
        </Link>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* ── Plinth ─────────────────────────────────────────────── */}
        <motion.div variants={bloomSoft} className="lg:sticky lg:top-24 lg:self-start">
          <Tilt strength={8} glare={false}>
            <div
              className={cn(
                "relative overflow-hidden rounded-3xl ring-1 ring-inset",
                productStage(product),
                product.stageTone === "dark" ? "ring-white/10" : "ring-black/6",
              )}
            >
              {/* orbit rings */}
              <span
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              >
                {[300, 380].map((s, i) => (
                  <span
                    key={s}
                    className={cn(
                      "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed",
                      product.stageTone === "dark"
                        ? "border-white/12"
                        : "border-black/8",
                      !reduce && (i === 0 ? "adv-orbit" : "adv-orbit-rev"),
                    )}
                    style={{ width: s, height: s }}
                  >
                    <span
                      className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full"
                      style={{
                        background: i === 0 ? "var(--plasma)" : "var(--cyo)",
                        boxShadow: `0 0 12px 2px ${i === 0 ? "var(--plasma)" : "var(--cyo)"}`,
                      }}
                    />
                  </span>
                ))}
              </span>

              {/* contact shadow */}
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-x-12 bottom-7 h-8 rounded-[50%] blur-xl",
                  product.stageTone === "dark" ? "bg-black/55" : "bg-black/14",
                )}
              />

              <div
                className={cn(
                  "relative mx-auto w-full",
                  product.imageAspect === "tall"
                    ? "aspect-square max-w-sm"
                    : "aspect-4/3",
                )}
              >
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 480px"
                  className={cn(
                    "object-contain p-8",
                    !reduce && "adv-float",
                  )}
                />
              </div>

              {!reduce && (
                <span className="adv-scan pointer-events-none absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,transparent,color-mix(in_oklab,var(--cyo)_20%,transparent),transparent)]" />
              )}
            </div>
          </Tilt>

          {/* key spec HUD */}
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
            {product.keySpecs.map((ks, i) => {
              const Icon = SPEC_ICONS[ks.icon] ?? Box;
              return (
                <motion.div
                  key={ks.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: EASE_ADV, delay: 0.15 + i * 0.05 }}
                >
                  <HoloPanel plain className="p-3 text-center">
                    <Icon className="mx-auto size-4 text-(--plasma)" />
                    <p className="mt-2 text-[13px] font-semibold leading-tight tabular-nums">
                      {ks.value}
                    </p>
                    <p className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                      {ks.label}
                    </p>
                  </HoloPanel>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Info column ────────────────────────────────────────── */}
        <div className="space-y-5">
          <motion.div variants={bloomSoft}>
            <HudLabel className="text-(--plasma)">{product.family}</HudLabel>
            <h1 className="mt-2 text-[2rem] font-semibold leading-[1.05] tracking-tight sm:text-[2.4rem]">
              {product.name}
            </h1>
            <p className="mt-2 text-[14px] text-muted-foreground">
              {product.tagline}
            </p>
            <div className="mt-3.5 flex flex-wrap gap-1.5">
              {product.chips.map((chip) => (
                <Pill key={chip} tone="ion">
                  {chip}
                </Pill>
              ))}
            </div>
          </motion.div>

          {product.capacities && product.capacities.length > 1 && (
            <motion.div variants={bloomSoft}>
              <HudLabel>Select capacity</HudLabel>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {product.capacities.map((c) => {
                  const value = String(c);
                  const on = capacity === value;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCapacity(value)}
                      aria-pressed={on}
                      className={cn(
                        "relative rounded-xl px-4 py-2.5 text-[13px] font-semibold tabular-nums transition-colors duration-300",
                        on
                          ? "text-white"
                          : "bg-muted/60 text-muted-foreground ring-1 ring-inset ring-border hover:text-foreground",
                      )}
                    >
                      {on && (
                        <motion.span
                          layoutId="capacity-pill"
                          transition={{ type: "spring", stiffness: 420, damping: 34 }}
                          className="absolute inset-0 -z-10 rounded-xl plasma-fill shadow-[0_0_22px_-8px_color-mix(in_oklab,var(--plasma)_95%,transparent)]"
                        />
                      )}
                      {c} TB
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* The rate is a fact about the device, not a fact about how you
              arrived at it. */}
          <motion.div variants={bloomSoft} className="flex items-baseline gap-2">
            <span className="text-[2.4rem] font-semibold leading-none tracking-tight plasma-text">
              <Rate
                usd={product.monthlyCost}
                from={product.priceNote === "from"}
                unit=""
              />
            </span>
            {product.monthlyCost > 0 && (
              <span className="text-sm text-muted-foreground">/ month</span>
            )}
          </motion.div>

          {/* spec tables */}
          {product.specs.map((group) => (
            <motion.div key={group.title} variants={bloomSoft}>
              <HoloPanel className="overflow-hidden p-0">
                <div className="flex items-center gap-2.5 border-b border-border/60 bg-muted/40 px-5 py-3.5">
                  <span className="size-1.5 rounded-full plasma-fill" />
                  <h2 className="text-[13px] font-semibold tracking-tight">
                    {group.title}
                  </h2>
                </div>
                <dl>
                  {group.rows.map((row) => (
                    <div
                      key={row.label}
                      className="grid gap-1 border-b border-border/40 px-5 py-3 last:border-0 sm:grid-cols-[210px_minmax(0,1fr)] sm:gap-4"
                    >
                      <dt className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
                        {row.label}
                      </dt>
                      <dd className="text-[13px] font-medium leading-relaxed">
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </HoloPanel>
            </motion.div>
          ))}

          <motion.div variants={bloomSoft}>
            <HoloPanel brackets className="p-5">
              <HudLabel>Capabilities</HudLabel>
              <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground">
                {product.capabilities}
              </p>
              <a
                href="https://tsecond.us"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-(--plasma) hover:underline coarse:min-h-11"
              >
                For more details — click here <ExternalLink className="size-3.5" />
              </a>
            </HoloPanel>
          </motion.div>
        </div>
      </div>

      {/*
        ── Sticky subscribe bar ───────────────────────────────────
        Unconditional, and that is the fix for a customer-reported bug: you
        could not add hardware to the cart.

        It used to render only when the URL carried `?mode=subscribe`, and the
        only links that passed that were on the cart page. So every other door
        into the catalogue — the right rail's "All", the left nav's Hardware,
        even the rail cart's own "Browse hardware" empty state — landed you on a
        product page with no way to buy it. To fill an empty cart you had to
        already be at the cart.

        A catalogue does not get to refuse a sale based on which link you
        followed. `subscribeMode` still tunes the copy and the back-link, which
        is a legitimate thing for context to change; it no longer decides
        whether commerce exists.
      */}
      {/*
        `sticky`, not `fixed`.

        Sticky resolves against the nearest scrolling ancestor — `main` — so it
        cannot be knocked out of position by a filter or transform higher up the
        tree, which is exactly what happened here. It also stops the bar
        stretching under the nav rail, which a viewport-fixed `inset-x-0` did,
        and it occupies its own space in flow so nothing needs padding to clear
        it.
      */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 28, delay: 0.2 }}
        className="sticky bottom-0 z-30 -mx-1 px-1 pb-1"
      >
          {/*
          `holo-solid` — the documented opaque variant — because glass over a
          scrolling spec table put six rows of small print behind the price and
          the only button on the page.

          `pr-20` keeps the CTA clear of the assistant dock, which is fixed in
          this same corner at 52px plus a 20px inset. Two affordances competing
          for one corner is a layout fact, so the bar yields rather than the
          floating one moving.
        */}
        <div className="holo holo-solid mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3 pr-20 sm:px-5 sm:pr-20">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-semibold plasma-text">
              <Rate
                usd={product.monthlyCost}
                from={product.priceNote === "from"}
                unit=""
              />
            </span>
            {product.monthlyCost > 0 && (
              <span className="text-[11px] text-muted-foreground">/ month</span>
            )}
            {capacity && <Pill tone="cyo">{capacity} TB</Pill>}
          </div>
          <div className="flex items-center gap-3">
            <HudLabel>Qty</HudLabel>
            <QtyStepper value={qty} onChange={setQty} />
            <button
              ref={addBtnRef}
              onClick={handleAdd}
              className="btn-plasma inline-flex h-11 items-center gap-2 px-6 text-[13px] font-medium"
            >
              <ShoppingCart className="size-4" /> Add to cart
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
