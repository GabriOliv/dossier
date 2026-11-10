import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Page } from "@playwright/test";
import { build, type Rollup } from "vite";

const path = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const react19 = path("../react19/node_modules/");
const bundles = new Map<boolean, Promise<string>>();

/** disclosure-entry.tsx as one iife script, with the root React 18 or with React 19 from tests/react19. */
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
        lib: { entry: path("./disclosure-entry.tsx"), formats: ["iife"], name: "DossierDisclosure" },
      },
    }).then((r) => ((Array.isArray(r) ? r[0] : r) as Rollup.RollupOutput).output[0].code);
    bundles.set(useReact19, out);
  }
  return bundles.get(useReact19)!;
}

/** A blank page with `dist/styles.css` and the bundle for that React version, which defines `window.mountDisclosure`. */
export async function loadDisclosure(page: Page, useReact19: boolean): Promise<void> {
  // A new document each time: after setContent replaces a document, Chromium stops sending pointerout and
  // pointerleave for the elements of the next one.
  await page.goto("about:blank");
  await page.setContent("<!doctype html><html><body></body></html>");
  await page.addStyleTag({ content: readFileSync("dist/styles.css", "utf8") });
  await page.addScriptTag({ content: await bundle(useReact19) });
}

/** Mounts the scene `name` of disclosure-entry.tsx with `props` (plain data only) in a new container. */
export function mountDisclosure(
  page: Page,
  name: string,
  props: Record<string, unknown> = {},
): Promise<{ version: string; id: string }> {
  return page.evaluate(([n, p]) => (window as any).mountDisclosure(n, p), [name, props] as const);
}

/** How many times each callback of the scene in container `id` was called; a callback never called is missing. */
export function disclosureCalls(page: Page, id: string): Promise<Record<string, number>> {
  return page.evaluate((i) => (window as any).disclosureCalls[i], id);
}

const VERSIONS = [
  [false, "18."],
  [true, "19."],
] as const;

/** Loads a fresh page and mounts the scene with React 18, runs `run`, then does the same with React 19. */
export async function onEachReact(
  page: Page,
  name: string,
  props: Record<string, unknown>,
  run: (id: string) => Promise<void>,
): Promise<void> {
  for (const [react19, major] of VERSIONS) {
    await loadDisclosure(page, react19);
    const r = await mountDisclosure(page, name, props);
    if (!r.version.startsWith(major)) throw new Error(`React ${r.version}, expected ${major}`);
    await run(r.id);
  }
}
