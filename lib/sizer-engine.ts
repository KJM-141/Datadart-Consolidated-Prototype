/**
 * DATADART sizing engine — ported from the Tsecond DataDart Sizer
 * (`Tsecond Tools/Datadart Sizer`), the authoritative implementation.
 *
 * It answers: how long does it take to move N units of data between two
 * systems using DATADART (BRYCK equipment shipped physically) versus a wire
 * transfer — and how much equipment carries the payload.
 *
 * Conventions
 * -----------
 * - Volume normalises to GB using the binary convention (1 TB = 1024 GB) to
 *   mirror the reference calculator.
 * - Source/destination throughput is bytes/sec (GB/s or MB/s).
 * - Wire throughput is bits/sec (Tbps / Gbps / Mbps, decimal).
 * - Time is hours throughout the result.
 *
 * Pure and synchronous, so it also powers the chat agent (one engine, one
 * source of truth — FR-2.2).
 */

/* ── Domain types ───────────────────────────────────────────────────────── */

export type EquipmentType = "bryck-fxr" | "bryck" | "bryck-turbo" | "bryck-mini";
export type RaidConfig = "none" | "raid5" | "raid6";
export type DataUnit = "tb" | "pb";
export type ThroughputUnit = "gbs" | "mbs";
export type TimeUnit = "hours" | "days";
export type WireUnit = "tbps" | "gbps" | "mbps";

export interface SizerRequest {
  equipmentType: EquipmentType;
  raidConfig: RaidConfig;
  encryptionEnabled: boolean;
  dataAmount: number;
  dataUnit: DataUnit;
  srcThroughput: number;
  srcUnit: ThroughputUnit;
  dstThroughput: number;
  dstUnit: ThroughputUnit;
  travelTime: number;
  timeUnit: TimeUnit;
  wireThroughput: number;
  wireUnit: WireUnit;
}

export interface EquipmentSpec {
  id: EquipmentType;
  name: string;
  /** Orderable per-unit sizes (TB) the fleet algorithm may draw from. */
  capacities: number[];
  /** Sustained device throughput (GB/s). */
  throughputGBs: number;
  description: string;
  tagline: string;
  connectivity: string;
  protocols: string;
  recommended?: boolean;
}

export interface UnitGroup {
  capacityTB: number;
  count: number;
}

export interface FleetPlan {
  list: number[];
  grouped: UnitGroup[];
  count: number;
  rawTB: number;
  usableTB: number;
}

export interface ConfigPlan {
  raidConfig: RaidConfig;
  raidLabel: string;
  raidUsable: number;
  encryptionEnabled: boolean;
  baseThroughputGBs: number;
  effectiveThroughputGBs: number;
}

export interface Timeline {
  ingressHours: number;
  travelHours: number;
  egressHours: number;
  totalHours: number;
  bottleneck: "ingress" | "travel" | "egress";
}

export interface Comparison {
  dataDartHours: number;
  wireHours: number;
  savingsHours: number;
  savingsPercent: number;
  speedup: number;
  dataDartFaster: boolean;
}

export interface BomLine {
  ref: string;
  description: string;
  qty: number;
  unit: string;
}

export interface RationaleNote {
  title: string;
  body: string;
  warn?: boolean;
}

export interface Sizing {
  request: SizerRequest;
  equipment: EquipmentSpec;
  fleet: FleetPlan;
  config: ConfigPlan;
  normalized: {
    dataTB: number;
    dataGB: number;
    srcGBs: number;
    dstGBs: number;
    travelHours: number;
    wireGbps: number;
    wireGBs: number;
  };
  timeline: Timeline;
  comparison: Comparison;
  bom: BomLine[];
  rationale: RationaleNote[];
  warnings: string[];
}

/* ── Constants ──────────────────────────────────────────────────────────── */

/** Usable fraction of raw capacity for each protection scheme. */
const RAID_USABLE: Record<RaidConfig, number> = {
  none: 1.0,
  raid5: 0.8,
  raid6: 0.67,
};

export const RAID_LABEL: Record<RaidConfig, string> = {
  none: "No RAID (100% usable)",
  raid5: "RAID 5 (80% usable)",
  raid6: "RAID 6 (67% usable)",
};

export const RAID_SHORT: Record<RaidConfig, string> = {
  none: "None",
  raid5: "RAID 5",
  raid6: "RAID 6",
};

const RAID_TOLERATES: Record<RaidConfig, string> = {
  none: "no drive failures (no parity)",
  raid5: "a single drive failure (one parity drive)",
  raid6: "two simultaneous drive failures (dual parity)",
};

/** Encryption reduces sustained throughput by 20% ⇒ 80% of the base rate. */
const ENCRYPTION_PENALTY = 0.8;
/** Binary GB per TB — matches the reference DATADART calculator. */
const GB_PER_TB = 1024;
const SECONDS_PER_HOUR = 3600;

/* ── Equipment catalog ──────────────────────────────────────────────────── */

const EQUIPMENT: Record<EquipmentType, EquipmentSpec> = {
  "bryck-fxr": {
    id: "bryck-fxr",
    name: "BRYCK FXR",
    capacities: [
      1024, 960, 896, 832, 768, 704, 640, 576, 512, 448, 384, 320, 256, 192,
      128, 64,
    ],
    throughputGBs: 10,
    description: "Rugged edge AI flyaway kit",
    tagline: "Highest density · finest capacity granularity",
    connectivity: "10 / 25 / 40 / 100 Gbps",
    protocols: "NFS · SMB · S3",
    recommended: true,
  },
  bryck: {
    id: "bryck",
    name: "BRYCK",
    capacities: [1024, 512, 256, 128],
    throughputGBs: 10,
    description: "Enterprise-grade edge accelerator",
    tagline: "Petabyte-scale rugged transport",
    connectivity: "10 / 25 / 40 / 100 Gbps",
    protocols: "NFS · SMB · S3",
  },
  "bryck-turbo": {
    id: "bryck-turbo",
    name: "BRYCK Turbo",
    capacities: [512, 448, 384, 320, 256, 192, 128, 64],
    throughputGBs: 10,
    description: "High-speed compact edge device",
    tagline: "Compact · high throughput",
    connectivity: "10 / 25 / 40 / 100 Gbps",
    protocols: "NFS · SMB · S3",
  },
  "bryck-mini": {
    id: "bryck-mini",
    name: "BRYCK Mini",
    capacities: [512, 256, 128],
    throughputGBs: 3,
    description: "Compact edge device for constrained deployments",
    tagline: "Lightweight · field-portable",
    connectivity: "10 / 25 Gbps",
    protocols: "NFS · SMB · S3",
  },
};

export const EQUIPMENT_LIST: EquipmentSpec[] = [
  EQUIPMENT["bryck-fxr"],
  EQUIPMENT.bryck,
  EQUIPMENT["bryck-turbo"],
  EQUIPMENT["bryck-mini"],
];

/* ── Unit conversion ────────────────────────────────────────────────────── */

const dataToTB = (amount: number, unit: DataUnit) =>
  unit === "pb" ? amount * 1024 : amount;

const throughputToGBs = (value: number, unit: ThroughputUnit) =>
  unit === "mbs" ? value / GB_PER_TB : value;

const timeToHours = (time: number, unit: TimeUnit) =>
  unit === "days" ? time * 24 : time;

const wireToGbps = (value: number, unit: WireUnit) => {
  if (unit === "tbps") return value * 1000;
  if (unit === "mbps") return value / 1000;
  return value;
};

/* ── Fleet selection ────────────────────────────────────────────────────── */

/** Compact capacity label for BOM / rationale strings. */
export function capacityLabel(tb: number): string {
  if (tb >= 1024) {
    const pb = tb / 1024;
    return `${Number.isInteger(pb) ? pb : pb.toFixed(1)} PB`;
  }
  return `${Math.round(tb)} TB`;
}

/**
 * Choose the fleet of physical units that carries `requiredRawTB`.
 *
 * 1. If a single device size holds the whole payload, use the **smallest**
 *    such size (least over-provisioning).
 * 2. Otherwise fill with the **largest** device repeatedly, then top up the
 *    remainder with the smallest single device that covers it.
 */
function selectFleet(
  requiredRawTB: number,
  capacities: number[],
): number[] {
  const desc = [...capacities].sort((a, b) => b - a);
  const asc = [...desc].reverse();

  const single = asc.find((c) => c >= requiredRawTB);
  if (single !== undefined) return [single];

  const units: number[] = [];
  const largest = desc[0];
  let remaining = requiredRawTB;
  while (remaining >= largest) {
    units.push(largest);
    remaining -= largest;
  }
  if (remaining > 0) {
    units.push(asc.find((c) => c >= remaining) ?? largest);
  }
  return units;
}

function groupUnits(list: number[]): UnitGroup[] {
  const map = new Map<number, number>();
  for (const c of list) map.set(c, (map.get(c) ?? 0) + 1);
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([capacityTB, count]) => ({ capacityTB, count }));
}

/* ── Main entry ─────────────────────────────────────────────────────────── */

export function runSizer(request: SizerRequest): Sizing {
  const equipment = EQUIPMENT[request.equipmentType];

  // Normalise inputs to base units.
  const dataTB = dataToTB(request.dataAmount, request.dataUnit);
  const dataGB = dataTB * GB_PER_TB;
  const srcGBs = throughputToGBs(request.srcThroughput, request.srcUnit);
  const dstGBs = throughputToGBs(request.dstThroughput, request.dstUnit);
  const travelHours = timeToHours(request.travelTime, request.timeUnit);
  const wireGbps = wireToGbps(request.wireThroughput, request.wireUnit);
  const wireGBs = wireGbps / 8;

  // Protection + encryption.
  const raidUsable = RAID_USABLE[request.raidConfig];
  const baseThroughputGBs = equipment.throughputGBs;
  const effectiveThroughputGBs = request.encryptionEnabled
    ? baseThroughputGBs * ENCRYPTION_PENALTY
    : baseThroughputGBs;

  // Fleet selection (raw sized up for parity overhead).
  const requiredRawTB = dataTB / raidUsable;
  const list = selectFleet(requiredRawTB, equipment.capacities);
  const rawTB = list.reduce((a, b) => a + b, 0);
  const usableTB = rawTB * raidUsable;
  const fleet: FleetPlan = {
    list,
    grouped: groupUnits(list),
    count: list.length,
    rawTB,
    usableTB,
  };

  const config: ConfigPlan = {
    raidConfig: request.raidConfig,
    raidLabel: RAID_LABEL[request.raidConfig],
    raidUsable,
    encryptionEnabled: request.encryptionEnabled,
    baseThroughputGBs,
    effectiveThroughputGBs,
  };

  // Timeline: ingress → travel → egress.
  const ingressThroughput = Math.min(srcGBs, effectiveThroughputGBs);
  const egressThroughput = Math.min(dstGBs, effectiveThroughputGBs);
  const ingressHours = dataGB / (ingressThroughput * SECONDS_PER_HOUR);
  const egressHours = dataGB / (egressThroughput * SECONDS_PER_HOUR);
  const totalHours = ingressHours + travelHours + egressHours;

  const phases: { phase: Timeline["bottleneck"]; hours: number }[] = [
    { phase: "ingress", hours: ingressHours },
    { phase: "travel", hours: travelHours },
    { phase: "egress", hours: egressHours },
  ];
  const bottleneck = phases.reduce((a, b) => (b.hours > a.hours ? b : a)).phase;

  const timeline: Timeline = {
    ingressHours,
    travelHours,
    egressHours,
    totalHours,
    bottleneck,
  };

  // Wire comparison.
  const wireHours = dataGB / (wireGBs * SECONDS_PER_HOUR);
  const savingsHours = wireHours - totalHours;
  const comparison: Comparison = {
    dataDartHours: totalHours,
    wireHours,
    savingsHours,
    savingsPercent: wireHours > 0 ? (savingsHours / wireHours) * 100 : 0,
    speedup: totalHours > 0 ? wireHours / totalHours : 0,
    dataDartFaster: totalHours < wireHours,
  };

  // Bill of materials.
  const bom: BomLine[] = fleet.grouped.map((g) => ({
    ref: `DATADART-${equipment.id.toUpperCase()}-${g.capacityTB}TB`,
    description: `${equipment.name} · ${capacityLabel(g.capacityTB)} transport unit`,
    qty: g.count,
    unit: "unit",
  }));

  // Design rationale + warnings.
  const rationale: RationaleNote[] = [];
  const warnings: string[] = [];

  const fleetDesc = fleet.grouped
    .map((g) => `${g.count}× ${capacityLabel(g.capacityTB)}`)
    .join(" + ");
  rationale.push({
    title: `Fleet — ${fleet.count}× ${equipment.name}`,
    body: `${fleetDesc} selected (${capacityLabel(fleet.rawTB)} raw → ${capacityLabel(fleet.usableTB)} usable). The smallest configuration that carries the protected payload is chosen to minimise over-provisioning.`,
  });

  rationale.push({
    title: `Data protection — ${RAID_LABEL[request.raidConfig]}`,
    body:
      request.raidConfig === "none"
        ? "No parity is reserved, so 100% of raw capacity is usable. The payload is carried without on-device redundancy."
        : `${RAID_SHORT[request.raidConfig]} tolerates ${RAID_TOLERATES[request.raidConfig]}. Raw capacity is sized up by 1 ÷ ${config.raidUsable} to absorb the parity overhead.`,
  });

  if (config.encryptionEnabled) {
    rationale.push({
      title: "Encryption impact",
      body: `Hardware encryption reduces sustained device throughput by 20% (${config.baseThroughputGBs} GB/s → ${config.effectiveThroughputGBs.toFixed(1)} GB/s), which lengthens the ingress and egress phases.`,
      warn: true,
    });
  }

  const limiter =
    Math.min(srcGBs, dstGBs) <= config.effectiveThroughputGBs
      ? "the source/destination system"
      : "the DATADART equipment";
  rationale.push({
    title: "Bottleneck analysis",
    body: `The ${timeline.bottleneck} phase dominates the move. Ingress and egress are limited by ${limiter} throughput; travel is a fixed logistics cost independent of payload size.`,
  });

  if (comparison.dataDartFaster) {
    rationale.push({
      title: "Verdict — DataDart wins",
      body: `DataDart completes the move in ${comparison.dataDartHours.toFixed(1)} h versus ${comparison.wireHours.toFixed(1)} h over a ${wireGbps.toFixed(2)} Gbps wire — a ${comparison.speedup.toFixed(1)}× speed-up (${comparison.savingsPercent.toFixed(1)}% faster).`,
    });
  } else {
    rationale.push({
      title: "Verdict — wire transfer wins",
      body: `For this payload and network the wire finishes first (${comparison.wireHours.toFixed(1)} h vs ${comparison.dataDartHours.toFixed(1)} h). DataDart's advantage grows with larger volumes and slower networks.`,
      warn: true,
    });
    warnings.push(
      "Wire transfer is faster than DataDart for these inputs — physical transport pays off at larger data volumes or over slower networks.",
    );
  }

  return {
    request,
    equipment,
    fleet,
    config,
    normalized: {
      dataTB,
      dataGB,
      srcGBs,
      dstGBs,
      travelHours,
      wireGbps,
      wireGBs,
    },
    timeline,
    comparison,
    bom,
    rationale,
    warnings,
  };
}

/* ── Display formatters ─────────────────────────────────────────────────── */

/** Human-friendly duration: sec / min / `Hh Mm` / `Dd Hh`. */
export function formatHours(hours: number): string {
  if (!Number.isFinite(hours) || hours < 0) return "—";
  if (hours === 0) return "0 sec";
  if (hours < 1 / 60) return `${Math.round(hours * 3600)} sec`;
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 24) {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  const days = Math.floor(hours / 24);
  const rem = Math.round((hours % 24) * 10) / 10;
  return rem > 0 ? `${days}d ${rem}h` : `${days}d`;
}

export function formatCapacityTB(tb: number): string {
  if (!Number.isFinite(tb)) return "—";
  if (tb >= 1024) {
    const pb = tb / 1024;
    return `${Number.isInteger(pb) ? pb : pb.toFixed(pb < 10 ? 2 : 1)} PB`;
  }
  return `${Math.round(tb)} TB`;
}

export function formatThroughputGBs(gbs: number): string {
  if (!Number.isFinite(gbs)) return "—";
  if (gbs < 1) return `${Math.round(gbs * 1024)} MB/s`;
  return `${Number.isInteger(gbs) ? gbs : gbs.toFixed(1)} GB/s`;
}

export function formatGbps(gbps: number): string {
  if (!Number.isFinite(gbps)) return "—";
  if (gbps >= 1000) return `${(gbps / 1000).toFixed(2)} Tbps`;
  if (gbps < 1) return `${Math.round(gbps * 1000)} Mbps`;
  return `${Number.isInteger(gbps) ? gbps : gbps.toFixed(2)} Gbps`;
}

export function formatMultiplier(x: number): string {
  if (!Number.isFinite(x)) return "—";
  return `${x >= 10 ? Math.round(x) : x.toFixed(1)}×`;
}

/** Sensible starting point for the standalone sizer. */
export const DEFAULT_REQUEST: SizerRequest = {
  equipmentType: "bryck-fxr",
  raidConfig: "raid5",
  encryptionEnabled: true,
  dataAmount: 800,
  dataUnit: "tb",
  srcThroughput: 8,
  srcUnit: "gbs",
  dstThroughput: 8,
  dstUnit: "gbs",
  travelTime: 3,
  timeUnit: "days",
  wireThroughput: 100,
  wireUnit: "mbps",
};
