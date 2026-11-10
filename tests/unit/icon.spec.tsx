import { expect, test, type Page } from "@playwright/test";
import { renderToStaticMarkup } from "react-dom/server";
import { Icon, type IconName } from "../../src/components/Icon";

const NAMES = [
  "close",
  "check",
  "plus",
  "minus",
  "chevron-up",
  "chevron-down",
  "chevron-left",
  "chevron-right",
  "arrow-up",
  "arrow-down",
  "arrow-left",
  "arrow-right",
  "search",
  "menu",
  "more",
  "external",
  "copy",
  "download",
  "info",
  "warning",
  "error",
  "loading",
] as IconName[];

/** What the first <svg> of `markup` is in a browser: its attributes and its drawn elements with computed strokes. */
const parse = (page: Page, markup: string) =>
  page.evaluate((html) => {
    const host = document.body.appendChild(document.createElement("div"));
    host.innerHTML = html;
    const svg = host.querySelector("svg")!;
    const attrs = Object.fromEntries([...svg.attributes].map((a) => [a.name, a.value]));
    const shapes = [...svg.querySelectorAll("path,line,circle,rect,polyline,polygon")].map((s) => {
      const c = getComputedStyle(s);
      return {
        d: s.getAttribute("d") ?? "",
        stroke: s.getAttribute("stroke"),
        fill: c.fill,
        width: c.strokeWidth,
        cap: c.strokeLinecap,
        effect: c.getPropertyValue("vector-effect"),
      };
    });
    host.remove();
    return { attrs, shapes, children: svg.children.length };
  }, markup);

for (const size of [16, 24] as const) {
  test(`ICN-01 every one of the 22 names renders a non-empty svg, viewBox 0 0 ${size} ${size} and fill none (size ${size})`, async ({
    page,
  }) => {
    expect(NAMES).toHaveLength(22);
    expect(new Set(NAMES).size).toBe(22);
    for (const name of NAMES) {
      const s = await parse(page, renderToStaticMarkup(<Icon name={name} size={size} />));
      expect(s.attrs.viewBox, name).toBe(`0 0 ${size} ${size}`);
      expect(s.attrs.fill, name).toBe("none");
      expect(s.shapes.length, name).toBeGreaterThan(0);
      for (const shape of s.shapes) {
        expect(shape.d.length, name).toBeGreaterThan(0);
        expect(shape.stroke, name).toBe("currentColor");
      }
    }
  });
}

test("ICN-01 the icons of one size differ from each other and from the other size", () => {
  const drawn = NAMES.flatMap((n) => [16, 24].map((s) => renderToStaticMarkup(<Icon name={n} size={s as 16 | 24} />)));
  expect(new Set(drawn).size).toBe(44);
});

test("ICN-02 size 24 sets width, height and viewBox to 24, and the default is 16", async ({ page }) => {
  const big = await parse(page, renderToStaticMarkup(<Icon name="search" size={24} />));
  expect(big.attrs).toMatchObject({ width: "24", height: "24", viewBox: "0 0 24 24" });
  const small = await parse(page, renderToStaticMarkup(<Icon name="search" />));
  expect(small.attrs).toMatchObject({ width: "16", height: "16", viewBox: "0 0 16 16" });
});

test("ICN-03 without label the svg has aria-hidden true and no role", async ({ page }) => {
  const s = await parse(page, renderToStaticMarkup(<Icon name="close" />));
  expect(s.attrs["aria-hidden"]).toBe("true");
  expect(s.attrs).not.toHaveProperty("role");
  expect(s.attrs).not.toHaveProperty("aria-label");
});

test("ICN-04 with label the svg has role img and the aria-label, and no aria-hidden", async ({ page }) => {
  const s = await parse(page, renderToStaticMarkup(<Icon name="close" label="Fechar" />));
  expect(s.attrs.role).toBe("img");
  expect(s.attrs["aria-label"]).toBe("Fechar");
  expect(s.attrs).not.toHaveProperty("aria-hidden");
});

test("ICN-05 a name out of the 22 renders nothing", () => {
  for (const name of ["star", "", "constructor", "toString", "__proto__", "Close"])
    expect(renderToStaticMarkup(<Icon name={name as IconName} />), name).toBe("");
});

test("ICN-07 every stroke of every icon has stroke-width 1, square caps and a non-scaling stroke", async ({ page }) => {
  for (const name of NAMES)
    for (const size of [16, 24] as const) {
      const s = await parse(page, renderToStaticMarkup(<Icon name={name} size={size} />));
      expect(s.shapes.length, name).toBeGreaterThan(0);
      for (const shape of s.shapes) {
        expect(shape.width, name).toBe("1px");
        expect(shape.cap, name).toBe("square");
        expect(shape.effect, name).toBe("non-scaling-stroke");
        expect(shape.fill, name).toBe("none");
      }
    }
});
