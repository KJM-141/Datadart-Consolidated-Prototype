/**
 * ── Catalogue reconciliation ──────────────────────────────────────────────
 *
 * The codebase carries two equipment lists that do not agree:
 *
 *   lib/products.ts     3 SKUs — what sales can actually sell, with real spec
 *                       sheets (encryption, tamper protection, MIL-STD…).
 *   lib/sizer-engine.ts 4 devices — a physics catalogue used to compute fleet
 *                       counts. It includes `bryck-turbo`, which has no
 *                       product page, and gives BRYCK Mini capacities
 *                       [512, 256, 128] where the product sells only [256].
 *
 * That divergence is harmless while a human picks the device. It is not
 * harmless once an agent picks it: the agent would happily quote a Turbo that
 * cannot be ordered, or a 512 TB Mini that does not exist.
 *
 * This module is the single reconciled view. Everything downstream in
 * lib/ultra/ selects hardware through here, never from either list directly.
 */

import {
  EQUIPMENT_LIST,
  type EquipmentSpec,
  type EquipmentType,
} from "./sizer-engine";
import { PRODUCTS, type Product } from "./products";

/* ══════════════════════════ Cross-catalogue map ══════════════════════════ */

/** Sizer id → product slug. `bryck-turbo` is absent by design: not sellable. */
const EQUIPMENT_TO_SLUG: Partial<Record<EquipmentType, string>> = {
  "bryck-fxr": "bryck-fxr",
  bryck: "bryck",
  "bryck-mini": "bryck-mini",
};

export interface CatalogEntry {
  id: EquipmentType;
  slug: string;
  product: Product;
  spec: EquipmentSpec;
  /** Capacities present in BOTH catalogues — the only ones we may propose. */
  capacities: number[];
  throughputGBs: number;
  /** Cheapest monthly rate from the product sheet, for tie-breaks. */
  monthlyCost: number;
}

/**
 * Capacities the sizer knows AND the product sells. When the two disagree we
 * take the intersection rather than either side: proposing a size sales cannot
 * fulfil is worse than proposing a slightly larger fleet.
 */
function reconcileCapacities(spec: EquipmentSpec, product: Product): number[] {
  const sellable = new Set(product.capacities ?? []);
  const shared = spec.capacities.filter((c) => sellable.has(c));
  // If the product sheet lists nothing (or nothing overlaps), fall back to the
  // product's own list — sales is the authority on what can be shipped.
  return shared.length ? shared : [...sellable].sort((a, b) => b - a);
}

/** Every device an agent is allowed to propose, richest first. */
export const CATALOG: CatalogEntry[] = EQUIPMENT_LIST.flatMap((spec) => {
  const slug = EQUIPMENT_TO_SLUG[spec.id as EquipmentType];
  if (!slug) return [];
  const product = PRODUCTS.find((p) => p.slug === slug);
  if (!product) return [];
  const capacities = reconcileCapacities(spec, product);
  if (!capacities.length) return [];
  return [
    {
      id: spec.id as EquipmentType,
      slug,
      product,
      spec,
      capacities,
      throughputGBs: spec.throughputGBs,
      monthlyCost: product.monthlyCost,
    },
  ];
});

export function catalogEntry(id: EquipmentType): CatalogEntry | undefined {
  return CATALOG.find((e) => e.id === id);
}

/** Devices excluded from agent selection, with the reason — shown in the trace. */
export const EXCLUDED: { id: string; reason: string }[] = EQUIPMENT_LIST.filter(
  (spec) => !EQUIPMENT_TO_SLUG[spec.id as EquipmentType],
).map((spec) => ({
  id: spec.id,
  reason: `${spec.name} has no product listing, not orderable`,
}));

/* ═══════════════════════════ Spec interrogation ══════════════════════════
   The compliance engine needs to ask questions of the real spec sheets rather
   than of a hardcoded table, so eligibility stays true if the catalogue is
   edited. These read `Product.specs[].rows[].label`. */

/**
 * Does a sized fleet only contain capacities that can actually be ordered?
 * Used to decide whether a correction is needed, and to explain it.
 */
function unsellableCapacities(
  id: EquipmentType,
  grouped: { capacityTB: number; count: number }[],
): string[] {
  const entry = catalogEntry(id);
  if (!entry) return [`${id} has no product listing`];
  return grouped
    .filter((g) => !entry.capacities.includes(g.capacityTB))
    .map(
      (g) =>
        `${entry.product.name} is not sold at ${g.capacityTB} TB, orderable sizes are ${entry.capacities.join(", ")} TB`,
    );
}

/**
 * `selectFleet`, replayed against the *sellable* capacity list.
 *
 * Mirrors the algorithm documented in lib/sizer-engine.ts exactly:
 *   1. If one device size holds the whole payload, take the smallest such size.
 *   2. Otherwise fill with the largest repeatedly, then top up the remainder
 *      with the smallest single device that covers it.
 *
 * We cannot pass a capacity list into `runSizer` — it reads `EQUIPMENT_LIST`
 * directly, and that module is shared with Normal and Advanced. Rather than
 * fork it (risking drift in the one engine everything agrees on) or discard
 * devices whose two catalogues disagree, Ultra re-derives just this one step
 * and leaves every other figure the engine produced untouched.
 */
function selectSellableFleet(requiredRawTB: number, capacities: number[]): number[] {
  const desc = [...capacities].sort((a, b) => b - a);
  const asc = [...capacities].sort((a, b) => a - b);

  const single = asc.find((c) => c >= requiredRawTB);
  if (single !== undefined) return [single];

  const largest = desc[0];
  const list: number[] = [];
  let remaining = requiredRawTB;
  while (remaining > largest) {
    list.push(largest);
    remaining -= largest;
  }
  const topUp = asc.find((c) => c >= remaining) ?? largest;
  list.push(topUp);
  return list;
}

export interface ReconciledFleet {
  list: number[];
  grouped: { capacityTB: number; count: number }[];
  count: number;
  rawTB: number;
  usableTB: number;
  /** Set when the sizer's own fleet had to be corrected, with the reason. */
  correction?: string;
}

/**
 * Takes the sizer's fleet and, if it contains sizes the catalogue cannot sell,
 * returns a corrected one built only from orderable capacities.
 */
export function reconcileFleet(
  id: EquipmentType,
  sizerFleet: { grouped: { capacityTB: number; count: number }[]; rawTB: number },
  payloadTB: number,
  raidUsable: number,
): ReconciledFleet | null {
  const entry = catalogEntry(id);
  if (!entry) return null;

  const bad = unsellableCapacities(id, sizerFleet.grouped);
  if (!bad.length) return null;

  const requiredRawTB = payloadTB / raidUsable;
  const list = selectSellableFleet(requiredRawTB, entry.capacities);
  const rawTB = list.reduce((a, b) => a + b, 0);

  const counts = new Map<number, number>();
  list.forEach((c) => counts.set(c, (counts.get(c) ?? 0) + 1));
  const grouped = [...counts.entries()]
    .map(([capacityTB, count]) => ({ capacityTB, count }))
    .sort((a, b) => b.capacityTB - a.capacityTB);

  return {
    list,
    grouped,
    count: list.length,
    rawTB,
    usableTB: rawTB * raidUsable,
    correction: `Re-planned on orderable ${entry.product.name} capacities (${entry.capacities.join(", ")} TB), the sizing catalogue lists sizes that are not sold`,
  };
}

/** Case-insensitive substring lookup across every spec group of a product. */
function specValue(product: Product, label: string): string | undefined {
  const want = label.toLowerCase();
  for (const group of product.specs) {
    for (const row of group.rows) {
      if (row.label.toLowerCase().includes(want)) return row.value;
    }
  }
  return undefined;
}

/** True when any spec row's *value* mentions the term. */
export function specMentions(product: Product, term: string): boolean {
  const want = term.toLowerCase();
  return product.specs.some((g) =>
    g.rows.some((r) => r.value.toLowerCase().includes(want)),
  );
}

export interface HardwareTraits {
  /** Hardware (not just at-rest software) encryption on the device. */
  hardwareEncryption: boolean;
  /** Physical anti-tamper — the gate for export-controlled and defence work. */
  tamperProof: boolean;
  /** MIL-STD-810 ruggedisation. */
  milSpec: boolean;
  /** Formal certifications listed on the sheet (FCC, CE, UL, RoHS, BIS…). */
  certifications: string[];
  /** RAID levels the device supports. */
  raidLevels: string;
}

/**
 * Derives a device's compliance-relevant traits from its published specs.
 * Everything here is quoted from `lib/products.ts`, so the compliance verdict
 * can cite an actual spec row rather than an opinion.
 */
export function hardwareTraits(product: Product): HardwareTraits {
  const compliance = specValue(product, "compliance");
  return {
    hardwareEncryption:
      specMentions(product, "hardware data encryption") ||
      specMentions(product, "hardware encryption"),
    tamperProof: specMentions(product, "tamper"),
    milSpec: specMentions(product, "mil-std"),
    certifications: compliance
      ? compliance.split(",").map((s) => s.trim()).filter(Boolean)
      : [],
    raidLevels: specValue(product, "raid") ?? "N/A",
  };
}
