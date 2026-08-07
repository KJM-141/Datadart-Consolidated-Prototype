"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { Dot, Label, PageHead } from "../kit";
import { usePortal } from "../portal-frame";
import { useDeclarePageScope } from "../page-context";
import { FAMILIES, productsByFamily, productStage, type Product } from "@/lib/products";
import { useAppStore } from "@/lib/store";
import { bloomSoft, deckStagger } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

/**
 * ── Hardware ──────────────────────────────────────────────────────────────
 *
 * The catalogue, as a catalogue.
 *
 * The previous version staged each device on a lit plinth with orbit rings, a
 * spotlight that tracked the cursor and a 3D tilt — a showroom for three SKUs.
 * Every one of those effects competed with the render it was decorating, and
 * the specs ended up as the quietest thing on a page about specs.
 *
 * This is the reference's card: the render on a neutral stage, the name, the
 * line, the stock position and the one figure worth quoting. Detail opens in
 * the full-screen modal rather than navigating, so the console stays put.
 */
export function HardwarePage() {
  useDeclarePageScope({
    label: "Hardware catalogue",
    suggestions: [
      "Which device suits 800 TB?",
      "What's the difference between BRYCK and FXR?",
      "How is data protected in transit?",
    ],
  });
  return (
    <>
      <PageHead
        eyebrow="Catalog"
        title="Hardware"
        description="Three devices, rented by the month or provisioned for a one-time transfer. Every one ships encrypted, sealed and tracked."
      />

      <motion.div
        variants={deckStagger(0.06, 0.04)}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        {FAMILIES.map((family) => {
          const products = productsByFamily(family.name);
          if (!products.length) return null;

          return (
            <motion.section key={family.name} variants={bloomSoft}>
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <Label>{family.name}</Label>
                <p className="text-[11.5px] text-ink-3">{family.blurb}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((p) => (
                  <ProductCard key={p.slug} product={p} />
                ))}
              </div>
            </motion.section>
          );
        })}
      </motion.div>
    </>
  );
}

export function ProductCard({ product: p }: { product: Product }) {
  const { openProduct } = usePortal();
  const cart = useAppStore((s) => s.cart);
  const picked = cart
    .filter((c) => c.productSlug === p.slug)
    .reduce((n, c) => n + c.qty, 0);

  return (
    <button
      type="button"
      onClick={() => openProduct(p.slug)}
      className="group block w-full overflow-hidden rounded-lg bg-elev text-left ring-1 ring-inset ring-hair transition-colors hover:ring-[color-mix(in_oklab,var(--plasma)_42%,transparent)]"
    >
      <div className={cn("relative h-44", productStage(p))}>
        <Image
          src={p.image}
          alt={p.name}
          fill
          sizes="(min-width: 1024px) 22rem, (min-width: 640px) 45vw, 90vw"
          className="object-contain p-6 transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>

      <div className="border-t border-hair px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13px] font-medium">{p.name}</span>
          {picked > 0 && (
            <span className="shrink-0 rounded px-1.5 text-[9.5px] tabular-nums text-(--plasma) ring-1 ring-inset ring-[color-mix(in_oklab,var(--plasma)_40%,transparent)]">
              {picked}
            </span>
          )}
          <ArrowUpRight className="ml-auto size-3.5 shrink-0 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>

        <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-ink-3">
          {p.tagline}
        </p>

        <div className="mt-2.5 flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5 text-[10.5px] text-ink-3">
            <Dot tone={p.availability.state === "available" ? "ok" : "warn"} />
            <span className="truncate">{p.availability.headline}</span>
          </span>
          <span className="shrink-0 text-[10.5px] tabular-nums text-ink-3">
            {p.hero.value}
          </span>
        </div>
      </div>

      {/* The four figures, as the hairline-gap grid — one object, not four.
          Two columns, not four: at card width four cells give each ~85px, and
          "NVIDIA BlueField" truncates to "NVIDIA Blue…". */}
      <dl className="grid grid-cols-2 gap-px border-t border-hair bg-hair">
        {p.keySpecs.map((s) => (
          <div key={s.label} className="bg-elev px-2.5 py-2">
            <dt className="truncate text-[8.5px] font-semibold uppercase tracking-[0.12em] text-ink-3">
              {s.label}
            </dt>
            <dd className="mt-0.5 truncate text-[10.5px] font-medium tabular-nums">
              {s.value}
            </dd>
          </div>
        ))}
      </dl>
    </button>
  );
}
