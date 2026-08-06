"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, CircleMinus, ShieldCheck, ShoppingCart, Truck } from "lucide-react";
import { QtyStepper } from "@/components/shared/qty-stepper";
import { HoloPanel } from "@/components/advanced/kit/holo-panel";
import { HudLabel, HudRule, PageHeading, Pill } from "@/components/advanced/kit/hud";
import { Counter } from "@/components/advanced/kit/text";
import { Spotlight } from "@/components/advanced/kit/interactions";
import { Rate } from "@/components/advanced/kit/rate";
import { cartKey, useAppStore, useMounted } from "@/lib/store";
import { bloomSoft, deckStagger, EASE_ADV } from "@/lib/advanced-motion";
import { PATHS } from "@/lib/nav";

const CheckoutWizard = dynamic(
  () => import("@/components/cart/checkout-wizard").then((m) => m.CheckoutWizard),
  { ssr: false },
);

/**
 * Cart — the Advanced manifest.
 *
 * Same store actions (`removeFromCart`, `setCartQty`) and the same checkout
 * wizard. Presented as a shipping manifest: numbered bays on the left, a
 * receipt console on the right.
 */
export function CartAdvanced() {
  const cart = useAppStore((s) => s.cart);
  const removeFromCart = useAppStore((s) => s.removeFromCart);
  const setCartQty = useAppStore((s) => s.setCartQty);
  const mounted = useMounted();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const subTotal = cart.reduce((sum, i) => sum + i.monthlyRate * i.qty, 0);
  const itemCount = cart.reduce((sum, i) => sum + i.qty, 0);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <PageHeading
        eyebrow="Checkout"
        title="Manifest"
        description={
          cart.length
            ? `${itemCount} device${itemCount !== 1 ? "s" : ""} ready for a month-to-month subscription.`
            : undefined
        }
        actions={
          <Link
            href={`${PATHS.hardware}?mode=subscribe`}
            className="btn-ghost-hud inline-flex h-11 items-center gap-2 px-5 text-[13px] font-medium"
          >
            Continue shopping <ArrowRight className="size-4" />
          </Link>
        }
      />

      {cart.length === 0 ? (
        <HoloPanel brackets className="flex flex-col items-center px-6 py-20 text-center">
          <span className="relative grid size-16 place-items-center rounded-2xl bg-accent text-accent-foreground">
            <span className="adv-ping absolute inset-0 rounded-2xl bg-[color-mix(in_oklab,var(--plasma)_35%,transparent)]" />
            <ShoppingCart className="relative size-7" />
          </span>
          <h3 className="mt-6 text-lg font-semibold tracking-tight">
            Your manifest is empty
          </h3>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Browse the hardware catalogue and add devices to start a
            month-to-month subscription.
          </p>
          <Link
            href={`${PATHS.hardware}?mode=subscribe`}
            className="btn-plasma mt-6 inline-flex h-11 items-center px-6 text-[13px] font-medium"
          >
            Browse hardware
          </Link>
        </HoloPanel>
      ) : (
        <motion.div
          variants={deckStagger(0.06)}
          initial="hidden"
          animate="show"
          className="grid items-start gap-4 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]"
        >
          {/* bays */}
          <HoloPanel className="overflow-hidden p-0">
            <div className="hidden grid-cols-[48px_44px_minmax(0,1fr)_150px_120px] items-center gap-3 border-b border-border/60 bg-muted/40 px-5 py-3 sm:grid">
              <HudLabel>Bay</HudLabel>
              <span />
              <HudLabel>Type &amp; details</HudLabel>
              <HudLabel className="text-center">Quantity</HudLabel>
              <HudLabel className="text-right">Rate</HudLabel>
            </div>

            <AnimatePresence initial={false}>
              {cart.map((item, index) => {
                const key = cartKey(item);
                return (
                  <motion.div
                    key={key}
                    layout
                    initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, x: -70, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.32, ease: EASE_ADV }}
                  >
                    <Spotlight size={320}>
                      <div className="grid grid-cols-[44px_minmax(0,1fr)] items-center gap-3 border-b border-border/50 px-5 py-4 last:border-0 sm:grid-cols-[48px_44px_minmax(0,1fr)_150px_120px]">
                        <span className="hidden text-[11px] font-bold tabular-nums text-muted-foreground/60 sm:block">
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <button
                          type="button"
                          aria-label={`Remove ${item.model} from cart`}
                          onClick={() => removeFromCart(key)}
                          className="text-muted-foreground transition-colors hover:text-destructive"
                        >
                          <CircleMinus className="size-4.5" />
                        </button>

                        <div className="flex min-w-0 items-center gap-3.5">
                          <span className="relative hidden size-15 shrink-0 overflow-hidden rounded-xl bg-product-stage ring-1 ring-inset ring-border sm:block">
                            <Image
                              src={item.image}
                              alt={item.model}
                              fill
                              sizes="60px"
                              className="object-contain p-1.5"
                            />
                          </span>
                          <div className="min-w-0">
                            <Link
                              href={`/customer/hardware/${item.productSlug}?mode=subscribe`}
                              className="block truncate text-[14px] font-semibold hover:underline"
                            >
                              {item.model}
                            </Link>
                            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                              {item.detail}
                            </p>
                          </div>
                        </div>

                        <div className="col-start-2 sm:col-start-4 sm:justify-self-center">
                          <QtyStepper
                            value={item.qty}
                            onChange={(q) => setCartQty(key, q)}
                            size="sm"
                          />
                        </div>

                        <div className="col-start-2 text-[15px] font-semibold tabular-nums sm:col-start-5 sm:text-right">
                          <Rate
                            usd={item.monthlyRate * item.qty}
                            unitClassName="text-[11px] font-normal text-muted-foreground"
                          />
                        </div>
                      </div>
                    </Spotlight>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </HoloPanel>

          {/* receipt console */}
          <motion.div variants={bloomSoft} className="lg:sticky lg:top-24">
            <HoloPanel plain brackets className="overflow-hidden p-5">
              <span aria-hidden className="hud-dots absolute inset-0 opacity-25" />
              <div className="relative">
                <HudLabel>Order summary</HudLabel>
                <h2 className="mt-1.5 text-lg font-semibold tracking-tight">
                  Monthly subscription
                </h2>

                <dl className="mt-5 space-y-3 text-[13px]">
                  <Line label="Devices">
                    <Counter value={itemCount} />
                  </Line>
                  <Line label="Subtotal">
                    <Counter value={subTotal} prefix="$" suffix="/mo" />
                  </Line>
                  <Line label="Shipping">
                    <span className="text-success">Free</span>
                  </Line>
                </dl>

                <HudRule className="my-4" />

                <div className="flex items-baseline justify-between">
                  <dt className="text-sm font-semibold">Total</dt>
                  <dd className="text-2xl font-semibold tabular-nums plasma-text">
                    <Counter value={subTotal} prefix="$" suffix="/mo" />
                  </dd>
                </div>

                <button
                  type="button"
                  onClick={() => setCheckoutOpen(true)}
                  className="btn-plasma group/act mt-5 flex h-12 w-full items-center justify-center gap-2 text-[13px] font-medium"
                >
                  Checkout
                  <ArrowRight className="size-4 transition-transform duration-300 group-hover/act:translate-x-1" />
                </button>

                <p className="mt-3.5 text-center text-[11px] leading-relaxed text-muted-foreground">
                  Checkout raises a subscription — you&apos;ll pick the rental
                  period and shipping destination next.
                </p>

                <div className="mt-4 flex flex-wrap justify-center gap-1.5">
                  <Pill tone="cyo" icon={Truck}>
                    Free logistics
                  </Pill>
                  <Pill tone="success" icon={ShieldCheck}>
                    Insured transit
                  </Pill>
                </div>
              </div>
            </HoloPanel>
          </motion.div>
        </motion.div>
      )}

      <CheckoutWizard open={checkoutOpen} onOpenChange={setCheckoutOpen} />
    </div>
  );
}

function Line({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold tabular-nums">{children}</dd>
    </div>
  );
}
