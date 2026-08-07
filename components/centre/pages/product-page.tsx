"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { ProductBody } from "../product-modal";
import { PATHS } from "@/lib/nav";
import type { Product } from "@/lib/products";

/**
 * `/customer/hardware/[slug]` — the product, as a linkable page.
 *
 * Deliberately the same `ProductBody` the modal renders, so the two can never
 * drift: the modal is this over the console, this is the modal in the frame.
 * The only thing the page adds is a way back, because it has history and the
 * modal does not.
 */
export function ProductPage({ product }: { product: Product }) {
  const [shot, setShot] = useState(0);

  return (
    <>
      <Link
        href={PATHS.hardware}
        className="mb-5 inline-flex items-center gap-1 text-[12px] text-ink-3 transition-colors hover:text-ink"
      >
        <ChevronLeft className="size-3.5" />
        Hardware
      </Link>

      <ProductBody slug={product.slug} shot={shot} setShot={setShot} />
    </>
  );
}
