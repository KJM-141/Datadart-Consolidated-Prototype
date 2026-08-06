/**
 * Build-time generator: turns Natural Earth country geometry (world-atlas,
 * public domain) into real filled-land + country-border SVG paths, using the
 * SAME equirectangular projection the client uses for route arcs, so cities
 * land exactly on the coastlines.
 *
 *   node scripts/generate-map.mjs
 *     → lib/world-geo.json     (110m — light, inline everywhere)
 *     → lib/world-geo-hi.json  (50m  — detailed, lazy-loaded in the expand modal)
 */
import { readFileSync, writeFileSync } from "fs";
import { mesh, merge } from "topojson-client";
import { presimplify, simplify } from "topojson-simplify";
import { geoPath, geoTransform } from "d3-geo";

// Shared projection window — identical across detail levels so arcs line up.
const LAT_TOP = 78;
const LAT_BOTTOM = -56;
const W = 720;
const H = Math.round((W * (LAT_TOP - LAT_BOTTOM)) / 360);

const round = (d) => d.replace(/-?\d+\.\d+/g, (n) => (+n).toFixed(1));

const projection = geoTransform({
  point(lon, lat) {
    this.stream.point(
      ((lon + 180) / 360) * W,
      ((LAT_TOP - lat) / (LAT_TOP - LAT_BOTTOM)) * H,
    );
  },
});
const path = geoPath(projection);

function build(resolution, outFile, minWeight = 0) {
  let topo = JSON.parse(
    readFileSync(`node_modules/world-atlas/countries-${resolution}.json`, "utf8"),
  );
  if (minWeight > 0) {
    // Decimate vertices below a screen-area weight to shrink 50m detail.
    topo = simplify(presimplify(topo), minWeight);
  }
  const countries = topo.objects.countries;
  const landGeo = {
    type: "MultiPolygon",
    coordinates: merge(topo, countries.geometries).coordinates,
  };
  const bordersGeo = mesh(topo, countries, (a, b) => a !== b);
  const land = round(path(landGeo));
  const borders = round(path(bordersGeo));
  writeFileSync(
    outFile,
    JSON.stringify({ w: W, h: H, latTop: LAT_TOP, latBottom: LAT_BOTTOM, land, borders }),
  );
  console.log(
    `${outFile}: ${resolution}, land ${(land.length / 1024).toFixed(0)}KB, borders ${(borders.length / 1024).toFixed(0)}KB`,
  );
}

build("110m", "lib/world-geo.json");
// 50m simplified — noticeably crisper coastlines for the expand modal, kept
// lazy-loaded. minWeight tuned to land near ~200 KB.
build("50m", "lib/world-geo-hi.json", 0.06);
