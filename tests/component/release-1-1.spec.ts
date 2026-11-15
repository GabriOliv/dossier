import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { openStory, section, THEMES } from "../support/story";

// The two changes of 1.1.0: FieldList rows on a phone, and a link that looks like a button.
const css = readFileSync("dist/styles.css", "utf8");
const docusaurusCss = readFileSync("dist/docusaurus.css", "utf8");

/** A blank page in `theme` with the styles of the package and `markup` in the body. */
async function open(page: Page, theme: string, markup: string): Promise<void> {
  await page.setContent(`<!doctype html><html data-theme="${theme}"><body>${markup}</body></html>`);
  await page.addStyleTag({ content: css });
  await page.mouse.move(0, 0); // a pointer left over a previous page would hover the new link
}

/** Infima's link rule, unlayered like the Docusaurus host's: it hovers every `a` red and underlined. */
const HOST_RULE = "a:hover { color: red; text-decoration: underline }";

/** A blank Docusaurus page: `dist/docusaurus.css` and the host's unlayered `a:hover`, with `markup` in the body. */
async function openHost(page: Page, theme: string, markup: string): Promise<void> {
  await page.setContent(`<!doctype html><html data-theme="${theme}"><body>${markup}</body></html>`);
  await page.addStyleTag({ content: docusaurusCss });
  await page.addStyleTag({ content: HOST_RULE });
  await page.mouse.move(0, 0);
}

/** What `property: value` computes to on the page: a token as the browser reads it. */
const computed = (page: Page, property: string, value: string) =>
  page.evaluate(
    ([p, v]) => {
      const probe = document.body.appendChild(document.createElement("i"));
      probe.style.setProperty(p, v);
      const out = getComputedStyle(probe).getPropertyValue(p);
      probe.remove();
      return out;
    },
    [property, value],
  );

for (const theme of THEMES) {
  test(`V11-01 below 640 px each FieldList row shows its label above its value, ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await openStory(page, "FieldList", theme);
    const rows = section(page, "FieldList").locator(".ds-field");
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const label = (await row.locator(".ds-field-label, .ds-field-term").first().boundingBox())!;
      const value = (await row.locator(".ds-field-value").first().boundingBox())!;
      // The value starts below the bottom of the label, at the same left edge.
      expect(value.y, `row ${i} value under label`).toBeGreaterThanOrEqual(label.y + label.height - 1);
      expect(value.x, `row ${i} same left edge`).toBeCloseTo(label.x, 0);
    }
  });

  test(`V11-01 from 640 px up a FieldList row keeps its label beside its value, ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 900, height: 800 });
    await openStory(page, "FieldList", theme);
    const row = section(page, "FieldList").locator(".ds-field").first();
    const label = (await row.locator(".ds-field-label").boundingBox())!;
    const value = (await row.locator(".ds-field-value").boundingBox())!;
    expect(value.x).toBeGreaterThan(label.x + label.width - 1);
  });

  test(`V11-02 a hovered solid link button keeps the on-signal text and has no underline, ${theme}`, async ({
    page,
  }) => {
    await open(page, theme, '<a class="ds-btn ds-btn-solid" href="#x">Open</a>');
    const link = page.locator("a.ds-btn");
    await link.hover();
    await expect(link).toHaveCSS("color", await computed(page, "color", "var(--ds-on-signal)"));
    expect(await link.evaluate((el) => getComputedStyle(el).textDecorationLine)).toBe("none");
  });

  test(`V11-02 in a Docusaurus host each hovered a.ds-btn variant keeps its own color and has no underline, ${theme}`, async ({
    page,
  }) => {
    await openHost(
      page,
      theme,
      '<a class="ds-btn ds-btn-outline" href="#a">One</a><a class="ds-btn ds-btn-solid" href="#b">Two</a><a class="ds-btn ds-btn-text" href="#c">Three</a>',
    );
    const own = ["var(--ds-ink)", "var(--ds-on-signal)", "var(--ds-signal)"];
    const links = page.locator("a.ds-btn");
    for (let i = 0; i < own.length; i++) {
      await links.nth(i).hover();
      await expect(links.nth(i), `variant ${i}`).toHaveCSS("color", await computed(page, "color", own[i]));
      expect(await links.nth(i).evaluate((el) => getComputedStyle(el).textDecorationLine), `variant ${i}`).toBe("none");
    }
  });

  test(`V11-03 an a.ds-btn computes display inline-flex, ${theme}`, async ({ page }) => {
    await open(
      page,
      theme,
      '<a class="ds-btn" href="#a">One</a><a class="ds-btn ds-btn-solid" href="#b">Two</a><a class="ds-btn ds-btn-text" href="#c">Three</a>',
    );
    const links = page.locator("a.ds-btn");
    await expect(links).toHaveCount(3);
    for (let i = 0; i < 3; i++) await expect(links.nth(i)).toHaveCSS("display", "inline-flex");
  });
}
