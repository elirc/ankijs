import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";

const pack = JSON.parse(
  readFileSync(
    new URL("../src/data/effect-packs/js-foundations.json", import.meta.url),
    "utf8",
  ),
);
const designPack = JSON.parse(
  readFileSync(
    new URL(
      "../src/data/effect-packs/distributed-reliability.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
test.use({ actionTimeout: 30_000 });

test("fundamentals and system design support recall, topic links, guide export, and offline first use", async ({
  page,
  context,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/effect-lab");
  await page
    .getByRole("button", { name: "Explore fundamentals", exact: true })
    .click({ timeout: 120_000 });
  await expect(page.locator(".effect-project-card")).toHaveCount(6);
  await expect(page).toHaveURL(/track=Fundamentals/);
  await page.reload();
  await expect(
    page.getByRole("combobox", { name: "Learning topic", exact: true }),
  ).toHaveValue("Fundamentals");
  await page
    .locator(`a.effect-project-card[href="/effect-lab/${pack.id}"]`)
    .click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download project guide" }).click();
  const download = await downloadPromise;
  const guide = await readFile((await download.path())!, "utf8");
  expect(guide).toContain(pack.milestones[0].workedExample);
  expect(guide).toContain(pack.milestones[0].retrieval[0].answer);
  expect(guide).toContain(pack.resources[0].url);
  await page.getByRole("link", { name: "Continue this project" }).click();
  await expect(
    page.getByRole("heading", { name: "Worked example", exact: true }),
  ).toBeVisible();
  const recall = page.getByRole("region", { name: "Recall before you build" });
  await expect(recall.locator("details")).toHaveCount(2);
  await expect(
    recall.locator("details").first().locator("p"),
  ).not.toBeVisible();
  await recall.locator("summary").first().click();
  await expect(recall.locator("details").first().locator("p")).toHaveText(
    pack.milestones[0].retrieval[0].answer,
  );
  await expect(recall.locator("details").first().locator("p")).toBeVisible();
  await recall.scrollIntoViewIfNeeded();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `artifacts/${testInfo.project.name}-effect-recall.png`,
  });
  await page.getByLabel("What I changed").fill("Separated the task draft from saved state and explained the reference graph.");
  await page.getByLabel("How I verified it").fill("Verified Cancel, nested edits, and earlier snapshots with the lesson fixtures.");
  await page.getByLabel("Tradeoff and next step").fill("Copy only the paths that change; revisit the example with nested labels.");
  for (const checkbox of await page.getByRole("checkbox").all()) await checkbox.check();
  await page.getByRole("button", { name: "Complete mission", exact: true }).click();
  await expect(page.getByRole("button", { name: "Reopen mission", exact: true })).toBeEnabled();
  await page.getByLabel("Jump to activity").selectOption({ index: 1 });
  await expect(
    page.getByRole("heading", { name: pack.milestones[1].title, exact: true }),
  ).toBeVisible();
  await expect(page.locator(".effect-recall details[open]")).toHaveCount(0);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await page.goto("/effect-lab?track=System+design");
  await expect(page.locator(".effect-project-card")).toHaveCount(3);
  await page
    .locator(`a.effect-project-card[href="/effect-lab/${designPack.id}"]`)
    .click();
  await page.getByRole("link", { name: "Continue this project" }).click();
  await expect(
    page.getByRole("heading", { name: "Worked example", exact: true }),
  ).toBeVisible();
  const offlineRecall = page.locator(".effect-recall details").first();
  await offlineRecall.locator("summary").click();
  await expect(offlineRecall.locator("p")).toHaveText(
    designPack.milestones[0].retrieval[0].answer,
  );
  await expect(offlineRecall.locator("p")).toBeVisible();
  expect(errors).toEqual([]);
});
