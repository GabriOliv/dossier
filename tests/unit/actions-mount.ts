import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { Page } from "@playwright/test";
import { build, type Rollup } from "vite";

const path = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const react19 = path("../react19/node_modules/");
const bundles = new Map<boolean, Promise<string>>();

/** actions-entry.tsx as one iife script, with the root React 18 or with React 19 from tests/react19. */
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
        lib: { entry: path("./actions-entry.tsx"), formats: ["iife"], name: "DossierActions" },
      },
    }).then((r) => ((Array.isArray(r) ? r[0] : r) as Rollup.RollupOutput).output[0].code);
    bundles.set(useReact19, out);
  }
  return bundles.get(useReact19)!;
}

/** A blank page with `dist/styles.css` and the bundle for that React version, which defines `window.mountAction`. */
export async function loadActions(page: Page, useReact19: boolean): Promise<void> {
  await page.setContent("<!doctype html><html><body></body></html>");
  await page.addStyleTag({ content: readFileSync("dist/styles.css", "utf8") });
  await page.addScriptTag({ content: await bundle(useReact19) });
}

/** Mounts `name` with `props` (plain data only) in a new container; each prop named in `handlers` counts its calls. */
export function mountAction(
  page: Page,
  name: string,
  props: Record<string, unknown> = {},
  handlers: string[] = [],
): Promise<{ version: string; id: string }> {
  return page.evaluate(([n, p, h]) => (window as any).mountAction(n, p, h), [name, props, handlers] as const);
}

/** How many times each handler of the component mounted in container `id` was called. */
export function actionCalls(page: Page, id: string): Promise<Record<string, number>> {
  return page.evaluate((i) => (window as any).actionCalls[i], id);
}

/** Renders the component in container `id` again with `props` (plain data only), keeping its counted handlers. */
export function rerenderAction(page: Page, id: string, props: Record<string, unknown> = {}): Promise<void> {
  return page.evaluate(([i, p]) => (window as any).rerenderAction(i, p), [id, props] as const);
}
