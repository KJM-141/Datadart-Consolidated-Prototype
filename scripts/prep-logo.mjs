import sharp from "sharp";
import { mkdirSync } from "fs";

const SRC = "../721a430ce2a2aff64a21c76667599a06.png";
mkdirSync("public/assets/brand", { recursive: true });

// Find the tight content bounding box from the alpha channel.
const { data, info } = await sharp(SRC)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;
let minX = width, minY = height, maxX = 0, maxY = 0;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const a = data[(y * width + x) * channels + 3];
    if (a > 16) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}
const pad = 6;
const left = Math.max(0, minX - pad);
const top = Math.max(0, minY - pad);
const w = Math.min(width - left, maxX - minX + pad * 2);
const h = Math.min(height - top, maxY - minY + pad * 2);
console.log(`content bbox: ${w}x${h} at (${left},${top})  ratio ${(w / h).toFixed(2)}`);

const base = sharp(SRC).extract({ left, top, width: w, height: h });

await base.clone().resize({ width: 760 }).webp({ quality: 92, effort: 6 }).toFile("public/assets/brand/logo.webp");
await base.clone().resize({ width: 760 }).png({ compressionLevel: 9 }).toFile("public/assets/brand/logo.png");

// contrast previews
for (const [name, bg] of [
  ["light", { r: 246, g: 246, b: 251, alpha: 1 }],
  ["dark", { r: 16, g: 16, b: 31, alpha: 1 }],
]) {
  await sharp({ create: { width: w + 60, height: h + 60, channels: 4, background: bg } })
    .composite([{ input: await base.clone().png().toBuffer(), gravity: "center" }])
    .png()
    .toFile(`shots/logo-on-${name}.png`);
}
console.log("done");
