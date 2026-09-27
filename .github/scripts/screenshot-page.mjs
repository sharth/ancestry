// Serves a built Angular app (SPA, path-based routing) and screenshots one route.
// Usage: node screenshot-page.mjs <distDir> <route> <outputFile> [port]
import { createReadStream, readdirSync } from "node:fs";
import http from "node:http";
import { extname, join, resolve } from "node:path";
import { chromium } from "playwright";

const [distDir, route, outputFile, portArg] = process.argv.slice(2);
if (!distDir || !route || !outputFile) {
  console.error(
    "Usage: node screenshot-page.mjs <distDir> <route> <outputFile> [port]",
  );
  process.exit(1);
}
const port = portArg ? Number(portArg) : 4300;

const contentTypes = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

const distRoot = resolve(distDir);
const indexPath = resolve(distRoot, "index.html");

// Build a fixed allowlist of every file actually present in the build output,
// so a request path is never used to touch the filesystem directly: it can
// only select one of these known-safe, precomputed paths.
function listFiles(dir) {
  const files = new Set();
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const entryPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      for (const file of listFiles(entryPath)) files.add(file);
    } else {
      files.add(entryPath);
    }
  }
  return files;
}
const servableFiles = listFiles(distRoot);

// Angular's build uses path-based routing (no hash), so any unmatched path
// falls back to index.html, same as a production SPA host would configure.
const server = http.createServer((req, res) => {
  const requestedPath = resolve(
    distRoot,
    "." + decodeURIComponent(req.url.split("?")[0]),
  );
  const filePath = servableFiles.has(requestedPath) ? requestedPath : indexPath;
  res.setHeader(
    "Content-Type",
    contentTypes[extname(filePath)] ?? "application/octet-stream",
  );
  createReadStream(filePath).pipe(res);
});

await new Promise((resolveListen) => server.listen(port, resolveListen));

const browser = await chromium.launch(
  process.env.CHROME_BIN ? { executablePath: process.env.CHROME_BIN } : {},
);
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
  });
  await page.goto(`http://localhost:${port}${route}`, {
    waitUntil: "networkidle",
  });
  await page.screenshot({ path: outputFile });
} finally {
  await browser.close();
  server.close();
}
