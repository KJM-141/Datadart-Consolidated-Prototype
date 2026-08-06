"use client";

import { WorldMap, type MapRoute } from "@/components/brand/world-map";
import { cn } from "@/lib/utils";

/**
 * ── The route map ─────────────────────────────────────────────────────────
 *
 * A drop-in replacement for the old `GlobePanel`, with the same props, so the
 * dashboard and the transfer detail did not have to be rewritten to lose the
 * globe.
 *
 * The globe was the wrong instrument for this product. A sphere shows one
 * hemisphere at a time and hides exactly the thing an operations console exists
 * to show — every live lane at once. The flat projection shows all of them
 * simultaneously, labels them without collision, and costs a fraction of the
 * render. Removing it also took `three`, `@react-three/fiber` and a 71 KB
 * geometry file out of the bundle.
 *
 * Deliberately headerless: every call site already sits inside a panel with its
 * own heading, and an earlier version that carried one printed "Network" twice.
 */
export function RoutePanel({
  routes,
  className,
  height = 340,
  expandable = true,
  labels = true,
}: {
  routes: MapRoute[];
  className?: string;
  /** Reserved height for the stage; the projection letterboxes inside it. */
  height?: number;
  expandable?: boolean;
  labels?: boolean;
}) {
  return (
    <div
      className={cn("flex w-full items-center", className)}
      style={{ minHeight: height }}
    >
      <WorldMap
        routes={routes}
        labelMode={labels ? "active" : "none"}
        expandable={expandable}
        className="w-full"
      />
    </div>
  );
}
