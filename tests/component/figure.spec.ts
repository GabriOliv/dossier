import { readFileSync } from "node:fs";
import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, type Page } from "@playwright/test";
import { Figure, type FigureProps } from "../../src/components/Figure";

// The Figure look: legend over a rule, the image as wide as the figure, the caption in body type (FIG-05 to FIG-10).
const css = readFileSync("dist/styles.css", "utf8");
const THEMES = ["paper", "void"] as const;
/** A 1 x 1 PNG: an image that loads without a server, stretched by the figure. */
const PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

/** A blank page in `theme` with the package styles and a Figure with an image and a caption in a box `width` px wide. */
async function openFigure(page: Page, theme: string, width: number, props: Partial<FigureProps> = {}) {
  const children = createElement(
    Fragment,
    null,
    createElement("img", { src: PIXEL, alt: "A pixel", height: 40 }),
    createElement("figcaption", null, "Tokens feed the components."),
  );
  const markup = renderToStaticMarkup(
    createElement(Figure, { n: 3, title: "Dossier structure", meta: "Rev A", children, ...props }),
  );
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.setContent(
    `<!doctype html><html data-theme="${theme}"><body style="margin:0"><div style="width:${width}px">${markup}</div></body></html>`,
  );
  await page.addStyleTag({ content: css });
}

/** What `property: value` computes to on the page: a token as the browser reads it. */
const computed = (page: Page, property: string, value: string) =>
  page.evaluate(
    ([p, v]) => {
      const probe = document.body.appendChild(document.createElement("i"));
      probe.style.setProperty(p, v);
      if (p.startsWith("border")) probe.style.borderStyle = "solid";
      const out = getComputedStyle(probe).getPropertyValue(p);
      probe.remove();
      return out;
    },
    [property, value],
  );

const box = (page: Page, selector: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((e) => e.getBoundingClientRect().toJSON());

for (const theme of THEMES) {
  test(`FIG-05 the legend is a label in ink-muted over a rule, uppercase, ${theme}`, async ({ page }) => {
    await openFigure(page, theme, 800);
    const legend = await page.locator(".ds-fig-legend").evaluate((e) => {
      const s = getComputedStyle(e);
      return {
        font: [s.fontFamily, s.fontSize, s.lineHeight, s.fontWeight, s.letterSpacing],
        color: s.color,
        transform: s.textTransform,
        rule: [s.borderBottomStyle, s.borderBottomWidth, s.borderBottomColor],
        others: [s.borderTopStyle, s.borderLeftStyle, s.borderRightStyle],
      };
    });
    // The label type style, as a bare .ds-t-label reads it.
    const label = await page.evaluate(() => {
      const probe = document.body.appendChild(document.createElement("span"));
      probe.className = "ds-t-label";
      const s = getComputedStyle(probe);
      const out = [s.fontFamily, s.fontSize, s.lineHeight, s.fontWeight, s.letterSpacing];
      probe.remove();
      return out;
    });
    expect(legend.font).toEqual(label);
    expect(legend.color).toBe(await computed(page, "color", "var(--ds-ink-muted)"));
    expect(legend.transform).toBe("uppercase");
    expect(legend.rule).toEqual([
      "solid",
      await computed(page, "border-bottom-width", "var(--ds-stroke-rule)"),
      await computed(page, "color", "var(--ds-rule)"),
    ]);
    expect(legend.others).toEqual(["none", "none", "none"]);
    // The rule sits between the legend and the image.
    expect((await box(page, "img")).top).toBeGreaterThanOrEqual((await box(page, ".ds-fig-legend")).bottom);
  });

  test(`FIG-03 the meta sits at the right end of the legend row, after the title, ${theme}`, async ({ page }) => {
    await openFigure(page, theme, 800);
    const legend = await box(page, ".ds-fig-legend");
    const title = await box(page, ".ds-fig-title");
    const meta = await box(page, ".ds-fig-meta");
    expect(Math.abs(meta.right - legend.right)).toBeLessThanOrEqual(1);
    expect(meta.left).toBeGreaterThanOrEqual(title.right);
    expect(Math.abs(meta.top - title.top)).toBeLessThanOrEqual(1);
  });

  test(`FIG-06 an image child is a block as wide as the figure, ${theme}`, async ({ page }) => {
    await openFigure(page, theme, 640);
    const fig = await box(page, ".ds-fig");
    const img = await box(page, "img");
    expect(await page.locator("img").evaluate((e) => getComputedStyle(e).display)).toBe("block");
    expect(fig.width).toBe(640);
    expect(img.left).toBe(fig.left);
    expect(img.width).toBe(fig.width);
  });

  test(`FIG-07 the caption sits under the image in body type and ink, ${theme}`, async ({ page }) => {
    await openFigure(page, theme, 640);
    const cap = await page.locator("figcaption").evaluate((e) => {
      const s = getComputedStyle(e);
      return { font: [s.fontSize, s.lineHeight, s.fontWeight], family: s.fontFamily, color: s.color };
    });
    expect(cap.font).toEqual(["14px", "21px", "400"]);
    expect(cap.family).toMatch(/^"?IBM Plex Sans"?,/);
    expect(cap.color).toBe(await computed(page, "color", "var(--ds-ink)"));
    expect((await box(page, "figcaption")).top).toBeGreaterThanOrEqual((await box(page, "img")).bottom);
  });

  test(`FIG-10 at 320 px the meta wraps under the title and nothing overflows the figure, ${theme}`, async ({
    page,
  }) => {
    await openFigure(page, theme, 320, { title: "Fatores que influenciam o esforço de teste", meta: "Garden · Rev A" });
    const title = await box(page, ".ds-fig-title");
    const meta = await box(page, ".ds-fig-meta");
    expect(meta.top).toBeGreaterThanOrEqual(title.bottom);
    const over = await page.locator(".ds-fig").evaluate((fig) => {
      const right = fig.getBoundingClientRect().right;
      return {
        scroll: fig.scrollWidth - fig.clientWidth,
        past: [...fig.querySelectorAll("*")].filter((e) => e.getBoundingClientRect().right > right + 0.5).length,
      };
    });
    expect(over).toEqual({ scroll: 0, past: 0 });
  });
}
