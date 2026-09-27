// Serves a built Angular app (SPA, path-based routing) and screenshots one route.
// Usage: node screenshot-page.mjs <distDir> <route> <outputFile> [port]
import { createReadStream, existsSync } from "node:fs";
import http from "node:http";
import { extname, join } from "node:path";
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

// Angular's build uses path-based routing (no hash), so any unmatched path
// falls back to index.html, same as a production SPA host would configure.
const server = http.createServer((req, res) => {
  const requestedPath = join(
    distDir,
    decodeURIComponent(req.url.split("?")[0]),
  );
  const filePath =
    existsSync(requestedPath) && requestedPath.includes(distDir) ?
      requestedPath
    : join(distDir, "index.html");
  res.setHeader(
    "Content-Type",
    contentTypes[extname(filePath)] ?? "application/octet-stream",
  );
  createReadStream(filePath).pipe(res);
});

await new Promise((resolve) => server.listen(port, resolve));

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
