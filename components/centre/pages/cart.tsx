"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { format, addMonths } from "date-fns";
import { Check, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Block, Facts, Label, PageHead } from "../kit";
import { PATHS } from "@/lib/nav";
import { useDeclarePageScope } from "../page-context";
import { fmtUSD } from "@/lib/pricing";
import { cartKey, useAppStore, useMounted } from "@/lib/store";
import type { DeviceSubscription } from "@/lib/types";
import { bloomSoft, deckStagger } from "@/lib/advanced-motion";

/**
 * ── Cart ──────────────────────────────────────────────────────────────────
 *
 * The lines, the total, and one button that finishes the job.
 *
 * Checkout used to be a separate multi-step wizard collecting a shipping
 * address and a contact — both of which the account already has, from sign-up.
 * Re-asking for them is not diligence, it is a form for its own sake, so this
 * confirms against the profile on file and lets you change it if it is wrong.
 *
 * Cart to active subscription is now one click.
 */
export function CartPage() {
  const cart = useAppStore((s) => s.cart);
  const profile = useAppStore((s) => s.profile);
  const setCartQty = useAppStore((s) => s.setCartQty);
  const removeFromCart = useAppStore((s) => s.removeFromCart);
  const clearCart = useAppStore((s) => s.clearCart);
  const addSubscription = useAppStore((s) => s.addSubscription);
  const mounted = useMounted();
  const router = useRouter();

  const [busy, setBusy] = useState(false);

  useDeclarePageScope({
    label: "Your cart",
    suggestions: [
      "Order or subscription?",
      "How does shipping work?",
      "When do I pay?",
    ],
  });

  const lines = mounted ? cart : [];
  const monthly = lines.reduce((n, i) => n + i.monthlyRate * i.qty, 0);
  const devices = lines.reduce((n, i) => n + i.qty, 0);

  const checkout = async () => {
    if (!lines.length) return;
    setBusy(true);
    await new Promise((r) => setTimeout(r, 650));

    const start = new Date();
    const sub: DeviceSubscription = {
      id: `SUB-${1100 + Math.floor(Math.random() * 800)}`,
      createdAt: format(start, "yyyy-MM-dd"),
      items: lines.map((i) => ({
        productSlug: i.productSlug,
        model: i.model,
        capacityTB: i.capacityTB,
        qty: i.qty,
        monthlyRate: i.monthlyRate,
      })),
      startDate: format(start, "dd MMM yy"),
      endDate: format(addMonths(start, 3), "dd MMM yy"),
      shipping: profile.address,
      contact: {
        name: `${profile.firstName} ${profile.lastName}`,
        email: profile.email,
        phone: profile.phone,
      },
      monthlyTotal: monthly,
      status: "Processing",
    };

    addSubscription(sub);
    clearCart();
    setBusy(false);
    toast.success(`${sub.id} placed`, {
      description: "We'll confirm the dispatch date by email.",
    });
    router.push(PATHS.subscriptions);
  };

  const ship = profile.address;
  const shipLine = [ship.city, ship.state, ship.country].filter(Boolean).join(", ");

  return (
    <>
      <PageHead
        eyebrow="Checkout"
        title="Cart"
        description="Month-to-month device rental. Shipping is included and arranged by our logistics team."
      />

      <motion.div
        variants={deckStagger(0.05, 0.04)}
        initial="hidden"
        animate="show"
        className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]"
      >
        <motion.div variants={bloomSoft}>
          <Block
            icon={ShoppingCart}
            label="Your selection"
            action={
              <span className="text-[10px] tabular-nums text-ink-3">
                {devices} device{devices === 1 ? "" : "s"}
              </span>
            }
          >
            <ul className="divide-y divide-hair">
              {lines.map((item) => {
                const key = cartKey(item);
                return (
                  <li key={key} className="flex items-center gap-3 px-4 py-3">
                    <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-sunk ring-1 ring-inset ring-hair">
                      <Image
                        src={item.image}
                        alt=""
                        fill
                        sizes="44px"
                        className="object-contain p-1"
                      />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-medium">
                        {item.model}
                      </p>
                      <p className="mt-0.5 font-mono text-[10.5px] text-ink-3">
                        {item.detail}
                        {item.monthlyRate
                          ? `, ${fmtUSD(item.monthlyRate)}/mo each`
                          : ", priced at proposal"}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setCartQty(key, item.qty - 1)}
                        disabled={item.qty <= 1}
                        aria-label={`Fewer ${item.model}`}
                        className="grid size-6 place-items-center rounded text-ink-3 ring-1 ring-inset ring-hair transition-colors hover:text-ink disabled:opacity-30"
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="w-6 text-center text-[12px] font-medium tabular-nums">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCartQty(key, item.qty + 1)}
                        aria-label={`More ${item.model}`}
                        className="grid size-6 place-items-center rounded text-ink-3 ring-1 ring-inset ring-hair transition-colors hover:text-ink"
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>

                    <span className="w-20 shrink-0 text-right font-mono text-[12px] tabular-nums">
                      {item.monthlyRate
                        ? `${fmtUSD(item.monthlyRate * item.qty)}`
                        : "N/A"}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeFromCart(key)}
                      aria-label={`Remove ${item.model}`}
                      className="grid size-7 shrink-0 place-items-center rounded-md text-ink-3 transition-colors hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                );
              })}

              {mounted && !lines.length && (
                <li className="px-4 py-10 text-center">
                  <p className="text-[12.5px] text-ink-3">Your cart is empty.</p>
                  <Link
                    href={`${PATHS.hardware}?mode=subscribe`}
                    className="mt-2 inline-block text-[12.5px] font-medium text-(--plasma) hover:underline"
                  >
                    Browse hardware
                  </Link>
                </li>
              )}
            </ul>
          </Block>
        </motion.div>

        <motion.div variants={bloomSoft}>
          <Block icon={Check} label="Confirm">
            <Facts
              cols={2}
              items={[
                { label: "Devices", value: devices },
                // A real 0 here means "not on the list rate", not "free".
                { label: "Monthly", value: monthly ? fmtUSD(monthly) : "At proposal" },
              ]}
            />

            {/* Confirmed, not re-collected. The account already knows this. */}
            <div className="border-t border-hair px-4 py-3">
              <Label>Ships to</Label>
              <p className="mt-1 text-[12px] leading-relaxed text-ink-2">
                {`${profile.firstName} ${profile.lastName}`}
                {shipLine ? <><br />{shipLine}</> : null}
              </p>
              <Link
                href={PATHS.profile}
                className="mt-1.5 inline-block text-[11px] text-ink-3 transition-colors hover:text-(--plasma)"
              >
                Change in profile
              </Link>
            </div>

            <div className="border-t border-hair px-4 py-3">
              <button
                type="button"
                onClick={checkout}
                disabled={!lines.length || busy}
                className="btn-plasma inline-flex h-11 w-full items-center justify-center gap-2 text-[13px] font-medium text-white disabled:pointer-events-none disabled:opacity-40"
              >
                {busy ? "Placing…" : "Place subscription"}
              </button>
              <p className="mt-2 text-center text-[10.5px] leading-relaxed text-ink-3">
                Three-month minimum term. Shipping included both ways.
              </p>
            </div>
          </Block>
        </motion.div>
      </motion.div>
    </>
  );
}
