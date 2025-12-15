import { test, expect } from "@playwright/test";

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
      path: "test-results/screenshots/homepage.png",
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
      path: "test-results/screenshots/songbook.png",
      fullPage: true,
    });
  },
);
