import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

// BRG-05: a display formula wider than the column scrolls inside its own block, and the page does not.
const docusaurusCss = readFileSync("dist/docusaurus.css", "utf8");

/** KaTeX's own rule for a display formula (katex.css), unlayered like the host's. */
const KATEX_RULE =
  ".katex-display { display: block; margin: 1em 0; text-align: center } .katex { white-space: nowrap }";

/** A Docusaurus-like page 320 px wide: a paragraph and a display formula far wider than the column. */
async function openFormula(page: Page, theme: string): Promise<void> {
  await page.setViewportSize({ width: 320, height: 640 });
  const terms = Array.from({ length: 40 }, (_, i) => `x_{${i}}`).join(" + ");
  await page.setContent(
    `<!doctype html><html data-theme="${theme}"><body style="margin:0"><article><div class="markdown">` +
      `<p>The total effort is the sum of every term.</p>` +
      `<span class="katex-display"><span class="katex">${terms}</span></span>` +
      `</div></article></body></html>`,
  );
  await page.addStyleTag({ content: docusaurusCss });
  await page.addStyleTag({ content: KATEX_RULE });
}

for (const theme of ["light", "dark"]) {
  test(`BRG-05 a wide display formula scrolls in its own block and the page does not scroll sideways, ${theme}`, async ({
    page,
  }) => {
    await openFormula(page, theme);
    const block = await page.locator(".katex-display").evaluate((el) => {
      const s = getComputedStyle(el);
      return { x: s.overflowX, y: s.overflowY, scrolls: el.scrollWidth > el.clientWidth, width: el.clientWidth };
    });
    expect(block).toEqual({ x: "auto", y: "hidden", scrolls: true, width: 320 });
    const page_ = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(page_).toBe(0);
    // The block scrolls: its far end comes into view.
    const end = await page.locator(".katex-display").evaluate((el) => {
      el.scrollLeft = el.scrollWidth;
      return el.scrollLeft;
    });
    expect(end).toBeGreaterThan(0);
  });
}
