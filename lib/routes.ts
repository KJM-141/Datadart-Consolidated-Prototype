import type { MapRoute } from "@/components/brand/world-map";
import { cityCoords } from "./geo-coords";
import type { Stage } from "./lifecycle";
import type { EndpointDetails, TransferOrder } from "./types";

/** Map emphasis by lifecycle stage — the physically-moving stages glow. */
const EMPHASIS: Record<Stage, MapRoute["emphasis"]> = {
  Proposal: "low",
  Onboarding: "low",
  "PO & Advance": "low",
  Provisioning: "mid",
  "Data Load": "mid",
  Shipment: "high",
  "DT2 Upload": "high",
  Verification: "mid",
  "Certified Erase": "low",
  Closure: "low",
};

function endpointCoords(e: EndpointDetails): [number, number] | undefined {
  return cityCoords(e.location.city);
}

/** Build a single map route from an order's source + destination. */
export function orderToRoute(order: TransferOrder): MapRoute | null {
  const from = endpointCoords(order.source);
  const to = endpointCoords(order.destination);
  if (!from || !to) return null;
  return {
    id: order.displayId,
    from,
    to,
    fromLabel: order.source.label,
    toLabel: order.destination.label,
    emphasis: order.closed ? "low" : EMPHASIS[order.stage],
  };
}

/** All plottable routes for a set of orders, brightest (in-transit) last so
 *  they render on top. */
export function ordersToRoutes(orders: TransferOrder[]): MapRoute[] {
  const rank = { low: 0, mid: 1, high: 2 };
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
