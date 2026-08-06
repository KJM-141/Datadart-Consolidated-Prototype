import sharp from "sharp";
import { readdirSync, statSync, unlinkSync } from "fs";
import path from "path";

const DIR = "public/assets/products";
const files = readdirSync(DIR).filter((f) => f.endsWith(".png"));

let before = 0;
let after = 0;
for (const f of files) {
  const src = path.join(DIR, f);
  const out = path.join(DIR, f.replace(/\.png$/, ".webp"));
  before += statSync(src).size;
  await sharp(src)
    .resize({ width: 900, withoutEnlargement: true })
    .webp({ quality: 82, effort: 6 })
    .toFile(out);
  after += statSync(out).size;
  unlinkSync(src); // drop the heavy PNG source
  console.log(`${f} → ${path.basename(out)}`);
}
console.log(
  `\ntotal: ${(before / 1024).toFixed(0)} KB → ${(after / 1024).toFixed(0)} KB (${Math.round((1 - after / before) * 100)}% smaller)`,
);
