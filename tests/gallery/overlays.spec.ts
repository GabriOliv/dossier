import { readFileSync } from "node:fs";
import { devices, expect, test, type Page } from "@playwright/test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Button } from "../../src/components/Button";
import { Dialog, type DialogProps } from "../../src/components/Dialog";
import { Menu } from "../../src/components/Menu";

// Computed styles of the overlays in each theme. Each test renders a component on a blank page that holds
// dist/styles.css under the theme, and opens it in the page the way the component does.
const THEMES = ["paper", "void", "blueprint"] as const;
const css = readFileSync("dist/styles.css", "utf8");

async function open(page: Page, theme: string, markup: string): Promise<void> {
  // The viewport meta of the gallery, so a phone lays the page out at its own width.
  await page.setContent(
    `<!doctype html><html data-theme="${theme}"><head><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>${markup}</body></html>`,
  );
  await page.addStyleTag({ content: css });
}
const dialog = (props: Partial<DialogProps> = {}) =>
  renderToStaticMarkup(
    createElement(
      Dialog,
      {
        open: true,
        onClose: () => {},
        title: "Excluir arquivo",
        description: "O arquivo relatorio-final-2026.pdf sai da pasta e não pode ser recuperado depois.",
        actions: [
          createElement(Button, { key: "c" }, "Cancelar"),
          createElement(Button, { key: "d", variant: "solid", tone: "danger" }, "Excluir"),
        ],
        ...props,
      },
      "Os links compartilhados deixam de funcionar.",
    ),
  );
const menu = () =>
  renderToStaticMarkup(
    createElement(Menu, {
      id: "menu",
      trigger: createElement(Button, null, "Ações"),
      items: [
        { label: "Editar", onSelect: () => {} },
        { label: "Excluir", onSelect: () => {}, tone: "danger" },
      ],
    }),
  );
const showModal = (page: Page) => page.$eval("dialog", (d: HTMLDialogElement) => d.showModal());
/** What `property: value` computes to on an element of the page. */
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

for (const theme of THEMES) {
  test(`DLG-11 the open Dialog has a hatched opaque backdrop, no shadow and a 2px border, ${theme}`, async ({
    page,
  }) => {
    await open(page, theme, dialog());
    await showModal(page);
    const s = await page.$eval("dialog", (d) => {
      const own = getComputedStyle(d);
      const back = getComputedStyle(d, "::backdrop");
      return {
        image: back.backgroundImage,
        backOpacity: back.opacity,
        opacity: own.opacity,
        shadow: own.boxShadow,
        widths: [own.borderTopWidth, own.borderRightWidth, own.borderBottomWidth, own.borderLeftWidth],
        style: own.borderTopStyle,
      };
    });
    const ruleSoft = await computed(page, "color", "var(--ds-rule-soft)");
    expect(s.image).toMatch(/^repeating-linear-gradient\(45deg, /);
    expect(s.image).toContain(ruleSoft);
    expect(s.backOpacity).toBe("1");
    expect(s.opacity).toBe("1");
    expect(s.shadow).toBe("none");
    expect(s.widths).toEqual(["2px", "2px", "2px", "2px"]);
    expect(s.style).toBe("solid");
    // Only the hatch lines paint: no colour of the backdrop is translucent.
    for (const alpha of s.image.matchAll(/rgba\([^)]*,\s*([\d.]+)\)/g)) expect(Number(alpha[1])).toBe(0);
  });

  test(`OVL-34 at the gallery-phone width the Dialog fits the window with no horizontal page scroll, ${theme}`, async ({
    page,
  }) => {
    await page.setViewportSize(devices["Pixel 7"].viewport);
    await open(page, theme, dialog());
    await showModal(page);
    const fit = await page.$eval("dialog", (d) => {
      const r = d.getBoundingClientRect();
      const root = document.documentElement;
      return { left: r.left, right: r.right, width: root.clientWidth, scroll: root.scrollWidth };
    });
    expect(fit.width).toBe(devices["Pixel 7"].viewport.width);
    expect(fit.left).toBeGreaterThanOrEqual(0);
    expect(fit.right).toBeLessThanOrEqual(fit.width);
    expect(fit.scroll).toBeLessThanOrEqual(fit.width);
  });

  test(`MNU-08 the text of a danger item computes to --ds-contrast-error, ${theme}`, async ({ page }) => {
    await open(page, theme, menu());
    await page.$eval("#menu", (m: HTMLElement) => m.showPopover());
    const color = (name: string) => page.getByRole("menuitem", { name }).evaluate((el) => getComputedStyle(el).color);
    const error = await computed(page, "color", "var(--ds-contrast-error)");
    expect(await color("Excluir")).toBe(error);
    // An item without the tone keeps the ink.
    expect(await color("Editar")).toBe(await computed(page, "color", "var(--ds-ink)"));
    expect(error).not.toBe(await computed(page, "color", "var(--ds-ink)"));
  });
}
