"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Check, Minus, Plus, X } from "lucide-react";
import { Dot, Label } from "./kit";
import { PATHS } from "@/lib/nav";
import { getProduct, productStage } from "@/lib/products";
import { useAppStore, cartKey } from "@/lib/store";
import { EASE_ADV } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

/**
 * ── The product modal ─────────────────────────────────────────────────────
 *
 * Products get the whole screen. Specs this dense do not belong in a 23rem
 * rail, and choosing a capacity is a decision worth stopping for — so clicking
 * a render in the workspace opens this rather than navigating away from the
 * conversation.
 *
 * Structure is the reference's: gallery and thumbnails on the left under a
 * hairline-gap figure grid, the decision on the right, the datasheet below the
 * fold in three columns. The surfaces, the plasma accent and the entrance are
 * this build's.
 *
 * `/customer/hardware/[slug]` still exists and renders the same content as a
 * page, so a product is linkable. This is the in-flow version of it.
 */
export function ProductModal({
  slug,
  onClose,
}: {
  slug: string | null;
  onClose: () => void;
}) {
  const product = slug ? getProduct(slug) : undefined;
  const [shot, setShot] = useState(0);

  useEffect(() => setShot(0), [slug]);

  // Escape closes, and the page behind must not scroll while this is up.
  useEffect(() => {
    if (!product) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [product, onClose]);

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          role="dialog"
          aria-label={product.name}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="fixed inset-0 z-[70] flex flex-col bg-canvas"
        >
          <header className="flex shrink-0 items-center justify-between gap-4 border-b border-hair px-5 py-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <Label>{product.family}</Label>
              <span aria-hidden className="h-3 w-px bg-hair" />
              <span className="truncate text-[12.5px] font-medium">
                {product.name}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid size-7 place-items-center rounded-md text-ink-3 transition-colors hover:bg-sunk hover:text-ink"
            >
              <X className="size-4" />
            </button>
          </header>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE_ADV, delay: 0.05 }}
            className="min-h-0 flex-1 overflow-y-auto"
          >
            <div className="mx-auto w-full max-w-[78rem] px-5 py-8">
              <ProductBody
                slug={product.slug}
                shot={shot}
                setShot={setShot}
                onDone={onClose}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * The product itself, without a frame.
 *
 * Shared by the modal and by `/customer/hardware/[slug]` so the two can never
 * drift — the page is this in a shell, the modal is this over the console.
 */
export function ProductBody({
  slug,
  shot,
  setShot,
  onDone,
}: {
  slug: string;
  shot: number;
  setShot: (i: number) => void;
  onDone?: () => void;
}) {
  const product = getProduct(slug);
  const cart = useAppStore((s) => s.cart);
  const addToCart = useAppStore((s) => s.addToCart);
  const setCartQty = useAppStore((s) => s.setCartQty);
  const removeFromCart = useAppStore((s) => s.removeFromCart);

  if (!product) return null;
  const avail = product.availability;

  const qtyOf = (capacityTB: number) =>
    cart.find((c) => cartKey(c) === `${product.slug}-${capacityTB}`)?.qty ?? 0;

  const bump = (capacityTB: number, delta: number) => {
    const key = `${product.slug}-${capacityTB}`;
    const current = qtyOf(capacityTB);
    const next = current + delta;
    if (next <= 0) {
      if (current > 0) removeFromCart(key);
      return;
    }
    if (current === 0) {
      addToCart({
        productSlug: product.slug,
        model: product.model,
        detail: `${capacityTB} TB`,
        capacityTB,
        qty: 1,
        monthlyRate: product.monthlyCost,
        image: product.image,
      });
      return;
    }
    setCartQty(key, next);
  };

  return (
    <>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,25rem)]">
        {/* ── Renders ─────────────────────────────────────────────────── */}
        <div>
          <div
            className={cn(
              "flex aspect-[16/10] items-center justify-center overflow-hidden rounded-lg p-8 ring-1 ring-inset ring-hair",
              productStage(product),
            )}
          >
            <motion.div
              key={product.gallery[shot]}
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: EASE_ADV }}
              className="relative size-full"
            >
              <Image
                src={product.gallery[shot]}
                alt={product.name}
                fill
                sizes="(min-width: 1024px) 46rem, 100vw"
                className="object-contain"
                priority
              />
            </motion.div>
          </div>

          {product.gallery.length > 1 && (
            <div className="mt-3 flex gap-2">
              {product.gallery.map((g, i) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setShot(i)}
                  aria-label={`View ${i + 1}`}
                  aria-current={i === shot}
                  className={cn(
                    "relative h-16 w-20 shrink-0 overflow-hidden rounded-md p-1.5 ring-1 ring-inset transition-colors",
                    productStage(product),
                    i === shot
                      ? "ring-[color-mix(in_oklab,var(--plasma)_55%,transparent)]"
                      : "ring-hair hover:ring-ink-3",
                  )}
                >
                  <Image src={g} alt="" fill sizes="80px" className="object-contain p-1.5" />
                </button>
              ))}
            </div>
          )}

          {/* Headline figures — the hairline-gap grid, so four numbers read as
              one object rather than four boxes. */}
          <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-hair ring-1 ring-inset ring-hair sm:grid-cols-4">
            {product.keySpecs.map((h) => (
              <div key={h.label} className="bg-elev px-4 py-3">
                <dt className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ink-3">
                  {h.label}
                </dt>
                <dd className="mt-1 text-[12.5px] font-medium tabular-nums">
                  {h.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* ── Choose ──────────────────────────────────────────────────── */}
        <div>
          <div className="flex items-baseline gap-3">
            <h1 className="text-[26px] font-semibold leading-tight">
              {product.name}
            </h1>
            <span className="shrink-0 text-[13px] tabular-nums text-ink-3">
              {product.hero.value}
            </span>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-2">
            {product.tagline}
          </p>
          <p className="mt-3 text-[12px] leading-relaxed text-ink-3">
            {product.capabilities}
          </p>

          <div className="mt-4 flex items-center gap-2 rounded-md bg-sunk px-3 py-2 ring-1 ring-inset ring-hair">
            <Dot
              tone={avail.state === "available" ? "ok" : "warn"}
              live={avail.state === "available"}
            />
            <span className="text-[11.5px]">{avail.headline}</span>
            <span className="truncate text-[11px] text-ink-3">· {avail.detail}</span>
          </div>

          {product.capacities && product.capacities.length > 0 && (
            <>
              <Label className="mb-2 mt-6">Configuration</Label>
              <div className="space-y-1.5">
                {product.capacities.map((tb) => {
                  const qty = qtyOf(tb);
                  return (
                    <div
                      key={tb}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2.5 ring-1 ring-inset transition-colors",
                        qty
                          ? "bg-[color-mix(in_oklab,var(--plasma)_7%,transparent)] ring-[color-mix(in_oklab,var(--plasma)_38%,transparent)]"
                          : "ring-hair",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[12.5px] font-medium">
                            {tb >= 1024 ? `${tb / 1024} PB` : `${tb} TB`}
                          </span>
                          <span className="font-mono text-[9.5px] text-ink-3">
                            {product.model}
                          </span>
                        </div>
                        <div className="mt-0.5 text-[11px] tabular-nums text-ink-3">
                          {product.monthlyCost
                            ? `$${product.monthlyCost.toLocaleString("en-US")} / month`
                            : "Priced at proposal"}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => bump(tb, -1)}
                          disabled={!qty}
                          aria-label={`Remove ${tb} TB`}
                          className="grid size-6 place-items-center rounded text-ink-3 ring-1 ring-inset ring-hair transition-colors hover:text-ink disabled:opacity-30"
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-6 text-center text-[12px] font-medium tabular-nums">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => bump(tb, 1)}
                          aria-label={`Add ${tb} TB`}
                          className="grid size-6 place-items-center rounded text-ink-3 ring-1 ring-inset ring-hair transition-colors hover:text-ink"
                        >
                          <Plus className="size-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <Link
            href={PATHS.checkout}
            onClick={onDone}
            className="btn-plasma mt-4 inline-flex h-11 w-full items-center justify-center gap-2 text-[13px] font-medium text-white"
          >
            <Check className="size-3.5" />
            Review in cart
          </Link>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            <Link
              href={PATHS.sizer}
              onClick={onDone}
              className="inline-flex items-center gap-1 text-[12px] text-ink-3 transition-colors hover:text-(--plasma)"
            >
              Size a transfer <ArrowUpRight className="size-3" />
            </Link>
            {product.detailsUrl && (
              <a
                href={product.detailsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[12px] text-ink-3 transition-colors hover:text-(--plasma)"
              >
                Manufacturer page <ArrowUpRight className="size-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Datasheet ─────────────────────────────────────────────────── */}
      <div className="mt-12 border-t border-hair pt-8">
        <h2 className="text-[15px] font-semibold">Technical specification</h2>
        <p className="mt-1 text-[11.5px] text-ink-3">
          From the {product.name} datasheet.
        </p>

        <div className="mt-5 grid gap-x-10 gap-y-7 md:grid-cols-2 xl:grid-cols-3">
          {product.specs.map((group) => (
            <section key={group.title}>
              <Label>{group.title}</Label>
              <dl className="mt-2 divide-y divide-hair">
                {group.rows.map((row) => (
                  <div key={row.label} className="flex gap-4 py-2">
                    <dt className="w-32 shrink-0 text-[11.5px] text-ink-3">
                      {row.label}
                    </dt>
                    <dd className="flex-1 text-[11.5px] leading-relaxed text-ink-2">
                      {row.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
