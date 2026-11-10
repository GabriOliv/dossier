import { fileURLToPath } from "node:url";
import type { Page } from "@playwright/test";
import { build, type Rollup } from "vite";

/** What `window.mount` reports: the React version, the container id and text, and what the ref received. */
export interface Mounted {
  version: string;
  id: string;
  text: string;
  /** Tag name of the element the ref received, or null. */
  ref: string | null;
  /** The ref received the container's first element. */
  refIsRoot: boolean;
}

const path = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const react19 = path("../react19/node_modules/");
const bundles = new Map<boolean, Promise<string>>();

/** mount-entry.tsx as one iife script, with the root React 18 or with React 19 from tests/react19. */
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
        lib: { entry: path("./mount-entry.tsx"), formats: ["iife"], name: "DossierMount" },
      },
    }).then((r) => ((Array.isArray(r) ? r[0] : r) as Rollup.RollupOutput).output[0].code);
    bundles.set(useReact19, out);
  }
  return bundles.get(useReact19)!;
}

/** Loads a blank page with the bundle for that React version, which defines `window.mount`. */
export async function load(page: Page, useReact19: boolean): Promise<void> {
  await page.setContent("<!doctype html><html><body></body></html>");
  await page.addScriptTag({ content: await bundle(useReact19) });
}

/**
 * Mounts the library component `name` with `props` (plain data only) and a ref, in a new container. Each prop named
 * in `handlers` gets a call counter, read with `calls`.
 */
export function mount(
  page: Page,
  name: string,
  props: Record<string, unknown> = {},
  handlers: string[] = [],
): Promise<Mounted> {
  return page.evaluate(([n, p, h]) => (window as any).mount(n, p, h), [name, props, handlers] as const);
}

/** How many times each handler of the component mounted in container `id` was called. */
export function calls(page: Page, id: string): Promise<Record<string, number>> {
  return page.evaluate((i) => (window as any).calls[i], id);
}

/** The ref of the component mounted in container `id` received the first element in it that matches `selector`. */
export function refIs(page: Page, id: string, selector: string): Promise<boolean> {
  return page.evaluate(
    ([i, s]) => {
      const el = (window as any).refs[i];
      return el != null && el === document.getElementById(i)!.querySelector(s);
    },
    [id, selector] as const,
  );
}
