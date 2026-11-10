import { defineConfig, devices } from "@playwright/test";

const consumer = !!process.env.PW_CONSUMER;
const gallery = !!process.env.PW_GALLERY;
const galleryURL = "http://127.0.0.1:4310/dossier/";
const storybook = !!process.env.PW_STORYBOOK;
const storybookURL = "http://127.0.0.1:4320/";

// References are made only in the container, so their paths carry no platform suffix.
const screenshots = "{testDir}/__screenshots__/{projectName}/{arg}{ext}";

export default defineConfig({
  reporter: "list",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // A missing reference fails; only the test:visual:update and test:markup:update scripts write references.
  updateSnapshots: "none",
  expect: { toHaveScreenshot: { maxDiffPixels: 0 } },
  projects: [
    { name: "unit", testDir: "tests/unit", snapshotPathTemplate: "{testDir}/__snapshots__/{arg}{ext}" },
    { name: "consumer", testDir: "tests/consumer", use: { ...devices["Desktop Chrome"] } },
    {
      name: "gallery",
      testDir: "tests/gallery",
      testIgnore: /visual-phone\.spec\.ts$/,
      snapshotPathTemplate: screenshots,
      use: { ...devices["Desktop Chrome"], baseURL: galleryURL },
    },
    {
      name: "gallery-phone",
      testDir: "tests/gallery",
      testIgnore: /visual\.spec\.ts$/,
      snapshotPathTemplate: screenshots,
      use: { ...devices["Pixel 7"], baseURL: galleryURL },
    },
    // The built Storybook (npm run build:storybook), served from storybook-static for the docs pages.
    { name: "storybook", testDir: "tests/storybook", use: { ...devices["Desktop Chrome"], baseURL: storybookURL } },
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
    // The gallery is served only for the gallery projects (npm run test:gallery).
    ...(gallery
      ? [
          {
            command: "npx vite preview --config gallery/vite.config.ts --host 127.0.0.1 --port 4310 --strictPort",
            url: galleryURL,
            reuseExistingServer: false,
          },
        ]
      : []),
    // The built Storybook is served only for the storybook project (PW_STORYBOOK=1).
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
