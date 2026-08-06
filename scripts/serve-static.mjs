/**
 * Zero-dependency static server for the exported `out/` folder — handy for
 * previewing the production build exactly as a static host would serve it.
 *
 *   node scripts/serve-static.mjs [port]
 */
import { createServer } from "http";
import { readFile, stat } from "fs/promises";
import { join, extname, normalize } from "path";

const ROOT = "out";
const PORT = Number(process.argv[2] ?? 4000);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
};

async function tryFiles(urlPath) {
  // Block path traversal, then try: exact file → dir/index.html → path.html
  const safe = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, "");
  const base = join(ROOT, safe);
  const candidates = [base, join(base, "index.html"), `${base}.html`];
  for (const c of candidates) {
    try {
      const s = await stat(c);
      if (s.isFile()) return c;
    } catch {
      /* keep looking */
    }
  }
  return null;
}

createServer(async (req, res) => {
  const urlPath = (req.url ?? "/").split("?")[0];
  let file = await tryFiles(urlPath === "/" ? "/index.html" : urlPath);
  let status = 200;
  if (!file) {
    file = join(ROOT, "404.html");
    status = 404;
  }
  try {
    const body = await readFile(file);
    res.writeHead(status, {
      "Content-Type": TYPES[extname(file)] ?? "application/octet-stream",
      "Cache-Control": "no-store",
    });
    res.end(body);
  } catch {
    res.writeHead(500).end("500");
  }
}).listen(PORT, () => {
  console.log(`Static preview of ${ROOT}/ → http://localhost:${PORT}`);
});
