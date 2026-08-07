# DataDart 2.0 — Prototype

Implements the **DataDart 2.0 Requirements Specification** (v1.0, 26 Jul 2026)
and its companion wireframe pack — the strategic shift from a back-office admin
tool to a **customer-facing conversational product**, with our design system on
top.

| Requirement | Where it lives |
|---|---|
| **WF-1** Conversational intake — chat left, live Transfer Summary right | `/start` |
| **WF-2** Sizer & transparent pricing (no auth, shared engine) | `/sizer` |
| **Sizing engine** — equipment catalog, RAID overhead, encryption penalty, fleet selection, ingress→travel→egress timeline, wire comparison, BOM, rationale (ported from the Tsecond DataDart Sizer) | `lib/sizer-engine.ts` |
| **DataDart Assistant mark** — dart-in-a-bubble identity for the agent | `components/brand/assistant-mark.tsx` |
| Public landing: how it works, security strip, datasheets, resources | `/how-it-works` |
| **WF-3** Proposal → e-sign → advance, three sequential acts | `/orders/[id]/agreement` |
| **WF-4** Ten-stage order tracker, documents hub, staged payments | `/orders/[id]` |
| **WF-6** Conversations queue (Sprint-1 back office) | `/conversations` |
| Design tokens (navy `#14142B`, purple `#8E2DE2`, blue `#4361EE`, 14 px cards) | `app/globals.css` |
| Human-readable IDs `DD-YYYY-NNNN`, UUIDs behind a copy action | `lib/lifecycle.ts` |
| Secret redaction, no credentials pre-agreement | `lib/agent.ts` |
| One pricing service for sizer **and** chat | `lib/pricing.ts` |

---

## Original redesign notes

A modern, ground-up redesign prototype of the DataDart customer portal
(https://portal.datadart.services) by Tsecond. Every route, form, wizard and
component from the live portal is rebuilt to a 2026 best-in-class standard while
preserving the brand: the purple→blue gradient, the DATADART wordmark, and
Poppins.

> **Frontend-only prototype.** All data is mocked in-app (Zustand +
> localStorage). Sign-in accepts any credentials. The real portal and its API
> are never called.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000 → you land on `/signin`. Any email + password works.

## Deploy it

The prototype has **no server requirements** — no API routes, server actions or
middleware, since all data is mocked client-side. `npm run build` emits a fully
static site to `out/`, which hosts anywhere.

```bash
npm run build     # → out/  (static site, ~1.4 MB)
npm run preview   # serve out/ at http://localhost:4000 exactly as a host would
```

Pick whichever is easiest:

| Host | How |
|---|---|
| **Netlify Drop** *(no CLI, no repo)* | Drag the `out/` folder onto <https://app.netlify.com/drop> → instant public URL |
| **Vercel** | `npx vercel` in this folder (prompts a login the first time) |
| **Netlify CLI** | `npx netlify deploy --prod --dir=out` |
| **Cloudflare Pages** | `npx wrangler pages deploy out` |
| **GitHub Pages** | Push the repo, then publish the `out/` folder (or use an Actions workflow) |

`netlify.toml` is included (`publish = "out"` + immutable caching for
`/_next/static` and `/assets`), so a Git-connected Netlify/Vercel project builds
with zero further configuration.

## What's inside

| Area | Highlights |
|---|---|
| **Sign in / Sign up / Forgot password** | Split layout with a live generative particle-network hero, rotating value props, 2-step signup with cascading Country → State → City |
| **Shell** | **Workspace app-shell** — persistent, collapsible left rail grouped into Workspace / Catalog, plus a slim contextual bar (route label, ⌘K search, theme, account). Replaces the old top-nav blueprint so content runs full-width and dense. Mobile collapses the rail into a drawer. |
| **Overview** | **Bento grid**: 4 metric tiles, a live **vector world map** hero (Natural Earth countries + borders + graticule, animated great-circle arcs from your real order endpoints, **Expand** for full-screen pan/zoom), an "In focus" transfer tile with live progress, activity feed, hardware rail and a gradient resources tile |
| **Hardware** | Catalog grouped by product line the way T\|Second organises it — **Edge Storage** (BRYCK, BRYCK Mini) and **Edge HPC** (BRYCK FXR) — as feature cards with key-spec grids; full spec sheets, capacity selector, subscribe mode with sticky add-to-cart bar and a fly-to-cart packet animation. FXR specs are sourced from [tsecond.ai](https://tsecond.ai/products/edge-hpc?tab=bryck-fxr). |
| **Resources** | Knowledge hub: product datasheets, blog / videos / YouTube / whitepaper links, and an FAQ accordion — everything in one place |
| **Orders** | Search + date-range filters, Active/Closed tabs, expandable order cards with journey timeline, a focused live map of the transfer and a **Cancel order** action (moves it to Closed live), and the flagship **5-step Raise Order wizard** whose summary rail plots your route on the world map as you fill it in |
| **Subscription** | Rental list with device thumbnails, expandable detail (items, term, shipping), Subscribe flow through the catalogue |
| **Cart & Checkout** | Animated line items and totals, 2-step Raise Subscription wizard with live cost estimate |
| **Profile** | Identity card, view/edit modes with sticky save bar, change password with a live policy checklist |
| **Platform** | ⌘K command palette, light + dark themes, page transitions, toasts, skeleton shimmer, keyboard/focus states, `prefers-reduced-motion` support, responsive down to mobile |

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui ·
Motion (Framer Motion 12) · Zustand · React Hook Form + Zod · date-fns +
react-day-picker · sonner · cmdk · Lucide

## Structure

```
app/
  (auth)/signin · signup · forgotpassword     — public screens
  (portal)/dashboard · orders · subscription  — authenticated portal
           products · products/[slug]
           mycart · profile · profile/changepassword
components/
  brand/     logo, particle field, route arc, transfer map, animated number
  layout/    top nav, user menu, command palette, auth hero, portal shell
  shared/    stepper, segmented, address/contact blocks, date pickers, …
  orders/ cart/ products/                     — feature components
lib/
  products.ts  full 6-SKU catalogue (specs from the portal analysis)
  demo-data.ts orders / subscriptions / activity seed data
  geo.ts       country → state → city cascade data
  store.ts     Zustand store (persisted)
```

Demo state persists in localStorage under the key `datadart-prototype` — clear
it (or use Logout) to reset.

## Build tooling (`scripts/`)

- `generate-map.mjs` — projects Natural Earth country geometry (public-domain
  `world-atlas`) into baked land + border SVG paths using the same
  equirectangular projection the client uses for route arcs. Emits
  `lib/world-geo.json` (110m, inline everywhere) and `lib/world-geo-hi.json`
  (50m simplified, lazy-loaded only in the expand modal)
- `prep-logo.mjs` — tight-crops the official DataDart PNG and exports optimised
  `public/assets/brand/logo.{webp,png}`
- `optimize-images.mjs` — converts product photos to WebP (~90% smaller)

`walkthrough.mjs` / `verify-signin.mjs` (repo root) are Playwright E2E drivers
that click through every screen and screenshot into `shots/` — run with
`node walkthrough.mjs` against a live dev server.
