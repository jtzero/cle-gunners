import { test, expect } from "@playwright/test";

import { rootPath } from "get-root-path";

test("has title", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/CLE Gunners/);
});

test(
  "take screenshot of homepage",
  { tag: "@screenshot" },
  async ({ page }) => {
    await page.goto("/");
    await page.screenshot({
      path: `${rootPath}/test-results/screenshots/homepage.png`,
      fullPage: true,
    });
  },
);

test(
  "take screenshot of songbook",
  { tag: "@screenshot" },
  async ({ page }) => {
    await page.goto("/songbook");
    await page.screenshot({
      path: `${rootPath}/test-results/screenshots/songbook.png`,
      fullPage: true,
    });
  },
);
