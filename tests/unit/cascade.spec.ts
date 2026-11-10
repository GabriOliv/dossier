import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { createElement, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Readout } from "../../src/components/Readout";
import { Tag } from "../../src/components/Tag";

const css = (file: string) => readFileSync(`dist/${file}`, "utf8");
const RED = "rgb(255, 0, 0)";

/** A blank page with `markup` in the body and each style sheet added in order: a dist file name or raw CSS. */
async function open(page: Page, markup: ReactElement | string, sheets: string[]): Promise<void> {
  await page.setContent(
    `<!doctype html><html><head></head><body>${typeof markup === "string" ? markup : renderToStaticMarkup(markup)}</body></html>`,
  );
  for (const sheet of sheets) await page.addStyleTag({ content: sheet.endsWith(".css") ? css(sheet) : sheet });
}
const style = (page: Page, selector: string, property: string) =>
  page.$eval(selector, (el, p) => getComputedStyle(el).getPropertyValue(p), property);

const tag = createElement(Tag, { children: "Live" });

test("STY-04 an unlayered consumer rule after styles.css wins over the Tag without specificity", async ({ page }) => {
  await open(page, tag, ["styles.css"]);
  expect(await style(page, ".ds-tag", "color")).not.toBe(RED);
  await open(page, tag, ["styles.css", `span { color: ${RED} }`]);
  expect(await style(page, ".ds-tag", "color")).toBe(RED);
});

test("STY-05 an unlayered body rule after styles.css and base.css wins over base.css", async ({ page }) => {
  await open(page, "", ["styles.css", "base.css"]);
  expect(await style(page, "body", "background-color")).toBe("rgb(244, 244, 241)");
  await open(page, "", ["styles.css", "base.css", "body { background-color: rgb(0, 128, 0) }"]);
  expect(await style(page, "body", "background-color")).toBe("rgb(0, 128, 0)");
});

test("STY-06 with docusaurus.css the same span rule does not change the Tag", async ({ page }) => {
  await open(page, tag, ["docusaurus.css"]);
  const before = await style(page, ".ds-tag", "color");
  await open(page, tag, ["docusaurus.css", `span { color: ${RED} }`]);
  const after = await style(page, ".ds-tag", "color");
  expect(after).not.toBe(RED);
  expect(after).toBe(before);
  expect(after).toBe("rgb(11, 12, 14)");
});

test("STY-13 inside data-theme=void on a Paper page, var(--paper) is the Void paper", async ({ page }) => {
  const probe = '<div data-theme="void"><i id="probe" style="background-color: var(--paper)"></i></div>';
  await open(page, `<i id="outside" style="background-color: var(--paper)"></i>${probe}`, ["styles.css"]);
  expect(await style(page, "#outside", "background-color")).toBe("rgb(244, 244, 241)");
  expect(await style(page, "#probe", "background-color")).toBe("rgb(10, 11, 13)");
});

test("STY-14 a consumer --ink on body does not change the Readout value", async ({ page }) => {
  const readout = createElement(Readout, { label: "Pass rate", value: "98.6", unit: "%" });
  await open(page, readout, ["styles.css", "base.css", `body { --ink: ${RED} }`]);
  expect(await style(page, "body", "--ink")).toBe(RED);
  expect(await style(page, ".ds-readout-figure", "color")).toBe("rgb(11, 12, 14)");
});

/** Probe rules in two Dossier layers: the layer declared later in the order wins, whatever order these come in. */
const PROBE = `
@layer dossier.base { #p { color: rgb(0, 0, 255); } }
@layer dossier.tokens { #p { color: ${RED}; background-color: ${RED}; } }
@layer dossier.base { #p { background-color: rgb(0, 128, 0); } }
@layer dossier.components { #p { outline-color: rgb(0, 0, 255); } }
@layer dossier.base { #p { outline-color: ${RED}; } }`;

for (const order of [
  ["styles.css", "base.css"],
  ["base.css", "styles.css"],
]) {
  test(`STY-31 the layer order is tokens, base, components with ${order.join(" then ")}`, async ({ page }) => {
    await open(page, '<i id="p"></i>', [...order, PROBE]);
    expect(await style(page, "#p", "color")).toBe("rgb(0, 0, 255)");
    expect(await style(page, "#p", "background-color")).toBe("rgb(0, 128, 0)");
    expect(await style(page, "#p", "outline-color")).toBe("rgb(0, 0, 255)");
  });
}

test("STY-32 a consumer --ds-signal on :root reaches the --signal alias and the components", async ({ page }) => {
  const solid = createElement(Tag, { variant: "solid", children: "Live" });
  await open(page, `${renderToStaticMarkup(solid)}<i id="alias" style="color: var(--signal)"></i>`, [
    "styles.css",
    `:root { --ds-signal: ${RED} }`,
  ]);
  expect(await style(page, ".ds-tag", "background-color")).toBe(RED);
  expect(await style(page, "#alias", "color")).toBe(RED);
});
