import type { NextConfig } from "next";

/**
 * The prototype has no server features (no API routes, server actions or
 * middleware — all data is mocked client-side), so it builds to a fully static
 * site in `out/`. That deploys to literally any host: Vercel, Netlify,
 * Cloudflare Pages, GitHub Pages, S3, nginx…
 *
 * `trailingSlash` emits `customer/index.html` instead of `customer.html`,
 * which every static host resolves correctly without extra rewrite rules.
 *
 * Note that `redirects()` is unavailable under `output: "export"` — there is no
 * server to run them. The console moved from `/dashboard` to `/customer/*`
 * during the consolidation and the old paths simply do not exist; every link is
 * generated from `PATHS` in lib/nav.ts, so nothing internal points at them.
 */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // No image optimiser in a static export; assets are already
    // pre-compressed WebP (see scripts/optimize-images.mjs).
    unoptimized: true,
  },
  devIndicators: {
    position: "bottom-left",
  },
  experimental: {
    // Tree-shake barrel imports so only used icons ship.
    optimizePackageImports: ["lucide-react", "motion", "date-fns"],
  },
};

export default nextConfig;
