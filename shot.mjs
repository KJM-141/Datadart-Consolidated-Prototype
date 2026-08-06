import { chromium } from "playwright";
const BASE = "http://127.0.0.1:4310";
const OUT = process.argv[2] ?? "shots";
const targets = process.argv.slice(3);
const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 1512, height: 950 } });
const p = await c.newPage();
p.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
p.on("console", (m) => m.type() === "error" && console.log("CONSOLE:", m.text()));
await p.addInitScript(() => localStorage.setItem("theme", "dark"));
await p.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await p.evaluate(() => {
  const raw = localStorage.getItem("datadart-prototype");
  const s = raw ? JSON.parse(raw) : { state: {}, version: 4 };
  s.state = { ...s.state, signedIn: true };
  localStorage.setItem("datadart-prototype", JSON.stringify(s));
});
for (const t of targets) {
  const eq = t.indexOf("=");
  const name = t.slice(0, eq), path = t.slice(eq + 1);
  await p.goto(BASE + path, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(5200);
  await p.screenshot({ path: `${OUT}/${name}.png` });
  console.log("shot", name, "→", p.url().replace(BASE, ""));
}
await b.close();
