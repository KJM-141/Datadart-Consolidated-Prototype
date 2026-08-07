/**
 * ── How a route is drawn ──────────────────────────────────────────────────
 *
 * One table, read by both the map and its legend.
 *
 * The three emphases used to differ by opacity alone — 1, 0.62, 0.34 of the
 * same gradient — which at 1.6px over a dark continent is no difference at all:
 * every lane looked like every other lane, and there was no key to consult
 * because there was nothing to key. Each state now has its own colour, weight
 * and dash pattern, so the distinction survives being small.
 *
 * The legend imports these same values rather than approximating them in
 * Tailwind classes, which is the only way a key stays honest.
 */

export type Emphasis = "high" | "mid" | "low";

export interface RouteStyle {
  /** What this state means, in the customer's language. */
  label: string;
  /** Solid colour for the legend swatch and for `low`, which takes no gradient. */
  color: string;
  /** Use the plasma gradient rather than the flat colour. */
  gradient: boolean;
  width: number;
  /** SVG `stroke-dasharray`; `undefined` draws solid. */
  dash?: string;
  opacity: number;
  /** A travelling packet rides the lane, and how long a lap takes. */
  packet?: { r: number; seconds: number };
}

export const ROUTE_STYLE: Record<Emphasis, RouteStyle> = {
  high: {
    label: "In transit",
    color: "#a78bfa",
    gradient: true,
    width: 2.4,
    opacity: 1,
    packet: { r: 3.2, seconds: 3 },
  },
  mid: {
    label: "In progress",
    color: "#6f8cf0",
    gradient: true,
    width: 1.8,
    dash: "7 5",
    opacity: 0.85,
    packet: { r: 2.3, seconds: 5.2 },
  },
  low: {
    label: "Scheduled or closed",
    color: "#6a6a9c",
    gradient: false,
    width: 1.3,
    dash: "1.5 4",
    opacity: 0.75,
  },
};

/** Ordered dimmest-first, matching the paint order on the map. */
export const EMPHASES: Emphasis[] = ["low", "mid", "high"];

/** Endpoint markers, which the legend also has to explain. */
export const ENDPOINT_STYLE = {
  active: { fill: "#e6e0ff", r: 3.2, label: "Live endpoint" },
  idle: { fill: "#9a9ad0", r: 2.4, label: "Endpoint" },
  /** Dark keyline under every node so it survives crossing a landmass. */
  halo: "#07071a",
} as const;
