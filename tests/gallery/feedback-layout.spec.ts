import { readFileSync } from "node:fs";
import { devices, expect, test, type Page } from "@playwright/test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Button, type ButtonProps } from "../../src/components/Button";
import { Skeleton } from "../../src/components/Skeleton";
import { Divider } from "../../src/components/Divider";
import { Grid } from "../../src/components/Grid";
import { Stack } from "../../src/components/Stack";
import { Spinner } from "../../src/components/Spinner";
import { loadToaster, mountToaster, toast } from "../unit/toaster-mount";

// Computed styles of Spinner, Skeleton, Stack, Grid, Divider and Toaster in each theme. Each test renders a component
// on a blank page that holds dist/styles.css under the theme.
const THEMES = ["paper", "void", "blueprint"] as const;
const css = readFileSync("dist/styles.css", "utf8");
const doc = (theme: string, markup: string) =>
  // The viewport meta of the gallery, so a phone lays the page out at its own width.
  `<!doctype html><html data-theme="${theme}"><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}</style></head><body>${markup}</body></html>`;

async function open(page: Page, theme: string, markup: string): Promise<void> {
  await page.setContent(doc(theme, markup));
}
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

const cells = (page: Page) =>
  page.$$eval(".ds-spin-cell", (all) =>
    all.map((c) => {
      const s = getComputedStyle(c);
      return { name: s.animationName, timing: s.animationTimingFunction, background: s.backgroundColor };
    }),
  );

for (const theme of THEMES) {
  test(`SPN-02 with no-preference the four cells run a steps() animation, ${theme}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await open(page, theme, renderToStaticMarkup(createElement(Spinner)));
    const s = await cells(page);
    expect(s).toHaveLength(4);
    for (const c of s) {
      expect(c.name).not.toBe("none");
      expect(c.timing).toContain("steps(");
    }
    const timing = await page.$$eval(".ds-spin-cell", (all) =>
      all.map((c) => {
        const s = getComputedStyle(c);
        return [s.animationDuration, s.animationIterationCount, s.animationDelay];
      }),
    );
    // A cycle of 800 ms, one cell lit per 200 ms.
    expect(timing).toEqual([
      ["0.8s", "infinite", "0s"],
      ["0.8s", "infinite", "0.2s"],
      ["0.8s", "infinite", "0.4s"],
      ["0.8s", "infinite", "0.6s"],
    ]);
  });

  test(`SPN-02 the animation lights one cell at a time, ${theme}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await open(page, theme, renderToStaticMarkup(createElement(Spinner)));
    const ink = await computed(page, "background-color", "var(--ds-ink)");
    const lit = [];
    for (const ms of [100, 300, 500, 700]) {
      // Seek every animation of the page to the middle of a 200 ms step.
      lit.push(
        await page.evaluate((t) => {
          document.getAnimations().forEach((a) => {
            a.pause();
            a.currentTime = t;
          });
          return [...document.querySelectorAll(".ds-spin-cell")].map((c) => getComputedStyle(c).backgroundColor);
        }, ms),
      );
    }
    lit.forEach((row, step) => expect(row.map((b) => b === ink)).toEqual([0, 1, 2, 3].map((i) => i === step)));
  });

  test(`SPN-03 with reduce the cells have no animation, two are lit and the text is visible, ${theme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await open(page, theme, renderToStaticMarkup(createElement(Spinner)));
    const ink = await computed(page, "background-color", "var(--ds-ink)");
    const s = await cells(page);
    expect(s.map((c) => c.name)).toEqual(["none", "none", "none", "none"]);
    expect(s.map((c) => c.background === ink)).toEqual([true, true, false, false]);
    const text = page.locator(".ds-spin-text");
    await expect(text).toBeVisible();
    await expect(text).toHaveText("Loading");
    expect(await text.evaluate((t) => getComputedStyle(t).color)).toBe(
      await computed(page, "color", "var(--ds-ink-muted)"),
    );
    expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  });
}

for (const theme of THEMES) {
  test(`SKL-01 a block Skeleton of height 120px is aria-hidden, panel coloured, 120 px high and still, ${theme}`, async ({
    page,
  }) => {
    for (const motion of ["no-preference", "reduce"] as const) {
      await page.emulateMedia({ reducedMotion: motion });
      await open(page, theme, renderToStaticMarkup(createElement(Skeleton, { variant: "block", height: "120px" })));
      const s = await page.$eval(".ds-skeleton", (e) => {
        const c = getComputedStyle(e);
        return {
          hidden: e.getAttribute("aria-hidden"),
          background: c.backgroundColor,
          height: c.height,
          animation: c.animationName,
          image: c.backgroundImage,
          radius: c.borderTopLeftRadius,
        };
      });
      expect(s).toEqual({
        hidden: "true",
        background: await computed(page, "background-color", "var(--ds-panel)"),
        height: "120px",
        animation: "none",
        image: "none",
        radius: "0px",
      });
      expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
    }
  });

  test(`SKL-02 a text Skeleton is as high as the line-height of .ds-t-body, ${theme}`, async ({ page }) => {
    await open(
      page,
      theme,
      renderToStaticMarkup(createElement(Skeleton, { variant: "text" })) + '<p class="ds-t-body">Texto</p>',
    );
    const body = await page.$eval(".ds-t-body:not(.ds-skeleton)", (e) => getComputedStyle(e).lineHeight);
    expect(body).toMatch(/^\d+(\.\d+)?px$/);
    expect(await page.$eval(".ds-skeleton", (e) => getComputedStyle(e).height)).toBe(body);
    expect(await page.$eval(".ds-skeleton", (e) => e.getAttribute("aria-hidden"))).toBe("true");
  });
}

const stack = (props: Record<string, unknown> = {}) =>
  renderToStaticMarkup(createElement(Stack, props, createElement("span", null, "a"), createElement("span", null, "b")));
/** The computed layout properties of `.ds-stack`. */
const layout = (page: Page) =>
  page.$eval(".ds-stack", (e) => {
    const s = getComputedStyle(e);
    return {
      display: s.display,
      direction: s.flexDirection,
      gap: s.rowGap + " " + s.columnGap,
      align: s.alignItems,
      justify: s.justifyContent,
      wrap: s.flexWrap,
    };
  });

for (const theme of THEMES) {
  test(`LAY-01 a Stack with no layout props is a column flex with a gap of space-3, ${theme}`, async ({ page }) => {
    await open(page, theme, stack());
    const gap = await computed(page, "gap", "var(--ds-space-3)");
    expect(await layout(page)).toMatchObject({ display: "flex", direction: "column", gap: `${gap} ${gap}` });
  });

  test(`LAY-02 a Stack with direction row, gap 6, align center, justify between and wrap computes them, ${theme}`, async ({
    page,
  }) => {
    await open(page, theme, stack({ direction: "row", gap: 6, align: "center", justify: "between", wrap: true }));
    const gap = await computed(page, "gap", "var(--ds-space-6)");
    expect(await layout(page)).toEqual({
      display: "flex",
      direction: "row",
      gap: `${gap} ${gap}`,
      align: "center",
      justify: "space-between",
      wrap: "wrap",
    });
  });

  test(`LAY-02 every step of the scale gives its own space token as the Stack gap, ${theme}`, async ({ page }) => {
    for (const n of [1, 2, 3, 4, 6, 8, 12]) {
      await open(page, theme, stack({ gap: n }));
      const gap = await computed(page, "gap", `var(--ds-space-${n})`);
      expect((await layout(page)).gap, `gap ${n}`).toBe(`${gap} ${gap}`);
    }
  });

  test(`LAY-03 a Stack gap out of 1, 2, 3, 4, 6, 8 and 12 falls back to space-3, ${theme}`, async ({ page }) => {
    for (const bad of [0, 5, 7, 10, 13, -1, 2.5, NaN, "4"]) {
      await open(page, theme, stack({ gap: bad, direction: "row" }));
      const gap = await computed(page, "gap", "var(--ds-space-3)");
      expect((await layout(page)).gap, String(bad)).toBe(`${gap} ${gap}`);
    }
  });
}

const DESKTOP = { width: 1280, height: 800 };
const grid = (props: Record<string, unknown> = {}, n = 6) =>
  renderToStaticMarkup(
    createElement(
      Grid,
      { ...props, style: { width: "1000px" } },
      ...Array.from({ length: n }, (_, i) => createElement("span", { key: i }, "item " + i)),
    ),
  );
/** The resolved column tracks of `.ds-grid` in px, the declared `grid-template-columns` and the gap. */
const tracks = (page: Page) =>
  page.$eval(".ds-grid", (e) => ({
    columns: getComputedStyle(e).gridTemplateColumns.split(" ").map(parseFloat),
    declared: (e as HTMLElement).style.gridTemplateColumns,
    gap: getComputedStyle(e).columnGap,
  }));

for (const theme of THEMES) {
  test(`LAY-04 a Grid with columns 3 on a 1280 px window has three columns of the same width, ${theme}`, async ({
    page,
  }) => {
    await page.setViewportSize(DESKTOP);
    await open(page, theme, grid({ columns: 3 }));
    const gap = parseFloat(await computed(page, "gap", "var(--ds-space-3)"));
    const { columns } = await tracks(page);
    expect(columns).toHaveLength(3);
    const each = (1000 - 2 * gap) / 3;
    columns.forEach((c) => expect(c).toBeCloseTo(each, 1));
    // Six items make two rows of three.
    expect(
      await page.$$eval(".ds-grid > span", (all) => new Set(all.map((s) => s.getBoundingClientRect().top)).size),
    ).toBe(2);
  });

  test(`LAY-05 a Grid with columns 3 at the gallery-phone width has one column, ${theme}`, async ({ page }) => {
    await page.setViewportSize(devices["Pixel 7"].viewport);
    await open(page, theme, grid({ columns: 3 }));
    const { columns } = await tracks(page);
    expect(columns).toHaveLength(1);
    expect(
      await page.$$eval(".ds-grid > span", (all) => new Set(all.map((s) => s.getBoundingClientRect().top)).size),
    ).toBe(6);
  });

  test(`LAY-06 a Grid with minColumnWidth 200px declares repeat(auto-fit, minmax(200px, 1fr)) and fits what it can, ${theme}`, async ({
    page,
  }) => {
    await page.setViewportSize(DESKTOP);
    await open(page, theme, grid({ minColumnWidth: "200px" }));
    const { declared, columns } = await tracks(page);
    expect(declared).toBe("repeat(auto-fit, minmax(200px, 1fr))");
    // 1000 px hold four columns of 200 px and three gaps, not five.
    expect(columns).toHaveLength(4);
    for (const c of columns) expect(c).toBeGreaterThanOrEqual(200);
  });

  test(`LAY-03 a Grid gap out of 1, 2, 3, 4, 6, 8 and 12 falls back to space-3, and a step gives its token, ${theme}`, async ({
    page,
  }) => {
    for (const bad of [0, 5, 13, -1, 2.5, NaN, "4"]) {
      await open(page, theme, grid({ columns: 2, gap: bad }));
      expect((await tracks(page)).gap, String(bad)).toBe(await computed(page, "gap", "var(--ds-space-3)"));
    }
    for (const n of [1, 2, 3, 4, 6, 8, 12]) {
      await open(page, theme, grid({ columns: 2, gap: n }));
      expect((await tracks(page)).gap, `gap ${n}`).toBe(await computed(page, "gap", `var(--ds-space-${n})`));
    }
  });

  test(`FBL-34 a Grid with columns and minColumnWidth together follows minColumnWidth, ${theme}`, async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await open(page, theme, grid({ columns: 2, minColumnWidth: "200px" }));
    const { declared, columns } = await tracks(page);
    expect(declared).toBe("repeat(auto-fit, minmax(200px, 1fr))");
    expect(columns).toHaveLength(4);
    expect(await page.$eval(".ds-grid", (e) => e.classList.contains("ds-grid-cols"))).toBe(false);
  });
}

const divider = (props: Record<string, unknown> = {}) => renderToStaticMarkup(createElement(Divider, props));
/** The line `<hr>` draws, from its computed border on the side that the orientation uses. */
const line = (page: Page) =>
  page.$eval("hr", (e) => {
    const s = getComputedStyle(e);
    const vertical = e.getAttribute("aria-orientation") === "vertical";
    const box = e.getBoundingClientRect();
    return {
      tag: e.tagName,
      width: vertical ? s.borderLeftWidth : s.borderTopWidth,
      style: vertical ? s.borderLeftStyle : s.borderTopStyle,
      color: vertical ? s.borderLeftColor : s.borderTopColor,
      box: vertical ? box.width : box.height,
      length: vertical ? box.height : box.width,
      orientation: e.getAttribute("aria-orientation"),
    };
  });

for (const theme of THEMES) {
  test(`DIV-01 a Divider with no props is an hr of stroke-hair in rule-soft, ${theme}`, async ({ page }) => {
    await open(page, theme, divider());
    const hair = await computed(page, "width", "var(--ds-stroke-hair)");
    const soft = await computed(page, "color", "var(--ds-rule-soft)");
    expect(await line(page)).toMatchObject({ tag: "HR", width: hair, style: "solid", color: soft, orientation: null });
    expect((await line(page)).box).toBe(parseFloat(hair));
  });

  test(`DIV-02 a Divider with weight rule or heavy has stroke-rule or stroke-heavy in rule, ${theme}`, async ({
    page,
  }) => {
    for (const [weight, token] of [
      ["rule", "stroke-rule"],
      ["heavy", "stroke-heavy"],
    ]) {
      await open(page, theme, divider({ weight }));
      const rule = await computed(page, "color", "var(--ds-rule)");
      const w = await computed(page, "width", `var(--ds-${token})`);
      const l = await line(page);
      expect(l, weight).toMatchObject({ width: w, style: "solid", color: rule });
      expect(l.box, weight).toBe(parseFloat(w));
    }
    // The rule colour is not the decorative one.
    expect(await computed(page, "color", "var(--ds-rule)")).not.toBe(
      await computed(page, "color", "var(--ds-rule-soft)"),
    );
  });

  test(`DIV-03 a vertical Divider has aria-orientation vertical, the stroke as width and the height of its container, ${theme}`, async ({
    page,
  }) => {
    for (const weight of [undefined, "rule", "heavy"]) {
      // A row with a fixed height, and a row that takes its height from the text next to the line.
      for (const container of [
        `<div style="display:flex;height:80px">${divider({ orientation: "vertical", weight })}<span>a</span></div>`,
        `<div style="display:flex;align-items:stretch">${divider({ orientation: "vertical", weight })}<p style="margin:0;height:64px">a</p></div>`,
        `<div style="height:80px">${divider({ orientation: "vertical", weight })}</div>`,
      ]) {
        await open(page, theme, container);
        const token = weight === "rule" ? "stroke-rule" : weight === "heavy" ? "stroke-heavy" : "stroke-hair";
        const w = await computed(page, "width", `var(--ds-${token})`);
        const l = await line(page);
        const expected = await page.$eval("hr", (e) => e.parentElement!.getBoundingClientRect().height);
        expect(l, container).toMatchObject({ orientation: "vertical", width: w, style: "solid" });
        expect(l.box, container).toBe(parseFloat(w));
        expect(l.length, container).toBe(expected);
        expect(l.color).toBe(await computed(page, "color", `var(--ds-${weight ? "rule" : "rule-soft"})`));
      }
    }
  });

  test(`FBL-40 a vertical Divider is as high as its container in a row flex, a grid and a block of definite height, ${theme}`, async ({
    page,
  }) => {
    const hr = divider({ orientation: "vertical" });
    for (const container of [
      `<div style="display:flex"><p style="margin:0;height:64px">a</p>${hr}</div>`,
      `<div style="display:grid;grid-template-columns:auto auto"><p style="margin:0;height:64px">a</p>${hr}</div>`,
      `<div style="height:80px"><p style="margin:0">a</p>${hr}</div>`,
    ]) {
      await open(page, theme, container);
      const m = await page.$eval("hr", (e) => ({
        line: e.getBoundingClientRect().height,
        container: e.parentElement!.getBoundingClientRect().height,
      }));
      expect(m.container, container).toBeGreaterThan(0);
      expect(m.line, container).toBe(m.container);
    }
  });
}

for (const theme of THEMES) {
  test(`TST-11 at the gallery-phone width the toasts take the width of the window at the bottom, with no horizontal scroll, ${theme}`, async ({
    page,
  }) => {
    await page.setViewportSize(devices["Pixel 7"].viewport);
    // The Toaster renders its toasts in the browser: a page with React 18 and the package's toast().
    await loadToaster(page, false, theme);
    await mountToaster(page);
    await toast(page, { title: "Arquivo salvo", description: "relatorio-de-inspecao-final-lote-0042-revisao-b.pdf" });
    await toast(page, { title: "Falha ao enviar", tone: "error" });
    await expect(page.locator(".ds-toast")).toHaveCount(2);
    const view = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      height: window.innerHeight,
      scroll: document.documentElement.scrollWidth,
    }));
    expect(view.width).toBe(devices["Pixel 7"].viewport.width);
    expect(view.scroll).toBe(view.width);
    const boxes = await page.locator(".ds-toast").evaluateAll((all) =>
      all.map((t) => {
        const r = t.getBoundingClientRect();
        return { left: r.left, right: r.right, bottom: r.bottom };
      }),
    );
    for (const b of boxes) expect(b).toMatchObject({ left: 0, right: view.width });
    // The last one sits on the bottom edge of the window.
    expect(boxes.at(-1)!.bottom).toBe(view.height);
  });
}

for (const theme of THEMES) {
  test(`BTL-01 a loading Button is busy, as wide as without loading, with the Spinner cells seen against it, ${theme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const variants = ["outline", "solid", "text"] as const;
    const pair = (variant: (typeof variants)[number], tone?: "danger") =>
      renderToStaticMarkup(
        createElement(
          "p",
          null,
          createElement(Button, { variant, tone, className: "plain" }, "Approve the run"),
          createElement(Button, { variant, tone, className: "busy", loading: true }, "Approve the run"),
        ),
      );
    await open(page, theme, variants.map((v) => pair(v) + pair(v, "danger")).join(""));
    const plain = page.locator(".plain");
    const busy = page.locator(".busy");
    await expect(busy).toHaveCount(6);
    for (let i = 0; i < 6; i++) {
      const [a, b] = [(await plain.nth(i).boundingBox())!, (await busy.nth(i).boundingBox())!];
      expect(b.width, `button ${i}`).toBe(a.width);
      expect(b.height, `button ${i}`).toBe(a.height);
      await expect(busy.nth(i)).toHaveAttribute("aria-busy", "true");
      await expect(busy.nth(i).locator(".ds-spinner")).toBeVisible();
      await expect(plain.nth(i).locator(".ds-spinner")).toHaveCount(0);
      // The lit cells differ from what is behind them, the button fill or the page.
      const colors = await busy.nth(i).evaluate((button) => {
        const fill = getComputedStyle(button).backgroundColor;
        const back = fill === "rgba(0, 0, 0, 0)" ? getComputedStyle(document.body).backgroundColor : fill;
        const lit = getComputedStyle(button.querySelector(".ds-spin-cell")!).backgroundColor;
        return { back, lit };
      });
      expect(colors.lit, `button ${i}`).not.toBe(colors.back);
    }
  });

  test(`FBL-38 the Spinner cells of a loading Button with a short label sit inside the button, md and sm, ${theme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const markup = [undefined, "sm"]
      .map((size) =>
        renderToStaticMarkup(createElement(Button, { size, loading: true, className: "short" } as ButtonProps, "OK")),
      )
      .join("");
    await open(page, theme, markup);
    const buttons = page.locator(".short");
    await expect(buttons).toHaveCount(2);
    for (let i = 0; i < 2; i++) {
      const button = (await buttons.nth(i).boundingBox())!;
      const boxes = await buttons
        .nth(i)
        .locator(".ds-spin-cell")
        .evaluateAll((all) =>
          all.map((c) => {
            const r = c.getBoundingClientRect();
            return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
          }),
        );
      expect(boxes, `button ${i}`).toHaveLength(4);
      const left = Math.min(...boxes.map((b) => b.left));
      const right = Math.max(...boxes.map((b) => b.right));
      expect(left, `button ${i} left`).toBeGreaterThanOrEqual(button.x);
      expect(right, `button ${i} right`).toBeLessThanOrEqual(button.x + button.width);
      expect(Math.min(...boxes.map((b) => b.top)), `button ${i} top`).toBeGreaterThanOrEqual(button.y);
      expect(Math.max(...boxes.map((b) => b.bottom)), `button ${i} bottom`).toBeLessThanOrEqual(
        button.y + button.height,
      );
    }
  });
}

test("FBL-40 the emitted types of Divider say where a vertical Divider gets its height", () => {
  const types = readFileSync("dist/components/Divider.d.ts", "utf8");
  const doc = types.match(/\/\*\*((?:(?!\*\/)[\s\S])*)\*\/\s*orientation\?:/)?.[1] ?? "";
  expect(doc).toMatch(/row flex container/);
  expect(doc).toMatch(/grid/);
  expect(doc).toMatch(/definite height/);
  expect(doc).toMatch(/auto-height block[^.]*no height/);
});
