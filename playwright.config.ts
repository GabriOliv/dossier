import { defineConfig, devices } from "@playwright/test";

const consumer = !!process.env.PW_CONSUMER;
const gallery = !!process.env.PW_GALLERY;
const galleryURL = "http://127.0.0.1:4310/dossier/";

export default defineConfig({
  reporter: "list",
  forbidOnly: !!process.env.CI,
  projects: [
    { name: "unit", testDir: "tests/unit" },
    { name: "consumer", testDir: "tests/consumer", use: { ...devices["Desktop Chrome"] } },
    { name: "gallery", testDir: "tests/gallery", use: { ...devices["Desktop Chrome"], baseURL: galleryURL } },
    { name: "gallery-phone", testDir: "tests/gallery", use: { ...devices["Pixel 7"], baseURL: galleryURL } },
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
  ],
});
