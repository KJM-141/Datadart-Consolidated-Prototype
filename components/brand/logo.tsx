import Link from "next/link";
import { cn } from "@/lib/utils";
import { PATHS } from "@/lib/nav";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  href?: string | null;
  className?: string;
}

/**
 * The DataDart wordmark, imported from the reference build.
 *
 * `DATA DART_Logo_Gradient.svg` — the boxed DATA|DART lockup on the official
 * magenta→blue gradient. Its viewBox is 262.29 × 57.82, so the lockup is a
 * ~4.54:1 letterbox: much wider than the 2.38:1 PNG it replaces, and the size
 * table below is height-led for exactly that reason. Setting a width on a mark
 * this wide is how you end up with a 20px-tall logo in a 56px bar.
 *
 * Rendered as a plain <img> rather than next/image: it is a 2.4 KB vector, so
 * there is nothing for the optimiser to do, and `next/image` would only add a
 * layout box to fight with.
 */
const HEIGHTS = { sm: 22, md: 30, lg: 42, xl: 60 } as const;

const ASPECT = 262.29 / 57.82;

export function Logo({ size = "md", href = PATHS.dashboard, className }: LogoProps) {
  const h = HEIGHTS[size];
  const mark = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/assets/brand/datadart-gradient.svg"
      alt="DataDart"
      width={Math.round(h * ASPECT)}
      height={h}
      className={cn("block select-none object-contain", className)}
      style={{ height: h, width: "auto" }}
    />
  );

  if (href === null) return mark;
  return (
    <Link
      href={href}
      className="inline-flex rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="DataDart home"
    >
      {mark}
    </Link>
  );
}
