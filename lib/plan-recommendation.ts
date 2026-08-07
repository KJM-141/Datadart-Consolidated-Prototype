/**
 * ── Cadence → subscription plan ───────────────────────────────────────────
 *
 * A one-off move is an order. Anything that repeats is a rental, and the
 * catalogue already sells rentals month-to-month — but until the intake agent
 * asked "how often?", nothing in the conversational pipeline could reach that
 * half of the product. This module is the bridge.
 *
 * It invents nothing. The fleet, the device and the capacities all come from
 * the sizing the engine already ran for the estimate the customer was shown, and
 * the rate comes from the same tier table `priceSizing` charges against. A plan
 * and the estimate it came from can therefore never disagree about the hardware
 * or what it costs per month.
 */
import { getProduct } from "./products";
import { rentalRatePerTBMonth, type Estimate } from "./pricing";
import type { EquipmentType } from "./sizer-engine";
import type { Cadence, CartItem } from "./types";

/**
 * Engine equipment → catalogue slug.
 *
 * `bryck-turbo` is a real sizing option with no purchasable counterpart — the
 * Sizer page says as much on screen — so a Turbo-sized fleet is quoted on the
 * BRYCK it would actually ship as.
 */
const SLUG_BY_EQUIPMENT: Record<EquipmentType, string> = {
  "bryck-fxr": "bryck-fxr",
  bryck: "bryck",
  "bryck-mini": "bryck-mini",
  "bryck-turbo": "bryck",
};

/**
 * Repack a required capacity into units the catalogue actually sells.
 *
 * The sizing engine and the catalogue do not agree on what exists: the engine
 * offers the FXR in sixteen capacities up to 1024 TB, while the catalogue sells
 * it in three, up to 512. Quoting the engine's fleet verbatim produced a plan
 * whose line item — "1× BRYCK-FXR, 1024 TB" — could not be bought, and the cart
 * would have carried it all the way to checkout.
 *
 * Greedy, largest-first, and it rounds *up* on the last unit: shipping slightly
 * more capacity than the data needs is the only safe direction to miss in.
 */
function packFleet(totalTB: number, capacities: number[]): { capacityTB: number; count: number }[] {
  const sizes = [...capacities].sort((a, b) => b - a);
  const smallest = sizes[sizes.length - 1];
  const counts = new Map<number, number>();

  let remaining = totalTB;
  // Bounded by construction — every iteration removes at least `smallest` TB —
  // but capped anyway so a bad capacity list can never hang the render.
  for (let i = 0; remaining > 0 && i < 512; i++) {
    const pick = sizes.find((c) => c <= remaining) ?? smallest;
    counts.set(pick, (counts.get(pick) ?? 0) + 1);
    remaining -= pick;
  }

  return [...counts.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([capacityTB, count]) => ({ capacityTB, count }));
}

/** Rental term we quote for each cadence, in months. */
const TERM_MONTHS: Record<Exclude<Cadence, "One-off">, number> = {
  Monthly: 12,
  Quarterly: 12,
  Ongoing: 24,
};

const RATIONALE: Record<Exclude<Cadence, "One-off">, string> = {
  Monthly:
    "At twelve moves a year the devices are in your hands more often than ours, so renting the fleet costs less than shipping it back and forth each time.",
  Quarterly:
    "Four moves a year keeps the same fleet on standby between runs — no re-provisioning, and the lane stays warm.",
  Ongoing:
    "A continuously running lane wants dedicated hardware. A two-year term holds the rate for the life of the pipeline.",
};

export interface PlanRecommendation {
  cadence: Exclude<Cadence, "One-off">;
  /** Line items shaped for `addToCart`, so checkout is unchanged. */
  items: CartItem[];
  /** Devices across the whole plan. */
  units: number;
  monthlyTotal: number;
  termMonths: number;
  /** Why this shape, in the customer's terms. */
  rationale: string;
}

/**
 * Derive a rental plan from a priced estimate.
 *
 * Returns `null` for a one-off (nothing to subscribe to) and for an estimate the
 * pricing layer has already flagged as better sent over the wire.
 */
export function recommendPlan(
  estimate: Estimate,
  cadence: Cadence | undefined,
): PlanRecommendation | null {
  if (!cadence || cadence === "One-off") return null;
  if (estimate.recommendOnline) return null;

  const { fleet, equipment } = estimate.sizing;
  if (!fleet.rawTB) return null;

  const slug = SLUG_BY_EQUIPMENT[equipment.id];
  const product = getProduct(slug);
  if (!product?.capacities?.length) return null;

  const groups = packFleet(fleet.rawTB, product.capacities);
  if (!groups.length) return null;

  const items: CartItem[] = groups.map((group) => ({
    productSlug: product.slug,
    model: product.model,
    detail: `${group.capacityTB} TB`,
    capacityTB: group.capacityTB,
    qty: group.count,
    // Per-unit monthly rate: capacity × the tier rate that capacity falls in.
    monthlyRate: Math.round(
      group.capacityTB * rentalRatePerTBMonth(group.capacityTB),
    ),
    image: product.image,
  }));

  return {
    cadence,
    items,
    units: groups.reduce((n, g) => n + g.count, 0),
    monthlyTotal: items.reduce((sum, i) => sum + i.monthlyRate * i.qty, 0),
    termMonths: TERM_MONTHS[cadence],
    rationale: RATIONALE[cadence],
  };
}
