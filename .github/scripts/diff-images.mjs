// Produces a pixel-diff image highlighting what changed between two PNGs of
// the same dimensions.
// Usage: node diff-images.mjs <basePng> <headPng> <outputPng>
import { readFileSync, writeFileSync } from "node:fs";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const [basePath, headPath, outputPath] = process.argv.slice(2);
if (!basePath || !headPath || !outputPath) {
  console.error("Usage: node diff-images.mjs <basePng> <headPng> <outputPng>");
  process.exit(1);
}

const base = PNG.sync.read(readFileSync(basePath));
const head = PNG.sync.read(readFileSync(headPath));

const width = Math.max(base.width, head.width);
const height = Math.max(base.height, head.height);

// Pad both images to the same size (a taller/wider page on one side isn't a
// pixelmatch error, just a size mismatch) so the comparison covers the
// full extent of either screenshot.
function pad(png) {
  if (png.width === width && png.height === height) return png;
  const padded = new PNG({ width, height });
  PNG.bitblt(png, padded, 0, 0, png.width, png.height, 0, 0);
  return padded;
}

const paddedBase = pad(base);
const paddedHead = pad(head);
const diff = new PNG({ width, height });

const changedPixels = pixelmatch(
  paddedBase.data,
  paddedHead.data,
  diff.data,
  width,
  height,
  { threshold: 0.1 },
);

writeFileSync(outputPath, PNG.sync.write(diff));

const totalPixels = width * height;
const changedRatio = ((changedPixels / totalPixels) * 100).toFixed(2);
console.log(
  `${changedPixels} of ${totalPixels} pixels changed (${changedRatio}%)`,
);
