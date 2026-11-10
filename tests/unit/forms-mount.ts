import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, type Locator, type Page } from "@playwright/test";
import { build, type Rollup } from "vite";

const path = (p: string) => fileURLToPath(new URL(p, import.meta.url));
const react19 = path("../react19/node_modules/");
const bundles = new Map<boolean, Promise<string>>();

/** forms-entry.tsx as one iife script, with the root React 18 or with React 19 from tests/react19. */
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
        lib: { entry: path("./forms-entry.tsx"), formats: ["iife"], name: "DossierForms" },
      },
    }).then((r) => ((Array.isArray(r) ? r[0] : r) as Rollup.RollupOutput).output[0].code);
    bundles.set(useReact19, out);
  }
  return bundles.get(useReact19)!;
}

/** The React versions every gesture test runs on, with the major its `version` must start with. */
export const VERSIONS = [
  [false, "18."],
  [true, "19."],
] as const;

/** A blank page with the built stylesheet (paper theme) and the bundle for that React version, which defines `window.mountForm`. */
export async function load(page: Page, useReact19: boolean): Promise<void> {
  await page.setContent("<!doctype html><html><head></head><body></body></html>");
  await page.addStyleTag({ content: readFileSync("dist/styles.css", "utf8") });
  await page.addScriptTag({ content: await bundle(useReact19) });
}

/** What `window.mountForm` reports: the React version, the container id and the tag the ref received. */
export interface MountedForm {
  version: string;
  id: string;
  ref: string | null;
}

/** Mounts the form control `name` with `props` (plain data only) and a ref; each prop in `handlers` logs its calls. */
export function mountForm(
  page: Page,
  name: string,
  props: Record<string, unknown> = {},
  handlers: string[] = [],
): Promise<MountedForm> {
  return page.evaluate(([n, p, h]) => (window as any).mountForm(n, p, h), [name, props, handlers] as const);
}

/** Per handler, the `value` and `checked` of the event target at each call of the control mounted in container `id`. */
export function formCalls(page: Page, id: string): Promise<Record<string, { value: string; checked: boolean }[]>> {
  return page.evaluate((i) => (window as any).formCalls[i], id);
}

/** Loads each React version in turn, mounts `name` and runs `run` with the mount result and the container locator. */
export async function onEachReact(
  page: Page,
  name: string,
  props: Record<string, unknown>,
  handlers: string[],
  run: (r: MountedForm, root: Locator) => Promise<void>,
): Promise<void> {
  for (const [react19, major] of VERSIONS) {
    await load(page, react19);
    const r = await mountForm(page, name, props, handlers);
    expect(r.version.startsWith(major), r.version).toBe(true);
    await run(r, page.locator("#" + r.id));
  }
}

/** The ref of the control mounted in container `id` received the first element in it that matches `selector`. */
export function formRefIs(page: Page, id: string, selector: string): Promise<boolean> {
  return page.evaluate(
    ([i, s]) => {
      const el = (window as any).formRefs[i];
      return el != null && el === document.getElementById(i)!.querySelector(s);
    },
    [id, selector] as const,
  );
}
