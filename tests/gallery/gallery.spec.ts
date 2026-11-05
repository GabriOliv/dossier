import { expect, test, type Page } from "@playwright/test";
import { fileURLToPath } from "node:url";

// Root selector that proves each component rendered.
const ROOTS: Record<string, string> = {
  DataHeader: ".ds-header",
  SectionTitle: ".ds-section",
  Readout: ".ds-readout",
  Tag: ".ds-tag",
  DataTable: ".ds-table",
  FieldList: ".ds-fields",
  Schematic: "svg.ds-schematic",
  Hierarchy: ".ds-tree",
  Quote: ".ds-quote",
  Footnotes: ".ds-notes",
  StatusFlag: ".ds-flag",
  CheckLog: ".ds-checklog",
  StageIcon: "svg.ds-stage",
};

const PAPER: Record<string, string> = { paper: "#f4f4f1", void: "#0a0b0d", blueprint: "#0f3270" };

async function libraryExports(): Promise<string[]> {
  const mod = await import(fileURLToPath(new URL("../../dist/index.js", import.meta.url)));
  return Object.keys(mod)
    .filter((k) => typeof mod[k] === "function")
    .sort();
}

const paperToken = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--paper").trim().toLowerCase());

test("GAL-01 sections equal the function exports of dist/index.js", async ({ page }) => {
  const exported = await libraryExports();
  expect(exported).toHaveLength(13);
  await page.goto(".");
  const pairs = await page
    .locator("section[data-component]")
    .evaluateAll((els) => els.map((e) => [e.id, e.getAttribute("data-component")]));
  for (const [id, comp] of pairs) expect(id).toBe(comp);
  expect(pairs.map((p) => p[0]).sort()).toEqual(exported);
});

test("GAL-02 every section renders at least one component root", async ({ page }) => {
  await page.goto(".");
  for (const name of await libraryExports()) {
    const sel = ROOTS[name];
    expect(sel, `no root selector for ${name}`).toBeTruthy();
    await expect(page.locator(`section#${name} > h2`)).toHaveText(name);
    await expect(page.locator(`section#${name}`).locator(sel).first(), name).toBeAttached();
  }
});

for (const theme of ["paper", "void", "blueprint"]) {
  test(`GAL-03 no console or page errors on load (${theme})`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(`?theme=${theme}`);
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await page.waitForLoadState("networkidle");
    expect(errors).toEqual([]);
  });
}

test("GAL-04 the theme selector switches data-theme and tokens", async ({ page }) => {
  await page.goto("?theme=paper");
  expect(await paperToken(page)).toBe(PAPER.paper);
  for (const [theme, label] of [
    ["void", "Void"],
    ["blueprint", "Blueprint"],
    ["paper", "Paper"],
  ]) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    expect(await paperToken(page)).toBe(PAPER[theme]);
  }
});

test("GAL-05 ?theme=blueprint works", async ({ page }) => {
  await page.goto("?theme=blueprint");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "blueprint");
  expect(await paperToken(page)).toBe(PAPER.blueprint);
  await expect(page.getByRole("button", { name: "Blueprint" })).toHaveAttribute("aria-pressed", "true");
});

test("GAL-06 the theme choice persists across reload", async ({ page }) => {
  await page.goto(".");
  await page.getByRole("button", { name: "Void", exact: true }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "void");
  expect(await paperToken(page)).toBe(PAPER.void);
});

test("GAL-07 IBM Plex fonts load locally", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (r) => /fonts\.(googleapis|gstatic)\.com/.test(r.url()) && external.push(r.url()));
  await page.goto(".");
  const loaded = await page.evaluate(async () => {
    await Promise.all([
      document.fonts.load('500 16px "IBM Plex Mono"'),
      document.fonts.load('700 16px "IBM Plex Sans Condensed"'),
    ]);
    const has = (family: string, weight: string) =>
      [...document.fonts].some(
        (f) => f.family.replace(/"/g, "") === family && f.weight === weight && f.status === "loaded",
      );
    return [
      document.fonts.check('500 16px "IBM Plex Mono"'),
      document.fonts.check('700 16px "IBM Plex Sans Condensed"'),
      has("IBM Plex Mono", "500"),
      has("IBM Plex Sans Condensed", "700"),
    ];
  });
  expect(loaded).toEqual([true, true, true, true]);
  expect(external).toEqual([]);
});

test("GAL-08 no horizontal page scroll", async ({ page }, info) => {
  test.skip(info.project.name !== "gallery-phone", "phone project only");
  await page.goto(".");
  await page.waitForLoadState("networkidle");
  const m = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: window.innerWidth }));
  expect(m.sw).toBeLessThanOrEqual(m.iw);
});

test("GAL-09 nav links jump to the section", async ({ page }) => {
  await page.goto(".");
  for (const name of ["Tag", "StageIcon"]) {
    await page.getByRole("navigation", { name: "Components" }).getByRole("link", { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`#${name}$`));
    await expect(page.locator(`section#${name}`)).toBeInViewport();
  }
});
