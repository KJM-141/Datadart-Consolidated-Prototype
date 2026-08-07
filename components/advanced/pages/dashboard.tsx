"use client";

import Link from "next/link";
import { AnimatePresence, motion, type Variants } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
} from "lucide-react";
import { format } from "date-fns";
import { GettingStarted } from "@/components/advanced/pages/getting-started";
import { MapLegend } from "@/components/brand/map-legend";
import { Segmented } from "@/components/shared/segmented";
import { RoutePanel } from "@/components/console/map-panel";
import { HoloPanel, PanelHead } from "@/components/advanced/kit/holo-panel";
import {
  Eyebrow,
  HudLabel,
  LiveDot,
  MetricRing,
  Pill,
} from "@/components/advanced/kit/hud";
import { Counter } from "@/components/advanced/kit/text";
import { StageBar } from "@/components/advanced/kit/stage-spine";
import { STAGE_BLURB, STAGES, stageIndex } from "@/lib/lifecycle";
import { fmtUSD } from "@/lib/pricing";
import { PATHS } from "@/lib/nav";
import { useAppStore, useMounted, type DashboardView } from "@/lib/store";
import { ordersToRoutes } from "@/lib/routes";
import { DEMO_ACTIVITY } from "@/lib/demo-data";
import { bloomSoft, deckStagger, EASE_ADV, useSafeReducedMotion } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

const VIEWS = ["guided", "dashboard"] as const;
const VIEW_LABELS: Record<DashboardView, string> = {
  guided: "Get started",
  dashboard: "Dashboard",
};

/**
 * Variant *labels*, not style objects.
 *
 * `HoloPanel` carries `variants={bloom}` with no `animate` of its own, so it
 * takes its state from the nearest ancestor that names one. A wrapper animating
 * with plain objects halts that propagation: every panel resolved to
 * `bloom.hidden` — opacity 0 — and had nothing to tell it to advance. The
 * dashboard rendered fine on first paint and then vanished the moment you
 * switched away and back, because only a remount re-applies `initial`.
 */
const pane: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.26,
      ease: EASE_ADV,
      staggerChildren: 0.055,
      delayChildren: 0.04,
    },
  },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18, ease: EASE_ADV } },
};

/**
 * The overview route — two surfaces behind one toggle.
 *
 * *Dashboard* is Mission Control: identical inputs to the Normal overview (same
 * store selectors, same derived figures, same destinations) presented as an
 * instrument panel — gauge pods, a scanning atlas, a lifecycle spine and a
 * beam-linked activity timeline.
 *
 * *Get started* is the same product explained rather than instrumented, for
 * someone who has not used it before. An instrument panel tells you nothing
 * until you know what the instruments are for, and a brand-new account sees a
 * dashboard of someone else's demo data either way.
 *
 * The choice is manual and it persists. Deriving it from "has no orders" would
 * make the tour unreachable the moment a single order exists, which in a
 * prototype seeded with three of them means never.
 */
export function DashboardAdvanced() {
  const profile = useAppStore((s) => s.profile);
  const view = useAppStore((s) => s.dashboardView);
  const setDashboardView = useAppStore((s) => s.setDashboardView);
  const mounted = useMounted();

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Persisted state is not available during SSR, so the first paint is always
  // the default view; the toggle settles once the store rehydrates.
  const active: DashboardView = mounted ? view : "dashboard";

  return (
    <motion.div
      variants={deckStagger(0.055, 0.04)}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      {/* ══ Greeting ══════════════════════════════════════════════════ */}
      <motion.section variants={bloomSoft} className="relative">
        {/*
          Suppressed in the guided view, which opens on a greeting of its own.
          Two "Good afternoon, Demo" on one screen is the kind of thing nobody
          reports and everybody notices — and the conversation wants the vertical
          room more than the page furniture does.
        */}
        {active === "dashboard" && (
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div className="min-w-0">
              <Eyebrow>{format(new Date(), "EEEE, d MMMM yyyy")}</Eyebrow>
              <h1 className="mt-2.5 text-[1.75rem] font-semibold leading-[1.12] sm:text-[2.125rem]">
                {greeting}
                {mounted && profile.firstName ? `, ${profile.firstName}` : ""}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={PATHS.start}
                className="btn-plasma group inline-flex h-10 items-center gap-2 px-5 text-[13px] font-medium text-white"
              >
                Start a conversation
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href={PATHS.sizer}
                className="btn-ghost-hud inline-flex h-10 items-center px-5 text-[13px] font-medium"
              >
                Get an estimate
              </Link>
            </div>
          </div>
        )}

        <div className={cn("border-b border-hair pb-3", active === "dashboard" && "mt-5")}>
          <Segmented
            options={VIEWS}
            value={active}
            onChange={setDashboardView}
            labels={VIEW_LABELS}
            size="sm"
            aria-label="Overview layout"
          />
        </div>
      </motion.section>

      <AnimatePresence mode="wait" initial={false}>
        {active === "guided" ? (
          <motion.div
            key="guided"
            variants={pane}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <GettingStarted />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            variants={pane}
            initial="hidden"
            animate="show"
            exit="exit"
            className="space-y-4"
          >
            <DashboardBody />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Mission Control ────────────────────────────────────────────────────── */

function DashboardBody() {
  const orders = useAppStore((s) => s.orders);
  const reduce = useSafeReducedMotion();

  const active = orders.filter((o) => !o.closed);
  const routes = ordersToRoutes(active).slice(0, 5);
  const focus =
    active.find((o) => o.stage === "Shipment") ??
    active.find((o) => o.stage === "Data Load") ??
    active[0];

  return (
    <>
      {/* ══ Atlas + focus ═════════════════════════════════════════════ */}
      <div className="grid gap-3 sm:gap-4 xl:grid-cols-12">
        {/* atlas */}
        {/* flex-col so the atlas absorbs the height the taller focus column
            forces on it, instead of centring a fixed-height map inside it and
            leaving a band of nothing above the legend. */}
        <HoloPanel
          scan
          className="flex flex-col overflow-hidden p-0 xl:col-span-8"
          variant="glass"
        >
          <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-5">
            <div className="min-w-0">
              <HudLabel className="mb-1.5">Network</HudLabel>
              <h2 className="flex items-center gap-2.5 text-[15px] font-semibold leading-snug">
                Live transfer routes
                <Pill tone="cyo" className="gap-1.5">
                  <LiveDot tone="cyo" />
                  {routes.length} active
                </Pill>
              </h2>
            </div>
            <Link
              href={PATHS.transfers}
              className="inline-flex shrink-0 items-center gap-1 text-[12px] font-medium text-(--plasma) transition-opacity hover:opacity-75 coarse:min-h-11"
            >
              View orders <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          <div className="relative min-h-0 flex-1 px-3 pb-3">
            <RoutePanel routes={routes} height={300} className="h-full" />
          </div>

          <MapLegend className="shrink-0 border-t border-hair px-5 py-3" />
        </HoloPanel>

        {/* focus capsule */}
        <HoloPanel live className="flex flex-col p-5 xl:col-span-4">
          {focus ? (
            <>
              <PanelHead
                label="In focus"
                title={focus.displayId}
                action={
                  <Pill tone={focus.closed ? "muted" : "warning"}>
                    {focus.stage}
                  </Pill>
                }
              />

              <p className="mt-3 text-[13px] font-medium">
                {focus.source.label}
                <span className="mx-1.5 text-(--plasma)">→</span>
                {focus.destination.label}
              </p>

              <div className="mt-4 flex items-center gap-4">
                <MetricRing
                  id="focus"
                  value={(stageIndex(focus.stage) + 1) / STAGES.length}
                  size={78}
                  stroke={6}
                >
                  <span className="text-center">
                    <span className="block text-lg font-semibold leading-none tabular-nums">
                      {stageIndex(focus.stage) + 1}
                    </span>
                    <span className="mt-0.5 block text-[9px] font-medium text-muted-foreground">
                      of {STAGES.length}
                    </span>
                  </span>
                </MetricRing>
                <div className="min-w-0 flex-1">
                  <p className="text-[26px] font-semibold leading-none tracking-tight">
                    <Counter value={focus.volumeTB} suffix=" TB" />
                  </p>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                    {STAGE_BLURB[focus.stage]}
                  </p>
                </div>
              </div>

              {/* Segments, not ten nodes — at card width the node spine reads
                  as a row of checkboxes competing with the figures above it. */}
              <div className="mt-5">
                <StageBar stage={focus.stage} closed={focus.closed} />
              </div>

              {focus.stage === "Data Load" && (
                <div className="mt-4">
                  <div className="flex items-baseline justify-between">
                    <HudLabel>Copy progress</HudLabel>
                    <span className="text-[13px] font-semibold tabular-nums">
                      <Counter value={focus.progress} suffix="%" />
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="relative h-full rounded-full plasma-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${focus.progress}%` }}
                      transition={{ duration: 1.1, ease: EASE_ADV }}
                    >
                      {!reduce && (
                        <motion.span
                          className="absolute inset-y-0 w-8 bg-white/50 blur-sm"
                          animate={{ x: ["-100%", "400%"] }}
                          transition={{
                            duration: 2.2,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                      )}
                    </motion.div>
                  </div>
                </div>
              )}

              {/* next milestones */}
              <ul className="mt-5 space-y-2 border-t border-border/60 pt-4">
                {focus.payments
                  .filter((p) => p.status !== "paid")
                  .slice(0, 1)
                  .map((p) => (
                    <li
                      key={p.label}
                      className="flex items-center justify-between gap-2 text-[12px]"
                    >
                      <span className="text-muted-foreground">{p.label}</span>
                      <span className="font-semibold tabular-nums text-(--plasma)">
                        {fmtUSD(p.amount)}
                      </span>
                    </li>
                  ))}
                {focus.documents
                  .filter((d) => d.status === "pending")
                  .slice(0, 2)
                  .map((d) => (
                    <li
                      key={d.type}
                      className="flex items-center justify-between gap-2 text-[12px]"
                    >
                      <span className="truncate text-muted-foreground">
                        {d.type}
                      </span>
                      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">
                        at {d.availableAtStage}
                      </span>
                    </li>
                  ))}
              </ul>

              <Link
                href={PATHS.transfer(focus.displayId)}
                className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[13px] font-medium text-(--plasma) hover:underline"
              >
                Track this transfer <ArrowUpRight className="size-3.5" />
              </Link>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center py-10 text-center">
              <HudLabel>In focus</HudLabel>
              <p className="mt-3 text-sm text-muted-foreground">
                No active transfers. Raise an order to get moving.
              </p>
            </div>
          )}
        </HoloPanel>
      </div>

      {/* ══ Timeline + hardware + resources ═══════════════════════════ */}
      <div className="grid gap-3 sm:gap-4 xl:grid-cols-12">
        {/* activity timeline */}
        <HoloPanel className="p-5 xl:col-span-8">
          <PanelHead label="Activity" title="Recent activity" />
          <ol className="relative mt-4 space-y-4 pl-5">
            <span
              aria-hidden
              className="absolute bottom-2 left-[5px] top-2 w-px bg-[linear-gradient(180deg,color-mix(in_oklab,var(--plasma)_60%,transparent),transparent)]"
            />
            {DEMO_ACTIVITY.map((a, i) => (
              <motion.li
                key={a.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: EASE_ADV, delay: 0.1 + i * 0.06 }}
                className="relative"
              >
                <span className="absolute -left-5 top-1.5 grid size-2.5 place-items-center">
                  {a.status === "transit" && !reduce && (
                    <span className="adv-ping absolute inset-0 rounded-full bg-(--ion)" />
                  )}
                  <span
                    className={cn(
                      "relative size-2.5 rounded-full ring-2 ring-card",
                      a.status === "transit" && "bg-(--ion)",
                      a.status === "success" && "bg-success",
                      a.status === "info" && "bg-(--plasma)",
                      a.status === "warning" && "bg-warning",
                    )}
                  />
                </span>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold">{a.title}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {a.detail}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">
                    {a.when}
                  </span>
                </div>
              </motion.li>
            ))}
          </ol>
        </HoloPanel>


        {/* Resources. Previously a full plasma-filled block, which made a
            secondary link the loudest object on a page whose job is calm
            reporting. Same panel as everything else now; the accent is one
            glyph and one link. */}
        <HoloPanel className="flex flex-col p-5 xl:col-span-4">
          <PanelHead label="Library" title="Resources & FAQ" />
          <p className="mt-2 text-[12.5px] leading-relaxed text-muted-foreground">
            Datasheets, whitepapers, blogs and videos — everything in one place.
          </p>
          <Link
            href={PATHS.resources}
            className="mt-auto inline-flex items-center gap-1.5 pt-5 text-[13px] font-medium text-(--plasma) transition-colors hover:text-foreground coarse:min-h-11"
          >
            <BookOpen className="size-4" />
            Open hub <ArrowRight className="size-3.5" />
          </Link>
        </HoloPanel>
      </div>
    </>
  );
}
