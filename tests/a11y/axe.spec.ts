import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { devices, expect, test, type Page } from "@playwright/test";
import { openAll, openOverlay, openStory, OVERLAYS, section, SECTIONS, THEMES } from "../support/story";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

// The scans of Overview/All take longer than the default 30 s under a full parallel run; the tests get room for that.
test.beforeEach(() => test.setTimeout(300_000));

/** The WCAG 2.2 AA scan of the whole page: no rule disabled, no element excluded. */
const scan = (page: Page) => new AxeBuilder({ page }).withTags(TAGS).analyze();
type Results = Awaited<ReturnType<typeof scan>>;

/** One line per violation: where it ran, the rule id and the selector of each element it hit. */
const report = (where: string, r: Results) =>
  r.violations.map((v) => `${where}: ${v.id} at ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`).join("\n");

/**
 * Checks every section of Overview/All with a soft assertion: the violations whose element sits in the section, one line
 * each. A violation outside every section is held under "(page)".
 */
async function expectSectionsClean(page: Page, r: Results, where: string): Promise<void> {
  const targets = r.violations.flatMap((v) => v.nodes.map((n) => ({ rule: v.id, target: n.target })));
  const owners = await page.evaluate(
    (list) =>
      list.map((t) =>
        t.length === 1
          ? (document.querySelector(t[0] as string)?.closest("section[data-component], section[data-composition]")
              ?.id ?? "(page)")
          : "(page)",
      ),
    targets.map((t) => t.target),
  );
  const lines = new Map<string, string[]>();
  targets.forEach((t, i) =>
    lines.set(owners[i], [...(lines.get(owners[i]) ?? []), `${t.rule} at ${t.target.join(" ")}`]),
  );
  for (const name of [...SECTIONS, "(page)"]) expect.soft(lines.get(name) ?? [], `${where} ${name}`).toEqual([]);
}

/** Overview/All in `theme`: no violation in any section, and the scan ran enough rules to mean something. */
async function allClean(page: Page, theme: string, project: string) {
  await openAll(page, theme);
  const r = await scan(page);
  await expectSectionsClean(page, r, `${project} ${theme}`);
  expect(new Set(r.passes.map((p) => p.id)).size).toBeGreaterThan(10);
}

test("A11Y-01 axe finds no WCAG 2.2 AA violation with ?theme=paper", async ({ page }, info) => {
  await allClean(page, "paper", info.project.name);
});

test("A11Y-02 axe finds no WCAG 2.2 AA violation with ?theme=void", async ({ page }, info) => {
  await allClean(page, "void", info.project.name);
});

test("A11Y-03 axe finds no WCAG 2.2 AA violation with ?theme=blueprint", async ({ page }, info) => {
  await allClean(page, "blueprint", info.project.name);
});

// One test per theme, in parallel.
for (const theme of THEMES) {
  test(`A11Y-04 axe finds no violation at phone width in any theme (${theme})`, async ({ browser }) => {
    const context = await browser.newContext({ ...devices["Pixel 7"], baseURL: test.info().project.use.baseURL });
    const page = await context.newPage();
    expect(page.viewportSize()!.width).toBeLessThan(640);
    await openAll(page, theme);
    await expectSectionsClean(page, await scan(page), `Pixel 7 ${theme}`);
    await context.close();
  });
}

test("A11Y-05 a violation fails with the rule id and the selector of each element it hits", async ({ page }) => {
  await page.setContent(
    '<!doctype html><html lang="en"><title>x</title><body><main><img id="a" src="a.png"><img class="b" src="b.png"></main></body></html>',
  );
  const r = await scan(page);
  const message = report("sample", r);
  expect(r.violations.map((v) => v.id)).toContain("image-alt");
  expect(message).toContain("sample: image-alt at #a, .b");
});

test("A11Y-06 the scan disables no rule and excludes no element", async ({ page }) => {
  const source = readFileSync(new URL(import.meta.url), "utf8");
  for (const call of ["exclude", "disableRules", "include", "withRules", "options"])
    expect(source, call).not.toContain(`.${call}(`);
  await openStory(page, "DataHeader", "paper");
  const r = await scan(page);
  expect(r.toolOptions.runOnly).toEqual({ type: "tag", values: TAGS });
  expect(r.toolOptions.rules).toBeUndefined();
  // The whole page is scanned: rules that look at the document itself ran on it.
  expect(r.passes.map((p) => p.id)).toEqual(expect.arrayContaining(["document-title", "html-has-lang"]));
});

test("A11Y-30 a violation names the project and theme it appears in", async ({ page }, info) => {
  await page.setContent(
    '<!doctype html><html lang="en"><title>x</title><body><main><img id="a" src="a.png"></main></body></html>',
  );
  const message = report(`${info.project.name} paper`, await scan(page));
  expect(message).toBe(`${info.project.name} paper: image-alt at #a`);
});

for (const theme of THEMES) {
  test(`OVL-06 axe finds no WCAG 2.2 AA violation with each of Dialog, Popover, Tooltip and Menu open, ${theme}`, async ({
    page,
  }, info) => {
    for (const id of OVERLAYS) {
      await openStory(page, id, theme);
      const panel = await openOverlay(page, id);
      await expect(panel, `${id} is open`).toBeVisible();
      const r = await scan(page);
      expect(r.passes.length, id).toBeGreaterThan(10);
      expect(r.violations, report(`${info.project.name} ${theme} ${id} open`, r)).toEqual([]);
    }
  });
}

for (const theme of THEMES) {
  test(`DIS-05 axe finds no WCAG 2.2 AA violation in the Tabs, Accordion and Pagination sections, as loaded and used, ${theme}`, async ({
    page,
  }, info) => {
    // Each section has its story; every state it can show is on the page: the second tab, an opened item, a current page.
    const where = `${info.project.name} ${theme}`;
    for (const id of ["Tabs", "Accordion", "Pagination"]) {
      await openStory(page, id, theme);
      await expect(section(page, id), id).toBeVisible();
      const loaded = await scan(page);
      expect(loaded.passes.length).toBeGreaterThan(10);
      expect(loaded.violations, report(`${where} ${id} as loaded`, loaded)).toEqual([]);
      if (id === "Tabs") await section(page, id).getByRole("tab", { name: "Checks" }).first().click();
      if (id === "Accordion") await section(page, id).locator("summary").first().click();
      if (id === "Pagination") {
        await section(page, id).getByRole("button", { name: "Page 3" }).click();
        await expect(section(page, id).getByRole("button", { name: "Page 3" })).toHaveAttribute("aria-current", "page");
      }
      const used = await scan(page);
      expect(used.violations, report(`${where} ${id} after use`, used)).toEqual([]);
    }
  });
}

for (const theme of THEMES) {
  test(`FBL-05 axe finds no WCAG 2.2 AA violation with a toast of each tone open, ${theme}`, async ({ page }, info) => {
    await openStory(page, "Toaster", theme);
    const toaster = section(page, "Toaster");
    // A toast that stays (duration Infinity) and an error, which never closes by itself.
    await toaster.getByRole("button", { name: "Assign", exact: true }).click();
    await toaster.getByRole("button", { name: "Upload", exact: true }).click();
    const region = page.getByRole("region", { name: "Notifications" });
    await expect(region.getByRole("status").locator(".ds-toast")).toHaveCount(1);
    await expect(region.getByRole("alert").locator(".ds-toast-error")).toHaveCount(1);
    for (const t of await region.locator(".ds-toast").all()) await expect(t).toBeInViewport();
    const r = await scan(page);
    expect(r.passes.length).toBeGreaterThan(10);
    expect(r.violations, report(`${info.project.name} ${theme} with toasts open`, r)).toEqual([]);
  });
}
