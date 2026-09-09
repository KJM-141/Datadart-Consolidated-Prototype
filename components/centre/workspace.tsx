"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Headphones,
  LayoutGrid,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Dot, Label } from "./kit";
import { Library } from "./library";
import { OpsThread } from "./ops-thread";
import { PATHS } from "@/lib/nav";
import { PRODUCTS, productStage } from "@/lib/products";
import { estimate as priceIt, fmtRange } from "@/lib/pricing";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

/**
 * ── The workspace ─────────────────────────────────────────────────────────
 *
 * Right column. What stays true regardless of the conversation: what you can
 * order, what it costs, where the reference lives — and the humans.
 *
 * These were four routes. As four tabs beside the transcript they cost one
 * click instead of a navigation, and all four stay mounted, so a half-built
 * estimate survives a trip to the catalogue and an unanswered message to Ops
 * is still there when you come back. That persistence is the only reason a
 * docked panel beats a page.
 */

const TABS = [
  { id: "hardware", label: "Hardware", icon: LayoutGrid },
  { id: "sizer", label: "Sizer", icon: SlidersHorizontal },
  { id: "library", label: "Library", icon: BookOpen },
  { id: "ops", label: "Ops", icon: Headphones },
] as const;

export type WorkspaceTab = (typeof TABS)[number]["id"];

export function Workspace({
  tab,
  setTab,
  onAsk,
  onOpenProduct,
  onClose,
  className,
}: {
  tab: WorkspaceTab;
  setTab: (t: WorkspaceTab) => void;
  /** Hands a sentence to the assistant — the panel's way of starting a chat. */
  onAsk: (text: string) => void;
  onOpenProduct: (slug: string) => void;
  onClose?: () => void;
  className?: string;
}) {
  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-canvas/60", className)}>
      <div className="flex shrink-0 items-center gap-0.5 border-b border-hair px-2 py-2">
        {TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[11.5px] font-medium transition-colors",
                active ? "bg-accent text-ink" : "text-ink-3 hover:text-ink-2",
              )}
            >
              <t.icon className="size-3.5" />
              {t.label}
            </button>
          );
        })}

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="ml-auto grid size-7 place-items-center rounded-md text-ink-3 transition-colors hover:bg-accent hover:text-ink"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* All four stay mounted. Ops manages its own scroll because it docks a
          composer at the foot; the other three share one scrolling body. */}
      <Pane show={tab === "hardware"} scroll>
        <Hardware onOpen={onOpenProduct} />
      </Pane>
      <Pane show={tab === "sizer"} scroll>
        <QuickSizer onAsk={onAsk} />
      </Pane>
      <Pane show={tab === "library"} scroll>
        <Library onAsk={onAsk} onOpenProduct={onOpenProduct} />
      </Pane>
      <Pane show={tab === "ops"}>
        <OpsThread />
      </Pane>
    </div>
  );
}

function Pane({
  show,
  scroll = false,
  children,
}: {
  show: boolean;
  scroll?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "min-h-0 flex-1",
        scroll && "overflow-y-auto px-3 py-3",
        !show && "hidden",
      )}
    >
      {children}
    </div>
  );
}

/* ══════════════════════════════ Hardware ═════════════════════════════════ */

/**
 * Three products, three renders.
 *
 * The render leads and the whole card is the target — detail opens in a
 * full-screen modal rather than here, because a 23rem rail is the wrong place
 * to read a spec sheet. Availability sits on the same line as the hero figure
 * so the two things you decide on are one glance apart.
 */
function Hardware({ onOpen }: { onOpen: (slug: string) => void }) {
  const cart = useAppStore((s) => s.cart);

  return (
    <>
      <div className="space-y-2">
        {PRODUCTS.map((p) => {
          const picked = cart
            .filter((c) => c.productSlug === p.slug)
            .reduce((n, c) => n + c.qty, 0);

          return (
            <button
              key={p.slug}
              type="button"
              onClick={() => onOpen(p.slug)}
              className="group block w-full overflow-hidden rounded-lg bg-elev text-left ring-1 ring-inset ring-hair transition-colors hover:ring-[color-mix(in_oklab,var(--plasma)_42%,transparent)]"
            >
              <div
                className={cn(
                  "relative flex h-28 items-center justify-center p-3",
                  productStage(p),
                )}
              >
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  sizes="320px"
                  className="object-contain p-3 transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>

              <div className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[12.5px] font-medium">
                    {p.name}
                  </span>
                  {picked > 0 && (
                    <span className="shrink-0 rounded px-1.5 text-[9.5px] tabular-nums text-(--plasma) ring-1 ring-inset ring-[color-mix(in_oklab,var(--plasma)_40%,transparent)]">
                      {picked}
                    </span>
                  )}
                  <ArrowUpRight className="ml-auto size-3 shrink-0 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </div>

                <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-ink-3">
                  {p.tagline}
                </p>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1.5 text-[10px] text-ink-3">
                    <Dot tone={p.availability.state === "available" ? "ok" : "warn"} />
                    <span className="truncate">{p.availability.headline}</span>
                  </span>
                  <span className="shrink-0 text-[10px] tabular-nums text-ink-3">
                    {p.hero.value}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <Foot href={PATHS.hardware}>Full catalogue</Foot>
    </>
  );
}

/* ════════════════════════════════ Sizer ══════════════════════════════════ */

const SERVICE = ["Self-managed", "White Glove"] as const;

/**
 * Two inputs, one number.
 *
 * The full sizer has a dozen controls and still lives at `/customer/sizer`.
 * What belongs beside a conversation is the ballpark you would otherwise have
 * to ask for, so this exposes only the two variables that actually move it and
 * hands the result to the assistant rather than pretending to be a quote.
 */
function QuickSizer({ onAsk }: { onAsk: (text: string) => void }) {
  const [sizeTB, setSizeTB] = useState(500);
  const [service, setService] = useState<(typeof SERVICE)[number]>("Self-managed");

  const est = useMemo(
    () => priceIt({ sizeTB, serviceLevel: service }),
    [sizeTB, service],
  );

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="centre-size" className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-3">
            Volume
          </label>
          <span className="font-mono text-[12px] tabular-nums">
            {sizeTB.toLocaleString()} TB
          </span>
        </div>
        <input
          id="centre-size"
          type="range"
          min={10}
          max={5000}
          step={10}
          value={sizeTB}
          onChange={(e) => setSizeTB(Number(e.target.value))}
          className="mt-2.5 w-full accent-(--plasma)"
        />
      </div>

      <div>
        <Label className="mb-2">Service</Label>
        <div className="flex gap-1">
          {SERVICE.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setService(s)}
              className={cn(
                "flex-1 rounded-md px-2 py-1.5 text-[11.5px] font-medium ring-1 ring-inset transition-colors",
                service === s
                  ? "bg-accent text-ink ring-[color-mix(in_oklab,var(--plasma)_35%,transparent)]"
                  : "text-ink-3 ring-hair hover:text-ink",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg ring-1 ring-inset ring-hair">
        <div className="px-3 py-3">
          <Label>Ballpark</Label>
          <p className="mt-1.5 text-[19px] font-semibold leading-none tabular-nums">
            {fmtRange(est)}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-px border-t border-hair bg-hair">
          {[
            ["Fleet", est.deviceLabel],
            ["Door to door", `${est.weeks} week${est.weeks === 1 ? "" : "s"}`],
            ["Over the wire", `${est.onlineMonths.toFixed(1)} months`],
            ["At", `${est.lineSpeedMbps} Mbps`],
          ].map(([k, v]) => (
            <div key={k} className="bg-elev px-3 py-2.5">
              <dt className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ink-3">
                {k}
              </dt>
              <dd className="mt-1 truncate font-mono text-[11px] tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* A text action, not a filled bar. This panel sits beside a conversation
          whose composer is the primary control; a plasma button here outshouts
          it and makes the quiet column the loud one. */}
      <button
        type="button"
        onClick={() =>
          onAsk(
            `${sizeTB} TB, ${service.toLowerCase()}, walk me through this estimate`,
          )
        }
        className="text-[12.5px] font-medium text-(--plasma) transition-colors hover:text-ink"
      >
        Take this to the assistant →
      </button>

      <Foot href={PATHS.sizer}>Full sizer</Foot>
    </div>
  );
}

/* ══════════════════════════════════ Bits ═════════════════════════════════ */

function Foot({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-3 transition-colors hover:text-(--plasma)"
    >
      {children} <ArrowUpRight className="size-3" />
    </Link>
  );
}
