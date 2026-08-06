import { chromium } from "playwright";

const BASE = "http://127.0.0.1:4310";
const OUT = process.argv[2] ?? "shots";

const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 1512, height: 950 } });
const p = await c.newPage();
p.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
p.on("console", (m) => m.type() === "error" && console.log("CONSOLE:", m.text()));

await p.goto(BASE + "/", { waitUntil: "domcontentloaded" });
// Signed out: `/` is the landing.
await p.waitForTimeout(6000);
await p.screenshot({ path: `${OUT}/login-a.png` });
await p.waitForTimeout(9000);
await p.screenshot({ path: `${OUT}/login-b.png` });

// Narrow: the scrim has to widen and the panel must stay readable.
await p.setViewportSize({ width: 430, height: 900 });
await p.waitForTimeout(2500);
await p.screenshot({ path: `${OUT}/login-sm.png` });

console.log("done");
await b.close();
