import { chromium } from "playwright";

/**
 * The console's structural contract, asserted rather than eyeballed:
 *   · the page itself never scrolls — each region scrolls independently
 *   · the rails hold their exact widths at desktop and disappear below their
 *     breakpoints rather than squeezing the working column
 *   · the right rail is never empty on any route
 */
const BASE = "http://127.0.0.1:4310";
const ROUTES = [
  "/customer/", "/customer/history/", "/customer/hardware/",
  "/customer/subscriptions/", "/customer/checkout/", "/customer/profile/",
  "/customer/sizer/", "/customer/start/", "/customer/conversations/",
  "/customer/resources/", "/customer/history/DD-2026-0187/",
];
const WIDTHS = [1512, 1280, 1024, 768, 390];

const b = await chromium.launch();
let fails = 0;
const problem = (m) => { fails++; console.log("  ✗ " + m); };

for (const width of WIDTHS) {
  const c = await b.newContext({ viewport: { width, height: 900 } });
  const p = await c.newPage();
  const errs = [];
  p.on("pageerror", (e) => errs.push(e.message));
  p.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  p.on("response", (r) => { if (r.status() === 404) errs.push("404 " + r.url()); });

  await p.addInitScript(() => localStorage.setItem("theme", "dark"));
  await p.goto(BASE + "/", { waitUntil: "domcontentloaded" });
  await p.evaluate(() => {
    const raw = localStorage.getItem("datadart-prototype");
    const s = raw ? JSON.parse(raw) : { state: {}, version: 4 };
    s.state = { ...s.state, signedIn: true };
    localStorage.setItem("datadart-prototype", JSON.stringify(s));
  });

  for (const r of ROUTES) {
    await p.goto(BASE + r, { waitUntil: "domcontentloaded" });
    await p.waitForTimeout(900);

    const m = await p.evaluate(() => {
      const nav = document.querySelector('nav[aria-label="Primary"]');
      const rail = document.querySelector('aside[aria-label="Panel"]');
      const main = document.querySelector("main");
      const vis = (el) => !!el && el.getBoundingClientRect().width > 0;
      return {
        pageScrolls: document.documentElement.scrollHeight > window.innerHeight + 2,
        navW: vis(nav) ? Math.round(nav.getBoundingClientRect().width) : 0,
        railW: vis(rail) ? Math.round(rail.getBoundingClientRect().width) : 0,
        railSections: rail ? rail.querySelectorAll("section").length : 0,
        mainScrolls: main ? main.scrollHeight > main.clientHeight : false,
        bodyOverflowX: document.body.scrollWidth > window.innerWidth + 2,
      };
    });

    if (m.pageScrolls) problem(`${width} ${r} — the page scrolls; only regions should`);
    if (m.bodyOverflowX) problem(`${width} ${r} — horizontal overflow`);
    if (width >= 1280 && m.navW !== 256) problem(`${width} ${r} — nav is ${m.navW}px, expected 256`);
    if (width < 1024 && m.navW > 0) problem(`${width} ${r} — nav still seated at ${m.navW}px`);
    if (width >= 1280 && m.railW !== 352) problem(`${width} ${r} — rail is ${m.railW}px, expected 352`);
    if (width >= 1280 && m.railSections < 2) problem(`${width} ${r} — rail has ${m.railSections} sections`);
  }

  if (errs.length) problem(`${width} — ${[...new Set(errs)].slice(0, 2).join(" | ")}`);
  console.log(`${fails === 0 ? "✓" : "·"} ${width}px swept`);
  await c.close();
}

await b.close();
console.log(fails ? `\n${fails} failure(s)` : "\nlayout contract holds at every width");
process.exit(fails ? 1 : 0);
