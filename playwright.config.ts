import { defineConfig, devices } from "@playwright/test";

const isContinuousIntegration = Boolean(process.env.CI);
// Production is the reproducible default. Build first; opt into development
// explicitly for local iteration rather than accidentally testing dev output.
const useProductionServer = process.env.PLAYWRIGHT_SERVER !== "development";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: isContinuousIntegration,
  retries: isContinuousIntegration ? 2 : 0,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ["json", { outputFile: "test-results/results.json" }],
  ],
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: "http://127.0.0.1:3100",
    headless: true,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    ...(process.env.PLAYWRIGHT_CHROME === "1"
      ? [
          {
            name: "chrome",
            use: { ...devices["Desktop Chrome"], channel: "chrome" },
          },
        ]
      : []),
  ],
  webServer: {
    command: `npm run ${useProductionServer ? "start" : "dev"} -- --hostname 127.0.0.1 --port 3100`,
    url: "http://127.0.0.1:3100",
    // A production verification must never silently reuse a development server.
    reuseExistingServer: !isContinuousIntegration && !useProductionServer,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
