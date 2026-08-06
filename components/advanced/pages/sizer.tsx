"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Boxes,
  ChevronDown,
  Clock,
  Info,
  Lock,
  Mail,
  MapPin,
  ShieldCheck,
  TriangleAlert,
  Wifi,
} from "lucide-react";
import { toast } from "sonner";
import { catalogEntry, EXCLUDED, reconcileFleet } from "@/lib/catalog";
import { Input } from "@/components/ui/input";
import { HoloPanel, PanelHead } from "@/components/advanced/kit/holo-panel";
import {
  HudLabel,
  HudRule,
  LiveDot,
  MetricRing,
  Pill,
  type Tone,
} from "@/components/advanced/kit/hud";
import { hudInputClass } from "@/components/advanced/kit/hud-field";
import { priceSizing, fmtRange, fmtUSD, type ServiceLevel } from "@/lib/pricing";
import {
  DEFAULT_REQUEST,
  EQUIPMENT_LIST,
  RAID_LABEL,
  RAID_SHORT,
  capacityLabel,
  formatCapacityTB,
  formatGbps,
  formatHours,
  formatMultiplier,
  formatThroughputGBs,
  runSizer,
  type DataUnit,
  type EquipmentType,
  type RaidConfig,
  type SizerRequest,
} from "@/lib/sizer-engine";
import { bloomSoft, deckStagger, EASE_ADV } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/brand/logo-mark";

const DESTINATIONS = [
  "AWS S3 — us-east-1",
  "AWS S3 — us-west-2",
  "AWS S3 — eu-west-1",
  "AWS S3 — ap-south-1",
  "Azure Blob — Germany West",
  "GCP Storage — europe-west2",
  "Private data centre",
];

/**
 * Sizer — the Advanced instrument panel.
 *
 * Backed by exactly the same `runSizer` / `priceSizing` engine as the Normal
 * page (and as the chat agent), with the same inputs, the same advanced drawer
 * and the same deep-link into /start. The redesign is in the readout: gauge
 * rings, a bottleneck-aware phase rail and a head-to-head speed race against
 * the customer's own wire.
 */
/**
 * The sizer is always catalogue-governed.
 *
 * `lib/sizer-engine.ts` and `lib/products.ts` diverged long ago: the engine
 * knows a `bryck-turbo` that has no product page, and Mini capacities the
 * catalogue cannot sell. Offering either produces a quote the business cannot
 * fulfil, so the equipment list is filtered and the chosen fleet re-selected
 * against sellable capacities before anything is priced.
 */
export function SizerAdvanced() {
  const governed = true;
  const [req, setReq] = useState<SizerRequest>(DEFAULT_REQUEST);
  const [source, setSource] = useState("Bengaluru, India");
  const [destination, setDestination] = useState(DESTINATIONS[0]);
  const [serviceLevel, setServiceLevel] = useState<ServiceLevel>("Self-managed");
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const set = <K extends keyof SizerRequest>(k: K, v: SizerRequest[K]) =>
    setReq((r) => ({ ...r, [k]: v }));

  // Split rather than filter, so the page can say what it withheld and why —
  // silently dropping options reads as a shorter catalogue, not as a decision.
  const [offered, withheld] = useMemo(() => {
    if (!governed) return [EQUIPMENT_LIST, []] as const;
    const blocked = new Set(EXCLUDED.map((e) => e.id));
    return [
      // Capacities are clamped to what sales can ship, so the card's "up to"
      // figure is a promise the catalogue can keep. The Mini advertises 512 TB
      // in the sizing engine but is only sold at 256.
      EQUIPMENT_LIST.filter((e) => !blocked.has(e.id)).map((e) => {
        const sellable = catalogEntry(e.id as EquipmentType)?.product.capacities;
        return sellable?.length ? { ...e, capacities: sellable } : e;
      }),
      EQUIPMENT_LIST.filter((e) => blocked.has(e.id)),
    ] as const;
  }, [governed]);

  // Never leave the form pointing at something that is no longer on offer.
  useEffect(() => {
    if (!offered.some((e) => e.id === req.equipmentType)) {
      set("equipmentType", offered[0].id as EquipmentType);
    }
  }, [offered, req.equipmentType]);

  const sizing = useMemo(() => {
    const raw = runSizer(req);
    if (!governed) return raw;
    // Same correction the orchestrator applies: the engine happily builds a
    // fleet out of capacity rungs the catalogue cannot sell, so re-select
    // against the sellable ones. Timeline and comparison are throughput-driven
    // and unaffected by which capacities make up the fleet.
    const fixed = reconcileFleet(
      req.equipmentType,
      raw.fleet,
      raw.normalized.dataTB,
      raw.config.raidUsable,
    );
    return fixed
      ? {
          ...raw,
          fleet: {
            list: fixed.list,
            grouped: fixed.grouped,
            count: fixed.count,
            rawTB: fixed.rawTB,
            usableTB: fixed.usableTB,
          },
        }
      : raw;
  }, [req, governed]);
  const priced = useMemo(
    () => priceSizing(sizing, { serviceLevel }),
    [sizing, serviceLevel],
  );

  const { fleet, timeline, comparison, equipment, config, normalized } = sizing;
  const tooSmall = normalized.dataTB > 0 && normalized.dataTB < 1;

  const chatHref = `/start?size=${Math.round(normalized.dataTB)}&source=${encodeURIComponent(source)}&dest=${encodeURIComponent(destination)}&sl=${encodeURIComponent(serviceLevel)}`;

  // Race bars are relative to whichever route is slower, so the loser always
  // fills the track and the winner reads as a fraction of it.
  const slowest = Math.max(comparison.dataDartHours, comparison.wireHours, 1);

  return (
    <motion.div
      variants={deckStagger(0.06)}
      initial="hidden"
      animate="show"
      className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14"
    >
      <motion.div variants={bloomSoft} className="max-w-2xl">
        <div className="flex items-center gap-2">
          <LiveDot tone="cyo" />
          <HudLabel>Transparent pricing</HudLabel>
        </div>
        <h1 className="mt-2.5 text-[2.1rem] font-semibold leading-[1.05] tracking-tight sm:text-[2.6rem]">
          What will my transfer cost
          <span className="plasma-text">?</span>
        </h1>
        <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
          Three inputs, an instant ballpark. No account, no sales call, no gated
          PDF — the same engine that powers our assistant.
        </p>
      </motion.div>

      <div className="mt-8 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        {/* ══ Input console ═══════════════════════════════════════ */}
        <motion.div variants={bloomSoft}>
          <HoloPanel plain brackets className="min-w-0 p-5 sm:p-6">
            <PanelHead
              label="Configure"
              title="How much data, from where, to where?"
            />

            <div className="mt-5 space-y-5">
              {/* size */}
              {/* The slider gets its own row. Sharing one with the number
                  field and the unit toggle left it about 100px wide, at which
                  width the track vanishes into the panel and all that reads is
                  the thumb — a stray dot floating beside the toggle. */}
              <Group label="Data size">
                <div className="flex items-center gap-2.5">
                  <Input
                    type="number"
                    min={1}
                    value={req.dataAmount}
                    onChange={(e) =>
                      set("dataAmount", Math.max(0, Number(e.target.value)))
                    }
                    className={cn(hudInputClass, "w-28 pl-4 text-lg font-bold tabular-nums")}
                    aria-label="Data amount"
                  />
                  <Toggle
                    options={["tb", "pb"] as const}
                    labels={{ tb: "TB", pb: "PB" }}
                    value={req.dataUnit}
                    onChange={(v) => set("dataUnit", v as DataUnit)}
                    id="unit"
                  />
                </div>
                <input
                  type="range"
                  min={req.dataUnit === "pb" ? 1 : 10}
                  max={req.dataUnit === "pb" ? 10 : 3000}
                  step={req.dataUnit === "pb" ? 1 : 10}
                  value={req.dataAmount}
                  onChange={(e) => set("dataAmount", Number(e.target.value))}
                  aria-label="Data size slider"
                  className="mt-3.5 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted ring-1 ring-inset ring-hair accent-(--plasma) coarse:h-11 coarse:bg-transparent coarse:ring-0 coarse:[background:linear-gradient(var(--color-muted),var(--color-muted))_center/100%_6px_no-repeat]"
                />
              </Group>

              {/* source */}
              <Group label="Source location" htmlFor="sz-source">
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-4 top-1/2 z-10 size-4 -translate-y-1/2 text-(--plasma)" />
                  <Input
                    id="sz-source"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="City, country"
                    className={hudInputClass}
                  />
                </div>
              </Group>

              {/* destination */}
              <Group label="Destination" htmlFor="sz-dest">
                <select
                  id="sz-dest"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="h-12 w-full rounded-xl border-transparent bg-[color-mix(in_oklab,var(--muted)_65%,transparent)] px-4 text-sm shadow-[inset_0_0_0_1px_var(--border)] outline-none transition-shadow focus-visible:shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--plasma)_60%,transparent)]"
                >
                  {DESTINATIONS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </Group>

              {/* equipment */}
              <Group label="Equipment">
                <div className="grid gap-2 sm:grid-cols-2">
                  {offered.map((eq) => {
                    const active = req.equipmentType === eq.id;
                    return (
                      <button
                        key={eq.id}
                        type="button"
                        onClick={() => set("equipmentType", eq.id as EquipmentType)}
                        className={cn(
                          "relative overflow-hidden rounded-xl px-3.5 py-3 text-left transition-all duration-300",
                          active
                            ? "bg-[color-mix(in_oklab,var(--plasma)_14%,transparent)] shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--plasma)_45%,transparent),0_0_24px_-12px_color-mix(in_oklab,var(--plasma)_95%,transparent)]"
                            : "bg-muted/50 shadow-[inset_0_0_0_1px_var(--border)] hover:bg-muted",
                        )}
                      >
                        <span className="flex items-center gap-1.5">
                          <span className="text-[13px] font-semibold">
                            {eq.name}
                          </span>
                          {eq.recommended && (
                            <span className="rounded-full plasma-fill px-1.5 py-0.5 text-[9px] font-bold text-white">
                              REC
                            </span>
                          )}
                        </span>
                        <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.08em] leading-tight text-muted-foreground">
                          {eq.throughputGBs} GB/s · up to{" "}
                          {capacityLabel(Math.max(...eq.capacities))}
                        </span>
                      </button>
                    );
                  })}
                </div>
                {withheld.length > 0 && (
                  <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
                    <LogoMark size={13} className="mt-0.5 shrink-0" />
                    <span>
                      {withheld.map((e) => e.name).join(" and ")}{" "}
                      {withheld.length === 1 ? "is" : "are"} hidden — the
                      catalogue cannot currently fulfil{" "}
                      {withheld.length === 1 ? "it" : "them"}, so the agent
                      will not quote {withheld.length === 1 ? "it" : "them"}{" "}
                      either.
                    </span>
                  </p>
                )}
              </Group>

              {/* service level */}
              <Group label="Service level">
                <Toggle
                  options={["Self-managed", "White Glove"] as const}
                  value={serviceLevel}
                  onChange={setServiceLevel}
                  id="sl"
                  full
                />
                <p className="mt-2 text-[11px] text-muted-foreground">
                  White Glove adds on-site engineers who handle the data load for
                  you.
                </p>
              </Group>

              {/* advanced drawer */}
              <div className="overflow-hidden rounded-xl bg-muted/35 shadow-[inset_0_0_0_1px_var(--border)]">
                <button
                  type="button"
                  onClick={() => setAdvancedOpen((a) => !a)}
                  aria-expanded={advancedOpen}
                  className="flex w-full items-center justify-between px-4 py-3.5 text-left"
                >
                  <HudLabel
                    className={cn(advancedOpen && "text-(--plasma)")}
                  >
                    Advanced — protection, throughput, logistics
                  </HudLabel>
                  <ChevronDown
                    className={cn(
                      "size-4 shrink-0 text-muted-foreground transition-transform duration-400",
                      advancedOpen && "rotate-180 text-(--plasma)",
                    )}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {advancedOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.32, ease: EASE_ADV }}
                    >
                      <div className="space-y-4 border-t border-border/60 px-4 py-4">
                        <Group label="Data protection">
                          <Toggle
                            options={["none", "raid5", "raid6"] as const}
                            labels={{
                              none: RAID_SHORT.none,
                              raid5: RAID_SHORT.raid5,
                              raid6: RAID_SHORT.raid6,
                            }}
                            value={req.raidConfig}
                            onChange={(v) => set("raidConfig", v as RaidConfig)}
                            id="raid"
                          />
                          <p className="mt-2 text-[11px] text-muted-foreground">
                            {RAID_LABEL[req.raidConfig]}
                          </p>
                        </Group>

                        <label className="flex cursor-pointer items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={req.encryptionEnabled}
                            onChange={(e) =>
                              set("encryptionEnabled", e.target.checked)
                            }
                            className="mt-0.5 size-4 accent-(--plasma)"
                          />
                          <span>
                            <span className="block text-[13px] font-semibold">
                              Hardware encryption
                            </span>
                            <span className="block text-[11px] text-muted-foreground">
                              AES-256 at rest; costs 20% of sustained throughput.
                            </span>
                          </span>
                        </label>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <NumberPair
                            label="Source throughput"
                            value={req.srcThroughput}
                            onValue={(n) => set("srcThroughput", n)}
                            options={["gbs", "mbs"] as const}
                            labels={{ gbs: "GB/s", mbs: "MB/s" }}
                            unit={req.srcUnit}
                            onUnit={(v) => set("srcUnit", v)}
                            id="src"
                          />
                          <NumberPair
                            label="Destination throughput"
                            value={req.dstThroughput}
                            onValue={(n) => set("dstThroughput", n)}
                            options={["gbs", "mbs"] as const}
                            labels={{ gbs: "GB/s", mbs: "MB/s" }}
                            unit={req.dstUnit}
                            onUnit={(v) => set("dstUnit", v)}
                            id="dst"
                          />
                          <NumberPair
                            label="Transit time"
                            value={req.travelTime}
                            onValue={(n) => set("travelTime", n)}
                            options={["hours", "days"] as const}
                            labels={{ hours: "hrs", days: "days" }}
                            unit={req.timeUnit}
                            onUnit={(v) => set("timeUnit", v)}
                            id="travel"
                          />
                          <NumberPair
                            label="Your network line"
                            value={req.wireThroughput}
                            onValue={(n) => set("wireThroughput", n)}
                            options={["mbps", "gbps"] as const}
                            labels={{ mbps: "Mbps", gbps: "Gbps" }}
                            unit={req.wireUnit === "tbps" ? "gbps" : req.wireUnit}
                            onUnit={(v) => set("wireUnit", v)}
                            id="wire"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <p className="mt-5 flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 size-3 shrink-0 text-(--cyo)" />
              No account needed. Estimates use the standard rate card: device
              rental (capacity × duration) + protection + DT2 port-hours +
              round-trip logistics.
            </p>
          </HoloPanel>
        </motion.div>

        {/* ══ Readout ═════════════════════════════════════════════ */}
        <motion.div variants={bloomSoft} className="min-w-0 space-y-4">
          {tooSmall ? (
            <HoloPanel brackets className="p-5">
              <h2 className="text-base font-semibold tracking-tight">
                Honestly? Send this one over the wire.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Under 1 TB will move faster over your existing connection than it
                would take us to ship a device. We&apos;d rather tell you that
                than force a deal.
              </p>
              <button
                type="button"
                onClick={() => toast.success("Summary sent to your email")}
                className="btn-ghost-hud mt-4 inline-flex h-11 items-center gap-2 px-5 text-[13px] font-medium"
              >
                <Mail className="size-4" /> Email me a summary
              </button>
            </HoloPanel>
          ) : (
            <>
              {/* headline estimate */}
              <HoloPanel plain live scan className="overflow-hidden p-5">
                <span aria-hidden className="hud-dots absolute inset-0 opacity-20" />
                <div className="relative flex items-start justify-between gap-5">
                  <div className="min-w-0">
                    <HudLabel>Ballpark estimate</HudLabel>
                    <motion.p
                      key={`${priced.min}-${priced.max}`}
                      initial={{ opacity: 0, y: 8, filter: "blur(6px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      transition={{ duration: 0.45, ease: EASE_ADV }}
                      className="mt-1.5 text-[2rem] font-semibold leading-none tracking-tight plasma-text sm:text-[2.4rem]"
                    >
                      {fmtRange(priced)}
                    </motion.p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      ≈ ${priced.perTBMin}–{priced.perTBMax} / TB · door-to-door{" "}
                      <span className="font-semibold text-foreground">
                        {formatHours(timeline.totalHours)}
                      </span>
                    </p>
                  </div>
                  <MetricRing
                    id="sizer"
                    value={Math.min(
                      comparison.dataDartFaster
                        ? 1 - comparison.dataDartHours / slowest
                        : 0.12,
                      1,
                    )}
                    size={82}
                    stroke={6}
                    className="shrink-0"
                  >
                    <span className="text-center">
                      <span className="block text-[15px] font-semibold leading-none">
                        {comparison.dataDartFaster
                          ? formatMultiplier(comparison.speedup)
                          : "—"}
                      </span>
                      <span className="mt-1 block text-[8px] font-medium text-muted-foreground">
                        faster
                      </span>
                    </span>
                  </MetricRing>
                </div>

                {/* phase rail */}
                <div className="relative mt-5">
                  <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
                    {(
                      [
                        ["ingress", timeline.ingressHours],
                        ["travel", timeline.travelHours],
                        ["egress", timeline.egressHours],
                      ] as const
                    ).map(([phase, hrs]) => (
                      <motion.span
                        key={phase}
                        layout
                        className={cn(
                          "h-full",
                          phase === timeline.bottleneck
                            ? "bg-warning shadow-[0_0_14px_-2px_var(--warning)]"
                            : "plasma-fill",
                        )}
                        style={{
                          flexGrow: Math.max(hrs, timeline.totalHours * 0.04),
                        }}
                        title={`${phase}: ${formatHours(hrs)}`}
                      />
                    ))}
                  </div>
                  <div className="mt-2 grid grid-cols-3">
                    <Phase label="Ingress" hours={timeline.ingressHours} live={timeline.bottleneck === "ingress"} />
                    <Phase label="Travel" hours={timeline.travelHours} live={timeline.bottleneck === "travel"} align="center" />
                    <Phase label="Egress" hours={timeline.egressHours} live={timeline.bottleneck === "egress"} align="right" />
                  </div>
                  <p className="mt-2.5 text-[10px] text-muted-foreground">
                    The{" "}
                    <span className="font-bold uppercase tracking-[0.1em] text-warning">
                      {timeline.bottleneck}
                    </span>{" "}
                    phase is the limiting factor.
                  </p>
                </div>
              </HoloPanel>

              {/* head-to-head race */}
              <HoloPanel className="p-5">
                <PanelHead label="Comparison" title="DataDart vs your wire" />
                <div className="mt-4 space-y-3.5">
                  <RaceBar
                    icon={Clock}
                    label="With DataDart"
                    value={formatHours(comparison.dataDartHours)}
                    ratio={comparison.dataDartHours / slowest}
                    tone="plasma"
                  />
                  <RaceBar
                    icon={Wifi}
                    label={`Over ${formatGbps(normalized.wireGbps)}`}
                    value={formatHours(comparison.wireHours)}
                    ratio={comparison.wireHours / slowest}
                    tone="muted"
                  />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3.5">
                  <Pill tone={comparison.dataDartFaster ? "success" : "warning"}>
                    {comparison.dataDartFaster
                      ? `${formatMultiplier(comparison.speedup)} faster · saves ${formatHours(comparison.savingsHours)}`
                      : "Wire wins at this volume"}
                  </Pill>
                  <Pill tone="ion" icon={Boxes}>
                    {fleet.count}× {equipment.name}
                  </Pill>
                  <Pill
                    tone="cyo"
                    icon={config.encryptionEnabled ? Lock : ShieldCheck}
                  >
                    {config.encryptionEnabled ? "AES-256" : "Standard"}
                  </Pill>
                </div>
              </HoloPanel>

              {/* fleet */}
              <HoloPanel className="p-5">
                <PanelHead
                  label="Hardware"
                  title="Fleet & capacity"
                  action={
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      {fleet.grouped
                        .map((g) => `${g.count}×${capacityLabel(g.capacityTB)}`)
                        .join(" + ")}
                    </span>
                  }
                />
                <dl className="mt-4 space-y-2.5">
                  <Row label="Payload" value={formatCapacityTB(normalized.dataTB)} />
                  <Row label="Protection" value={RAID_LABEL[config.raidConfig]} />
                  <Row label="Raw capacity" value={formatCapacityTB(fleet.rawTB)} />
                  <Row label="Usable capacity" value={formatCapacityTB(fleet.usableTB)} />
                  <Row
                    label="Device throughput"
                    value={
                      config.encryptionEnabled
                        ? `${formatThroughputGBs(config.effectiveThroughputGBs)} (encrypted)`
                        : formatThroughputGBs(config.baseThroughputGBs)
                    }
                  />
                </dl>
              </HoloPanel>

              {/* ledger */}
              <HoloPanel className="p-5">
                <PanelHead label="Breakdown" title="What's included" />
                <dl className="mt-4 space-y-2.5">
                  {priced.breakdown.map((b) => (
                    <Row key={b.label} label={b.label} value={fmtUSD(b.amount)} />
                  ))}
                </dl>
                <HudRule className="my-3.5" />
                <p className="text-[10px] leading-relaxed text-muted-foreground">
                  Final pricing is confirmed in your proposal. A range is shown so
                  there are no surprises later. Rate card {priced.ratesVersion}.
                </p>
              </HoloPanel>

              {sizing.warnings.length > 0 && (
                <div className="flex items-start gap-2.5 rounded-2xl bg-warning/10 p-4 ring-1 ring-inset ring-warning/40">
                  <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
                  <p className="text-[13px] leading-relaxed">
                    {sizing.warnings[0]}
                  </p>
                </div>
              )}
            </>
          )}

          {/* CTAs */}
          <div className="flex flex-wrap gap-2.5">
            <Link
              href={chatHref}
              className="btn-plasma group inline-flex h-12 flex-1 items-center justify-center gap-2 text-[13px] font-medium"
            >
              Refine in chat
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <button
              type="button"
              onClick={() =>
                toast.success("Estimate sent", {
                  description: "Check your inbox for the full breakdown.",
                })
              }
              className="btn-ghost-hud inline-flex h-12 items-center gap-2 px-5 text-[13px] font-medium"
            >
              <Mail className="size-4" /> Email me this
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ── Building blocks ────────────────────────────────────────────────────── */

function Group({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="hud-label mb-2 block">
        {label}
      </label>
      {children}
    </div>
  );
}

/** Segmented control with a sliding plasma thumb. */
function Toggle<T extends string>({
  options,
  labels,
  value,
  onChange,
  id,
  full,
}: {
  options: readonly T[];
  labels?: Partial<Record<T, string>>;
  value: T;
  onChange: (v: T) => void;
  id: string;
  full?: boolean;
}) {
  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center gap-0.5 rounded-xl bg-muted/60 p-1 shadow-[inset_0_0_0_1px_var(--border)]",
        full && "flex w-full",
      )}
    >
      {options.map((o) => {
        const on = o === value;
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            aria-pressed={on}
            className={cn(
              "relative rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors duration-300",
              full && "flex-1",
              on ? "text-white" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {on && (
              <motion.span
                layoutId={`toggle-${id}`}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className="absolute inset-0 -z-10 rounded-lg plasma-fill"
              />
            )}
            {labels?.[o] ?? o}
          </button>
        );
      })}
    </div>
  );
}

function NumberPair<T extends string>({
  label,
  value,
  onValue,
  options,
  labels,
  unit,
  onUnit,
  id,
}: {
  label: string;
  value: number;
  onValue: (n: number) => void;
  options: readonly T[];
  labels: Partial<Record<T, string>>;
  unit: T;
  onUnit: (v: T) => void;
  id: string;
}) {
  return (
    <Group label={label}>
      <div className="flex gap-1.5">
        <Input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onValue(Number(e.target.value))}
          className={cn(hudInputClass, "h-10 min-w-0 pl-3 text-[13px]")}
          aria-label={label}
        />
        <Toggle
          options={options}
          labels={labels}
          value={unit}
          onChange={onUnit}
          id={id}
        />
      </div>
    </Group>
  );
}

function Phase({
  label,
  hours,
  live,
  align = "left",
}: {
  label: string;
  hours: number;
  live?: boolean;
  align?: "left" | "center" | "right";
}) {
  return (
    <span
      className={cn(
        "block text-[10px]",
        align === "center" && "text-center",
        align === "right" && "text-right",
      )}
    >
      <span
        className={cn(
          "font-medium uppercase tracking-[0.06em]",
          live ? "text-warning" : "text-muted-foreground/60",
        )}
      >
        {label}
      </span>
      <span className="ml-1.5 font-semibold tabular-nums">
        {formatHours(hours)}
      </span>
    </span>
  );
}

function RaceBar({
  icon: Icon,
  label,
  value,
  ratio,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  ratio: number;
  tone: Tone;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
          <Icon
            className={cn(
              "size-3.5",
              tone === "plasma" ? "text-(--plasma)" : "",
            )}
          />
          {label}
        </span>
        <span className="text-[15px] font-semibold tabular-nums">{value}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
        <motion.span
          initial={{ scaleX: 0 }}
          animate={{ scaleX: Math.max(0.02, Math.min(1, ratio)) }}
          transition={{ duration: 0.9, ease: EASE_ADV }}
          className={cn(
            "block h-full origin-left rounded-full",
            tone === "plasma"
              ? "plasma-fill shadow-[0_0_16px_-4px_color-mix(in_oklab,var(--plasma)_95%,transparent)]"
              : "bg-muted-foreground/45",
          )}
        />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/40 pb-2.5 last:border-0 last:pb-0">
      <dt className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </dt>
      <dd className="text-[13px] font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
