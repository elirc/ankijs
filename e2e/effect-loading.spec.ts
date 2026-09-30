import { test, expect } from "@playwright/test";

test.use({ serviceWorkers: "block", actionTimeout: 15_000 });

test("catalog defers project bodies and search; drills stay paginated", async ({
  page,
}, testInfo) => {
  const requests: string[] = [];
  page.on("request", (request) =>
    requests.push(new URL(request.url()).pathname),
  );
  await page.goto("/effect-lab");
  await expect(
    page.getByRole("heading", { name: "Effect & agentic CRUD", level: 1 }),
  ).toBeVisible({ timeout: 120_000 });
  expect(
    requests.some((path) =>
      /\/(project-tracker|booking|customer-crm|js-foundations|system-design-foundations|effect-search)-/.test(path),
    ),
  ).toBe(false);
  await page
    .getByRole("button", { name: "All activities", exact: true })
    .click();
  await page
    .getByRole("combobox", { name: "Activity type", exact: true })
    .selectOption("Practice drills");
  await expect(page.locator(".effect-milestone-card")).toHaveCount(24);
  await page.getByRole("button", { name: "Next page", exact: true }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(
    page.getByRole("heading", { name: "Activities", exact: true }),
  ).toBeFocused();
  await page.screenshot({
    path: `artifacts/${testInfo.project.name}-effect-activities.png`,
  });
  await page.reload();
  await expect(page.locator(".effect-milestone-card")).toHaveCount(24);
  await expect(page.getByRole("combobox", { name: "Activity type", exact: true })).toHaveValue(
    "Practice drills",
  );
  await page.locator(".effect-milestone-card").first().click();
  await expect(page.getByLabel("What I changed")).toBeVisible();
  expect(requests.some((path) => /\/project-tracker-/.test(path))).toBe(true);
  expect(requests.some((path) => /\/(booking|customer-crm|js-foundations|distributed-reliability)-/.test(path))).toBe(
    false,
  );
  await expect(
    page.getByRole("link", { name: "Review the build milestone" }),
  ).toBeVisible();
});
