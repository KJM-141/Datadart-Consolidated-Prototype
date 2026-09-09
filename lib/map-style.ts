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

export type Emphasis = "high" | "mid";

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
    // Solid, bright, with a running packet: the shipment is physically moving.
    label: "In transit",
    color: "#a78bfa",
    gradient: true,
    width: 2.6,
    opacity: 1,
    packet: { r: 3.2, seconds: 3 },
  },
  mid: {
    // Long dashes, a distinct blue, and deliberately NO travelling packet: the
    // device is stationary at one end and data is moving on/off it. The map
    // pulses that endpoint instead, so nothing reads as motion along the lane.
    label: "Transfer in progress",
    color: "#4aa8ff",
    gradient: false,
    width: 1.9,
    dash: "9 6",
    opacity: 0.9,
  },
};

/**
 * The lane states the legend explains. Only **in transit** is a lane now: a
 * transfer in progress is shown by the device badge sitting at one endpoint, not
 * by a line, and scheduled/done transfers are left off the map entirely.
 */
export const EMPHASES: Emphasis[] = ["high"];

/**
 * Endpoint markers. Every route runs from a **source** to a **destination**, so
 * the two ends are drawn differently — a solid dot where the data starts, a
 * ring where it lands — rather than "bright vs dim". That directionality is the
 * thing the map was missing.
 */
export const ENDPOINT_STYLE = {
  source: { fill: "#c9bfff", r: 3.2, label: "Source" },
  destination: { fill: "#7fb0ff", r: 3.2, label: "Destination" },
  /** Dark keyline under every node so it survives crossing a landmass. */
  halo: "#07071a",
} as const;

/** The colour of the "device parked here, transferring" badge — shared by the
 *  map, its dialog and the legend so all three agree. */
export const DEVICE_COLOR = "#7fe0ff";
