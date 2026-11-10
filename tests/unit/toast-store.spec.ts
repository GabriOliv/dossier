import { fileURLToPath } from "node:url";
import { expect, test, type Page } from "@playwright/test";
import { build, type Rollup } from "vite";

// The toast queue of src/lib/toast-store.ts, bundled as `window.ToastStore` on a blank page. The page clock is paused,
// so only page.clock.runFor moves the timers.
let code: Promise<string> | undefined;
const bundle = () =>
  (code ??= build({
    configFile: false,
    logLevel: "silent",
    publicDir: false,
    build: {
      write: false,
      minify: false,
      lib: {
        entry: fileURLToPath(new URL("../../src/lib/toast-store.ts", import.meta.url)),
        formats: ["iife"],
        name: "ToastStore",
      },
    },
  }).then((r) => ((Array.isArray(r) ? r[0] : r) as Rollup.RollupOutput).output[0].code));

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-08T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-11-08T00:00:01Z"));
  await page.setContent("<!doctype html><html><body></body></html>");
  await page.addScriptTag({ content: await bundle() });
});

/** Calls `ToastStore[fn](...args)` in the page; `ToastStore.owners[name]` is one object per Toaster name. */
const call = (page: Page, fn: string, ...args: unknown[]) =>
  page.evaluate(([f, a]) => (window as any).ToastStore[f](...a), [fn, args] as const);
const add = (page: Page, options: Record<string, unknown>) => call(page, "add", options) as Promise<string | null>;
const dismiss = (page: Page, id: string) => call(page, "dismiss", id);
/** Registers the Toaster `name`, as a Toaster does on mount. */
const claim = (page: Page, name = "a") =>
  page.evaluate((n) => {
    const w = window as any;
    w.owners ??= {};
    w.releases ??= {};
    w.owners[n] = { name: n };
    w.releases[n] = w.ToastStore.claim(w.owners[n]);
  }, name);
const release = (page: Page, name = "a") => page.evaluate((n) => (window as any).releases[n](), name);
/** The titles on screen. */
const shown = (page: Page) =>
  page.evaluate(() => (window as any).ToastStore.snapshot().toasts.map((t: { title: string }) => t.title));

/** From here on, counts the timers that fire. */
const countFired = (page: Page) =>
  page.evaluate(() => {
    const w = window as any;
    const start = w.setTimeout;
    w.fired = 0;
    w.setTimeout = (fn: () => void, ms: number) => start(() => (w.fired++, fn()), ms);
  });
const fired = (page: Page) => page.evaluate(() => (window as any).fired as number);
const owner = (page: Page) => page.evaluate(() => (window as any).ToastStore.snapshot().owner?.name as string);

test("TST-04 a default toast closes 6 s after it shows, and a duration sets that time", async ({ page }) => {
  await claim(page);
  await add(page, { title: "Arquivo salvo" });
  await page.clock.runFor(5999);
  expect(await shown(page)).toEqual(["Arquivo salvo"]);
  await page.clock.runFor(1);
  expect(await shown(page)).toEqual([]);
  await add(page, { title: "Copiado", duration: 2000 });
  await page.clock.runFor(1999);
  expect(await shown(page)).toEqual(["Copiado"]);
  await page.clock.runFor(1);
  expect(await shown(page)).toEqual([]);
});

test("TST-05 a paused toast keeps its time, and on resume closes after what was left", async ({ page }) => {
  await claim(page);
  const id = await add(page, { title: "Arquivo salvo" });
  await page.clock.runFor(2000);
  await call(page, "pause", id);
  await page.clock.runFor(60_000);
  expect(await shown(page)).toEqual(["Arquivo salvo"]);
  await call(page, "resume", id);
  await page.clock.runFor(3999);
  expect(await shown(page)).toEqual(["Arquivo salvo"]);
  await page.clock.runFor(1);
  expect(await shown(page)).toEqual([]);
});

test("TST-05 repeated pauses each keep what was left", async ({ page }) => {
  await claim(page);
  const id = await add(page, { title: "Arquivo salvo" });
  for (const ms of [1000, 1000, 1000]) {
    await page.clock.runFor(ms);
    await call(page, "pause", id);
    // A second pause while paused changes nothing.
    await call(page, "pause", id);
    await page.clock.runFor(10_000);
    await call(page, "resume", id);
  }
  // 3 s ran, 3 s are left.
  await page.clock.runFor(2999);
  expect(await shown(page)).toEqual(["Arquivo salvo"]);
  await page.clock.runFor(1);
  expect(await shown(page)).toEqual([]);
});

test("TST-06 an error toast and a toast with duration Infinity never close by themselves", async ({ page }) => {
  await claim(page);
  await add(page, { title: "Falha", tone: "error" });
  await add(page, { title: "Falha curta", tone: "error", duration: 1000 });
  await add(page, { title: "Fixo", duration: Infinity });
  await page.clock.runFor(24 * 3600_000);
  expect(await shown(page)).toEqual(["Falha", "Falha curta", "Fixo"]);
});

test("TST-08 dismiss closes the toast of that id and keeps the others", async ({ page }) => {
  await claim(page);
  await add(page, { title: "Um" });
  const two = await add(page, { title: "Dois", tone: "error" });
  await add(page, { title: "Três" });
  expect(typeof two).toBe("string");
  await dismiss(page, two!);
  expect(await shown(page)).toEqual(["Um", "Três"]);
  // The others keep their own time.
  await page.clock.runFor(6000);
  expect(await shown(page)).toEqual([]);
});

test("TST-09 of five toasts three show, and each one that closes lets the next in, in order of arrival", async ({
  page,
}) => {
  await claim(page);
  const ids = [];
  for (const title of ["1", "2", "3", "4", "5"]) ids.push(await add(page, { title }));
  expect(await shown(page)).toEqual(["1", "2", "3"]);
  await page.clock.runFor(1000);
  await dismiss(page, ids[0]!);
  expect(await shown(page)).toEqual(["2", "3", "4"]);
  // 2 and 3 close at 6 s; 4 showed at 1 s, so it closes at 7 s; 5 showed at 6 s.
  await page.clock.runFor(5000);
  expect(await shown(page)).toEqual(["4", "5"]);
  await page.clock.runFor(999);
  expect(await shown(page)).toEqual(["4", "5"]);
  await page.clock.runFor(1);
  expect(await shown(page)).toEqual(["5"]);
  await page.clock.runFor(4999);
  expect(await shown(page)).toEqual(["5"]);
  await page.clock.runFor(1);
  expect(await shown(page)).toEqual([]);
});

test("TST-10 a toast queued before any Toaster shows once one registers, and its time starts then", async ({
  page,
}) => {
  await add(page, { title: "Arquivo salvo" });
  expect(await page.evaluate(() => (window as any).ToastStore.snapshot().owner)).toBeNull();
  await page.clock.runFor(60_000);
  await claim(page);
  expect(await page.evaluate(() => (window as any).ToastStore.snapshot().owner.name)).toBe("a");
  expect(await shown(page)).toEqual(["Arquivo salvo"]);
  await page.clock.runFor(5999);
  expect(await shown(page)).toEqual(["Arquivo salvo"]);
  await page.clock.runFor(1);
  expect(await shown(page)).toEqual([]);
});

test("FBL-30 with two Toasters registered, the first one owns the toasts", async ({ page }) => {
  await claim(page, "a");
  await claim(page, "b");
  await add(page, { title: "Arquivo salvo" });
  expect(await page.evaluate(() => (window as any).ToastStore.snapshot().owner.name)).toBe("a");
  expect(await shown(page)).toEqual(["Arquivo salvo"]);
});

test("FBL-31 a toast with an empty title is not created and returns null", async ({ page }) => {
  await claim(page);
  const before = await page.evaluate(() => {
    const w = window as any;
    w.calls = 0;
    w.ToastStore.subscribe(() => w.calls++);
    w.before = w.ToastStore.snapshot();
    return w.before.toasts.length;
  });
  expect(before).toBe(0);
  expect(await add(page, { title: "" })).toBeNull();
  expect(await page.evaluate(() => (window as any).ToastStore.snapshot() === (window as any).before)).toBe(true);
  expect(await page.evaluate(() => (window as any).calls)).toBe(0);
});

test("FBL-32 dismiss with an unknown id changes nothing and throws nothing", async ({ page }) => {
  await claim(page);
  await add(page, { title: "Arquivo salvo" });
  await page.evaluate(() => {
    const w = window as any;
    w.calls = 0;
    w.ToastStore.subscribe(() => w.calls++);
    w.before = w.ToastStore.snapshot();
  });
  await dismiss(page, "ds-toast-999");
  expect(await page.evaluate(() => (window as any).ToastStore.snapshot() === (window as any).before)).toBe(true);
  expect(await page.evaluate(() => (window as any).calls)).toBe(0);
  expect(await shown(page)).toEqual(["Arquivo salvo"]);
  // Dismissing a toast twice is the same as an unknown id.
  const id = await add(page, { title: "Dois" });
  await dismiss(page, id!);
  await dismiss(page, id!);
  expect(await shown(page)).toEqual(["Arquivo salvo"]);
});

test("FBL-33 once the last Toaster unregisters, its toasts and their timers are dropped", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await countFired(page);
  await claim(page);
  for (const title of ["1", "2", "3", "4"]) await add(page, { title });
  await release(page);
  expect(await shown(page)).toEqual([]);
  await page.clock.runFor(60_000);
  // A timer left running would only call dismiss with an id that is gone, so count them.
  expect(await fired(page)).toBe(0);
  // A Toaster mounted later finds none of them.
  await claim(page, "b");
  expect(await shown(page)).toEqual([]);
  expect(errors).toEqual([]);
});

test("FBL-33 a Toaster that unregisters and registers again in the same task keeps its toasts", async ({ page }) => {
  await claim(page);
  await add(page, { title: "Arquivo salvo" });
  await page.clock.runFor(2000);
  // React's StrictMode runs the effect cleanup, then the effect again.
  await page.evaluate(() => {
    const w = window as any;
    w.releases.a();
    w.releases.a = w.ToastStore.claim(w.owners.a);
  });
  // A later evaluate runs in a later task, after the microtasks of the one above.
  expect(await shown(page)).toEqual(["Arquivo salvo"]);
  await page.clock.runFor(3999);
  expect(await shown(page)).toEqual(["Arquivo salvo"]);
  await page.clock.runFor(1);
  expect(await shown(page)).toEqual([]);
});

test("FBL-42 when the owner unregisters and another Toaster stays, the toasts and timers are dropped", async ({
  page,
}) => {
  await countFired(page);
  await claim(page, "a");
  await claim(page, "b");
  // A paused toast too: it must not reach the other Toaster, where nothing would ever resume it.
  const paused = await add(page, { title: "1" });
  await call(page, "pause", paused);
  for (const title of ["2", "3", "4"]) await add(page, { title });
  await release(page, "a");
  expect(await owner(page)).toBe("b");
  expect(await shown(page)).toEqual([]);
  await page.clock.runFor(60_000);
  expect(await fired(page)).toBe(0);
  // A later toast shows in the other Toaster, with its whole time.
  await add(page, { title: "Depois" });
  expect(await shown(page)).toEqual(["Depois"]);
  await page.clock.runFor(5999);
  expect(await shown(page)).toEqual(["Depois"]);
  await page.clock.runFor(1);
  expect(await shown(page)).toEqual([]);
});

test("FBL-42 a Toaster that is not the owner unregisters and nothing is dropped", async ({ page }) => {
  await claim(page, "a");
  await claim(page, "b");
  await add(page, { title: "Arquivo salvo" });
  await page.clock.runFor(2000);
  await release(page, "b");
  expect(await owner(page)).toBe("a");
  expect(await shown(page)).toEqual(["Arquivo salvo"]);
  await page.clock.runFor(3999);
  expect(await shown(page)).toEqual(["Arquivo salvo"]);
  await page.clock.runFor(1);
  expect(await shown(page)).toEqual([]);
});

test("FBL-42 an owner that registers again in the same task keeps its toasts with another Toaster mounted", async ({
  page,
}) => {
  await claim(page, "a");
  await claim(page, "b");
  await add(page, { title: "Arquivo salvo" });
  await page.clock.runFor(2000);
  await page.evaluate(() => {
    const w = window as any;
    w.releases.a();
    w.releases.a = w.ToastStore.claim(w.owners.a);
  });
  expect(await owner(page)).toBe("a");
  expect(await shown(page)).toEqual(["Arquivo salvo"]);
  await page.clock.runFor(3999);
  expect(await shown(page)).toEqual(["Arquivo salvo"]);
  await page.clock.runFor(1);
  expect(await shown(page)).toEqual([]);
});

test("FBL-39 a duration above 2147483647 keeps the toast open; 2147483647 itself still closes it", async ({ page }) => {
  await claim(page);
  await add(page, { title: "Longo", duration: 2 ** 31 });
  await add(page, { title: "Enorme", duration: Number.MAX_SAFE_INTEGER });
  await page.clock.runFor(60_000);
  expect(await shown(page)).toEqual(["Longo", "Enorme"]);
  await add(page, { title: "No limite", duration: 2147483647 });
  await page.clock.runFor(2147483646);
  expect(await shown(page)).toEqual(["Longo", "Enorme", "No limite"]);
  await page.clock.runFor(1);
  expect(await shown(page)).toEqual(["Longo", "Enorme"]);
});
