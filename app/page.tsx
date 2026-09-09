"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PATHS } from "@/lib/nav";

/**
 * ── Root entry ────────────────────────────────────────────────────────────
 *
 * The marketing landing was ported out to the Tsecond marketing site
 * (…/products/data-dart), whose CTAs point back into this build. So this
 * repo is purely the DataDart app, and `/` is just the door: it sends
 * people to the sign-in surface.
 *
 * A static export (`output: "export"`) has no server to run
 * `next.config` redirects, so the hop is done client-side on mount with a
 * history `replace` — the empty root never lands in the back-button stack.
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace(PATHS.signin);
  }, [router]);

  return null;
}
