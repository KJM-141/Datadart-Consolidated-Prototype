import geo from "./world-geo.json";

/** Projection window — shared by the inline (110m) and hi-detail (50m) maps
 *  and by every route arc, so geometry and routes always align. */
export const MAP = {
  W: geo.w,
  H: geo.h,
  LAT_TOP: geo.latTop,
  LAT_BOTTOM: geo.latBottom,
};

export function project([lat, lon]: [number, number]): [number, number] {
  const x = ((lon + 180) / 360) * MAP.W;
  const y = ((MAP.LAT_TOP - lat) / (MAP.LAT_TOP - MAP.LAT_BOTTOM)) * MAP.H;
  return [x, y];
}

/** Great-circle-style arc bowed upward like a flight route. */
export function arcPath(
  a: [number, number],
  b: [number, number],
  lift = 0.3,
): string {
  const [x1, y1] = project(a);
  const [x2, y2] = project(b);
  const dist = Math.hypot(x2 - x1, y2 - y1);
  const l = Math.min(dist * lift, 90);
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 - l;
  return `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
}
