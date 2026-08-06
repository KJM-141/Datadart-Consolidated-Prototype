/**
 * Single pricing service (FR-2.2) — the one source of truth consumed by BOTH
 * the standalone Sizer (WF-2) and the chat agent (WF-1). Estimates are always
 * returned as a min–max range; single-number pricing is a proposal-stage
 * artifact only (FR-2.5).
 *
 * Pricing is layered ON TOP of the real sizing engine (`lib/sizer-engine.ts`),
 * so the rate card is applied to the actual selected fleet and computed
 * timeline rather than to a guess.
 */
import {
  DEFAULT_REQUEST,
  formatHours,
  runSizer,
  type EquipmentType,
  type RaidConfig,
  type Sizing,
} from "./sizer-engine";

export interface RateCard {
  version: string;
  /** USD per TB of raw fleet capacity, per rental month, by capacity tier. */
  rentalPerTBMonth: { upTo: number; rate: number }[];
  /** Flat protection fee per device instance. */
  protectionPerDevice: number;
  /** DT2 transfer-facility port-hours. */
  dt2PortHourRate: number;
  /** Round-trip logistics per device (domestic / international). */
  logisticsRoundTrip: { domestic: number; international: number };
  /** White Glove on-site service, per device instance. */
  whiteGlovePerInstance: number;
  /** Spread applied to produce the min–max ballpark band. */
  bandSpread: number;
}

export const RATE_CARD: RateCard = {
  version: "2026.07",
  rentalPerTBMonth: [
    { upTo: 256, rate: 62 },
    { upTo: 512, rate: 54 },
    { upTo: 1024, rate: 46 },
    { upTo: Infinity, rate: 39 },
  ],
  protectionPerDevice: 1800,
  dt2PortHourRate: 240,
  logisticsRoundTrip: { domestic: 2400, international: 6200 },
  whiteGlovePerInstance: 7500,
  bandSpread: 0.16,
};

export type ServiceLevel = "Self-managed" | "White Glove";

export interface EstimateInput {
  sizeTB: number;
  source?: string;
  destination?: string;
  serviceLevel?: ServiceLevel;
  /** Customer's internet line speed for the comparison, in Mbps. */
  lineSpeedMbps?: number;
  international?: boolean;
  /** Overrides for the underlying engine run. */
  equipmentType?: EquipmentType;
  raidConfig?: RaidConfig;
  encryptionEnabled?: boolean;
  travelDays?: number;
}

export interface Estimate {
  min: number;
  max: number;
  currency: "USD";
  perTBMin: number;
  perTBMax: number;
  /** Door-to-door working duration, rounded up to whole weeks. */
  weeks: number;
  devices: number;
  deviceLabel: string;
  /** Months of online transfer at the assumed line speed. */
  onlineMonths: number;
  lineSpeedMbps: number;
  ratesVersion: string;
  /** True when the transfer is too small to justify physical shipping. */
  recommendOnline: boolean;
  /** The full engine result behind this estimate. */
  sizing: Sizing;
  /** Cost breakdown for the proposal. */
  breakdown: { label: string; amount: number }[];
}

const round = (n: number, to: number) => Math.round(n / to) * to;

function rentalRate(perUnitTB: number): number {
  return (
    RATE_CARD.rentalPerTBMonth.find((t) => perUnitTB <= t.upTo)?.rate ??
    RATE_CARD.rentalPerTBMonth[RATE_CARD.rentalPerTBMonth.length - 1].rate
  );
}

/** Price a sizing produced by the engine. */
export function priceSizing(
  sizing: Sizing,
  opts: { serviceLevel?: ServiceLevel; international?: boolean } = {},
): Omit<Estimate, "onlineMonths" | "lineSpeedMbps" | "recommendOnline"> {
  const serviceLevel = opts.serviceLevel ?? "Self-managed";
  const international = opts.international ?? true;
  const { fleet, timeline, equipment, normalized } = sizing;

  // Rental is priced per unit against its own capacity tier.
  const rental = fleet.grouped.reduce(
    (sum, g) => sum + g.capacityTB * g.count * rentalRate(g.capacityTB),
    0,
  );
  const protection = fleet.count * RATE_CARD.protectionPerDevice;
  // DT2 port-hours track the real egress phase from the engine.
  const dt2 = timeline.egressHours * RATE_CARD.dt2PortHourRate;
  const logistics =
    fleet.count *
    (international
      ? RATE_CARD.logisticsRoundTrip.international
      : RATE_CARD.logisticsRoundTrip.domestic);
  const whiteGlove =
    serviceLevel === "White Glove"
      ? RATE_CARD.whiteGlovePerInstance * fleet.count
      : 0;

  const base = rental + protection + dt2 + logistics + whiteGlove;
  const min = round(base * (1 - RATE_CARD.bandSpread), 1000);
  const max = round(base * (1 + RATE_CARD.bandSpread), 1000);
  const sizeTB = normalized.dataTB;

  const breakdown = [
    { label: `Device rental (${fleet.count}× ${equipment.name})`, amount: Math.round(rental) },
    { label: "Protection & insurance", amount: protection },
    { label: `DT2 port-hours (${formatHours(timeline.egressHours)})`, amount: Math.round(dt2) },
    { label: "Round-trip logistics", amount: logistics },
    ...(whiteGlove ? [{ label: "White Glove service", amount: whiteGlove }] : []),
  ];

  return {
    min,
    max,
    currency: "USD",
    perTBMin: sizeTB ? Math.round(min / sizeTB) : 0,
    perTBMax: sizeTB ? Math.round(max / sizeTB) : 0,
    weeks: Math.max(1, Math.ceil(timeline.totalHours / 24 / 7)),
    devices: fleet.count,
    deviceLabel:
      fleet.count === 1 ? `1× ${equipment.name}` : `${fleet.count}× ${equipment.name}`,
    ratesVersion: RATE_CARD.version,
    sizing,
    breakdown,
  };
}

/**
 * Convenience wrapper for callers that only know volume + endpoints (the chat
 * agent). Runs the engine with sensible defaults, then prices it.
 */
export function estimate(input: EstimateInput): Estimate {
  const sizeTB = Math.max(0, input.sizeTB || 0);
  const lineSpeedMbps = input.lineSpeedMbps ?? 100;
  const serviceLevel = input.serviceLevel ?? "Self-managed";

  const sizing = runSizer({
    ...DEFAULT_REQUEST,
    equipmentType: input.equipmentType ?? "bryck-fxr",
    raidConfig: input.raidConfig ?? "raid5",
    encryptionEnabled: input.encryptionEnabled ?? true,
    dataAmount: sizeTB,
    dataUnit: "tb",
    travelTime: input.travelDays ?? 3,
    timeUnit: "days",
    wireThroughput: lineSpeedMbps,
    wireUnit: "mbps",
  });

  const priced = priceSizing(sizing, {
    serviceLevel,
    international: input.international,
  });

  return {
    ...priced,
    onlineMonths: sizing.comparison.wireHours / 24 / 30,
    lineSpeedMbps,
    recommendOnline: sizeTB > 0 && sizeTB < 1,
  };
}

export const fmtUSD = (n: number) =>
  `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export function fmtRange(e: { min: number; max: number }): string {
  return `${fmtUSD(e.min)} – ${fmtUSD(e.max)}`;
}
