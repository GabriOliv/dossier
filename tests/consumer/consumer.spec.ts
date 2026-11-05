import { existsSync, lstatSync, readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

// Served by playwright.config.ts when PW_CONSUMER is set (npm run test:consumer builds them first).
const VITE = "http://127.0.0.1:4301/";
const DOCU = "http://127.0.0.1:4302";
const PLAIN = "http://127.0.0.1:4303";

/** Computed properties compared between the two hosts, on every element inside each probe. */
const PROPS = [
  "display",
  "position",
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "line-height",
  "letter-spacing",
  "text-transform",
  "text-align",
  "white-space",
  "vertical-align",
  "color",
  "background-color",
  "border-top-width",
  "border-top-style",
  "border-top-color",
  "border-right-width",
  "border-right-style",
  "border-right-color",
  "border-bottom-width",
  "border-bottom-style",
  "border-bottom-color",
  "border-left-width",
  "border-left-style",
  "border-left-color",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "list-style-type",
  "box-shadow",
  "fill",
  "stroke",
  "stroke-width",
];

/** Collects console errors and uncaught page errors, which is where React reports hydration mismatches. */
function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
}

async function probeStyles(page: Page) {
  await page.locator("[data-slice]").waitFor();
  await page.evaluate(() => document.fonts.ready);
  return page.evaluate((props) => {
    const out: Record<string, { path: string; style: Record<string, string> }[]> = {};
    for (const probe of document.querySelectorAll<HTMLElement>("[data-slice] [data-probe]")) {
      out[probe.dataset.probe!] = [...probe.querySelectorAll("*")].map((el, i) => {
        const cs = getComputedStyle(el);
        const style: Record<string, string> = {};
        for (const p of props) style[p] = cs.getPropertyValue(p);
        return { path: `${i} ${el.tagName.toLowerCase()}.${el.getAttribute("class") ?? ""}`, style };
      });
    }
    return out;
  }, PROPS);
}

test("CONS-01 both fixtures install the packed tarball, not a link, and render the same slice", () => {
  for (const dir of ["fixtures/vite", "fixtures/docusaurus"]) {
    const pkg = `${dir}/node_modules/@gabrioliv/dossier`;
    expect(lstatSync(pkg).isSymbolicLink(), pkg).toBe(false);
    expect(existsSync(`${pkg}/dist/index.js`)).toBe(true);
    expect(existsSync(`${pkg}/src`), "only dist and docs are packed").toBe(false);
  }
  expect(readFileSync("fixtures/docusaurus/src/components/Slice.tsx", "utf8")).toBe(
    readFileSync("fixtures/vite/src/Slice.tsx", "utf8"),
  );
});

test("CONS-02 vite build and docusaurus build produced the pages", () => {
  expect(existsSync("fixtures/vite/dist/index.html")).toBe(true);
  expect(existsSync("fixtures/docusaurus/build/slice/index.html")).toBe(true);
  expect(existsSync("fixtures/docusaurus/build/mermaid/index.html")).toBe(true);
  expect(existsSync("fixtures/docusaurus/build-plain/mermaid/index.html")).toBe(true);
  // The static HTML is server-rendered: the slice is in it before any script runs.
  expect(readFileSync("fixtures/docusaurus/build/slice/index.html", "utf8")).toContain('class="ds-table"');
});

for (const [name, url] of [
  ["vite /", VITE],
  ["docusaurus /slice", `${DOCU}/slice`],
  ["docusaurus /", `${DOCU}/`],
  ["docusaurus /mermaid", `${DOCU}/mermaid`],
]) {
  test(`CONS-03 no console or hydration error on ${name}`, async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(url);
    await page.waitForLoadState("networkidle");
    if (url.endsWith("/mermaid")) await page.locator(".docusaurus-mermaid-container svg").waitFor();
    expect(errors).toEqual([]);
  });
}

test("CONS-04 computed styles are the same in the Vite and the Docusaurus fixture", async ({ browser }) => {
  const vite = await browser.newPage();
  const docu = await browser.newPage();
  await vite.goto(VITE);
  await docu.goto(`${DOCU}/slice`);
  const [a, b] = await Promise.all([probeStyles(vite), probeStyles(docu)]);
  expect(Object.keys(b).sort()).toEqual(Object.keys(a).sort());
  expect(a.DataTable.length).toBeGreaterThan(20);
  expect(a.DataHeader.some((e) => e.path.includes("h1.ds-t-display ds-header-title"))).toBe(true);
  const diffs: string[] = [];
  for (const [probe, els] of Object.entries(a)) {
    expect(
      b[probe].map((e) => e.path),
      probe,
    ).toEqual(els.map((e) => e.path));
    els.forEach((el, i) => {
      for (const p of PROPS) {
        if (el.style[p] !== b[probe][i].style[p]) {
          diffs.push(`${probe} ${el.path} ${p}: vite=${el.style[p]} docusaurus=${b[probe][i].style[p]}`);
        }
      }
    });
  }
  expect(diffs).toEqual([]);
});

async function mermaidLabels(page: Page, url: string) {
  await page.goto(url);
  const svg = page.locator(".docusaurus-mermaid-container svg");
  await svg.waitFor();
  return svg.evaluate((el) =>
    [...el.querySelectorAll(".label, .nodeLabel, .edgeLabel")].map((n) => {
      const cs = getComputedStyle(n);
      return `${n.getAttribute("class")}: ${cs.fontSize} ${cs.letterSpacing}`;
    }),
  );
}

test("CONS-05 Mermaid labels keep their font-size and letter-spacing with the package", async ({ browser }) => {
  const plain = await mermaidLabels(await browser.newPage(), `${PLAIN}/mermaid`);
  const withPkg = await mermaidLabels(await browser.newPage(), `${DOCU}/mermaid`);
  expect(plain.length).toBeGreaterThan(0);
  expect(plain.some((l) => l.startsWith("label"))).toBe(true);
  expect(withPkg).toEqual(plain);
});

test("CONS-06 with the dark theme active, --paper resolves to Void's #0a0b0d; Blueprint works per block", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("theme", "dark"));
  await page.goto(`${DOCU}/slice`);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const paper = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--paper").trim(),
  );
  expect(paper).toBe("#0a0b0d");
  // Infima paints the page ground on html, through the bridged --ifm-background-color.
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)).toBe("rgb(10, 11, 13)");
  const blueprint = await page
    .locator('[data-probe="blueprint"]')
    .evaluate((el) => getComputedStyle(el).getPropertyValue("--paper").trim());
  expect(blueprint).toBe("#0f3270");
});

test("CONS-06 in the light theme --paper stays Paper's #f4f4f1", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("theme", "light"));
  await page.goto(`${DOCU}/slice`);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  const paper = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--paper").trim(),
  );
  expect(paper).toBe("#f4f4f1");
});

async function focusAndBody(page: Page, url: string) {
  await page.goto(url);
  await page.locator("#focus-target, a").first().waitFor();
  const target = (await page.locator("#focus-target").count()) ? "#focus-target" : "article a";
  await page.locator(target).first().focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  return page.evaluate(() => {
    const a = document.activeElement as HTMLElement;
    const f = getComputedStyle(a);
    const b = getComputedStyle(document.body);
    return {
      focusVisible: a.matches(":focus-visible"),
      outlineStyle: f.outlineStyle,
      boxShadow: f.boxShadow,
      bodyMargin: b.margin,
      bodyFont: b.fontFamily,
      bodyBackground: b.backgroundColor,
    };
  });
}

test("CONS-07 without base.css the Vite page keeps the browser's body and :focus-visible", async ({ page }) => {
  const r = await focusAndBody(page, VITE);
  expect(r.focusVisible).toBe(true);
  expect(r.boxShadow).toBe("none");
  expect(r.outlineStyle).not.toBe("none");
  expect(r.bodyMargin).toBe("8px");
  expect(r.bodyBackground).toBe("rgba(0, 0, 0, 0)");
  expect(r.bodyFont).not.toContain("IBM Plex");
});

test("CONS-07 the Docusaurus site keeps its own :focus-visible and body margin with the package", async ({
  browser,
}) => {
  const plain = await focusAndBody(await browser.newPage(), `${PLAIN}/`);
  const withPkg = await focusAndBody(await browser.newPage(), `${DOCU}/`);
  expect(withPkg.focusVisible).toBe(true);
  expect({ o: withPkg.outlineStyle, s: withPkg.boxShadow, m: withPkg.bodyMargin }).toEqual({
    o: plain.outlineStyle,
    s: plain.boxShadow,
    m: plain.bodyMargin,
  });
});

test("CONS-08 no style in the slice depends on the source order of the library's rules", async ({ page }) => {
  // Docusaurus minifies CSS with clean-css restructureRules, which moves rules that share declarations. A rule that
  // wins only by coming later (same specificity) then loses. Reversing every rule must change nothing.
  await page.goto(VITE);
  const normal = await probeStyles(page);
  await page.evaluate(() => {
    const sheet = [...document.styleSheets].find((s) => [...s.cssRules].some((r) => r.cssText.includes(".ds-tag")))!;
    const reversed = new CSSStyleSheet();
    reversed.replaceSync(
      [...sheet.cssRules]
        .map((r) => r.cssText)
        .reverse()
        .join("\n"),
    );
    sheet.disabled = true;
    document.adoptedStyleSheets = [reversed];
  });
  const reversed = await probeStyles(page);
  const diffs: string[] = [];
  for (const [probe, els] of Object.entries(normal)) {
    els.forEach((el, i) => {
      for (const p of PROPS) {
        const r = reversed[probe][i].style[p];
        if (el.style[p] !== r) diffs.push(`${probe} ${el.path} ${p}: in order=${el.style[p]} reversed=${r}`);
      }
    });
  }
  expect(diffs).toEqual([]);
});
