/**
 * ── A monthly rate ────────────────────────────────────────────────────────
 *
 * Two of the three devices in the catalogue carry `monthlyCost: 0` — the
 * business has not published a rental rate for the BRYCK or the BRYCK Mini
 * yet. Rendered arithmetically that became "$0/mo" on the subscriptions page
 * and "From $0" on the product page, both of which say the hardware is free.
 *
 * Zero is not a price here, it is a missing price, so it renders as one. The
 * component returns a fragment rather than an element so it drops into every
 * existing wrapper without disturbing a single layout, and it keeps the unit
 * in its own span so call sites can go on styling it smaller and muted.
 */
export function Rate({
  usd,
  from = false,
  unit = "/mo",
  unitClassName,
}: {
  usd: number;
  /** Renders "From $x" — for catalogue entries priced by capacity. */
  from?: boolean;
  /** Pass "" to suppress the unit entirely. */
  unit?: string;
  unitClassName?: string;
}) {
  if (!(usd > 0)) return <>On request</>;

  return (
    <>
      {from ? "From " : ""}${usd.toLocaleString("en-US")}
      {unit ? <span className={unitClassName}>{unit}</span> : null}
    </>
  );
}
