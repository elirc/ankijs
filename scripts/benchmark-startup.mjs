import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync, writeFileSync } from "node:fs";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = fileURLToPath(new URL("../", import.meta.url));
const dist = resolve(root, "dist");
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webmanifest": "application/manifest+json",
  ".woff2": "font/woff2",
};
const server = createServer((request, response) => {
  const pathname = new URL(request.url, "http://localhost").pathname;
  const candidate = resolve(dist, "." + decodeURIComponent(pathname));
  if (!candidate.startsWith(dist + sep) && candidate !== dist) {
    response.writeHead(403).end();
    return;
  }
  const path =
    existsSync(candidate) && statSync(candidate).isFile()
      ? candidate
      : resolve(dist, "index.html");
  response.writeHead(200, {
    "Content-Type": mime[extname(path)] ?? "application/octet-stream",
    "Content-Length": statSync(path).size,
    "Cache-Control": "public, max-age=3600",
  });
  createReadStream(path).pipe(response);
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const port = server.address().port;
let browser;
try {
  browser = await chromium.launch({ headless: true });
  // Exclude PWA installation so both builds measure the same app/IDB path.
  // Offline behavior is covered separately by the browser regression suite.
  const context = await browser.newContext({
    serviceWorkers: "block",
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const samples = [];
  for (let index = 0; index < 4; index++) {
    if (index === 0)
      await page.goto(`http://127.0.0.1:${port}/`, {
        waitUntil: "domcontentloaded",
        timeout: 180_000,
      });
    else await page.reload({ waitUntil: "domcontentloaded", timeout: 180_000 });
    await page
      .getByRole("heading", { name: "Today", exact: true })
      .waitFor({ state: "visible", timeout: 180_000 });
    samples.push(
      await page.evaluate(
        (kind) => ({
          kind,
          readyMs: Math.round(performance.now()),
          javascript: performance
            .getEntriesByType("resource")
            .filter((entry) => new URL(entry.name).pathname.endsWith(".js"))
            .map((entry) => {
              const resource = entry;
              return {
                path: new URL(resource.name).pathname,
                transferBytes: resource.transferSize,
                encodedBytes: resource.encodedBodySize,
              };
            }),
        }),
        index === 0 ? "fresh installation" : "repeat open",
      ),
    );
    console.log(`${samples.at(-1).kind}: ${samples.at(-1).readyMs} ms`);
  }
  assert.deepEqual(errors, [], "Startup must not raise browser errors.");
  if (process.argv.includes("--check")) {
    assert(
      !samples[0].javascript.some((resource) =>
        /content-corrections-/.test(resource.path),
      ),
      "Fresh installations must not fetch archived corrections.",
    );
    for (const sample of samples.slice(1)) {
      assert(
        !sample.javascript.some((resource) =>
          /\/(seed|original-curriculum|workshop|expanded-cards|content-corrections)-/.test(
            resource.path,
          ),
        ),
        "Returning users must not load installer or full lesson bodies.",
      );
    }
  }
  const warm = samples
    .slice(1)
    .map((sample) => sample.readyMs)
    .sort((a, b) => a - b);
  const report = {
    conditions:
      "Headless Chromium, 1440×1000, localhost uncompressed static server, no CPU/network throttle, one fresh browser context followed by three reloads. Service workers blocked to isolate app installation. Readiness is the visible Today heading; OS load and Playwright scheduling affect timings. These are diagnostic samples, not a latency guarantee.",
    freshMs: samples[0].readyMs,
    repeatMedianMs: warm[1],
    samples,
  };
  const name = process.argv.includes("--baseline")
    ? "docs/startup-timing-baseline.json"
    : "docs/startup-timing-current.json";
  writeFileSync(
    resolve(root, name),
    JSON.stringify(report, null, 2) + "\n",
    process.argv.includes("--baseline") ? { flag: "wx" } : undefined,
  );
  console.log(
    JSON.stringify(
      {
        freshMs: report.freshMs,
        repeatMedianMs: report.repeatMedianMs,
        report: name,
      },
      null,
      2,
    ),
  );
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
