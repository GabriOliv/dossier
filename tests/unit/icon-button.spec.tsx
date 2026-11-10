import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { renderToStaticMarkup } from "react-dom/server";
import { IconButton, type IconButtonProps } from "../../src/components/IconButton";
import { actionCalls, loadActions, mountAction } from "./actions-mount";
import { expectMarkup } from "./markup";
import { render } from "./oracle";

const icon = (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" fill="none" />
  </svg>
);
const html = (props: Partial<IconButtonProps> = {}) =>
  renderToStaticMarkup(
    <IconButton label="Fechar" {...props}>
      {icon}
    </IconButton>,
  );
const classes = (markup: string) => (markup.match(/ class="([^"]*)"/)?.[1] ?? "").split(" ");

async function open(page: Page, markup: string): Promise<void> {
  await page.setContent(`<!doctype html><html><body>${markup}</body></html>`);
  await page.addStyleTag({ content: readFileSync("dist/styles.css", "utf8") });
}
const style = (page: Page, selector: string, property: string) =>
  page.$eval(selector, (el, p) => getComputedStyle(el).getPropertyValue(p), property);

const cases: [string, Partial<IconButtonProps>][] = [
  ["default", {}],
  ["solid", { variant: "solid" }],
  ["text", { variant: "text" }],
  ["danger", { tone: "danger", label: "Apagar" }],
  ["small", { size: "sm" }],
  ["disabled", { disabled: true }],
  ["id and className", { id: "x", className: "y" }],
  ["loading", { loading: true }],
];

test("BTN-11 IconButton markup matches its snapshot", () => {
  expectMarkup(
    "IconButton",
    cases.map(([name, props]) => [
      name,
      render(
        <IconButton label="Fechar" {...props}>
          {icon}
        </IconButton>,
      ),
    ]),
  );
});

test("BTN-11 an IconButton with label Fechar and an SVG is a button named Fechar with no visible text", () => {
  const markup = html();
  expect(markup).toMatch(/^<button type="button" aria-label="Fechar" class="[^"]*">/);
  expect(markup).toContain("<svg");
  expect(markup.replace(/<[^>]*>/g, "")).toBe("");
  expect(classes(markup)).toEqual(expect.arrayContaining(["ds-btn", "ds-btn-outline", "ds-btn-icon"]));
});

test("BTN-11 variant, tone, size and className reach the button; the label is the aria-label", () => {
  const markup = html({ variant: "solid", tone: "danger", size: "sm", className: "x", label: "Apagar" });
  expect(markup).toContain('aria-label="Apagar"');
  expect(classes(markup)).toEqual(
    expect.arrayContaining(["ds-btn", "ds-btn-solid", "ds-btn-danger", "ds-btn-sm", "ds-btn-icon", "x"]),
  );
});

test("BTN-11 an IconButton is as wide as it is tall, with the icon centered, in both sizes", async ({ page }) => {
  await open(page, html({ id: "a" }) + html({ id: "b", size: "sm" }));
  const sizes: number[] = [];
  for (const id of ["a", "b"]) {
    const button = (await page.locator(`#${id}`).boundingBox())!;
    const svg = (await page.locator(`#${id} svg`).boundingBox())!;
    const [width, height] = ["width", "height"].map(async (p) => parseFloat(await style(page, `#${id}`, p)));
    expect(await width).toBe(await height);
    expect(button.width).toBe(button.height);
    expect(Math.abs(svg.x + svg.width / 2 - (button.x + button.width / 2))).toBeLessThan(0.5);
    expect(Math.abs(svg.y + svg.height / 2 - (button.y + button.height / 2))).toBeLessThan(0.5);
    expect(await style(page, `#${id}`, "padding-left")).toBe("0px");
    sizes.push(button.width);
  }
  expect(sizes[1]).toBeLessThan(sizes[0]);
});

test("BTN-11 a click on an IconButton calls onClick once", async ({ page }) => {
  await loadActions(page, false);
  const m = await mountAction(page, "IconButton", { label: "Fechar" }, ["onClick"]);
  const button = page.getByRole("button", { name: "Fechar" });
  await button.click();
  expect(await actionCalls(page, m.id)).toEqual({ onClick: 1 });
});

test("BTL-04 a loading IconButton stays square, shows the Spinner in place of the icon and keeps its aria-label", async ({
  page,
}) => {
  const markup = html({ loading: true });
  expect(markup).toContain('aria-label="Fechar"');
  expect(markup).toContain('aria-busy="true"');
  expect(markup).toContain("ds-spinner");
  await open(page, html({ id: "a" }) + html({ id: "b", loading: true }) + html({ id: "c", loading: true, size: "sm" }));
  const plain = (await page.locator("#a").boundingBox())!;
  for (const id of ["b", "c"]) {
    const button = (await page.locator(`#${id}`).boundingBox())!;
    expect(button.width, id).toBe(button.height);
    if (id === "b") expect(button.width).toBe(plain.width);
    expect(await style(page, `#${id} .ds-btn-label`, "opacity")).toBe("0");
    const cells = (await page.locator(`#${id} .ds-spin-cells`).boundingBox())!;
    expect(cells.x, id).toBeGreaterThan(button.x);
    expect(cells.x + cells.width, id).toBeLessThan(button.x + button.width);
    expect(Math.abs(cells.x + cells.width / 2 - (button.x + button.width / 2))).toBeLessThan(0.5);
  }
  await expect(page.locator("#b")).toHaveAccessibleName("Fechar");
});
