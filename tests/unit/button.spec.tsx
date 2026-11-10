import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { renderToStaticMarkup } from "react-dom/server";
import { Button, type ButtonProps } from "../../src/components/Button";
import { actionCalls, loadActions, mountAction, rerenderAction } from "./actions-mount";
import { expectMarkup } from "./markup";
import { render } from "./oracle";

const html = (props: ButtonProps) => renderToStaticMarkup(<Button {...props} />);
const classes = (markup: string) => (markup.match(/ class="([^"]*)"/)?.[1] ?? "").split(" ");

/** A blank page with the styles of the package and `markup` in the body. */
async function open(page: Page, markup: string): Promise<void> {
  await page.setContent(`<!doctype html><html><body>${markup}</body></html>`);
  await page.addStyleTag({ content: readFileSync("dist/styles.css", "utf8") });
}
const style = (page: Page, selector: string, property: string) =>
  page.$eval(selector, (el, p) => getComputedStyle(el).getPropertyValue(p), property);

const VERSIONS = [
  [false, "18."],
  [true, "19."],
] as const;

const cases: [string, ButtonProps][] = [
  ["default", { children: "Salvar" }],
  ["solid", { variant: "solid", children: "Salvar" }],
  ["text", { variant: "text", children: "Salvar" }],
  ["danger outline", { tone: "danger", children: "Apagar" }],
  ["danger solid", { variant: "solid", tone: "danger", children: "Apagar" }],
  ["danger text", { variant: "text", tone: "danger", children: "Apagar" }],
  ["small", { size: "sm", children: "Salvar" }],
  ["submit", { type: "submit", children: "Enviar" }],
  ["disabled", { disabled: true, children: "Salvar" }],
  [
    "variant and tone outside the list",
    { variant: "ghost", tone: "loud", children: "Salvar" } as unknown as ButtonProps,
  ],
  ["id and className", { id: "x", className: "y", children: "Salvar" }],
  ["loading", { loading: true, children: "Salvar" }],
];

test("BTN-01 Button markup matches its snapshot", () => {
  expectMarkup(
    "Button",
    cases.map(([name, props]) => [name, render(<Button {...props} />)]),
  );
});

test("BTN-01 a Button without variant, tone, size and type is a button of type button, outline", () => {
  const markup = html({ children: "Salvar" });
  expect(markup).toMatch(/^<button type="button" class="[^"]*">Salvar<\/button>$/);
  expect(classes(markup)).toEqual(expect.arrayContaining(["ds-btn", "ds-btn-outline"]));
  expect(classes(markup)).not.toContain("ds-btn-danger");
  expect(classes(markup)).not.toContain("ds-btn-sm");
});

test("BTN-01 variant, tone and size add their classes; type and className come from the consumer", () => {
  const markup = html({ variant: "solid", tone: "danger", size: "sm", type: "submit", className: "x", children: "Ok" });
  expect(markup).toContain(' type="submit"');
  expect(markup).not.toContain('type="button"');
  expect(classes(markup)).toEqual(
    expect.arrayContaining(["ds-btn", "ds-btn-solid", "ds-btn-danger", "ds-btn-sm", "x"]),
  );
  expect(classes(markup)).not.toContain("ds-btn-outline");
  expect(classes(html({ variant: "text", children: "Ok" }))).toContain("ds-btn-text");
});

test("BTN-01 a Button with type undefined is still of type button", () => {
  const markup = html({ type: undefined, children: "Salvar" });
  expect(markup).toMatch(/^<button type="button" class="[^"]*">Salvar<\/button>$/);
});

test("BTN-05 a variant or tone outside the listed values renders as outline and default", () => {
  const markup = html({ variant: "ghost", tone: "loud", children: "Ok" } as unknown as ButtonProps);
  expect(classes(markup)).toEqual(expect.arrayContaining(["ds-btn", "ds-btn-outline"]));
  expect(markup).not.toMatch(/ds-btn-(ghost|loud|danger)/);
});

for (const [react19, major] of VERSIONS) {
  test(`BTN-07 Enter, Space and a click each call onClick once, React ${major}`, async ({ page }) => {
    await loadActions(page, react19);
    const m = await mountAction(page, "Button", { children: "Salvar" }, ["onClick"]);
    expect(m.version.startsWith(major), m.version).toBe(true);
    const button = page.locator(`#${m.id} button`);
    await button.focus();
    await page.keyboard.press("Enter");
    expect(await actionCalls(page, m.id)).toEqual({ onClick: 1 });
    await page.keyboard.press("Space");
    expect(await actionCalls(page, m.id)).toEqual({ onClick: 2 });
    await button.click();
    expect(await actionCalls(page, m.id)).toEqual({ onClick: 3 });
  });
}

test("BTN-08 a disabled Button ignores the click and the keyboard, takes no Tab focus and has a dashed border", async ({
  page,
}) => {
  await loadActions(page, false);
  const m = await mountAction(page, "Button", { children: "Salvar", disabled: true }, ["onClick"]);
  const button = page.locator(`#${m.id} button`);
  const box = (await button.boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");
  expect(await actionCalls(page, m.id)).toEqual({ onClick: 0 });
  expect(await style(page, `#${m.id} button`, "border-top-style")).toBe("dashed");
  // The variants and the danger tone do not undo it.
  for (const props of [
    { variant: "solid" },
    { variant: "text" },
    { tone: "danger" },
    { variant: "solid", tone: "danger" },
  ]) {
    await open(page, html({ ...props, disabled: true, children: "Salvar" } as ButtonProps));
    expect(await style(page, "button", "border-top-style"), JSON.stringify(props)).toBe("dashed");
    expect(await style(page, "button", "background-color"), JSON.stringify(props)).toBe("rgba(0, 0, 0, 0)");
  }
});

test("BTN-10 the text of a Button stays Salvar in the DOM and is uppercased by CSS, in the mono face", async ({
  page,
}) => {
  expect(html({ children: "Salvar" })).toContain(">Salvar<");
  await open(page, html({ children: "Salvar" }));
  expect(await page.$eval("button", (el) => el.textContent)).toBe("Salvar");
  expect(await style(page, "button", "text-transform")).toBe("uppercase");
  expect(await style(page, "button", "font-family")).toContain("IBM Plex Mono");
});

test("BTN-30 a Button without type inside a form does not submit it; type submit does", async ({ page }) => {
  const form = (button: string) =>
    `<form id="f" onsubmit="window.sent = (window.sent || 0) + 1; return false">${button}</form>`;
  await open(page, form(html({ children: "Salvar" })));
  await page.locator("button").click();
  expect(await page.evaluate(() => (window as any).sent ?? 0)).toBe(0);
  await open(page, form(html({ type: "submit", children: "Salvar" })));
  await page.locator("button").click();
  expect(await page.evaluate(() => (window as any).sent ?? 0)).toBe(1);
  await open(page, form(html({ type: undefined, children: "Salvar" })));
  await page.evaluate(() => ((window as any).sent = 0));
  await page.locator("button").click();
  expect(await page.evaluate(() => (window as any).sent ?? 0)).toBe(0);
});

test("BTL-01 a loading Button has aria-busy, a Spinner over the hidden label and the width it has without loading", async ({
  page,
}) => {
  const markup = html({ loading: true, children: "Salvar" });
  expect(markup).toContain('aria-busy="true"');
  expect(markup).toMatch(/<span role="status" aria-label="Loading" class="[^"]*ds-spinner/);
  expect(html({ children: "Salvar" })).not.toContain("aria-busy");
  for (const props of [
    {},
    { variant: "solid" },
    { variant: "text" },
    { size: "sm" },
    { tone: "danger" },
  ] as ButtonProps[]) {
    await open(
      page,
      html({ ...props, id: "a", children: "Salvar alterações" }) +
        "<br>" +
        html({ ...props, id: "b", loading: true, children: "Salvar alterações" }),
    );
    const [a, b] = [(await page.locator("#a").boundingBox())!, (await page.locator("#b").boundingBox())!];
    expect(b.width, JSON.stringify(props)).toBe(a.width);
    expect(b.height, JSON.stringify(props)).toBe(a.height);
    expect(await style(page, "#b .ds-btn-label", "opacity")).toBe("0");
    // The Spinner sits inside the button, its cells shown and its text not.
    const spinner = (await page.locator("#b .ds-spinner").boundingBox())!;
    expect(spinner.x).toBeGreaterThanOrEqual(b.x);
    expect(spinner.x + spinner.width).toBeLessThanOrEqual(b.x + b.width);
    expect((await page.locator("#b .ds-spin-cell").first().boundingBox())!.width).toBeGreaterThan(0);
    expect((await page.locator("#b .ds-spin-text").boundingBox())!.width).toBeLessThanOrEqual(1);
  }
});

test("FBL-37 a loading Button keeps its label as the accessible name, busy, with no Spinner in the accessibility tree", async ({
  page,
}) => {
  await open(page, html({ loading: true, children: "Salvar alterações" }));
  const button = page.getByRole("button", { name: "Salvar alterações", exact: true });
  await expect(button).toHaveCount(1);
  await expect(button).toHaveAttribute("aria-busy", "true");
  await expect(button).toHaveAccessibleName("Salvar alterações");
  await expect(page.getByRole("status")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Loading" })).toHaveCount(0);
  expect(await style(page, ".ds-btn-label", "opacity")).toBe("0");
});

for (const [react19, major] of VERSIONS) {
  test(`BTL-02 a loading Button ignores a click, Enter and Space and still takes focus by Tab, React ${major}`, async ({
    page,
  }) => {
    await loadActions(page, react19);
    const m = await mountAction(page, "Button", { children: "Salvar", loading: true }, ["onClick"]);
    expect(m.version.startsWith(major), m.version).toBe(true);
    const button = page.locator(`#${m.id} button`);
    await page.keyboard.press("Tab");
    await expect(button).toBeFocused();
    await page.keyboard.press("Enter");
    await page.keyboard.press("Space");
    await button.click();
    expect(await actionCalls(page, m.id)).toEqual({ onClick: 0 });
    await expect(button).toHaveAttribute("aria-busy", "true");
    await expect(button).toBeEnabled();
  });

  test(`BTL-03 when loading turns false with focus on the Button, focus stays and the label comes back, React ${major}`, async ({
    page,
  }) => {
    await loadActions(page, react19);
    const m = await mountAction(page, "Button", { children: "Salvar", loading: true }, ["onClick"]);
    const button = page.locator(`#${m.id} button`);
    await page.keyboard.press("Tab");
    await expect(button).toBeFocused();
    await rerenderAction(page, m.id, { children: "Salvar", loading: false });
    await expect(button).toBeFocused();
    await expect(button).not.toHaveAttribute("aria-busy");
    await expect(page.locator(`#${m.id} .ds-spinner`)).toHaveCount(0);
    await expect(button).toHaveText("Salvar");
    await expect(button).toBeVisible();
    expect(await page.$eval(`#${m.id} button`, (el) => el.innerHTML)).toBe("Salvar");
    await page.keyboard.press("Enter");
    expect(await actionCalls(page, m.id)).toEqual({ onClick: 1 });
  });
}
