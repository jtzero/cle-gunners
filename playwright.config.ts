import { defineConfig, devices } from "@playwright/test";

import { rootPath } from "get-root-path";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: `${rootPath}/__tests__/e2e`,
  outputDir: `${rootPath}/test-results/work/`,
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  retries: 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { outputFolder: `${rootPath}/test-results/reporter` }]],
  use: {
    baseURL: "http://localhost:4321",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },

    // TODO: add safari
    //{
    //  name: "webkit",
    //  use: { ...devices["Desktop Safari"] },
    //},

    /* Test against mobile viewports. */
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 8"] },
    },
    // TODO:
    // {
    //  name: "Mobile Safari",
    //  use: { ...devices["iPhone 12"] },
    //},

    /* Test against branded browsers. */
    // TODO:
    // {
    //  name: "Microsoft Edge",
    //  use: { ...devices["Desktop Edge"], channel: "msedge" },
    // },
    {
      name: "Google Chrome",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
  },
});
