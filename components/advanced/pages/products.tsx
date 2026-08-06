"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  BookOpen,
  Box,
  Cpu,
  Database,
  HardDrive,
  Network,
  Ruler,
  Server,
  Weight,
  Zap,
} from "lucide-react";
import { HoloPanel } from "@/components/advanced/kit/holo-panel";
import { HudLabel, PageHeading, Pill } from "@/components/advanced/kit/hud";
import { Spotlight, Tilt } from "@/components/advanced/kit/interactions";
import {
  FAMILIES,
  productStage,
  productsByFamily,
  type Product,
} from "@/lib/products";
import { bloomSoft, deckStagger, EASE_ADV } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";
import { Rate } from "@/components/advanced/kit/rate";

const SPEC_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  server: Server,
  box: Box,
  weight: Weight,
  zap: Zap,
  database: Database,
  cpu: Cpu,
  network: Network,
  ruler: Ruler,
};

const FAMILY_ICON = {
  "Edge Storage": HardDrive,
  "Edge HPC": Cpu,
} as const;

/**
 * Hardware — the Advanced catalog.
 *
 * Same families, same products, same `?mode=subscribe` behaviour. Each device
 * is staged on a lit plinth with orbit rings and a 3D tilt, so the catalogue
 * reads as a showroom rather than a grid of cards.
 */
export function ProductsAdvanced() {
  const params = useSearchParams();
  const subscribeMode = params.get("mode") === "subscribe";

  return (
    <motion.div
      variants={deckStagger(0.07)}
      initial="hidden"
      animate="show"
      className="space-y-10"
    >
      <PageHeading
        eyebrow={subscribeMode ? "Subscribe" : "Catalog"}
        title={subscribeMode ? "Choose your hardware" : "Hardware"}
        description={
          subscribeMode
            ? "Select devices to rent month-to-month. Add them to your cart and raise a subscription with a shipping destination."
            : "Petabyte-class capture, transport and edge AI — engineered by T|Second for the world's most demanding environments."
        }
        actions={
          <Link
            href="/customer/resources"
            className="btn-ghost-hud inline-flex h-11 items-center gap-2 px-5 text-[13px] font-medium"
          >
            <BookOpen className="size-4" /> Datasheets
          </Link>
        }
      />

      {FAMILIES.map((family) => {
        const items = productsByFamily(family.name);
        if (!items.length) return null;
        const Icon = FAMILY_ICON[family.name];
        return (
          <motion.section key={family.name} variants={bloomSoft} className="space-y-5">
            <div className="flex items-center gap-3.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[color-mix(in_oklab,var(--plasma)_14%,transparent)] text-(--plasma) ring-1 ring-inset ring-[color-mix(in_oklab,var(--plasma)_32%,transparent)]">
                <Icon className="size-4.5" />
              </span>
              <div className="min-w-0">
                <HudLabel>{family.name}</HudLabel>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {family.blurb}
                </p>
              </div>
              <span className="ml-auto shrink-0">
                <Pill tone="muted">
                  {items.length} device{items.length === 1 ? "" : "s"}
                </Pill>
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((p) => (
                <DevicePod key={p.slug} product={p} subscribeMode={subscribeMode} />
              ))}
            </div>
          </motion.section>
        );
      })}
    </motion.div>
  );
}

/* ── Device pod ─────────────────────────────────────────────────────────── */

export function DevicePod({
  product,
  subscribeMode,
}: {
  product: Product;
  subscribeMode: boolean;
}) {
  const reduce = useReducedMotion();
  const href = `/customer/hardware/${product.slug}${subscribeMode ? "?mode=subscribe" : ""}`;

  return (
    <motion.div variants={bloomSoft} layout className="h-full">
      <Tilt strength={7} className="h-full" innerClassName="h-full">
        <Spotlight size={380} className="h-full rounded-(--radius)">
          <HoloPanel
            plain
            sheen
            className="group/pod flex h-full flex-col overflow-hidden transition-shadow duration-500 hover:shadow-[0_30px_70px_-30px_color-mix(in_oklab,var(--plasma)_70%,transparent)]"
          >
            <span aria-hidden className="sheen" />
            <Link href={href} className="relative flex h-full flex-col">
              {/* plinth */}
              <div
                className={cn(
                  "relative m-3 h-56 overflow-hidden rounded-2xl sm:h-62",
                  productStage(product),
                )}
              >
                {/* orbit rings behind the device */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                  <span
                    className={cn(
                      "block size-52 rounded-full border border-dashed",
                      product.stageTone === "dark"
                        ? "border-white/12"
                        : "border-black/8",
                      !reduce && "adv-orbit",
                    )}
                  >
                    <span className="absolute -top-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full plasma-fill shadow-[0_0_10px_2px_color-mix(in_oklab,var(--plasma)_85%,transparent)]" />
                  </span>
                </span>
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-8 bottom-5 h-3 rounded-[50%] bg-black/22 blur-md"
                />

                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 420px"
                  className={cn(
                    "object-contain p-6 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/pod:scale-108",
                    product.imageAspect === "tall" && "p-4",
                    !reduce && "adv-float-slow",
                  )}
                />

                {subscribeMode ? (
                  <span className="absolute right-3 top-3 rounded-full plasma-fill px-3 py-1 text-[11px] font-bold text-white shadow-[0_6px_20px_-6px_color-mix(in_oklab,var(--plasma)_95%,transparent)]">
                    <Rate usd={product.monthlyCost} from={product.priceNote === "from"} />
                  </span>
                ) : (
                  product.capacities &&
                  product.capacities.length > 1 && (
                    <span
                      className={cn(
                        "absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.06em] backdrop-blur-md",
                        product.stageTone === "dark"
                          ? "bg-white/14 text-white ring-1 ring-inset ring-white/20"
                          : "bg-white/70 text-[#17172e] ring-1 ring-inset ring-black/8",
                      )}
                    >
                      {product.capacities.length} capacities
                    </span>
                  )
                )}
              </div>

              <div className="flex flex-1 flex-col px-5 pb-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-semibold leading-tight tracking-tight">
                    {product.name}
                  </h3>
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-[color-mix(in_oklab,var(--plasma)_16%,transparent)] text-(--plasma) opacity-0 transition-opacity duration-300 group-hover/pod:opacity-100">
                    <ArrowUpRight className="size-3.5" />
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                  {product.tagline}
                </p>

                {/* spec HUD */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {product.keySpecs.map((ks, i) => {
                    const Icon = SPEC_ICONS[ks.icon] ?? Box;
                    return (
                      <motion.div
                        key={ks.label}
                        initial={{ opacity: 0, y: 6 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.35, ease: EASE_ADV, delay: i * 0.04 }}
                        className="flex items-center gap-2 rounded-xl bg-muted/60 px-2.5 py-2 ring-1 ring-inset ring-border/60"
                      >
                        <Icon className="size-3.5 shrink-0 text-(--plasma)" />
                        <span className="min-w-0">
                          <span className="block truncate text-[12px] font-semibold leading-tight tabular-nums">
                            {ks.value}
                          </span>
                          <span className="block truncate text-[9px] font-medium uppercase tracking-[0.06em] text-muted-foreground/70">
                            {ks.label}
                          </span>
                        </span>
                      </motion.div>
                    );
                  })}
                </div>

                <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[13px] font-medium text-(--plasma)">
                  {subscribeMode ? "Configure & add to cart" : "View specifications"}
                  <ArrowUpRight className="size-3.5 transition-transform duration-300 group-hover/pod:-translate-y-0.5 group-hover/pod:translate-x-0.5" />
                </span>
              </div>
            </Link>
          </HoloPanel>
        </Spotlight>
      </Tilt>
    </motion.div>
  );
}
