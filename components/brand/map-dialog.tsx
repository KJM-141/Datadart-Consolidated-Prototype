"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {  } from "motion/react";
import { Minus, Plus, RotateCcw, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { MAP, arcPath, emphasisAlpha, project } from "@/lib/map-projection";
import type { MapRoute } from "./world-map";
import { cn } from "@/lib/utils";
import { useSafeReducedMotion } from "@/lib/advanced-motion";

const { W, H } = MAP;

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
const FULL: Box = { x: 0, y: 0, w: W, h: H };
const MIN_W = W / 7; // max zoom ≈ 7×

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

function clampBox(b: Box): Box {
  const w = clamp(b.w, MIN_W, W);
  const h = w * (H / W);
  const x = clamp(b.x, -W * 0.08, W - w + W * 0.08);
  const y = clamp(b.y, -H * 0.12, H - h + H * 0.12);
  return { x, y, w, h };
}

/**
 * Full-screen explorable world map: high-detail 50m geometry (lazy-loaded),
 * drag-to-pan, wheel/buttons-to-zoom, every route labeled with city markers.
 */
export function MapDialog({
  routes,
  open,
  onOpenChange,
}: {
  routes: MapRoute[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const reduce = useSafeReducedMotion();
  const svgRef = useRef<SVGSVGElement>(null);
  const [vb, setVb] = useState<Box>(FULL);
  const [geo, setGeo] = useState<{ land: string; borders: string } | null>(null);
  const drag = useRef<{ x: number; y: number; vb: Box } | null>(null);

  // Lazy-load the detailed geometry only when the modal first opens.
  useEffect(() => {
    if (open && !geo) {
      import("@/lib/world-geo-hi.json").then((m) => {
        const g = (m.default ?? m) as { land: string; borders: string };
        setGeo({ land: g.land, borders: g.borders });
      });
    }
    if (open) setVb(FULL);
  }, [open, geo]);

  const toSvg = (clientX: number, clientY: number) => {
    const r = svgRef.current!.getBoundingClientRect();
    return {
      x: vb.x + ((clientX - r.left) / r.width) * vb.w,
      y: vb.y + ((clientY - r.top) / r.height) * vb.h,
    };
  };

  const zoomAt = (factor: number, cx?: number, cy?: number) => {
    const px = cx ?? vb.x + vb.w / 2;
    const py = cy ?? vb.y + vb.h / 2;
    const nw = clamp(vb.w * factor, MIN_W, W);
    const nh = nw * (H / W);
    const nx = px - ((px - vb.x) / vb.w) * nw;
    const ny = py - ((py - vb.y) / vb.h) * nh;
    setVb(clampBox({ x: nx, y: ny, w: nw, h: nh }));
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const p = toSvg(e.clientX, e.clientY);
    zoomAt(e.deltaY < 0 ? 0.82 : 1.22, p.x, p.y);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, vb };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const r = svgRef.current!.getBoundingClientRect();
    const dx = ((e.clientX - drag.current.x) / r.width) * drag.current.vb.w;
    const dy = ((e.clientY - drag.current.y) / r.height) * drag.current.vb.h;
    setVb(clampBox({ ...drag.current.vb, x: drag.current.vb.x - dx, y: drag.current.vb.y - dy }));
  };
  const onPointerUp = () => (drag.current = null);

  // Dedupe endpoints for clean city markers.
  const markers = useMemo(() => {
    const seen = new Map<string, { x: number; y: number; label: string; active: boolean }>();
    for (const r of routes) {
      const add = (pt: [number, number], label: string | undefined, active: boolean) => {
        if (!label) return;
        const [x, y] = project(pt);
        const key = `${x.toFixed(0)},${y.toFixed(0)}`;
        if (!seen.has(key) || active) seen.set(key, { x, y, label, active });
      };
      add(r.from, r.fromLabel, r.emphasis === "high");
      add(r.to, r.toLabel, r.emphasis === "high");
    }
    return [...seen.values()];
  }, [routes]);

  const zoomedIn = vb.w < W - 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[min(760px,92dvh)] w-[min(1160px,96vw)] max-w-none flex-col gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-none sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b px-5 py-3.5 sm:px-6">
          <div>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              Global transfer map
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                <span className="size-1.5 rounded-full bg-emerald-500 pulse-dot" /> Live
              </span>
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              {routes.length} route{routes.length === 1 ? "" : "s"} · drag to pan, scroll to zoom
            </p>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            aria-label="Close map"
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4.5" />
          </button>
        </div>

        <div className="relative min-h-0 flex-1 bg-[#070713]">
          <svg
            ref={svgRef}
            viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
            className={cn("h-full w-full touch-none", drag.current ? "cursor-grabbing" : "cursor-grab")}
            onWheel={onWheel}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            role="img"
            aria-label="Explorable world map of live transfer routes"
          >
            <defs>
              <linearGradient id="mdRoute" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#9d5cff" />
                <stop offset="100%" stopColor="#5c8dff" />
              </linearGradient>
              <linearGradient id="mdLand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#26264a" />
                <stop offset="100%" stopColor="#1a1a36" />
              </linearGradient>
              <radialGradient id="mdOcean" cx="50%" cy="18%" r="90%">
                <stop offset="0%" stopColor="#12122a" />
                <stop offset="100%" stopColor="#070713" />
              </radialGradient>
              <radialGradient id="mdGlow">
                <stop offset="0%" stopColor="#c9bfff" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#c9bfff" stopOpacity="0" />
              </radialGradient>
            </defs>

            <rect x={-W} y={-H} width={W * 3} height={H * 3} fill="url(#mdOcean)" />
            <Graticule />

            {geo ? (
              <>
                <path d={geo.land} fill="url(#mdLand)" />
                <path d={geo.borders} fill="none" stroke="#4d4d85" strokeOpacity="0.55" strokeWidth={0.4} vectorEffect="non-scaling-stroke" />
              </>
            ) : (
              <text x={W / 2} y={H / 2} textAnchor="middle" fill="#6a6a9a" fontSize="8">
                Loading map…
              </text>
            )}

            {routes.map((r) => {
              const d = arcPath(r.from, r.to);
              const emph = r.emphasis ?? "mid";
              const alpha = emphasisAlpha(emph);
              const live = emph !== "low";
              return (
                <g key={r.id}>
                  <path d={d} fill="none" stroke="url(#mdRoute)" strokeOpacity={alpha * 0.28} strokeWidth={1.6} vectorEffect="non-scaling-stroke" />
                  <path
                    d={d}
                    fill="none"
                    stroke="url(#mdRoute)"
                    strokeOpacity={alpha}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                    className={live && !reduce ? "route-dash" : undefined}
                  />
                  {live && !reduce && (
                    <circle r={2.6} fill="#fff">
                      <animateMotion dur={`${emph === "high" ? 3 : 4.4}s`} repeatCount="indefinite" path={d} />
                    </circle>
                  )}
                </g>
              );
            })}

            {markers.map((m, i) => (
              <g key={i}>
                {m.active && (
                  <circle cx={m.x} cy={m.y} r={7} fill="url(#mdGlow)">
                    {!reduce && <animate attributeName="r" values="4;10;4" dur="2.4s" repeatCount="indefinite" />}
                  </circle>
                )}
                <circle cx={m.x} cy={m.y} r={2.4} fill={m.active ? "#e6e0ff" : "#9a9ad0"} stroke="#0a0a1a" strokeWidth={0.5} vectorEffect="non-scaling-stroke" />
                <MapLabel x={m.x} y={m.y} text={m.label} active={m.active} />
              </g>
            ))}
          </svg>

          {/* zoom controls */}
          <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 rounded-full border bg-card/90 p-1 shadow-lg backdrop-blur">
            <button aria-label="Zoom in" onClick={() => zoomAt(0.7)} className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
              <Plus className="size-4" />
            </button>
            <button aria-label="Zoom out" onClick={() => zoomAt(1.4)} className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground">
              <Minus className="size-4" />
            </button>
            <button aria-label="Reset view" disabled={!zoomedIn} onClick={() => setVb(FULL)} className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-30">
              <RotateCcw className="size-3.5" />
            </button>
          </div>

          {/* legend */}
          <div className="absolute bottom-4 left-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border bg-card/90 px-3 py-2 text-[11px] shadow-lg backdrop-blur">
            <LegendDot className="bg-[#5c8dff]" label="In transit" />
            <LegendDot className="bg-indigo-400" label="In progress" />
            <LegendDot className="bg-muted-foreground" label="Requested / closed" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Graticule() {
  const lines: string[] = [];
  for (let lon = -150; lon <= 150; lon += 30) {
    const x = ((lon + 180) / 360) * W;
    lines.push(`M ${x.toFixed(1)} ${-H} V ${H * 2}`);
  }
  for (let lat = MAP.LAT_TOP - 20; lat > MAP.LAT_BOTTOM; lat -= 20) {
    const y = ((MAP.LAT_TOP - lat) / (MAP.LAT_TOP - MAP.LAT_BOTTOM)) * H;
    lines.push(`M ${-W} ${y.toFixed(1)} H ${W * 2}`);
  }
  return <path d={lines.join(" ")} stroke="#ffffff" strokeOpacity="0.05" strokeWidth={0.5} fill="none" vectorEffect="non-scaling-stroke" />;
}

function MapLabel({ x, y, text, active }: { x: number; y: number; text: string; active: boolean }) {
  const w = text.length * 4.6 + 12;
  return (
    <g style={{ pointerEvents: "none" }}>
      <rect x={x - w / 2} y={y - 20} width={w} height={13} rx={6.5} fill="#0b0b1c" opacity={0.82} />
      <text x={x} y={y - 10.5} textAnchor="middle" fontSize="8" fontWeight={active ? 600 : 500} fill={active ? "#e6e0ff" : "#c2c2e4"}>
        {text}
      </text>
    </g>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className={cn("size-2 rounded-full", className)} />
      {label}
    </span>
  );
}
