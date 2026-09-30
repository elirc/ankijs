import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test.use({ actionTimeout: 30_000 });

test("Effect project path saves offline evidence and exports it on desktop and mobile", async ({
  page,
  context,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/more");
  await page
    .getByRole("navigation", { name: "More tools" })
    .getByRole("link", { name: "Effect & agentic CRUD" })
    .click({ timeout: 120_000 });
  await expect(
    page.getByRole("heading", { name: "Effect & agentic CRUD", level: 1 }),
  ).toBeVisible();
  await expect(page.locator(".effect-project-card")).toHaveCount(23);
  await page.screenshot({
    path: `artifacts/${testInfo.project.name}-effect-projects.png`,
  });
  await page.getByLabel("Project type").selectOption("Standalone app");
  await expect(page.locator(".effect-project-card")).toHaveCount(18);
  await page.reload();
  await expect(page.locator(".effect-project-card")).toHaveCount(18);
  await page.getByLabel("Project type").selectOption("All projects");
  await page
    .locator(".effect-project-card")
    .filter({ hasText: "Project tracker" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Project tracker", level: 1 }),
  ).toBeVisible();
  const guideDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download project guide" }).click();
  const guide = await guideDownload;
  const guideText = await readFile((await guide.path())!, "utf8");
  expect(guideText).toContain("Upgrade existing local databases");
  expect(guideText).toContain("Acceptance checks");
  const drills = page.locator(".effect-drill-group").first();
  await drills.locator("summary").click();
  await expect(drills.locator(".effect-milestone-card")).toHaveCount(9);
  await page.getByRole("link", { name: "Continue this project" }).click();
  await page.getByText("Your agent brief", { exact: true }).click();
  await expect(page.getByLabel("Agent prompt")).toContainText(
    "Create and list projects",
  );
  await page
    .getByLabel("What I changed")
    .fill("Built the tracker with validated writes. Commit abc123.");
  await page
    .getByLabel("How I verified it")
    .fill("Blank input failed without a write; valid data survived reload.");
  await page
    .getByLabel("Tradeoff and next step")
    .fill("Start local, then add shared projects.");
  for (const checkbox of await page.getByRole("checkbox").all())
    await checkbox.check();
  await page.getByRole("button", { name: "Complete mission" }).click();
  await expect(
    page.getByRole("button", { name: "Reopen mission" }),
  ).toBeEnabled();
  await expect(
    page.getByRole("link", { name: "Next activity" }),
  ).toHaveAttribute("href", "/effect-lab/project-tracker/effect-tracker-edit");
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByLabel("What I changed")).toHaveValue(
    "Built the tracker with validated writes. Commit abc123.",
  );
  await page.getByRole("button", { name: "Reopen mission" }).click();
  await page
    .getByLabel("Tradeoff and next step")
    .fill("Offline update: test duplicate submissions next.");
  await page.getByRole("button", { name: "Complete mission" }).click();
  await expect(
    page.getByRole("button", { name: "Reopen mission" }),
  ).toBeEnabled();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `artifacts/${testInfo.project.name}-effect-milestone.png`,
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Project tracker", exact: true })
    .click();
  await page
    .getByRole("link", { name: "All Effect projects", exact: true })
    .click();
  await expect(page.locator(".effect-hero")).toContainText(
    "1 / 1002 activities completed",
  );
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export project evidence" }).click();
  const file = await downloaded;
  const content = await readFile((await file.path())!, "utf8");
  expect(content).toContain("Offline update: test duplicate submissions next.");
  expect(content).toContain("Create and list projects");
  // Open a never-visited project and drill from the installed offline cache.
  await page
    .locator(".effect-project-card")
    .filter({ hasText: "Booking & availability" })
    .click();
  await page.getByRole("link", { name: "Continue this project" }).click();
  await page.getByLabel("Jump to activity").selectOption({ index: 6 });
  await expect(
    page.getByRole("link", { name: "Review the build milestone" }),
  ).toBeVisible();
  await expect(page.getByLabel("What I changed")).toBeVisible();
  await page
    .getByRole("link", { name: "Booking & availability", exact: true })
    .click();
  await page
    .getByRole("link", { name: "All Effect projects", exact: true })
    .click();
  // This is the first use of full-text search in the context, while offline.
  await page
    .getByRole("button", { name: "All activities", exact: true })
    .click();
  await page.getByLabel("Search projects").fill("poison payload");
  await page
    .getByRole("combobox", { name: "Learning stage", exact: true })
    .selectOption("Own the outcome");
  await expect(
    page.getByRole("heading", {
      name: "Measure lag and recover from poison events",
    }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Search projects")).toHaveValue(
    "poison payload",
  );
  await expect(
    page.getByRole("button", { name: "All activities", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Clear filters" }).click();
  await page.getByRole("button", { name: "Projects", exact: true }).click();
  expect(errors).toEqual([]);
});
