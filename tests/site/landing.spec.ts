import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { devices, expect, test, type Page } from "@playwright/test";

const THEMES = ["paper", "void", "blueprint"] as const;
const LABEL = { paper: "Paper", void: "Void", blueprint: "Blueprint" } as const;
const { version } = JSON.parse(readFileSync("package.json", "utf8")) as {
  version: string;
};
const readme = readFileSync("README.md", "utf8");

/** The landing in `theme`, with the fonts loaded. */
async function open(page: Page, theme?: string): Promise<void> {
  await page.goto(theme ? `?theme=${theme}` : "");
  await expect(page.locator("main")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

test("SITE-01 the landing imports its components from dist/", async ({ page }) => {
  const app = readFileSync("site/src/App.tsx", "utf8");
  const config = readFileSync("site/vite.config.ts", "utf8");
  const from = [...app.matchAll(/from "([^"]+)"/g)].map((m) => m[1]);
  expect(from).toContain("@gabrioliv/dossier");
  expect(from.filter((f) => /src\/|\.\.\//.test(f))).toEqual([]);
  expect(config).toMatch(/"@gabrioliv\/dossier":\s*repo \+ "dist\/index\.js"/);
  await open(page);
  await expect(page.locator(".ds-header")).toBeVisible();
});

test("SITE-02 the install command carries the package.json version", async ({ page }) => {
  await open(page);
  const url = `https://github.com/GabriOliv/dossier/releases/download/v${version}/gabrioliv-dossier-${version}.tgz`;
  await expect(page.locator("pre code").first()).toHaveText(`npm install ${url}`);
});

test("SITE-03 the Storybook link opens /dossier/storybook/", async ({ page }) => {
  await open(page);
  // The landing build does not hold the Storybook (the Pages deploy puts it there): the request is answered by hand.
  await page.route("**/dossier/storybook/", (route) =>
    route.fulfill({ contentType: "text/html", body: "<title>sb</title>" }),
  );
  await page.getByRole("link", { name: "Open the Storybook" }).click();
  await expect(page).toHaveURL(/\/dossier\/storybook\/$/);
});

test("SITE-03 the Storybook link has the type of a Button of the same variant", async ({ page }) => {
  await open(page);
  const type = (el: Element) => {
    const c = getComputedStyle(el);
    return [c.fontFamily, c.fontSize, c.letterSpacing, c.textTransform];
  };
  const link = await page.getByRole("link", { name: "Open the Storybook" }).evaluate(type);
  const button = await page.getByRole("button", { name: "Approve", exact: true }).evaluate(type);
  expect(link).toEqual(button);
});

test("SITE-04 picking a theme sets data-theme on <html>", async ({ page }) => {
  await open(page);
  for (const theme of [...THEMES, "paper" as const]) {
    await page
      .getByRole("button", {
        name: LABEL[theme as keyof typeof LABEL],
        exact: true,
      })
      .click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
  }
});

for (const theme of THEMES) {
  test(`SITE-05 ?theme=${theme} loads the ${theme} theme`, async ({ page }) => {
    await open(page, theme);
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await expect(
      page.getByRole("button", {
        name: LABEL[theme as keyof typeof LABEL],
        exact: true,
      }),
    ).toHaveAttribute("aria-pressed", "true");
  });
}

test("SITE-06 DataHeader, Readout, Timeline and Button render live", async ({ page }) => {
  await open(page);
  await expect(page.locator(".ds-header")).toBeVisible();
  await expect(page.locator(".ds-readout").first()).toBeVisible();
  await expect(page.locator(".ds-timeline")).toBeVisible();
  await expect(page.locator("main button.ds-btn").first()).toBeVisible();
});

test("SITE-07 one Vite and one Docusaurus snippet with the README imports", async ({ page }) => {
  await open(page);
  const code = await page.locator("pre code").allTextContents();
  const vite = code.find((c) => c.includes('import { DataHeader, Readout } from "@gabrioliv/dossier";')) ?? "";
  const docusaurus = code.find((c) => c.includes("docusaurus.css")) ?? "";
  for (const line of [
    'import "@gabrioliv/dossier/styles.css";',
    'import "@gabrioliv/dossier/base.css";',
    'import { DataHeader, Readout } from "@gabrioliv/dossier";',
  ]) {
    expect(readme, line).toContain(line);
    expect(vite, line).toContain(line);
  }
  for (const line of [
    'customCss: [require.resolve("@gabrioliv/dossier/docusaurus.css"), "./src/css/custom.css"],',
    'import { Readout } from "@gabrioliv/dossier";',
  ]) {
    expect(readme, line).toContain(line);
    expect(docusaurus, line).toContain(line);
  }
});

test.describe("on a phone", () => {
  const { defaultBrowserType: _browser, ...pixel7 } = devices["Pixel 7"];
  test.use(pixel7);

  for (const theme of THEMES) {
    test(`SITE-08 no horizontal page scroll on a phone (${theme})`, async ({ page }) => {
      await open(page, theme);
      await page.waitForLoadState("networkidle");
      // innerWidth grows with an overflowing page on a phone, so only clientWidth holds the width of the window.
      const m = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        width: document.documentElement.clientWidth,
      }));
      expect(m.scroll, `scrollWidth ${m.scroll} > clientWidth ${m.width}`).toBeLessThanOrEqual(m.width);
    });
  }

  test("SITE-08 no horizontal page scroll at 320 px, the Timeline wrapping", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await open(page);
    await page.waitForLoadState("networkidle");
    const m = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      width: document.documentElement.clientWidth,
      timeline:
        document.querySelector(".ds-timeline")!.scrollWidth - document.querySelector(".ds-timeline")!.clientWidth,
    }));
    expect(m.scroll, `scrollWidth ${m.scroll} > clientWidth ${m.width}`).toBeLessThanOrEqual(m.width);
    expect(m.timeline, "the Timeline overflows its own box").toBeLessThanOrEqual(0);
    // The Timeline sits in no scroll region: it wraps as in its story.
    await expect(page.getByRole("region", { name: "Timeline sample" })).toHaveCount(0);
  });
});

for (const theme of THEMES) {
  test(`SITE-09 axe finds no WCAG 2.2 AA violation in ${theme}`, async ({ page }) => {
    await open(page, theme);
    const r = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(r.violations.map((v) => `${v.id} at ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`)).toEqual([]);
    expect(new Set(r.passes.map((p) => p.id)).size).toBeGreaterThan(10);
  });
}

test("SITE-10 no console error and no page error on load", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page);
  await page.waitForLoadState("networkidle");
  expect(errors).toEqual([]);
});

test("SITE-11 IBM Plex loads from the site's own origin", async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  const fonts: string[] = [];
  const foreign: string[] = [];
  page.on("request", (r) => {
    if (r.resourceType() === "font") fonts.push(r.url());
    if (!r.url().startsWith(origin) && !r.url().startsWith("data:")) foreign.push(r.url());
  });
  await open(page);
  const loaded = await page.evaluate(async () => {
    await Promise.all([
      document.fonts.load('500 16px "IBM Plex Mono"'),
      document.fonts.load('700 16px "IBM Plex Sans Condensed"'),
    ]);
    return [
      document.fonts.check('500 16px "IBM Plex Mono"'),
      document.fonts.check('700 16px "IBM Plex Sans Condensed"'),
    ];
  });
  expect(loaded).toEqual([true, true]);
  expect(fonts.length).toBeGreaterThan(0);
  expect(foreign).toEqual([]);
});
