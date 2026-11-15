import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

const consumer = !!process.env.PW_CONSUMER;
const storybookURL = "http://127.0.0.1:4320/";
const landingURL = "http://127.0.0.1:4310/dossier/";

// Projects named with --project (or --project=<name>); empty means every project.
const argv = process.argv.slice(2);
const selected = argv.flatMap((a, i) =>
  a.startsWith("--project=") ? [a.slice(10)] : a === "--project" && argv[i + 1] ? [argv[i + 1]] : [],
);
const wants = (...names: string[]) => selected.length === 0 || selected.some((p) => names.includes(p));
// The browser projects read the built Storybook; the site project reads the built landing.
const storybook = wants("component", "visual", "visual-phone", "a11y", "docs");
const landing = wants("site") && existsSync("site/vite.config.ts");

// References are made only in the container, so their paths carry no platform suffix.
const screenshots = "{testDir}/__screenshots__/{projectName}/{arg}{ext}";

export default defineConfig({
  reporter: "list",
  fullyParallel: true,
  workers: "80%",
  forbidOnly: !!process.env.CI,
  // A missing reference fails; only the test:visual:update and test:markup:update scripts write references.
  updateSnapshots: "none",
  expect: { toHaveScreenshot: { maxDiffPixels: 0 } },
  projects: [
    { name: "unit", testDir: "tests/unit", snapshotPathTemplate: "{testDir}/__snapshots__/{arg}{ext}" },
    { name: "consumer", testDir: "tests/consumer", use: { ...devices["Desktop Chrome"] } },
    // Browser projects by kind: each opens the built Storybook (4320) or the built landing (4310).
    { name: "component", testDir: "tests/component", use: { ...devices["Desktop Chrome"], baseURL: storybookURL } },
    {
      name: "visual",
      testDir: "tests/visual",
      testIgnore: /visual-phone\.spec\.ts$/,
      snapshotPathTemplate: screenshots,
      use: { ...devices["Desktop Chrome"], baseURL: storybookURL },
    },
    {
      name: "visual-phone",
      testDir: "tests/visual",
      testIgnore: /visual\.spec\.ts$/,
      snapshotPathTemplate: screenshots,
      use: { ...devices["Pixel 7"], baseURL: storybookURL },
    },
    { name: "a11y", testDir: "tests/a11y", use: { ...devices["Desktop Chrome"], baseURL: storybookURL } },
    { name: "docs", testDir: "tests/docs", use: { ...devices["Desktop Chrome"], baseURL: storybookURL } },
    { name: "site", testDir: "tests/site", use: { ...devices["Desktop Chrome"], baseURL: landingURL } },
  ],
  webServer: [
    // The consumer fixtures are served only for the consumer project (npm run test:consumer).
    ...(consumer
      ? [
          {
            command: "npm --prefix fixtures/vite run preview",
            url: "http://127.0.0.1:4301",
            reuseExistingServer: false,
          },
          {
            command: "npm --prefix fixtures/docusaurus run serve -- --dir build --port 4302 --host 127.0.0.1 --no-open",
            url: "http://127.0.0.1:4302",
            reuseExistingServer: false,
          },
          {
            command:
              "npm --prefix fixtures/docusaurus run serve -- --dir build-plain --port 4303 --host 127.0.0.1 --no-open",
            url: "http://127.0.0.1:4303",
            reuseExistingServer: false,
          },
        ]
      : []),
    // The landing is served for the site project, once site/ exists.
    ...(landing
      ? [
          {
            command: "npx vite preview --config site/vite.config.ts --host 127.0.0.1 --port 4310 --strictPort",
            url: landingURL,
            reuseExistingServer: false,
          },
        ]
      : []),
    // The built Storybook is served for the browser projects.
    ...(storybook
      ? [
          {
            command:
              "npx vite preview --config .storybook/vite.config.ts --outDir storybook-static --host 127.0.0.1 --port 4320 --strictPort",
            url: storybookURL,
            reuseExistingServer: false,
          },
        ]
      : []),
  ],
});
