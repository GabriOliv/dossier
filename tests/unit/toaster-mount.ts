import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Page } from "@playwright/test";
import { build, type Rollup } from "vite";

const path = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const react19 = path("../react19/node_modules/");
const bundles = new Map<boolean, Promise<string>>();

/** toaster-entry.tsx as one iife script, with the root React 18 or with React 19 from tests/react19. */
function bundle(useReact19: boolean): Promise<string> {
  if (!bundles.has(useReact19)) {
    const out = build({
      configFile: false,
      logLevel: "silent",
      publicDir: false,
      esbuild: { jsx: "automatic" },
      define: { "process.env.NODE_ENV": JSON.stringify("production") },
      resolve: useReact19 ? { alias: [{ find: /^(react(-dom)?)(\/.*)?$/, replacement: react19 + "$1$3" }] } : {},
      build: {
        write: false,
        minify: false,
        lib: { entry: path("./toaster-entry.tsx"), formats: ["iife"], name: "DossierToaster" },
      },
    }).then((r) => ((Array.isArray(r) ? r[0] : r) as Rollup.RollupOutput).output[0].code);
    bundles.set(useReact19, out);
  }
  return bundles.get(useReact19)!;
}

/**
 * A blank page under `theme` with `dist/styles.css`, the gallery's viewport meta (so a phone lays it out at its own
 * width) and the bundle for that React version, which defines `window.mountToaster`, `unmountToaster` and `toast`.
 */
export async function loadToaster(page: Page, useReact19: boolean, theme = "paper"): Promise<void> {
  // A new document each time: after setContent replaces a document, Chromium stops sending pointerout and
  // pointerleave for the elements of the next one.
  await page.goto("about:blank");
  await page.setContent(
    `<!doctype html><html data-theme="${theme}"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body></body></html>`,
  );
  await page.addStyleTag({ content: readFileSync("dist/styles.css", "utf8") });
  await page.addScriptTag({ content: await bundle(useReact19) });
}

/** Mounts a `<Toaster {...props} />` (plain data only) in a new container and returns the container's id. */
export async function mountToaster(page: Page, props: Record<string, unknown> = {}): Promise<string> {
  return (await page.evaluate((p) => (window as any).mountToaster(p), props)).id;
}

/** Calls the package's `toast(options)` in the page and returns its id. */
export function toast(page: Page, options: Record<string, unknown>): Promise<string | null> {
  return page.evaluate((o) => (window as any).toast(o), options);
}

const VERSIONS = [
  [false, "18."],
  [true, "19."],
] as const;

/** Loads a fresh page with React 18, runs `run`, then does the same with React 19. */
export async function onEachReact(page: Page, run: () => Promise<void>): Promise<void> {
  for (const [react19, major] of VERSIONS) {
    await loadToaster(page, react19);
    const version: string = await page.evaluate(() => (window as any).reactVersion);
    if (!version.startsWith(major)) throw new Error(`React ${version}, expected ${major}`);
    await run();
  }
}
