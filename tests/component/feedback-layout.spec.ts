import { readFileSync } from "node:fs";
import { devices, expect, test, type Locator, type Page } from "@playwright/test";
import { computed, openFixture, openStory, section, THEMES } from "../support/story";

// Computed styles of Spinner, Skeleton, Stack, Grid, Divider, Toaster and loading Buttons in each theme, measured on
// their Overview stories.

/** The variant of the story `name` whose caption holds `caption`. */
const variant = (page: Page, name: string, caption: string): Locator =>
  section(page, name).locator(".gal-variant", { hasText: caption });

const cells = (spinner: Locator) =>
  spinner.locator(".ds-spin-cell").evaluateAll((all) =>
    all.map((c) => {
      const s = getComputedStyle(c);
      return { name: s.animationName, timing: s.animationTimingFunction, background: s.backgroundColor };
    }),
  );

for (const theme of THEMES) {
  test(`SPN-02 with no-preference the four cells run a steps() animation, ${theme}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await openStory(page, "Spinner", theme);
    const spinner = section(page, "Spinner").locator(".ds-spinner").first();
    const s = await cells(spinner);
    expect(s).toHaveLength(4);
    for (const c of s) {
      expect(c.name).not.toBe("none");
      expect(c.timing).toContain("steps(");
    }
    const timing = await spinner.locator(".ds-spin-cell").evaluateAll((all) =>
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
    await openStory(page, "Spinner", theme);
    const spinner = section(page, "Spinner").locator(".ds-spinner").first();
    const ink = await computed(page, "background-color", "var(--ds-ink)");
    const lit = [];
    for (const ms of [100, 300, 500, 700]) {
      // Seek every animation of the page to the middle of a 200 ms step.
      await page.evaluate((t) => {
        document.getAnimations().forEach((a) => {
          a.pause();
          a.currentTime = t;
        });
      }, ms);
      lit.push((await cells(spinner)).map((c) => c.background));
    }
    lit.forEach((row, step) => expect(row.map((b) => b === ink)).toEqual([0, 1, 2, 3].map((i) => i === step)));
  });

  test(`SPN-03 with reduce the cells have no animation, two are lit and the text is visible, ${theme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openStory(page, "Spinner", theme);
    const spinner = section(page, "Spinner").locator(".ds-spinner").first();
    const ink = await computed(page, "background-color", "var(--ds-ink)");
    const s = await cells(spinner);
    expect(s.map((c) => c.name)).toEqual(["none", "none", "none", "none"]);
    expect(s.map((c) => c.background === ink)).toEqual([true, true, false, false]);
    const text = spinner.locator(".ds-spin-text");
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
      await openStory(page, "Skeleton", theme);
      const s = await section(page, "Skeleton")
        .locator(".ds-skeleton")
        .first()
        .evaluate((e) => {
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
    await openStory(page, "Skeleton", theme);
    // The first text Skeleton of the story, and the description paragraph, which is .ds-t-body.
    const skeleton = variant(page, "Skeleton", 'variant="text"').locator(".ds-skeleton").first();
    const body = await section(page, "Skeleton")
      .locator(".ds-t-body:not(.ds-skeleton)")
      .first()
      .evaluate((e) => getComputedStyle(e).lineHeight);
    expect(body).toMatch(/^\d+(\.\d+)?px$/);
    expect(await skeleton.evaluate((e) => getComputedStyle(e).height)).toBe(body);
    expect(await skeleton.evaluate((e) => e.getAttribute("aria-hidden"))).toBe("true");
  });
}

/** The computed layout properties of a `.ds-stack`. */
const layout = (stack: Locator) =>
  stack.evaluate((e) => {
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
    await openStory(page, "Stack", theme);
    const gap = await computed(page, "gap", "var(--ds-space-3)");
    expect(await layout(section(page, "Stack").locator(".ds-stack").first())).toMatchObject({
      display: "flex",
      direction: "column",
      gap: `${gap} ${gap}`,
    });
  });

  test(`LAY-02 a Stack with direction row, gap 6, align center, justify between and wrap computes them, ${theme}`, async ({
    page,
  }) => {
    await openStory(page, "Stack", theme);
    const gap = await computed(page, "gap", "var(--ds-space-6)");
    expect(await layout(section(page, "Stack").locator(".ds-stack").nth(1))).toEqual({
      display: "flex",
      direction: "row",
      gap: `${gap} ${gap}`,
      align: "center",
      justify: "space-between",
      wrap: "wrap",
    });
  });

  test(`LAY-02 every step of the scale gives its own space token as the Stack gap, ${theme}`, async ({ page }) => {
    await openFixture(page, "Stack", theme);
    const stacks = variant(page, "Stack", "each step of the scale").locator(".ds-stack");
    await expect(stacks).toHaveCount(7);
    for (const [i, n] of [1, 2, 3, 4, 6, 8, 12].entries()) {
      const gap = await computed(page, "gap", `var(--ds-space-${n})`);
      expect((await layout(stacks.nth(i))).gap, `gap ${n}`).toBe(`${gap} ${gap}`);
    }
  });

  test(`LAY-03 a Stack gap out of 1, 2, 3, 4, 6, 8 and 12 falls back to space-3, ${theme}`, async ({ page }) => {
    await openFixture(page, "Stack", theme);
    const stacks = variant(page, "Stack", "out of the scale").locator(".ds-stack");
    const bad = [0, 5, 7, 10, 13, -1, 2.5, NaN, "4"];
    await expect(stacks).toHaveCount(bad.length);
    const gap = await computed(page, "gap", "var(--ds-space-3)");
    for (const [i, value] of bad.entries()) {
      expect((await layout(stacks.nth(i))).gap, String(value)).toBe(`${gap} ${gap}`);
    }
  });
}

const DESKTOP = { width: 1280, height: 800 };
/** The resolved column tracks of a `.ds-grid` in px, the declared `grid-template-columns` and the gap. */
const tracks = (grid: Locator) =>
  grid.evaluate((e) => ({
    columns: getComputedStyle(e).gridTemplateColumns.split(" ").map(parseFloat),
    declared: (e as HTMLElement).style.gridTemplateColumns,
    gap: getComputedStyle(e).columnGap,
  }));
/** How many rows the items of a grid make. */
const rowsOf = (grid: Locator) =>
  grid.locator("> *").evaluateAll((all) => new Set(all.map((s) => s.getBoundingClientRect().top)).size);

for (const theme of THEMES) {
  test(`LAY-04 a Grid with columns 3 on a 1280 px window has three columns of the same width, ${theme}`, async ({
    page,
  }) => {
    await page.setViewportSize(DESKTOP);
    await openFixture(page, "Grid", theme);
    const grid = variant(page, "Grid", "columns={3}").locator(".ds-grid");
    const gap = parseFloat(await computed(page, "gap", "var(--ds-space-3)"));
    const { columns } = await tracks(grid);
    expect(columns).toHaveLength(3);
    // The story caps the Grid at 1000 px.
    const each = (1000 - 2 * gap) / 3;
    columns.forEach((c) => expect(c).toBeCloseTo(each, 1));
    // Six items make two rows of three.
    expect(await rowsOf(grid)).toBe(2);
  });

  test(`LAY-05 a Grid with columns 3 at the gallery-phone width has one column, ${theme}`, async ({ page }) => {
    await page.setViewportSize(devices["Pixel 7"].viewport);
    await openFixture(page, "Grid", theme);
    const grid = variant(page, "Grid", "columns={3}").locator(".ds-grid");
    const { columns } = await tracks(grid);
    expect(columns).toHaveLength(1);
    expect(await rowsOf(grid)).toBe(6);
  });

  test(`LAY-06 a Grid with minColumnWidth 200px declares repeat(auto-fit, minmax(200px, 1fr)) and fits what it can, ${theme}`, async ({
    page,
  }) => {
    await page.setViewportSize(DESKTOP);
    await openFixture(page, "Grid", theme);
    const { declared, columns } = await tracks(
      variant(page, "Grid", 'minColumnWidth="200px" gap={4}').locator(".ds-grid"),
    );
    expect(declared).toBe("repeat(auto-fit, minmax(200px, 1fr))");
    // 1000 px hold four columns of 200 px and three gaps, not five.
    expect(columns).toHaveLength(4);
    for (const c of columns) expect(c).toBeGreaterThanOrEqual(200);
  });

  test(`LAY-03 a Grid gap out of 1, 2, 3, 4, 6, 8 and 12 falls back to space-3, and a step gives its token, ${theme}`, async ({
    page,
  }) => {
    await openFixture(page, "Grid", theme);
    const bad = [0, 5, 13, -1, 2.5, NaN, "4"];
    const fallback = variant(page, "Grid", "out of the scale").locator(".ds-grid");
    await expect(fallback).toHaveCount(bad.length);
    for (const [i, value] of bad.entries()) {
      expect((await tracks(fallback.nth(i))).gap, String(value)).toBe(await computed(page, "gap", "var(--ds-space-3)"));
    }
    const steps = variant(page, "Grid", "each step of the scale").locator(".ds-grid");
    for (const [i, n] of [1, 2, 3, 4, 6, 8, 12].entries()) {
      expect((await tracks(steps.nth(i))).gap, `gap ${n}`).toBe(await computed(page, "gap", `var(--ds-space-${n})`));
    }
  });

  test(`FBL-34 a Grid with columns and minColumnWidth together follows minColumnWidth, ${theme}`, async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await openFixture(page, "Grid", theme);
    const grid = variant(page, "Grid", "minColumnWidth wins").locator(".ds-grid");
    const { declared, columns } = await tracks(grid);
    expect(declared).toBe("repeat(auto-fit, minmax(200px, 1fr))");
    expect(columns).toHaveLength(4);
    expect(await grid.evaluate((e) => e.classList.contains("ds-grid-cols"))).toBe(false);
  });
}

/** The line an `<hr>` draws, from its computed border on the side that the orientation uses. */
const line = (hr: Locator) =>
  hr.evaluate((e) => {
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
    await openStory(page, "Divider", theme);
    // The first line of the story: hair, the default weight.
    const hr = variant(page, "Divider", 'weight="hair"').locator("hr").first();
    const hair = await computed(page, "width", "var(--ds-stroke-hair)");
    const soft = await computed(page, "color", "var(--ds-rule-soft)");
    expect(await line(hr)).toMatchObject({ tag: "HR", width: hair, style: "solid", color: soft, orientation: null });
    expect((await line(hr)).box).toBe(parseFloat(hair));
  });

  test(`DIV-02 a Divider with weight rule or heavy has stroke-rule or stroke-heavy in rule, ${theme}`, async ({
    page,
  }) => {
    await openStory(page, "Divider", theme);
    const lines = variant(page, "Divider", 'weight="hair"').locator("hr");
    for (const [i, weight, token] of [
      [1, "rule", "stroke-rule"],
      [2, "heavy", "stroke-heavy"],
    ] as const) {
      const rule = await computed(page, "color", "var(--ds-rule)");
      const w = await computed(page, "width", `var(--ds-${token})`);
      const l = await line(lines.nth(i));
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
    await openFixture(page, "Divider", theme);
    // Three weights, each in a row with a fixed height, a row that takes its height from the text next to the line, and
    // a block of definite height.
    const lines = variant(page, "Divider", "takes the height of a flex row").locator("hr");
    await expect(lines).toHaveCount(9);
    for (const [w, weight] of [undefined, "rule", "heavy"].entries()) {
      for (let c = 0; c < 3; c++) {
        const hr = lines.nth(w * 3 + c);
        const token = weight === "rule" ? "stroke-rule" : weight === "heavy" ? "stroke-heavy" : "stroke-hair";
        const width = await computed(page, "width", `var(--ds-${token})`);
        const l = await line(hr);
        const expected = await hr.evaluate((e) => e.parentElement!.getBoundingClientRect().height);
        const where = `${weight ?? "hair"} in container ${c}`;
        expect(l, where).toMatchObject({ orientation: "vertical", width, style: "solid" });
        expect(l.box, where).toBe(parseFloat(width));
        expect(l.length, where).toBe(expected);
        expect(l.color).toBe(await computed(page, "color", `var(--ds-${weight ? "rule" : "rule-soft"})`));
      }
    }
  });

  test(`FBL-40 a vertical Divider is as high as its container in a row flex, a grid and a block of definite height, ${theme}`, async ({
    page,
  }) => {
    await openFixture(page, "Divider", theme);
    const lines = variant(page, "Divider", "a row flex, a grid and a block").locator("hr");
    await expect(lines).toHaveCount(3);
    for (let i = 0; i < 3; i++) {
      const m = await lines.nth(i).evaluate((e) => ({
        line: e.getBoundingClientRect().height,
        container: e.parentElement!.getBoundingClientRect().height,
      }));
      expect(m.container, `container ${i}`).toBeGreaterThan(0);
      expect(m.line, `container ${i}`).toBe(m.container);
    }
  });
}

for (const theme of THEMES) {
  test(`TST-11 at the gallery-phone width the toasts take the width of the window at the bottom, with no horizontal scroll, ${theme}`, async ({
    page,
  }) => {
    await page.setViewportSize(devices["Pixel 7"].viewport);
    await openStory(page, "Toaster", theme);
    // The Toaster story: a saved file, then a failed upload.
    await section(page, "Toaster").getByRole("button", { name: "Save", exact: true }).click();
    await section(page, "Toaster").getByRole("button", { name: "Upload", exact: true }).click();
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
    await openFixture(page, "Spinner", theme);
    // Six pairs in the story: outline, solid and text, each standard and danger, a Button and the same one loading.
    const pairs = variant(page, "Spinner", "loading: each variant");
    const plain = pairs.locator("button:not([aria-busy])");
    const busy = pairs.locator("button[aria-busy]");
    await expect(busy).toHaveCount(6);
    await expect(plain).toHaveCount(6);
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
    await openFixture(page, "Spinner", theme);
    const buttons = variant(page, "Spinner", "short label").locator("button");
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
