import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";

const root = new URL("../", import.meta.url);
const html = readFileSync(new URL("dist/index.html", root), "utf8");
const names = [
  ...new Set(
    [...html.matchAll(/(?:src|href)="(\/assets\/[^" ]+\.js)"/g)].map(
      (match) => match[1],
    ),
  ),
];
assert(names.length > 0, "Build the app before measuring startup assets.");
const assets = names.map((name) => {
  const bytes = readFileSync(new URL("dist" + name, root));
  return { name, bytes: bytes.length, gzipBytes: gzipSync(bytes).length };
});
const report = {
  measurement:
    "JavaScript entry and modulepreloads in production index.html; uncompressed and gzip bytes. Excludes route requests, install data, CSS, service-worker downloads, and network/runtime timing.",
  assets,
  bytes: assets.reduce((sum, asset) => sum + asset.bytes, 0),
  gzipBytes: assets.reduce((sum, asset) => sum + asset.gzipBytes, 0),
};
if (process.argv.includes("--baseline")) {
  writeFileSync(
    new URL("docs/startup-performance-baseline.json", root),
    JSON.stringify(report, null, 2) + "\n",
    { flag: "wx" },
  );
}
if (process.argv.includes("--check")) {
  const baseline = JSON.parse(
    readFileSync(
      new URL("docs/startup-performance-baseline.json", root),
      "utf8",
    ),
  );
  assert(
    report.bytes < baseline.bytes,
    "Startup JavaScript should remain below the pre-refactor baseline.",
  );
  assert(
    !names.some((name) =>
      /\/(workshop|original-curriculum|EffectLabScreen|seed)-/.test(name),
    ),
    "Lesson and installer modules must stay out of the entry preloads.",
  );
  report.baselineBytes = baseline.bytes;
  report.reductionPercent =
    Math.round((1 - report.bytes / baseline.bytes) * 1000) / 10;
  report.baselineGzipBytes = baseline.gzipBytes;
  report.gzipReductionPercent =
    Math.round((1 - report.gzipBytes / baseline.gzipBytes) * 1000) / 10;
  writeFileSync(
    new URL("docs/startup-performance-current.json", root),
    JSON.stringify(report, null, 2) + "\n",
  );
}
console.log(JSON.stringify(report, null, 2));
