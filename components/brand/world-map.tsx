"use client";

import { useId, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Maximize2 } from "lucide-react";
import worldGeo from "@/lib/world-geo.json";
import { MAP, arcPath, project } from "@/lib/map-projection";
import { ENDPOINT_STYLE, ROUTE_STYLE, type Emphasis } from "@/lib/map-style";
import { MapDialog } from "./map-dialog";
import { cn } from "@/lib/utils";
import { useSafeReducedMotion } from "@/lib/advanced-motion";

export interface MapRoute {
  id: string;
  from: [number, number]; // [lat, lon]
  to: [number, number];
  fromLabel?: string;
  toLabel?: string;
  emphasis?: "high" | "mid" | "low";
}

const { W, H, LAT_TOP, LAT_BOTTOM } = MAP;
const { land: LAND, borders: BORDERS } = worldGeo;

/**
 * Live global-transfer map rendered from real Natural Earth country geometry —
 * filled continents, country borders and a faint graticule — with animated
 * great-circle route arcs + traveling packets between projected city
 * coordinates. Land + borders ship as two baked <path> strings (~88 KB), so the
 * whole map is a handful of DOM nodes.
 */
export function WorldMap({
  routes,
  className,
  labelMode = "all",
  compact = false,
  expandable = false,
  fill = false,
}: {
  routes: MapRoute[];
  className?: string;
  labelMode?: "all" | "active" | "none";
  compact?: boolean;
  /** Show an expand affordance that opens the full explorable pan/zoom map. */
  expandable?: boolean;
  /**
   * Cover the container instead of fitting inside it.
   *
   * The default letterboxes — correct in a panel, where the whole projection
   * should be visible. `fill` crops to the viewport instead, which is what a
   * full-bleed backdrop needs, and drops the panel chrome (radius, ring, its
   * own background) so it can sit under other content.
   */
  fill?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const reduce = useSafeReducedMotion();
  const [expanded, setExpanded] = useState(false);

  // Graticule (every 30° lon, 20° lat), clipped to the map bounds.
  const graticule = useMemo(() => {
    const lines: string[] = [];
    for (let lon = -150; lon <= 150; lon += 30) {
      const x = ((lon + 180) / 360) * W;
      lines.push(`M ${x.toFixed(1)} 0 V ${H}`);
    }
    for (let lat = LAT_TOP - 20; lat > LAT_BOTTOM; lat -= 20) {
      const y = ((LAT_TOP - lat) / (LAT_TOP - LAT_BOTTOM)) * H;
      lines.push(`M 0 ${y.toFixed(1)} H ${W}`);
    }
    return lines.join(" ");
  }, []);

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        fill ? "size-full" : "rounded-2xl ring-1 ring-white/5",
        className,
      )}
      style={
        fill
          ? undefined
          : {
              background:
                "radial-gradient(120% 130% at 50% 8%, #12122a 0%, #0a0a1a 55%, #070713 100%)",
            }
      }
    >
      {/* Ambient brand glows. Panel dressing only — a full-bleed map sits on a
          stage that brings its own light. */}
      {!fill && (
        <>
          <div
            aria-hidden
            className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#7b2ff7] opacity-20 blur-[90px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-[#2f6bff] opacity-20 blur-[90px]"
          />
        </>
      )}

      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio={fill ? "xMidYMid meet" : undefined}
        className={cn("relative", fill ? "size-full" : "h-auto w-full")}
        role="img"
        aria-label="Live global transfer routes on a world map"
      >
        <defs>
          <linearGradient id={`route-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#9d5cff" />
            <stop offset="100%" stopColor="#5c8dff" />
          </linearGradient>
          <linearGradient id={`land-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#26264a" />
            <stop offset="100%" stopColor="#1c1c3a" />
          </linearGradient>
          <radialGradient id={`glow-${uid}`}>
            <stop offset="0%" stopColor="#c9bfff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#c9bfff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* graticule */}
        <path d={graticule} stroke="#ffffff" strokeOpacity="0.055" strokeWidth="0.7" fill="none" />

        {/* Real country geometry. Borders carry more weight than they used to —
            at 0.5 opacity the continents read as one undifferentiated mass, and
            "which country is that lane landing in" is the question the map
            exists to answer. */}
        <path d={LAND} fill={`url(#land-${uid})`} stroke="none" />
        <path
          d={BORDERS}
          fill="none"
          stroke="#5f5f9e"
          strokeOpacity="0.78"
          strokeWidth={compact ? 0.6 : 0.75}
        />

        {routes.map((r, i) => {
          const d = arcPath(r.from, r.to);
          const [fx, fy] = project(r.from);
          const [tx, ty] = project(r.to);
          const emph: Emphasis = r.emphasis ?? "mid";
          const style = ROUTE_STYLE[emph];
          const stroke = style.gradient ? `url(#route-${uid})` : style.color;
          const active = emph === "high";

          return (
            <g key={r.id}>
              {/* Casing: a dark, slightly wider stroke under the lane so it
                  stays readable where it crosses a landmass. */}
              <path
                d={d}
                fill="none"
                stroke={ENDPOINT_STYLE.halo}
                strokeOpacity={0.55}
                strokeWidth={style.width + 1.6}
                strokeLinecap="round"
              />
              <motion.path
                d={d}
                fill="none"
                stroke={stroke}
                strokeOpacity={style.opacity}
                strokeWidth={style.width}
                strokeLinecap="round"
                strokeDasharray={style.dash}
                initial={reduce ? undefined : { pathLength: 0, opacity: 0 }}
                animate={reduce ? undefined : { pathLength: 1, opacity: style.opacity }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.15 * i }}
                className={active && !reduce ? "route-dash" : undefined}
              />
              {style.packet && !reduce && (
                <circle r={style.packet.r} fill="#fff">
                  <animateMotion
                    dur={`${style.packet.seconds}s`}
                    repeatCount="indefinite"
                    path={d}
                  />
                </circle>
              )}

              <Endpoint x={fx} y={fy} uid={uid} active={active} reduce={!!reduce} />
              <Endpoint x={tx} y={ty} uid={uid} active={active} reduce={!!reduce} delay={1} />

              {(labelMode === "all" || (labelMode === "active" && active)) && (
                <>
                  <MapLabel x={fx} y={fy} text={r.fromLabel} active={active} />
                  <MapLabel x={tx} y={ty} text={r.toLabel} active={active} place="below" />
                </>
              )}
            </g>
          );
        })}
      </svg>

      {expandable && (
        <>
          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label="Expand map"
            className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur transition-colors hover:bg-black/55 coarse:py-3"
          >
            <Maximize2 className="size-3.5" /> Expand
          </button>
          <MapDialog routes={routes} open={expanded} onOpenChange={setExpanded} />
        </>
      )}
    </div>
  );
}

function Endpoint({
  x,
  y,
  uid,
  active,
  reduce,
  delay = 0,
}: {
  x: number;
  y: number;
  uid: string;
  active: boolean;
  reduce: boolean;
  delay?: number;
}) {
  return (
    <g>
      {active && (
        <circle cx={x} cy={y} r="9" fill={`url(#glow-${uid})`}>
          {!reduce && (
            <animate
              attributeName="r"
              values="5;13;5"
              dur="2.4s"
              begin={`${delay * 1.1}s`}
              repeatCount="indefinite"
            />
          )}
        </circle>
      )}
      {/* Keyline first, node on top: a 1px ring is the difference between a
          city marker and a speck of noise on the coastline behind it. */}
      <circle
        cx={x}
        cy={y}
        r={(active ? ENDPOINT_STYLE.active.r : ENDPOINT_STYLE.idle.r) + 0.9}
        fill={ENDPOINT_STYLE.halo}
        fillOpacity={0.75}
      />
      <circle
        cx={x}
        cy={y}
        r={active ? ENDPOINT_STYLE.active.r : ENDPOINT_STYLE.idle.r}
        fill={active ? ENDPOINT_STYLE.active.fill : ENDPOINT_STYLE.idle.fill}
        stroke={active ? "#fff" : "#c9c9ec"}
        strokeOpacity={active ? 0.9 : 0.45}
        strokeWidth="0.7"
      />
    </g>
  );
}

function MapLabel({
  x,
  y,
  text,
  active,
  place = "above",
}: {
  x: number;
  y: number;
  text?: string;
  active: boolean;
  place?: "above" | "below";
}) {
  if (!text) return null;
  const ly = place === "above" ? y - 11 : y + 17;
  const w = text.length * 4.9 + 12;
  return (
    <g className="select-none">
      <rect x={x - w / 2} y={ly - 8} width={w} height={13} rx={6.5} fill="#0b0b1c" opacity={0.78} />
      <text
        x={x}
        y={ly + 1.5}
        textAnchor="middle"
        fontSize="8.5"
        fontWeight={active ? 600 : 500}
        fill={active ? "#e6e0ff" : "#b9b9e0"}
      >
        {text}
      </text>
    </g>
  );
}
