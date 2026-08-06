"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  CalendarClock,
  FileSignature,
  MapPin,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { HudLabel, LiveDot, Pill } from "@/components/advanced/kit/hud";
import { needsYou, railSections, type RailSection } from "@/lib/rail-spec";
import { PATHS } from "@/lib/nav";
import { PRODUCTS, productStage } from "@/lib/products";
import { fmtUSD } from "@/lib/pricing";
import { stageIndex, STAGES } from "@/lib/lifecycle";
import type { TransferFacts } from "@/lib/types";
import { useAppStore, useMounted } from "@/lib/store";
import { bloomSoft, deckStagger } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/brand/logo-mark";

/**
 * ── The right rail ────────────────────────────────────────────────────────
 *
 * 352px, always present, and always carrying something — `railSections()`
 * brackets every route with *Needs you* and *Assistant*, so there is no
 * pathname on which this column is dead weight.
 *
 * On the hardware routes it becomes the product panel, which is the single
 * feature the Vercel app had that the deck did not: the catalogue stays beside
 * you while you work instead of being a place you navigate to.
 */
export function RightRail({ className }: { className?: string }) {
  const pathname = usePathname();
  const sections = railSections(pathname);

  return (
    <motion.aside
      variants={deckStagger(0.04, 0.06)}
      initial="hidden"
      animate="show"
      aria-label="Panel"
      className={cn("h-full flex-col overflow-y-auto bg-canvas/72", className)}
    >
      {sections.map((s) => (
        <motion.section
          key={s}
          variants={bloomSoft}
          className="border-b border-hair px-4 pb-5 pt-4 last:border-b-0"
        >
          <Section id={s} />
        </motion.section>
      ))}
    </motion.aside>
  );
}

function Section({ id }: { id: RailSection }) {
  switch (id) {
    case "needs-you":
      return <NeedsYou />;
    case "product":
      return <ProductPanel />;
    case "signals":
      return <Signals />;
    case "watchers":
      return <Watchers />;
    case "custody":
      return <Custody />;
    case "checkpoints":
      return <Checkpoints />;
    case "payments":
      return <Payments />;
    case "documents":
      return <Documents />;
    case "estimate":
      return <RateCard />;
    case "draft":
      return <Draft />;
    case "renewals":
      return <Renewals />;
    case "account":
      return <Account />;
    case "assistant":
      return <Assistant />;
  }
}

/* ══════════════════════════════ Needs you ════════════════════════════════ */

function NeedsYou() {
  const orders = useAppStore((s) => s.orders);
  const mounted = useMounted();
  const items = useMemo(() => (mounted ? needsYou(orders) : []), [orders, mounted]);

  const icon = {
    signature: FileSignature,
    payment: Wallet,
    document: ShieldCheck,
    stalled: CalendarClock,
  } as const;

  return (
    <>
      <Head label="Needs you">
        {items.length > 0 && <Pill tone="plasma">{items.length}</Pill>}
      </Head>

      {items.length === 0 ? (
        <p className="mt-3 text-[12.5px] leading-relaxed text-ink-2">
          Nothing outstanding. Every open transfer is signed, settled to its
          current stage and moving.
        </p>
      ) : (
        <ul className="mt-3 space-y-1">
          {items.slice(0, 5).map((a) => {
            const Icon = icon[a.kind];
            return (
              <li key={a.id}>
                <Link
                  href={a.href}
                  className="group flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-accent"
                >
                  <Icon
                    className={cn(
                      "mt-0.5 size-3.5 shrink-0",
                      a.blocking ? "text-(--plasma)" : "text-ink-3",
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] leading-snug">
                      {a.title}
                    </span>
                    <span className="mt-0.5 block font-mono text-[10.5px] text-ink-3">
                      {a.displayId}
                    </span>
                  </span>
                  <ArrowUpRight className="mt-0.5 size-3 shrink-0 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

/* ═════════════════════════════ Product panel ═════════════════════════════ */

/**
 * The catalogue, docked. This is the Vercel app's contribution to the blend:
 * hardware stays beside you while you size, price and check out, instead of
 * being somewhere you have to go.
 */
function ProductPanel() {
  const addToCart = useAppStore((s) => s.addToCart);

  return (
    <>
      <Head label="Hardware">
        <Link href={PATHS.hardware} className="text-[11px] text-(--plasma) hover:underline">
          All
        </Link>
      </Head>

      <ul className="mt-3 space-y-2">
        {PRODUCTS.map((p) => {
          const capacity = p.capacities?.[p.capacities.length - 1];
          return (
            <li
              key={p.slug}
              className={cn("rounded-lg p-2.5 ring-1 ring-inset ring-hair", productStage(p))}
            >
              <div className="flex items-start gap-3">
                {/* The hardware, actually shown. A catalogue of names is a list;
                    a catalogue with the objects on it is a catalogue. */}
                <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-sunk ring-1 ring-inset ring-hair">
                  <Image
                    src={p.image}
                    alt=""
                    fill
                    sizes="44px"
                    className="object-contain p-1"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={PATHS.product(p.slug)}
                    className="block truncate text-[13px] font-medium hover:text-(--plasma)"
                  >
                    {p.name}
                  </Link>
                  <p className="mt-0.5 font-mono text-[10.5px] leading-snug text-ink-3">
                    {p.chips[0]} · {p.chips[1]}
                  </p>
                </div>
              </div>

              {capacity && (
                <button
                  type="button"
                  onClick={() =>
                    addToCart({
                      productSlug: p.slug,
                      model: p.model,
                      detail: `${capacity} TB`,
                      capacityTB: capacity,
                      qty: 1,
                      monthlyRate: p.monthlyCost,
                      image: p.image,
                    })
                  }
                  className="mt-2.5 w-full rounded-md bg-sunk py-1.5 text-[11.5px] font-medium text-ink-2 ring-1 ring-inset ring-hair transition-colors hover:text-ink hover:ring-[color-mix(in_oklab,var(--plasma)_36%,transparent)]"
                >
                  Add {capacity} TB to plan
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

/* ═══════════════════════════════ Operations ══════════════════════════════ */

function Signals() {
  const orders = useAppStore((s) => s.orders);
  const mounted = useMounted();
  const live = mounted ? orders.filter((o) => !o.closed) : [];

  return (
    <>
      <Head label="Signals">
        <Pill tone="cyo">
          <LiveDot /> live
        </Pill>
      </Head>
      <ul className="mt-3 space-y-2.5">
        {live.map((o) => (
          <li key={o.displayId}>
            <Link href={PATHS.transfer(o.displayId)} className="group block">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-[11px] text-ink-3">{o.displayId}</span>
                <span className="font-mono text-[11px] tabular-nums">
                  {o.volumeTB.toLocaleString()} TB
                </span>
              </div>
              <p className="mt-0.5 flex items-center gap-1.5 truncate text-[12px] text-ink-2 transition-colors group-hover:text-ink">
                <MapPin className="size-3 shrink-0 text-ink-3" />
                {o.source.label} → {o.destination.label}
              </p>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-sunk">
                <span
                  className="block h-full rounded-full plasma-fill"
                  style={{
                    width: `${((stageIndex(o.stage) + 1) / STAGES.length) * 100}%`,
                  }}
                />
              </div>
            </Link>
          </li>
        ))}
        {live.length === 0 && <Empty>No transfers in flight.</Empty>}
      </ul>
    </>
  );
}

function Watchers() {
  return (
    <>
      <Head label="Standing triggers" />
      <ul className="mt-3 space-y-2 text-[12.5px] text-ink-2">
        {[
          ["Temperature", "above 28 °C"],
          ["Shock", "above 4 g"],
          ["Custody", "any unscheduled handoff"],
        ].map(([what, when]) => (
          <li key={what} className="flex items-baseline justify-between gap-3">
            <span className="text-ink">{what}</span>
            <span className="font-mono text-[11px] text-ink-3">{when}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11.5px] leading-relaxed text-ink-3">
        Fires to email and in-app the moment a threshold is crossed.
      </p>
    </>
  );
}

/* ═══════════════════════════ Transfer-scoped ═════════════════════════════ */

/** The order the current route is about, if the pathname names one. */
function useRouteOrder() {
  const pathname = usePathname();
  const orders = useAppStore((s) => s.orders);
  const id = pathname.split("/").filter(Boolean).pop();
  return orders.find((o) => o.displayId === id);
}

function Custody() {
  const order = useRouteOrder();
  return (
    <>
      <Head label="Chain of custody" />
      {order ? (
        <ol className="mt-3 space-y-2">
          {order.stageHistory.slice(-4).map((e, i) => (
            <li key={i} className="flex items-baseline gap-2.5">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full plasma-fill" />
              <span className="min-w-0 flex-1">
                <span className="block text-[12.5px]">{e.stage}</span>
                <span className="font-mono text-[10.5px] text-ink-3">
                  {e.at.slice(0, 10)} · {e.owner}
                </span>
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <Empty>Open a transfer to see its custody log.</Empty>
      )}
    </>
  );
}

function Checkpoints() {
  const order = useRouteOrder();
  const at = order ? stageIndex(order.stage) : -1;
  return (
    <>
      <Head label="Checkpoints" />
      {order ? (
        <ol className="mt-3 space-y-1.5">
          {STAGES.map((s, i) => (
            <li key={s} className="flex items-center gap-2.5 text-[12px]">
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  i < at ? "plasma-fill" : i === at ? "bg-(--cyo)" : "bg-hair",
                )}
              />
              <span className={i <= at ? "text-ink" : "text-ink-3"}>{s}</span>
            </li>
          ))}
        </ol>
      ) : (
        <Empty>No transfer selected.</Empty>
      )}
    </>
  );
}

function Payments() {
  const order = useRouteOrder();
  return (
    <>
      <Head label="Payment milestones" />
      {order ? (
        <ul className="mt-3 space-y-2">
          {order.payments.map((p) => (
            <li key={p.label} className="flex items-baseline justify-between gap-3">
              <span className="text-[12.5px] text-ink-2">{p.label}</span>
              <span
                className={cn(
                  "font-mono text-[12px] tabular-nums",
                  p.status === "paid" ? "text-ok" : p.status === "due" ? "text-(--plasma)" : "text-ink-3",
                )}
              >
                {fmtUSD(p.amount)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>No transfer selected.</Empty>
      )}
    </>
  );
}

function Documents() {
  const order = useRouteOrder();
  return (
    <>
      <Head label="Documents & certificates" />
      {order ? (
        <ul className="mt-3 space-y-1.5">
          {order.documents.map((d) => (
            <li key={d.type} className="flex items-baseline justify-between gap-3">
              <span className="text-[12.5px] text-ink-2">{d.type}</span>
              <span className="font-mono text-[10.5px] uppercase tracking-[0.1em] text-ink-3">
                {d.status === "available" ? "ready" : d.status}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>No transfer selected.</Empty>
      )}
    </>
  );
}

/* ═════════════════════════════════ Other ═════════════════════════════════ */

function RateCard() {
  return (
    <>
      <Head label="Rate card" />
      <ul className="mt-3 space-y-1.5 text-[12.5px]">
        {[
          ["Device rental", "capacity × duration"],
          ["Protection", "per device"],
          ["DT2 port-hours", "real egress hours"],
          ["Logistics", "round trip, by lane"],
        ].map(([k, v]) => (
          <li key={k} className="flex items-baseline justify-between gap-3">
            <span className="text-ink-2">{k}</span>
            <span className="font-mono text-[11px] text-ink-3">{v}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11.5px] leading-relaxed text-ink-3">
        A range is quoted so there are no surprises at proposal.
      </p>
    </>
  );
}

/**
 * Written out rather than derived from the key.
 *
 * The previous version split on capitals and lower-cased the result, which
 * turned `sizeTB` into "size t b" and then — via `capitalize` — into
 * "Size T B". Any mechanical humaniser breaks on the initialisms this domain
 * is full of (TB, SLA, DPU), and there are seven keys.
 */
const FACT_LABELS: Record<keyof TransferFacts, string> = {
  sizeTB: "Size",
  sourceType: "Source type",
  sourceLocation: "From",
  destination: "To",
  timeline: "Timeline",
  serviceLevel: "Service level",
  compliance: "Compliance",
};

function Draft() {
  const conversations = useAppStore((s) => s.conversations);
  const mounted = useMounted();
  const live = mounted ? conversations[0] : undefined;

  return (
    <>
      <Head label="What is moving" />
      {live ? (
        <ul className="mt-3 space-y-1.5 text-[12.5px]">
          {Object.entries(live.facts)
            .filter(([k, v]) => v !== undefined && v !== "" && k in FACT_LABELS)
            .map(([k, v]) => (
              <li key={k} className="flex items-baseline justify-between gap-3">
                <span className="text-ink-2">
                  {FACT_LABELS[k as keyof TransferFacts]}
                </span>
                <span className="truncate font-mono text-[11px]">
                  {k === "sizeTB" ? `${v} TB` : String(v)}
                </span>
              </li>
            ))}
        </ul>
      ) : (
        <Empty>Nothing captured yet. Describe a transfer to begin.</Empty>
      )}
    </>
  );
}

function Renewals() {
  const subs = useAppStore((s) => s.subscriptions);
  const mounted = useMounted();
  const open = mounted ? subs.filter((s) => s.status !== "Closed") : [];

  return (
    <>
      <Head label="Upcoming" />
      {open.length ? (
        <ul className="mt-3 space-y-2">
          {open.map((s) => (
            <li key={s.id} className="flex items-baseline justify-between gap-3">
              <span className="font-mono text-[11px] text-ink-3">{s.id}</span>
              <span className="font-mono text-[11.5px] tabular-nums">{s.endDate}</span>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>No active rentals.</Empty>
      )}
    </>
  );
}

function Account() {
  const profile = useAppStore((s) => s.profile);
  const mounted = useMounted();
  return (
    <>
      <Head label="Account" />
      {mounted && (
        <ul className="mt-3 space-y-1.5 text-[12.5px]">
          <Row k="Name" v={`${profile.firstName} ${profile.lastName}`} />
          <Row k="Email" v={profile.email} />
          <Row k="Region" v={profile.address.country || "—"} />
        </ul>
      )}
    </>
  );
}

function Assistant() {
  return (
    <>
      <Head label="Assistant">
        <LogoMark size={15} />
      </Head>
      <p className="mt-3 text-[12.5px] leading-relaxed text-ink-2">
        Ask about a transfer, or say what you need moved and where.
      </p>
      <Link
        href={PATHS.start}
        className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-(--plasma) hover:underline"
      >
        Plan a new transfer <ArrowUpRight className="size-3.5" />
      </Link>
    </>
  );
}

/* ══════════════════════════════════ Bits ═════════════════════════════════ */

/**
 * A section header, banded.
 *
 * The rail previously separated its sections with a hairline and nothing else,
 * so eight stacked panels read as one long undifferentiated column. A sunk band
 * bled to both edges gives each section a lid — the same device a table header
 * uses, and for the same reason.
 */
function Head({ label, children }: { label: string; children?: React.ReactNode }) {
  return (
    <div className="-mx-4 -mt-4 mb-3.5 flex items-center justify-between gap-2 border-b border-hair bg-sunk/70 px-4 py-2.5">
      <HudLabel>{label}</HudLabel>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-[12px] leading-relaxed text-ink-3">{children}</p>;
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <li className="flex items-baseline justify-between gap-3">
      <span className="text-ink-2">{k}</span>
      <span className="truncate font-mono text-[11px]">{v}</span>
    </li>
  );
}
