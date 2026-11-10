import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Button, type ButtonProps } from "../../src/components/Button";
import { Link } from "../../src/components/Link";

// Computed styles of the action components in each theme. Each test renders the components on a blank page that
// holds dist/styles.css under the theme, so a case is measured alone, away from the gallery layout.
const THEMES = ["paper", "void", "blueprint"] as const;
const css = readFileSync("dist/styles.css", "utf8");

/** A blank page in `theme` with the styles of the package and `markup` in the body. */
async function open(page: Page, theme: string, markup: string): Promise<void> {
  await page.setContent(`<!doctype html><html data-theme="${theme}"><body>${markup}</body></html>`);
  await page.addStyleTag({ content: css });
  await page.mouse.move(0, 0); // a pointer left over a previous page would hover the new button
}
const button = (props: ButtonProps) => renderToStaticMarkup(createElement(Button, { children: "Salvar", ...props }));
const style = (page: Page, selector: string, property: string) =>
  page.$eval(selector, (el, p) => getComputedStyle(el).getPropertyValue(p), property);
/** What `property: value` computes to on an element of the page: a token name or a colour as the browser reads it. */
const computed = (page: Page, property: string, value: string) =>
  page.evaluate(
    ([p, v]) => {
      const probe = document.body.appendChild(document.createElement("i"));
      probe.style.setProperty(p, v);
      const out = getComputedStyle(probe).getPropertyValue(p);
      probe.remove();
      return out;
    },
    [property, value] as const,
  );
const MIX = (accent: string) => `color-mix(in srgb, var(${accent}) 85%, var(--ds-ink))`;

for (const theme of THEMES) {
  test(`BTN-02 a solid Button is filled with signal and its text is on-signal, and hover and press mix in ink, ${theme}`, async ({
    page,
  }) => {
    await open(page, theme, button({ variant: "solid" }));
    expect(await style(page, "button", "background-color")).toBe(
      await computed(page, "background-color", "var(--ds-signal)"),
    );
    expect(await style(page, "button", "color")).toBe(await computed(page, "color", "var(--ds-on-signal)"));
    const mixed = await computed(page, "background-color", MIX("--ds-signal"));
    expect(mixed).not.toBe(await computed(page, "background-color", "var(--ds-signal)"));
    await page.hover("button");
    expect(await style(page, "button", "background-color")).toBe(mixed);
    expect(await style(page, "button", "border-top-color")).toBe(mixed);
    await page.mouse.move(0, 0);
    expect(await style(page, "button", "background-color")).not.toBe(mixed);
    // Pressed with the keyboard, the pointer elsewhere: Space held down on the focused button.
    await page.keyboard.press("Tab");
    await page.keyboard.down("Space");
    expect(await style(page, "button", "background-color")).toBe(mixed);
    await page.keyboard.up("Space");
  });

  test(`BTN-03 a text Button has no visible border and signal text, and the panel shows on hover, ${theme}`, async ({
    page,
  }) => {
    await open(page, theme, button({ variant: "text" }));
    expect(await style(page, "button", "color")).toBe(await computed(page, "color", "var(--ds-signal)"));
    expect(await style(page, "button", "border-top-color")).toBe("rgba(0, 0, 0, 0)");
    expect(await style(page, "button", "background-color")).toBe("rgba(0, 0, 0, 0)");
    await page.hover("button");
    expect(await style(page, "button", "background-color")).toBe(
      await computed(page, "background-color", "var(--ds-panel)"),
    );
    await page.mouse.move(0, 0);
    await page.keyboard.press("Tab");
    await page.keyboard.down("Space");
    expect(await style(page, "button", "background-color")).toBe(
      await computed(page, "background-color", "var(--ds-panel)"),
    );
    await page.keyboard.up("Space");
  });

  test(`BTN-04 an outline Button is ink on a square hair border; danger turns every variant to contrast-error, ${theme}`, async ({
    page,
  }) => {
    await open(page, theme, button({}));
    const ink = await computed(page, "color", "var(--ds-ink)");
    const error = await computed(page, "color", "var(--ds-contrast-error)");
    expect(error).not.toBe(ink);
    expect(await style(page, "button", "color")).toBe(ink);
    expect(await style(page, "button", "border-top-color")).toBe(ink);
    expect(await style(page, "button", "border-top-width")).toBe("1px");
    expect(await style(page, "button", "border-top-left-radius")).toBe("0px");
    expect(await style(page, "button", "background-color")).toBe("rgba(0, 0, 0, 0)");
    await page.hover("button");
    expect(await style(page, "button", "background-color")).toBe(
      await computed(page, "background-color", "var(--ds-panel)"),
    );
    await page.mouse.move(0, 0);
    await page.keyboard.press("Tab");
    await page.keyboard.down("Space");
    expect(await style(page, "button", "background-color")).toBe(
      await computed(page, "background-color", "var(--ds-panel)"),
    );
    await page.keyboard.up("Space");

    await open(page, theme, button({ tone: "danger" }));
    expect(await style(page, "button", "color")).toBe(error);
    expect(await style(page, "button", "border-top-color")).toBe(error);

    await open(page, theme, button({ variant: "text", tone: "danger" }));
    expect(await style(page, "button", "color")).toBe(error);

    await open(page, theme, button({ variant: "solid", tone: "danger" }));
    expect(await style(page, "button", "background-color")).toBe(error);
    expect(await style(page, "button", "border-top-color")).toBe(error);
    expect(await style(page, "button", "color")).toBe(await computed(page, "color", "var(--ds-on-signal)"));
    const mixed = await computed(page, "background-color", MIX("--ds-contrast-error"));
    await page.hover("button");
    expect(await style(page, "button", "background-color")).toBe(mixed);
  });

  test(`BTN-09 a Button focused by keyboard shows the focus ring, in every variant, ${theme}`, async ({ page }) => {
    for (const variant of ["outline", "solid", "text"] as const) {
      await open(page, theme, button({ variant }));
      expect(await style(page, "button", "box-shadow"), "before focus").toBe("none");
      await page.keyboard.press("Tab");
      expect(await style(page, "button", "box-shadow"), variant).toBe(
        await computed(page, "box-shadow", "var(--ds-focus-ring)"),
      );
      expect(await style(page, "button", "outline-style"), variant).toBe("none");
    }
  });
}

test("BTN-06 a Button with size sm is shorter than the standard one with the same text", async ({ page }) => {
  await open(page, "paper", button({ id: "a" } as ButtonProps) + button({ size: "sm", id: "b" } as ButtonProps));
  const [standard, small] = await Promise.all(
    ["#a", "#b"].map(async (s) => (await page.locator(s).boundingBox())!.height),
  );
  expect(small).toBeLessThan(standard);
  expect(small).toBeGreaterThanOrEqual(24);
  for (const id of ["#a", "#b"])
    expect(await style(page, id, "padding-left")).toBe(await computed(page, "width", "var(--ds-space-4)"));
});

// A Link and a plain `<a class="ds-link">` side by side, as a router's link would be.
const links =
  renderToStaticMarkup(createElement(Link, { href: "#a", id: "component", children: "Documentation" })) +
  '<a href="#b" id="plain" class="ds-link">Documentation</a>';

for (const theme of THEMES) {
  test(`LNK-02 a Link is signal-coloured and underlined, ${theme}`, async ({ page }) => {
    await open(page, theme, links);
    // A host's own `a` rule, in a layer below the components, as a reset or Infima would be.
    await page.addStyleTag({ content: "@layer dossier.base { a { color: rgb(255, 0, 0); text-decoration: none; } }" });
    const signal = await computed(page, "color", "var(--ds-signal)");
    expect(signal).not.toBe(await computed(page, "color", "var(--ds-ink)"));
    expect(await style(page, "#component", "color")).toBe(signal);
    expect(await style(page, "#component", "text-decoration-line")).toBe("underline");
  });

  test(`LNK-04 a Link focused by keyboard shows the focus ring and no outline, ${theme}`, async ({ page }) => {
    await open(page, theme, links);
    expect(await style(page, "#component", "box-shadow"), "before focus").toBe("none");
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.id)).toBe("component");
    expect(await style(page, "#component", "box-shadow")).toBe(
      await computed(page, "box-shadow", "var(--ds-focus-ring)"),
    );
    expect(await style(page, "#component", "outline-style")).toBe("none");
  });

  test(`LNK-03 an a element with class ds-link that is not the Link looks and focuses like the Link, ${theme}`, async ({
    page,
  }) => {
    await open(page, theme, links);
    const read = async (id: string) => ({
      color: await style(page, id, "color"),
      line: await style(page, id, "text-decoration-line"),
      shadow: await style(page, id, "box-shadow"),
    });
    await page.keyboard.press("Tab");
    const component = await read("#component");
    await page.keyboard.press("Tab");
    expect(await page.evaluate(() => document.activeElement?.id)).toBe("plain");
    const plain = await read("#plain");
    expect(component.shadow).not.toBe("none");
    expect(plain).toEqual(component);
  });
}
