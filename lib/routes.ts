import type { MapRoute } from "@/components/brand/world-map";
import { cityCoords } from "./geo-coords";
import type { Stage } from "./lifecycle";
import type { EndpointDetails, TransferOrder } from "./types";

/**
 * Map emphasis by lifecycle stage. The map shows only lanes where something is
 * actually happening:
 *
 *  · **high — in transit:** the device itself is physically moving between two
 *    places. That is *Shipment* and nothing else.
 *  · **mid — transfer in progress:** the device is stationary at one end and
 *    data is being written to or read from it. It is not moving. `DEVICE_AT`
 *    below says which end it is sitting at.
 *
 * Stages where nothing is moving or transferring — scheduled-ahead (Proposal,
 * Onboarding, PO & Advance) and already-done (Certified Erase, Closure) — map to
 * `undefined` and are left off the map entirely.
 */
const EMPHASIS: Record<Stage, MapRoute["emphasis"] | undefined> = {
  Proposal: undefined,
  Onboarding: undefined,
  "PO & Advance": undefined,
  Provisioning: "mid",
  "Data Load": "mid",
  Shipment: "high",
  "DT2 Upload": "mid",
  Verification: "mid",
  "Certified Erase": undefined,
  Closure: undefined,
};

/**
 * For a *transfer in progress*, which end the device is sitting at while the
 * data moves on or off it — so the map can pulse that endpoint rather than
 * imply motion along the lane. Loading happens at the source; upload and
 * verification happen at the destination.
 */
const DEVICE_AT: Partial<Record<Stage, "source" | "destination">> = {
  Provisioning: "source",
  "Data Load": "source",
  "DT2 Upload": "destination",
  Verification: "destination",
};

function endpointCoords(e: EndpointDetails): [number, number] | undefined {
  return cityCoords(e.location.city);
}

/** Build a single map route from an order's source + destination. */
export function orderToRoute(order: TransferOrder): MapRoute | null {
  // Closed orders, and open ones in a scheduled/done stage, aren't live — they
  // don't belong on a map of what's moving right now.
  if (order.closed) return null;
  const emphasis = EMPHASIS[order.stage];
  if (!emphasis) return null;
  const from = endpointCoords(order.source);
  const to = endpointCoords(order.destination);
  if (!from || !to) return null;
  return {
    id: order.displayId,
    from,
    to,
    fromLabel: order.source.label,
    toLabel: order.destination.label,
    emphasis,
    deviceAt: DEVICE_AT[order.stage],
  };
}

/** All plottable routes for a set of orders, brightest (in-transit) last so
 *  they render on top. */
export function ordersToRoutes(orders: TransferOrder[]): MapRoute[] {
  const rank = { mid: 0, high: 1 };
  return orders
    .map(orderToRoute)
    .filter((r): r is MapRoute => r !== null)
    .sort((a, b) => rank[a.emphasis ?? "mid"] - rank[b.emphasis ?? "mid"]);
}

/** Ad-hoc route from two city names (wizard live preview). */
export function citiesToRoute(
  id: string,
  fromCity: string,
  toCity: string,
  fromLabel: string,
  toLabel: string,
): MapRoute | null {
  const from = cityCoords(fromCity);
  const to = cityCoords(toCity);
  if (!from || !to) return null;
  return { id, from, to, fromLabel, toLabel, emphasis: "high" };
}
