import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { devices, expect, test, type Page } from "@playwright/test";
import { openOverlay, openTheme, OVERLAYS, section, THEMES } from "./visual";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

// A scan of the whole gallery, with 50 sections, takes most of the default 30 s under a full parallel run; the tests
// that scan it several times get room for that. The assertions are the same.
test.beforeEach(() => test.setTimeout(120_000));

/** The WCAG 2.2 AA scan of the whole page: no rule disabled, no element excluded. */
const scan = (page: Page) => new AxeBuilder({ page }).withTags(TAGS).analyze();
type Results = Awaited<ReturnType<typeof scan>>;

/** One line per violation: where it ran, the rule id and the selector of each element it hit. */
const report = (where: string, r: Results) =>
  r.violations.map((v) => `${where}: ${v.id} at ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`).join("\n");

for (const [id, theme] of [
  ["A11Y-01", "paper"],
  ["A11Y-02", "void"],
  ["A11Y-03", "blueprint"],
] as const) {
  test(`${id} axe finds no WCAG 2.2 AA violation with ?theme=${theme}`, async ({ page }, info) => {
    await page.goto(`?theme=${theme}`);
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    const r = await scan(page);
    expect(r.passes.length).toBeGreaterThan(10);
    expect(r.violations, report(`${info.project.name} ${theme}`, r)).toEqual([]);
  });
}

test("A11Y-04 axe finds no violation at phone width in any theme", async ({ browser }) => {
  const context = await browser.newContext({ ...devices["Pixel 7"], baseURL: test.info().project.use.baseURL });
  const page = await context.newPage();
  expect(page.viewportSize()!.width).toBeLessThan(640);
  for (const theme of ["paper", "void", "blueprint"]) {
    await page.goto(`?theme=${theme}`);
    const r = await scan(page);
    expect(r.violations, report(`Pixel 7 ${theme}`, r)).toEqual([]);
  }
  await context.close();
});

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
  await page.goto("?theme=paper");
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
      await openTheme(page, theme);
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
    await openTheme(page, theme);
    // The sections exist, and every state they can show is on the page: the second tab, an opened item, a current page.
    for (const id of ["Tabs", "Accordion", "Pagination"]) await expect(section(page, id), id).toBeVisible();
    const where = `${info.project.name} ${theme}`;
    const loaded = await scan(page);
    expect(loaded.passes.length).toBeGreaterThan(10);
    expect(loaded.violations, report(`${where} as loaded`, loaded)).toEqual([]);
    await section(page, "Tabs").getByRole("tab", { name: "Checks" }).first().click();
    await section(page, "Accordion").locator("summary").first().click();
    await section(page, "Pagination").getByRole("button", { name: "Page 3" }).click();
    await expect(section(page, "Pagination").getByRole("button", { name: "Page 3" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    const used = await scan(page);
    expect(used.violations, report(`${where} after use`, used)).toEqual([]);
  });
}

for (const theme of THEMES) {
  test(`FBL-05 axe finds no WCAG 2.2 AA violation with a toast of each tone open, ${theme}`, async ({ page }, info) => {
    await openTheme(page, theme);
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
