"use client";

import { useEffect, useRef } from "react";
import geo from "@/lib/world-geo.json";
import { useSafeReducedMotion } from "@/lib/advanced-motion";
import { cn } from "@/lib/utils";

/**
 * ── The globe ─────────────────────────────────────────────────────────────
 *
 * Earth from orbit, turning, with the terminator across it and the cities lit
 * on the night side.
 *
 * ── Why canvas 2D and not a 3D library ────────────────────────────────────
 *
 * `three` and `@react-three/fiber` were removed from this project along with
 * the old globe, and re-adding them for one background would cost ~600 KB and
 * a shader compile on first paint — on the *login*, the one screen where time
 * to first frame is the whole impression. Everything below is orthographic
 * projection, which is just a rotation and a divide, so 2D canvas is not a
 * compromise here; it is the correct tool.
 *
 * ── The one trick that makes it look real ─────────────────────────────────
 *
 * The sun is placed **in the view plane** — its direction has zero z. That is
 * not an approximation for convenience, it is what makes the lighting exact:
 * for a surface point with unit normal N, illumination is N·S, and with
 * S.z = 0 that reduces to `N.x·S.x + N.y·S.y`, which in orthographic
 * projection is a linear ramp across the disc. So a plain linear gradient
 * *is* the terminator, geometrically correct, for free. It also puts the
 * brightest point on the limb rather than in the middle, which is what gives
 * the crescent its drama.
 *
 * The sun sits to the upper right, so the dark limb faces the sign-in panel:
 * the form sits over the darkest part of the frame, and the city lights face
 * the viewer.
 *
 * ── Hidden geometry ───────────────────────────────────────────────────────
 *
 * Orthographic projection maps both hemispheres onto the same disc, so a
 * coastline crossing the limb folds back over itself. Rings entirely on the
 * far side are skipped outright; rings that straddle the limb have their
 * hidden vertices clamped out to the horizon circle, which is exactly where
 * they would disappear, so the silhouette stays honest.
 *
 * Longitude needs no unwrapping even though the source data has rings that
 * cross the antimeridian: longitude only ever reaches the maths through
 * `sin` and `cos`, and those do not care that a vertex jumped from −180° to
 * +179°. In three dimensions the two points are simply adjacent.
 */

const DEG = Math.PI / 180;

/** Latitude at the centre of the disc — a little north, as satellites shoot it. */
const TILT = 17 * DEG;
/** Seconds per rotation. Slow enough to look still, fast enough to notice. */
const SPIN = 165;
/** Sun bearing on screen, counter-clockwise from +x. Upper right. */
const SUN_A = 27 * DEG;
const SUN_X = Math.cos(SUN_A);
const SUN_Y = Math.sin(SUN_A);
/** How far arcs stand off the surface, as a fraction of the radius. */
const LIFT = 0.135;
const ARC_STEPS = 54;

/* ══════════════════════════════ The network ══════════════════════════════ */

/** Fourteen, to match the "14 regions" the footer claims two lines below. */
const HUBS: Record<string, [lat: number, lon: number]> = {
  IAD: [39.04, -77.49],
  SFO: [37.77, -122.42],
  YYZ: [43.65, -79.38],
  GRU: [-23.55, -46.63],
  LHR: [51.51, -0.13],
  AMS: [52.37, 4.9],
  FRA: [50.11, 8.68],
  DXB: [25.2, 55.27],
  CPT: [-33.92, 18.42],
  BOM: [19.08, 72.88],
  BLR: [12.97, 77.59],
  SIN: [1.35, 103.82],
  NRT: [35.68, 139.69],
  SYD: [-33.87, 151.21],
};

/** [from, to, plasma?] — the lanes the console shows as live transfers. */
const LANES: [string, string, boolean][] = [
  ["BLR", "IAD", true],
  ["FRA", "SIN", false],
  ["SIN", "SYD", true],
  ["SFO", "NRT", false],
  ["LHR", "IAD", true],
  ["DXB", "AMS", false],
  ["GRU", "LHR", true],
  ["BOM", "DXB", false],
  ["YYZ", "FRA", false],
  ["CPT", "DXB", true],
];

const PLASMA = "161,128,255";
const CYO = "79,209,224";

/**
 * Ground cover, as a dozen patches.
 *
 * A single fill for every landmass on Earth is the thing that most gives a
 * drawn globe away: real continents are not one colour, they are deserts,
 * canopy and boreal forest, and the eye knows the pattern by heart even when
 * it cannot name it. These are stamped *clipped to the land path*, so they
 * shade the continents and stop dead at the coast.
 *
 * `[lat, lon, radius, "r,g,b", alpha]` — radius as a fraction of the sphere.
 */
const ALBEDO: [number, number, number, string, number][] = [
  // Deserts: brighter and warmer than anything else on the planet.
  [23, 13, 0.34, "214,196,158", 0.5], // Sahara
  [23, 45, 0.17, "210,190,152", 0.46], // Arabia
  [-25, 133, 0.24, "206,178,146", 0.44], // Australian interior
  [41, 88, 0.21, "198,184,158", 0.34], // Taklamakan / Gobi
  [-23, 21, 0.15, "206,186,150", 0.34], // Kalahari
  [33, -110, 0.12, "202,180,152", 0.32], // Sonoran
  // Canopy: the darkest ground there is.
  [-4, -62, 0.23, "46,74,58", 0.42], // Amazon
  [0, 22, 0.17, "46,74,58", 0.4], // Congo
  [0, 112, 0.17, "50,78,62", 0.34], // Indonesia
  // Boreal: dark, and cool rather than warm.
  [58, -100, 0.26, "58,70,92", 0.34], // Canadian shield
  [62, 95, 0.3, "58,70,92", 0.34], // Siberia
  // Ice and rock, the two bright ones.
  [72, -42, 0.15, "226,234,248", 0.55], // Greenland
  [33, 82, 0.1, "216,224,240", 0.4], // Himalaya
];

interface Patch {
  x: number;
  y: number;
  z: number;
  r: number;
  /** The three gradient stops, built once rather than per frame. */
  c0: string;
  c1: string;
  c2: string;
}

let PATCHES: Patch[] | null = null;

function patches(): Patch[] {
  if (PATCHES) return PATCHES;
  PATCHES = ALBEDO.map(([lat, lon, rad, rgb, a]) => {
    const [x, y, z] = latLonToXYZ(lat, lon);
    return {
      x,
      y,
      z,
      r: rad,
      c0: `rgba(${rgb},${a})`,
      c1: `rgba(${rgb},${a * 0.55})`,
      c2: `rgba(${rgb},0)`,
    };
  });
  return PATCHES;
}

/* ═══════════════════════════════ Geometry ════════════════════════════════ */

const latLonToXYZ = (lat: number, lon: number): [number, number, number] => {
  const p = lat * DEG;
  const l = lon * DEG;
  const c = Math.cos(p);
  return [c * Math.sin(l), Math.sin(p), c * Math.cos(l)];
};

/**
 * The coastlines, as flat `[x,y,z, x,y,z, …]` unit vectors.
 *
 * Parsed once and cached at module scope. The source is an SVG path in
 * equirectangular pixel space using only M/L/Z, which is why this is eight
 * lines rather than a parser.
 */
let RINGS: Float64Array[] | null = null;

function rings(): Float64Array[] {
  if (RINGS) return RINGS;
  const span = geo.latTop - geo.latBottom;
  const out: Float64Array[] = [];

  for (const sub of geo.land.split("M")) {
    if (!sub) continue;
    const parts = (sub.endsWith("Z") ? sub.slice(0, -1) : sub).split("L");
    const v = new Float64Array(parts.length * 3);
    let n = 0;
    for (const p of parts) {
      const comma = p.indexOf(",");
      if (comma < 0) continue;
      const px = +p.slice(0, comma);
      const py = +p.slice(comma + 1);
      if (!Number.isFinite(px) || !Number.isFinite(py)) continue;
      const [x, y, z] = latLonToXYZ(
        geo.latTop - (py / geo.h) * span,
        (px / geo.w) * 360 - 180,
      );
      v[n * 3] = x;
      v[n * 3 + 1] = y;
      v[n * 3 + 2] = z;
      n++;
    }
    if (n >= 3) out.push(v.subarray(0, n * 3));
  }

  RINGS = out;
  return out;
}

/**
 * City lights, sampled off the coastline vertices.
 *
 * Cities really are mostly coastal, so taking every few vertices of the
 * landmass outline and jittering them inland gives a distribution that reads
 * as populated without shipping a gazetteer. Weighted down toward the poles,
 * where the vertex density is high (fjords, islands) and the population is
 * not.
 */
let LIGHTS: Float64Array | null = null;

function lights(): Float64Array {
  if (LIGHTS) return LIGHTS;
  let s = 0x2f6b >>> 0;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0), s / 0x100000000);

  const buf: number[] = [];
  for (const ring of rings()) {
    for (let i = 0; i < ring.length; i += 3 * 5) {
      const y = ring[i + 1];
      // |y| is the sine of latitude — cheap, no trig needed.
      const polar = Math.abs(y);
      if (polar > 0.78 || rnd() > 0.62 - polar * 0.34) continue;

      const jx = ring[i] + (rnd() - 0.5) * 0.045;
      const jy = y + (rnd() - 0.5) * 0.03;
      const jz = ring[i + 2] + (rnd() - 0.5) * 0.045;
      const m = Math.hypot(jx, jy, jz) || 1;
      buf.push(jx / m, jy / m, jz / m, 0.35 + rnd() * 0.65);
    }
  }

  LIGHTS = Float64Array.from(buf);
  return LIGHTS;
}

/**
 * The ice caps, as the two circles of latitude that bound them.
 *
 * The bundled coastline is a *cropped* equirectangular map — it runs 78°N to
 * 56°S, so it has no Arctic ice and no Antarctica at all. On a flat map that
 * crop is invisible; on a globe it leaves bare ocean at both poles.
 *
 * A spherical cap projects, in orthographic, to the interior of its own
 * boundary circle, so filling the projected parallel *is* the cap — no
 * special-casing, just two more rings drawn a shade brighter than land.
 */
let CAPS: Float64Array[] | null = null;

function caps(): Float64Array[] {
  if (CAPS) return CAPS;
  // 78°N is exactly where the source data stops, so the Arctic cap fills the
  // gap and no more. The south has no data at all, so −68° stands in for the
  // Antarctic coast.
  CAPS = [78, -68].map((lat) => {
    const v = new Float64Array(73 * 3);
    for (let i = 0; i <= 72; i++) {
      const [x, y, z] = latLonToXYZ(lat, -180 + i * 5);
      v[i * 3] = x;
      v[i * 3 + 1] = y;
      v[i * 3 + 2] = z;
    }
    return v;
  });
  return CAPS;
}

/**
 * Weather.
 *
 * Cells clustered into the bands where cloud actually lives — the equatorial
 * convergence and the two mid-latitude storm tracks — rather than scattered
 * evenly, which reads as noise. They drift a little faster than the ground
 * turns, so the deck moves over the continents instead of being painted on.
 */
let CLOUDS: Float64Array | null = null;

function clouds(): Float64Array {
  if (CLOUDS) return CLOUDS;
  let s = 0xc10d >>> 0;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0), s / 0x100000000);

  const BANDS = [0, 0, 38, -38, 56, -56, 18, -18];
  const out = new Float64Array(130 * 5);
  for (let i = 0; i < 130; i++) {
    const lat = BANDS[i % BANDS.length] + (rnd() + rnd() - 1) * 17;
    const [x, y, z] = latLonToXYZ(lat, rnd() * 360 - 180);
    out[i * 5] = x;
    out[i * 5 + 1] = y;
    out[i * 5 + 2] = z;
    out[i * 5 + 3] = 0.035 + rnd() * 0.075;
    out[i * 5 + 4] = 0.42 + rnd() * 0.46;
  }

  CLOUDS = out;
  return out;
}

/** Meridians and parallels every 30°, as polylines of unit vectors. */
let GRID: Float64Array[] | null = null;

function grid(): Float64Array[] {
  if (GRID) return GRID;
  const out: Float64Array[] = [];

  for (let lon = -180; lon < 180; lon += 30) {
    const v = new Float64Array(61 * 3);
    for (let i = 0; i <= 60; i++) {
      const [x, y, z] = latLonToXYZ(-90 + i * 3, lon);
      v[i * 3] = x;
      v[i * 3 + 1] = y;
      v[i * 3 + 2] = z;
    }
    out.push(v);
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const v = new Float64Array(73 * 3);
    for (let i = 0; i <= 72; i++) {
      const [x, y, z] = latLonToXYZ(lat, -180 + i * 5);
      v[i * 3] = x;
      v[i * 3 + 1] = y;
      v[i * 3 + 2] = z;
    }
    out.push(v);
  }

  GRID = out;
  return out;
}

/**
 * The lanes, pre-slerped.
 *
 * An arc is fixed to the Earth, so its great circle is computed once at module
 * load and only *rotated* each frame — the per-frame cost of a lane is the
 * same nine multiplies per point as a coastline.
 */
interface Lane {
  pts: Float64Array;
  plasma: boolean;
  phase: number;
  speed: number;
}

let LANE_GEO: Lane[] | null = null;

function lanes(): Lane[] {
  if (LANE_GEO) return LANE_GEO;

  LANE_GEO = LANES.map(([from, to, plasma], i) => {
    const a = latLonToXYZ(...HUBS[from]);
    const b = latLonToXYZ(...HUBS[to]);
    const dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
    const omega = Math.acos(dot);
    const sin = Math.sin(omega);

    const pts = new Float64Array((ARC_STEPS + 1) * 3);
    for (let k = 0; k <= ARC_STEPS; k++) {
      const t = k / ARC_STEPS;
      // Degenerate great circles (near-identical endpoints) fall back to a
      // straight blend; slerp divides by sin(omega).
      const wa = sin > 1e-6 ? Math.sin((1 - t) * omega) / sin : 1 - t;
      const wb = sin > 1e-6 ? Math.sin(t * omega) / sin : t;
      // Lift peaks at the midpoint so the arc leaves and meets the surface.
      const r = 1 + LIFT * Math.sin(Math.PI * t);
      pts[k * 3] = (a[0] * wa + b[0] * wb) * r;
      pts[k * 3 + 1] = (a[1] * wa + b[1] * wb) * r;
      pts[k * 3 + 2] = (a[2] * wa + b[2] * wb) * r;
    }

    return { pts, plasma, phase: (i * 0.37) % 1, speed: 0.055 + (i % 4) * 0.011 };
  });

  return LANE_GEO;
}

/* ════════════════════════════════ Stars ══════════════════════════════════ */

interface Star {
  x: number;
  y: number;
  m: number;
  tw: number;
  ph: number;
}

/* ═══════════════════════════════ Component ═══════════════════════════════ */

export function GlobeCinematic({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useSafeReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const LAND = rings();
    const CITY = lights();
    const GRAT = grid();
    const LANE = lanes();
    const CAP = caps();
    const CLOUD = clouds();

    const PATCH = patches();

    /* Sprites, rendered once and stamped a few hundred times a frame. Building
       a gradient per cloud instead costs more than everything else in the loop
       put together.

       Four cloud variants, each built from nine overlapping blobs rather than
       one. A single radial gradient per cloud is what made the first pass read
       as bokeh: perfectly round, perfectly smooth, identical. Weather is none
       of those, and the giveaway is the silhouette, not the softness. The
       blobs are scattered close to isotropically: the zonal lean is applied
       once, at stamp time. Building it into the sprite *as well* compounded
       to roughly 3.6:1 and the deck came out looking like motion blur. */
    const puffs = Array.from({ length: 4 }, () => {
      const c = document.createElement("canvas");
      c.width = 96;
      c.height = 96;
      return c;
    });
    {
      let s = 0x9d31 >>> 0;
      const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0), s / 0x100000000);
      for (const c of puffs) {
        const p = c.getContext("2d");
        if (!p) return;
        for (let k = 0; k < 9; k++) {
          const bx = 48 + (rnd() - 0.5) * 44;
          const by = 48 + (rnd() - 0.5) * 40;
          const br = 10 + rnd() * 19;
          const g = p.createRadialGradient(bx, by, 0, bx, by, br);
          g.addColorStop(0, "rgba(255,255,255,0.34)");
          g.addColorStop(0.45, "rgba(240,246,255,0.15)");
          g.addColorStop(1, "rgba(226,236,255,0)");
          p.fillStyle = g;
          p.fillRect(0, 0, 96, 96);
        }
      }
    }


    let w = 0;
    let h = 0;
    let cx = 0;
    let cy = 0;
    let r = 0;
    let stars: Star[] = [];
    let frame = 0;
    let visible = true;
    let t0 = 0;

    // Pointer influence, eased. A globe that snaps to the cursor is a toy; one
    // that leans is alive.
    const aim = { x: 0, y: 0 };
    const lean = { x: 0, y: 0 };

    const layout = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (w < 1024) {
        // The panel takes the full width here, so the globe can only ever be
        // a corner of itself. Held to the top right and kept small: centred
        // and large, it put a busy continent directly behind the wordmark.
        r = Math.min(w * 0.46, h * 0.3);
        cx = w * 0.72;
        cy = h * 0.11;
      } else {
        // Sized so the limb closes inside the frame on every side. A first
        // pass at 0.34w bled off all four edges, and a sphere you cannot see
        // the edge of stops reading as a sphere — it reads as a wall. Note
        // that `w`/`h` here are the *overscanned* box the parallax moves
        // inside, not the viewport, which is why these look conservative.
        r = Math.min(w * 0.262, h * 0.405);
        cx = w * 0.665;
        cy = h * 0.5;
      }

      let s = 0x7c1d >>> 0;
      const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0), s / 0x100000000);
      const count = Math.min(900, Math.round((w * h) / 2600));
      stars = Array.from({ length: count }, () => ({
        x: rnd() * w,
        y: rnd() * h,
        m: Math.pow(rnd(), 2.6),
        tw: 0.4 + rnd() * 1.7,
        ph: rnd() * Math.PI * 2,
      }));
    };

    /* Every loop below rotates an Earth-fixed vector into view space the same
       way: spin about Y, then tilt about X. Written out inline rather than
       shared through a function — it runs about eight thousand times a frame.

           xr = x·cos + z·sin          zr = z·cos − x·sin
           yv = y·ct − zr·st           zv = y·st + zr·ct

       A point is on the near side when zv > 0, and its screen position is
       (cx + r·xr, cy − r·yv) — orthographic projection is that and no more. */

    const draw = (t: number) => {
      const spin = (t / SPIN) * Math.PI * 2 + lean.x;
      const cs = Math.cos(spin);
      const sn = Math.sin(spin);
      const ct = Math.cos(TILT + lean.y);
      const st = Math.sin(TILT + lean.y);

      /* ── Space ──────────────────────────────────────────────────────── */
      const sky = ctx.createLinearGradient(0, 0, w * 0.5, h);
      sky.addColorStop(0, "#05040d");
      sky.addColorStop(0.55, "#070614");
      sky.addColorStop(1, "#04030b");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      for (const s of stars) {
        const a = (0.1 + s.m * 0.85) * (0.72 + 0.28 * Math.sin(t * s.tw + s.ph));
        ctx.fillStyle = `rgba(226,232,255,${a})`;
        ctx.fillRect(s.x, s.y, 0.5 + s.m * 1.6, 0.5 + s.m * 1.6);
      }

      /* ── Atmosphere, outside the sphere ─────────────────────────────── */
      const halo = ctx.createRadialGradient(cx, cy, r * 0.97, cx, cy, r * 1.26);
      halo.addColorStop(0, `rgba(${CYO},0.2)`);
      halo.addColorStop(0.35, `rgba(120,150,255,0.09)`);
      halo.addColorStop(1, "rgba(90,120,255,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.26, 0, Math.PI * 2);
      ctx.fill();

      // Scattering piles up on the sunward limb, so a second bloom sits there.
      const sunX = cx + r * SUN_X;
      const sunY = cy - r * SUN_Y;
      const bloom = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, r * 0.85);
      bloom.addColorStop(0, `rgba(150,200,255,0.28)`);
      bloom.addColorStop(0.5, `rgba(110,150,255,0.08)`);
      bloom.addColorStop(1, "rgba(90,120,255,0)");
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = bloom;
      ctx.beginPath();
      ctx.arc(sunX, sunY, r * 0.85, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";

      /* ── The sphere ─────────────────────────────────────────────────── */
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();

      // Ocean, in daylight colour throughout — the night is applied as one
      // gradient over the whole disc further down, land included.
      const ocean = ctx.createRadialGradient(
        sunX,
        sunY,
        0,
        cx - r * SUN_X * 0.2,
        cy + r * SUN_Y * 0.2,
        r * 1.8,
      );
      // Deep. The first pass had the ocean lighter than the landmasses, which
      // inverts the one contrast everybody knows by heart and made the whole
      // sphere read as a grey ball with blue blotches.
      ocean.addColorStop(0, "#124a8f");
      ocean.addColorStop(0.4, "#0b2a5e");
      ocean.addColorStop(1, "#050f2c");
      ctx.fillStyle = ocean;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

      /* Projection, inlined into each loop below rather than shared through a
         function — this runs about eight thousand times a frame. */

      /* Ice, filling the two holes the cropped source data leaves at the poles.
         Drawn *under* the land: at full opacity on top it painted a bright
         plate over Greenland and northern Russia, and a cap that hides the
         coastline it is supposed to sit on stops looking like ice and starts
         looking like a lens cap. Only a shade off the sea beneath it, so it
         reads as pack ice rather than as a decal. */
      ctx.fillStyle = "#6d80b4";
      for (const cap of CAP) {
        let maxZ = -2;
        for (let i = 0; i < cap.length; i += 3) {
          const zr = -cap[i] * sn + cap[i + 2] * cs;
          const z = cap[i + 1] * st + zr * ct;
          if (z > maxZ) maxZ = z;
        }
        if (maxZ <= 0) continue;

        ctx.beginPath();
        for (let i = 0; i < cap.length; i += 3) {
          const xr = cap[i] * cs + cap[i + 2] * sn;
          const zr = -cap[i] * sn + cap[i + 2] * cs;
          const yv = cap[i + 1] * ct - zr * st;
          const zv = cap[i + 1] * st + zr * ct;

          let sx: number;
          let sy: number;
          if (zv >= 0) {
            sx = cx + r * xr;
            sy = cy - r * yv;
          } else {
            const m = Math.hypot(xr, yv) || 1;
            sx = cx + (r * xr) / m;
            sy = cy - (r * yv) / m;
          }
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        ctx.fill();
      }

      // Land — the same falloff as the ocean, two stops lighter throughout, so
      // the sea/shore contrast holds everywhere on the disc rather than only
      // where a flat fill happens to sit well against the gradient beneath it.
      const soil = ctx.createRadialGradient(
        sunX,
        sunY,
        0,
        cx - r * SUN_X * 0.2,
        cy + r * SUN_Y * 0.2,
        r * 1.8,
      );
      // Warmed a few degrees off the ocean's hue. Land and sea cut from the
      // same blue read as one flat lavender mass at this size; the drift
      // toward tan is what separates continent from water at a glance.
      soil.addColorStop(0, "#9a9cbe");
      soil.addColorStop(0.4, "#5f6493");
      soil.addColorStop(1, "#363c63");
      ctx.fillStyle = soil;
      ctx.beginPath();
      for (const ring of LAND) {
        // Skip anything wholly on the far side: clamping a hidden ring to the
        // limb would smear a blob along the horizon.
        let maxZ = -2;
        for (let i = 0; i < ring.length; i += 3) {
          const zr = -ring[i] * sn + ring[i + 2] * cs;
          const z = ring[i + 1] * st + zr * ct;
          if (z > maxZ) maxZ = z;
          if (maxZ > 0) break;
        }
        if (maxZ <= 0) continue;

        for (let i = 0; i < ring.length; i += 3) {
          const xr = ring[i] * cs + ring[i + 2] * sn;
          const zr = -ring[i] * sn + ring[i + 2] * cs;
          const yv = ring[i + 1] * ct - zr * st;
          const zv = ring[i + 1] * st + zr * ct;

          let sx: number;
          let sy: number;
          if (zv >= 0) {
            sx = cx + r * xr;
            sy = cy - r * yv;
          } else {
            const m = Math.hypot(xr, yv) || 1;
            sx = cx + (r * xr) / m;
            sy = cy - (r * yv) / m;
          }
          if (i === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.closePath();
      }
      ctx.fill();

      /* Ground cover, clipped to the land path that is still current.
         Everything here is `fillRect` rather than `arc` + `fill` for one
         reason: `beginPath` would wipe that path, and the coastline stroke
         below still needs it. The clip is part of the saved state; the path
         is not. Each gradient is transparent by its own edge, so the square
         it is painted into is invisible. */
      ctx.save();
      ctx.clip();
      for (const p of PATCH) {
        const xr = p.x * cs + p.z * sn;
        const zr = -p.x * sn + p.z * cs;
        const yv = p.y * ct - zr * st;
        const zv = p.y * st + zr * ct;
        if (zv <= 0) continue;

        // Foreshortened toward the limb, and faded there too: a patch seen
        // edge-on covers a sliver, not a circle.
        const rad = r * p.r * (0.35 + 0.65 * zv);
        const px = cx + r * xr;
        const py = cy - r * yv;
        const g = ctx.createRadialGradient(px, py, 0, px, py, rad);
        g.addColorStop(0, p.c0);
        g.addColorStop(0.55, p.c1);
        g.addColorStop(1, p.c2);
        ctx.globalAlpha = Math.min(1, zv * 2.2);
        ctx.fillStyle = g;
        ctx.fillRect(px - rad, py - rad, rad * 2, rad * 2);
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // Coastline, so the continents keep an edge once the night lands on them.
      ctx.strokeStyle = "rgba(150,190,255,0.16)";
      ctx.lineWidth = 0.6;
      ctx.stroke();

      /* ── Weather ────────────────────────────────────────────────────── */
      // Drawn onto the surface, before the night gradient, so the deck goes
      // dark with everything under it. Cloud only catches light it is given:
      // alpha scales with illumination, so the night side has no cloud at all
      // — which is exactly how Earth looks from orbit.
      const drift = spin * 1.06 + t * 0.006;
      const dc = Math.cos(drift);
      const ds = Math.sin(drift);
      for (let i = 0; i < CLOUD.length; i += 5) {
        const x0 = CLOUD[i];
        const z0 = CLOUD[i + 2];
        const xr = x0 * dc + z0 * ds;
        const zr = -x0 * ds + z0 * dc;
        const yv = CLOUD[i + 1] * ct - zr * st;
        const zv = CLOUD[i + 1] * st + zr * ct;
        if (zv <= 0.02) continue;

        const lit = xr * SUN_X + yv * SUN_Y;
        // Lit like everything else, but with the same gamma the terminator
        // uses, so cloud does not fade out well ahead of the ground under it.
        if (lit <= 0.01) continue;
        const a =
          CLOUD[i + 4] * Math.pow(Math.min(1, lit * 1.6), 0.5) * Math.min(1, zv * 2.4);
        if (a < 0.015) continue;

        /* Weather runs in bands, so each sprite is turned to lie along the
           local east. That direction is the tangent (z, 0, −x), normalised,
           put through the same rotation as everything else; its screen angle
           is then just an atan2. Without this the deck reads as scattered
           dots no matter how irregular the sprites are. */
        const eh = Math.hypot(x0, z0) || 1;
        const ex = z0 / eh;
        const ez = -x0 / eh;
        const exr = ex * dc + ez * ds;
        const ezr = -ex * ds + ez * dc;
        const eyv = -ezr * st;

        // Foreshortened toward the limb rather than properly projected to an
        // ellipse — at cloud softness the difference is not visible.
        const rad = r * CLOUD[i + 3] * (0.4 + 0.6 * zv);
        // Aspect varies per cell so the deck is not one repeated smear.
        const k = (i / 5) | 0;
        const wide = 1.35 + (k % 3) * 0.28;
        ctx.save();
        ctx.translate(cx + r * xr, cy - r * yv);
        ctx.rotate(Math.atan2(-eyv, exr));
        ctx.globalAlpha = a;
        ctx.drawImage(
          puffs[k & 3],
          -rad * wide,
          -rad * 0.82,
          rad * wide * 2,
          rad * 1.64,
        );
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      // Graticule. Faint enough to be felt rather than read.
      ctx.strokeStyle = "rgba(150,190,255,0.075)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (const line of GRAT) {
        let pen = false;
        for (let i = 0; i < line.length; i += 3) {
          const xr = line[i] * cs + line[i + 2] * sn;
          const zr = -line[i] * sn + line[i + 2] * cs;
          const yv = line[i + 1] * ct - zr * st;
          const zv = line[i + 1] * st + zr * ct;
          if (zv < 0) {
            pen = false;
            continue;
          }
          const sx = cx + r * xr;
          const sy = cy - r * yv;
          if (pen) ctx.lineTo(sx, sy);
          else ctx.moveTo(sx, sy);
          pen = true;
        }
      }
      ctx.stroke();

      /* Atmospheric depth. Looking at the limb you are looking through far
         more air than you are at the centre, so the edge of the disc hazes
         blue and loses contrast. It is a small effect and it does more for
         reading the thing as a ball than the outer glow does. Applied before
         the night gradient so it darkens with the surface it sits on. */
      const depth = ctx.createRadialGradient(cx, cy, r * 0.55, cx, cy, r);
      depth.addColorStop(0, "rgba(120,170,255,0)");
      depth.addColorStop(0.72, "rgba(125,172,255,0.05)");
      depth.addColorStop(0.93, "rgba(140,190,255,0.15)");
      depth.addColorStop(1, "rgba(165,205,255,0.3)");
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = depth;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      ctx.globalCompositeOperation = "source-over";

      /* ── Night ──────────────────────────────────────────────────────── */
      // Exact, because the sun sits in the view plane. See the header note.
      const night = ctx.createLinearGradient(
        cx - r * SUN_X,
        cy + r * SUN_Y,
        cx + r * SUN_X,
        cy - r * SUN_Y,
      );
      /* Lambert, then gamma.
       *
       * The gradient position `p` runs 0 at the anti-solar point to 1 at the
       * sub-solar point, so incident light is `I = 2p − 1` on the lit half —
       * a straight line, because the sun is in the view plane. Darkening by
       * `1 − I` is therefore physically exact, and it is exactly what the
       * first version did. It looked wrong: one murky wash with a thin bright
       * rind at the limb.
       *
       * It looked wrong because a display is not linear. Radiance reaches the
       * eye through roughly a 2.2 gamma, so what a photograph of Earth shows
       * is `I^(1/2.2)` — which lifts the mid-tones hard and pushes almost all
       * of the falloff into the last few degrees before the terminator. Hence
       * the stops below: alpha is `1 − I^0.45`, not `1 − I`.
       *
       * The two stops either side of 0.5 are the atmosphere. At the geometric
       * terminator the sun is on the horizon and the sky is still lit — that
       * is sunset, not darkness — so the ramp crosses 0.5 well short of
       * opaque and only reaches full night a little way onto the dark side.
       */
      night.addColorStop(0, "rgba(2,3,9,0.975)");
      night.addColorStop(0.3, "rgba(2,4,12,0.972)");
      night.addColorStop(0.42, "rgba(4,6,20,0.955)");
      night.addColorStop(0.465, "rgba(6,9,28,0.9)");
      night.addColorStop(0.5, "rgba(9,12,38,0.74)");
      night.addColorStop(0.545, "rgba(7,10,32,0.56)");
      night.addColorStop(0.6, "rgba(4,7,24,0.44)");
      night.addColorStop(0.68, "rgba(2,4,16,0.32)");
      night.addColorStop(0.78, "rgba(0,2,10,0.21)");
      night.addColorStop(0.88, "rgba(0,0,6,0.11)");
      night.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = night;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

      /* Twilight: the warm line where the sun is actually setting.
         Kept very low. At the strength it first shipped at, this stopped
         reading as a terminator and started reading as a light leak — a hard
         pale stripe down the sphere. A terminator is a *transition*, so the
         wide night ramp above does the work and this only tints it. */
      const dusk = ctx.createLinearGradient(
        cx - r * SUN_X,
        cy + r * SUN_Y,
        cx + r * SUN_X,
        cy - r * SUN_Y,
      );
      dusk.addColorStop(0.4, "rgba(120,90,255,0)");
      dusk.addColorStop(0.5, "rgba(146,108,255,0.06)");
      dusk.addColorStop(0.57, "rgba(255,152,116,0.055)");
      dusk.addColorStop(0.66, "rgba(255,190,140,0)");
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = dusk;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

      /* ── City lights ────────────────────────────────────────────────── */
      // Still in "lighter": these add to the darkness rather than covering it.
      for (let i = 0; i < CITY.length; i += 4) {
        const xr = CITY[i] * cs + CITY[i + 2] * sn;
        const zr = -CITY[i] * sn + CITY[i + 2] * cs;
        const yv = CITY[i + 1] * ct - zr * st;
        const zv = CITY[i + 1] * st + zr * ct;
        if (zv <= 0.04) continue;

        // Illumination is the dot product with the sun; negative means night.
        // The threshold sits slightly *into* daylight so lights come up
        // through dusk rather than switching on at a line.
        const lit = xr * SUN_X + yv * SUN_Y;
        if (lit > 0.16) continue;
        const nightness = Math.min(1, (0.16 - lit) / 0.3);
        // Fade at the limb, where a whole hemisphere piles into a few pixels.
        const a = CITY[i + 3] * nightness * Math.min(1, zv * 3.2);
        if (a < 0.02) continue;

        const px = cx + r * xr;
        const py = cy - r * yv;
        ctx.fillStyle = `rgba(255,206,138,${a})`;
        ctx.fillRect(px - 0.7, py - 0.7, 1.5, 1.5);
        // A halo on the strongest, so the night side has a few real cities on
        // it rather than an even dusting of pixels.
        if (a > 0.5) {
          ctx.fillStyle = `rgba(255,190,120,${(a - 0.5) * 0.22})`;
          ctx.beginPath();
          ctx.arc(px, py, 3.4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalCompositeOperation = "source-over";

      /* ── The lit limb ───────────────────────────────────────────────── */
      // A bright rim on the day edge, fading to nothing around the night side.
      const rim = ctx.createLinearGradient(
        cx - r * SUN_X,
        cy + r * SUN_Y,
        cx + r * SUN_X,
        cy - r * SUN_Y,
      );
      rim.addColorStop(0.42, "rgba(120,170,255,0)");
      rim.addColorStop(0.74, `rgba(${CYO},0.28)`);
      rim.addColorStop(1, "rgba(198,226,255,0.7)");
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = rim;
      ctx.lineWidth = Math.max(1.2, r * 0.014);
      ctx.beginPath();
      ctx.arc(cx, cy, r - ctx.lineWidth / 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";

      ctx.restore();

      /* ── Lanes ──────────────────────────────────────────────────────── */
      // Outside the clip, because an arc stands off the surface and its apex
      // legitimately crosses the limb into open space.
      ctx.lineCap = "round";
      for (const lane of LANE) {
        const rgb = lane.plasma ? PLASMA : CYO;
        const p = lane.pts;

        ctx.strokeStyle = `rgba(${rgb},0.42)`;
        ctx.lineWidth = 1.15;
        ctx.beginPath();
        let pen = false;
        for (let k = 0; k <= ARC_STEPS; k++) {
          const i = k * 3;
          const xr = p[i] * cs + p[i + 2] * sn;
          const zr = -p[i] * sn + p[i + 2] * cs;
          const yv = p[i + 1] * ct - zr * st;
          const zv = p[i + 1] * st + zr * ct;

          // Occluded when behind the sphere *and* projecting inside its disc.
          if (zv < 0 && xr * xr + yv * yv < 1) {
            pen = false;
            continue;
          }
          const sx = cx + r * xr;
          const sy = cy - r * yv;
          if (pen) ctx.lineTo(sx, sy);
          else ctx.moveTo(sx, sy);
          pen = true;
        }
        ctx.stroke();

        // The packet. One dot per lane, running the arc end to end.
        const u = (t * lane.speed + lane.phase) % 1;
        const k = Math.min(ARC_STEPS, Math.floor(u * ARC_STEPS));
        const i = k * 3;
        const xr = p[i] * cs + p[i + 2] * sn;
        const zr = -p[i] * sn + p[i + 2] * cs;
        const yv = p[i + 1] * ct - zr * st;
        const zv = p[i + 1] * st + zr * ct;
        if (zv < 0 && xr * xr + yv * yv < 1) continue;

        const px = cx + r * xr;
        const py = cy - r * yv;
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = `rgba(${rgb},0.9)`;
        ctx.beginPath();
        ctx.arc(px, py, 1.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(${rgb},0.14)`;
        ctx.beginPath();
        ctx.arc(px, py, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = "source-over";
      }

      /* ── Hubs ───────────────────────────────────────────────────────── */
      ctx.globalCompositeOperation = "lighter";
      let n = 0;
      for (const key in HUBS) {
        const [x, y, z] = latLonToXYZ(...HUBS[key]);
        const xr = x * cs + z * sn;
        const zr = -x * sn + z * cs;
        const yv = y * ct - zr * st;
        const zv = y * st + zr * ct;
        if (zv <= 0.06) {
          n++;
          continue;
        }
        const fade = Math.min(1, zv * 2.6);
        const px = cx + r * xr;
        const py = cy - r * yv;

        ctx.fillStyle = `rgba(${CYO},${0.85 * fade})`;
        ctx.beginPath();
        ctx.arc(px, py, 1.7, 0, Math.PI * 2);
        ctx.fill();

        // A ring leaving each hub, staggered so they never pulse in unison.
        const ping = ((t * 0.34 + n * 0.19) % 1);
        ctx.strokeStyle = `rgba(${CYO},${(1 - ping) * 0.3 * fade})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(px, py, 2 + ping * 13, 0, Math.PI * 2);
        ctx.stroke();
        n++;
      }
      ctx.globalCompositeOperation = "source-over";
    };

    /* ── Loop ───────────────────────────────────────────────────────────── */

    const step = (now: number) => {
      // Seeded from the first rAF timestamp so `t` is monotonic from zero.
      if (!t0) t0 = now;
      const t = (now - t0) / 1000;
      lean.x += (aim.x - lean.x) * 0.035;
      lean.y += (aim.y - lean.y) * 0.035;
      draw(t);
      frame = requestAnimationFrame(step);
    };

    const start = () => {
      if (frame || reduce) return;
      frame = requestAnimationFrame(step);
    };
    const stop = () => {
      if (!frame) return;
      cancelAnimationFrame(frame);
      frame = 0;
    };

    layout();

    const onResize = () => {
      layout();
      if (reduce) draw(28);
    };
    window.addEventListener("resize", onResize);

    if (reduce) {
      // A moment picked for the composition: the Atlantic on the terminator.
      draw(28);
      return () => window.removeEventListener("resize", onResize);
    }

    const onPointer = (e: PointerEvent) => {
      aim.x = (e.clientX / window.innerWidth - 0.5) * 0.42;
      aim.y = (e.clientY / window.innerHeight - 0.5) * -0.2;
    };
    const onLeave = () => {
      aim.x = 0;
      aim.y = 0;
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else if (visible) start();
    };

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    document.addEventListener("visibilitychange", onVisibility);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !document.hidden) start();
        else stop();
      },
      { threshold: 0 },
    );
    io.observe(canvas);
    start();

    return () => {
      stop();
      io.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerleave", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [reduce]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
    />
  );
}
