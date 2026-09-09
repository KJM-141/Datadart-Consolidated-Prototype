/**
 * DataDart 2.0 order lifecycle (FR-4.1) — the ten-stage model that replaces
 * the old binary Active/Closed status. Stage transitions are audited; each
 * stage names an accountable owner before it can start.
 */

export const STAGES = [
  "Proposal",
  "Onboarding",
  "PO & Advance",
  "Provisioning",
  "Data Load",
  "Shipment",
  "DT2 Upload",
  "Verification",
  "Certified Erase",
  "Closure",
] as const;

export type Stage = (typeof STAGES)[number];

/** Short labels for the compact tracker rail. */
export const STAGE_SHORT: Record<Stage, string> = {
  Proposal: "Proposal",
  Onboarding: "Onboard",
  "PO & Advance": "PO/Adv",
  Provisioning: "Provision",
  "Data Load": "Data load",
  Shipment: "Shipment",
  "DT2 Upload": "DT2 upload",
  Verification: "Verify",
  "Certified Erase": "Erase",
  Closure: "Closure",
};

export const STAGE_BLURB: Record<Stage, string> = {
  Proposal: "Scope agreed and priced; proposal issued for review.",
  Onboarding: "Site readiness, shipping windows and secure credential collection.",
  "PO & Advance": "Purchase order raised and advance invoice settled.",
  Provisioning: "Device prepared, encrypted and configured for your transfer.",
  "Data Load": "Your data is being written to the device, live progress below.",
  Shipment: "Sealed device in transit with chain-of-custody tracking.",
  "DT2 Upload": "Data uploaded from our transfer facility into your cloud.",
  Verification: "Checksums compared end-to-end; verification report produced.",
  "Certified Erase": "Device securely erased and an erasure certificate issued.",
  Closure: "Balance settled, artifacts delivered, order closed.",
};

export function stageIndex(stage: Stage): number {
  return STAGES.indexOf(stage);
}

/* ── Human-readable IDs (FR-1.6 / FR-6.4) ───────────────────────────────
   DD-YYYY-NNNN is the only ID a user ever sees; UUIDs stay behind a copy
   action. The year is pinned rather than read from the clock so an ID minted
   in the browser always matches one rendered at build time. */
const ID_YEAR = 2026;

function makeDisplayId(seq: number) {
  return `DD-${ID_YEAR}-${String(seq).padStart(4, "0")}`;
}

/**
 * The prototype ships as a static export, so `/orders/[id]` can only serve IDs
 * that existed at build time. Runtime IDs therefore come from a reserved block
 * that `generateStaticParams` pre-renders — every order a visitor can create
 * has a real page, and the sequence is deterministic (no hydration drift).
 */
const RESERVED_FIRST = 201;
const RESERVED_COUNT = 40;

export const RESERVED_DISPLAY_IDS: string[] = Array.from(
  { length: RESERVED_COUNT },
  (_, i) => makeDisplayId(RESERVED_FIRST + i),
);

let issued = 0;
export function nextDisplayId(): string {
  const id = RESERVED_DISPLAY_IDS[issued % RESERVED_COUNT];
  issued += 1;
  return id;
}
