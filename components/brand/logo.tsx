import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  href?: string | null;
  className?: string;
}

// Official DataDart lockup (DATA|DART + T|second), transparent PNG. Aspect ~2.38:1.
// `xl` is the splash/hero size — use it instead of CSS-scaling a smaller one,
// which would overflow the layout box and clip inside overflow-hidden parents.
const SIZES = {
  sm: { w: 84, h: 35 },
  md: { w: 112, h: 47 },
  lg: { w: 162, h: 68 },
  xl: { w: 240, h: 101 },
};

export function Logo({ size = "md", href = "/customer", className }: LogoProps) {
  const { w, h } = SIZES[size];
  const mark = (
    <Image
      src="/assets/brand/logo.webp"
      alt="DataDart by T|Second"
      width={w}
      height={h}
      priority
      sizes={`${w}px`}
      className={cn("h-auto w-auto select-none", className)}
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
