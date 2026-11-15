import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { MARKS, readMarksBySection, type MarkStyle } from "../support/marks";
import { openAll, openOverlay, openStory, OVERLAYS, section, SECTIONS, THEMES } from "../support/story";

// The forced-colors tests open Overview stories; the ones that read every mark of the gallery visit every story.
test.beforeEach(() => test.setTimeout(120_000));

/**
 * Captured before this feature: theme to the marks' styles, over every Overview story in story order. Recorded from
 * the stories at the move: against the gallery capture only the gallery's own header mark is gone and the width of
 * the fluid marks (bar fills, highlighted cells) follows the Storybook layout; every other property is equal.
 */
const before = JSON.parse(readFileSync(new URL("../support/marks-before.json", import.meta.url), "utf8")) as Record<
  string,
  MarkStyle[]
>;

/** The Overview story `name` in `theme`, in forced colors. */
async function forced(page: Page, name: string, theme = "paper") {
  await page.emulateMedia({ forcedColors: "active" });
  await openStory(page, name, theme);
}
/** Gives `visit` each section of Overview/All, with the marks it holds; open the page first. */
async function eachSection(page: Page, visit: (name: string, marks: MarkStyle[]) => Promise<void>) {
  const bySection = await readMarksBySection(page);
  for (const name of SECTIONS) await visit(name, bySection.get(name) ?? []);
}
/** Background, text colour and top border of the first element matching `selector` that has no ancestor `outside`. */
const first = (page: Page, selector: string, outside?: string) =>
  page.evaluate(
    ([sel, out]) => {
      const [css, pseudo] = sel.split("::");
      const el = [...document.querySelectorAll(css)].find((e) => !out || !e.closest(out))!;
      const s = getComputedStyle(el, pseudo ? `::${pseudo}` : null);
      return { background: s.backgroundColor, color: s.color, border: s.borderTopColor };
    },
    [selector, outside ?? ""] as const,
  );
const bodyBackground = (page: Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
/** Per section of Overview/All: for each `.ds-flag-dot`, in order, whether it is a hollow one (pending or skipped flag). */
const hollowDots = (page: Page) =>
  page.evaluate(() => {
    const out: Record<string, boolean[]> = {};
    for (const d of document.querySelectorAll(".ds-flag-dot")) {
      const id = d.closest("section[data-component], section[data-composition]")?.id ?? "(page)";
      (out[id] ??= []).push(!!d.closest(".ds-flag-pending, .ds-flag-skip"));
    }
    return out;
  });
/** A colour that paints: alpha 0.5 or more (Chromium's forced Highlight is rgba(…, 0.8)); transparent is not. */
const painted = (c: string) => Number(c.match(/^rgba\([^)]*,\s*([\d.]+)\)$/)?.[1] ?? 1) >= 0.5;

for (const theme of THEMES) {
  test(`A11Y-10 every mark is painted apart from the page in forced colors, ${theme}`, async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    const seen = new Set<string>();
    await openAll(page, theme);
    const body = await bodyBackground(page);
    const hollow = await hollowDots(page);
    await eachSection(page, async (name, marks) => {
      marks.forEach((m) => seen.add(m.mark));
      for (const m of marks) {
        // Pending and skipped flags draw a hollow dot: its mark is the border.
        if (m.mark === ".ds-flag-dot" && hollow[name][m.i]) {
          expect.soft(m.border, `${name} ${m.mark} #${m.i}`).not.toBe(body);
          continue;
        }
        expect.soft(painted(m.background), `${name} ${m.mark} #${m.i} ${m.background}`).toBe(true);
        expect.soft(m.background, `${name} ${m.mark} #${m.i}`).not.toBe(body);
      }
    });
    expect(seen).toEqual(new Set(MARKS));
  });
}

test("A11Y-11 a lit Meter cell differs from an unlit one in forced colors", async ({ page }) => {
  await forced(page, "Meter");
  const on = await first(page, ".ds-meter:not(.ds-meter-signal) .ds-cell-on");
  const off = await first(page, ".ds-meter:not(.ds-meter-signal) .ds-cell:not(.ds-cell-on)");
  const signal = await first(page, ".ds-meter-signal .ds-cell-on");
  const body = await bodyBackground(page);
  for (const lit of [on, signal]) {
    expect(painted(lit.background), lit.background).toBe(true);
    expect(lit.background).not.toBe(body);
    expect(lit.background).not.toBe(off.background);
  }
});

test("A11Y-12 the active BarChart bar differs from an inactive one in forced colors", async ({ page }) => {
  await forced(page, "BarChart");
  const on = await first(page, ".ds-bar-on .ds-bar-fill");
  const off = await first(page, ".ds-bar-fill", ".ds-bar-on");
  expect(on.background).not.toBe(off.background);
});

test("A11Y-13 the active Timeline mark differs from an inactive one in forced colors", async ({ page }) => {
  await forced(page, "Timeline");
  const on = await first(page, ".ds-tl-on .ds-tl-mark");
  const off = await first(page, ".ds-tl-mark", ".ds-tl-on");
  expect(on.background).not.toBe(off.background);
});

test("A11Y-14 the active Hierarchy node differs from the root and from a plain node in forced colors", async ({
  page,
}) => {
  await forced(page, "Hierarchy");
  const on = await first(page, ".ds-tree-node.ds-tree-on");
  const root = await first(page, ".ds-tree-node.ds-tree-root:not(.ds-tree-on)");
  const plain = await first(page, ".ds-tree-node:not(.ds-tree-root):not(.ds-tree-on)");
  expect(new Set([on.background, root.background, plain.background]).size).toBe(3);
});

test("A11Y-15 the out-of-range ToleranceBar marker differs from an in-range one in forced colors", async ({ page }) => {
  await forced(page, "ToleranceBar");
  const out = await first(page, ".ds-tol-out .ds-tol-marker");
  const inside = await first(page, ".ds-tol-marker", ".ds-tol-out");
  expect(out.background).not.toBe(inside.background);
});

test("A11Y-16 text on a solid Tag, a failed StatusFlag and the active node differs from its fill", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  const STORY: Record<string, string> = {
    ".ds-tag.ds-tag-solid": "Tag",
    ".ds-flag.ds-flag-fail": "StatusFlag",
    ".ds-tree-node.ds-tree-on": "Hierarchy",
  };
  for (const selector of Object.keys(STORY)) {
    await openStory(page, STORY[selector], "paper");
    const s = await first(page, selector);
    expect(painted(s.background), selector).toBe(true);
    expect(s.color, selector).not.toBe(s.background);
  }
  // The root node's code keeps a colour of its own: it must differ from the root's fill too.
  await openStory(page, "Hierarchy", "paper");
  const code = await first(page, ".ds-tree-root .ds-tree-code");
  const root = await first(page, ".ds-tree-node.ds-tree-root");
  expect(code.color).not.toBe(root.background);
});

for (const theme of THEMES) {
  test(`A11Y-17 without forced colors every mark keeps its style from before, ${theme}`, async ({ page }) => {
    await page.emulateMedia({ forcedColors: "none" });
    const expected = before[theme];
    expect(expected.length).toBeGreaterThan(80);
    // The marks of every section, in section order, are the marks of the gallery page: the index of a mark counts
    // the elements of its selector over all the sections before it.
    const marks: MarkStyle[] = [];
    const count: Record<string, number> = {};
    await openAll(page, theme);
    const bySection = await readMarksBySection(page);
    for (const name of SECTIONS) {
      for (const m of bySection.get(name) ?? []) {
        marks.push({ ...m, i: m.i + (count[m.mark] ?? 0) });
      }
      for (const m of MARKS) count[m] = marks.filter((x) => x.mark === m).length;
    }
    const order = (list: MarkStyle[]) => MARKS.flatMap((m) => list.filter((x) => x.mark === m));
    expect(order(marks)).toEqual(order(expected));
  });
}

test("A11Y-32 Redacted keeps role img and its label, with no hidden text, in forced colors", async ({ page }) => {
  let total = 0;
  await page.emulateMedia({ forcedColors: "active" });
  await openAll(page, "paper");
  for (const name of SECTIONS) {
    const bars = section(page, name).locator(".ds-redact");
    total += await bars.count();
    for (const bar of await bars.all()) {
      await expect.soft(bar, name).toHaveAttribute("role", "img");
      await expect.soft(bar, name).toHaveAttribute("aria-label", "Redacted");
      await expect.soft(bar, name).toHaveText("");
    }
  }
  expect(total).toBeGreaterThan(0);
});

/** sRGB channels and alpha of a computed colour. */
const channels = (c: string) => {
  const [r, g, b, a = 1] = c
    .match(/rgba?\(([^)]*)\)/)![1]
    .split(",")
    .map(Number);
  return { r, g, b, a };
};
const over = (fg: string, bg: string) => {
  const f = channels(fg);
  const b = channels(bg);
  return { r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a) };
};
const luminance = ({ r, g, b }: { r: number; g: number; b: number }) => {
  const lin = (v: number) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
/** WCAG contrast of a colour (composited over the page) against the page. */
const contrast = (fg: string, body: string) => {
  const [x, y] = [luminance(over(fg, body)), luminance(channels(body))].sort((a, b) => b - a);
  return (x + 0.05) / (y + 0.05);
};

for (const colorScheme of ["light", "dark"] as const) {
  test(`A11Y-18 every mark reaches 3:1 against the page by its fill or its outline in forced colors, ${colorScheme}`, async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active", colorScheme });
    const low: string[] = [];
    let body = "";
    await openAll(page, "paper");
    body = await bodyBackground(page);
    const hollow = await hollowDots(page);
    await eachSection(page, async (name, marks) => {
      for (const m of marks) {
        const where = `${name} ${m.mark} #${m.i}`;
        if (m.mark === ".ds-flag-dot" && hollow[name][m.i]) {
          if (contrast(m.border, body) < 3) low.push(`${where} border ${m.border}`);
          continue;
        }
        if (contrast(m.background, body) >= 3) continue;
        const outlined =
          m.outlineStyle === "solid" && parseFloat(m.outlineWidth) >= 1 && contrast(m.outlineColor, body) >= 3;
        if (!outlined)
          low.push(`${where} fill ${m.background}, outline ${m.outlineStyle} ${m.outlineWidth} ${m.outlineColor}`);
      }
      expect
        .soft(
          low.filter((l) => l.startsWith(`${name} `)),
          `${name} marks under 3:1 (page ${body})`,
        )
        .toEqual([]);
    });
    expect(low, `page ${body}`).toEqual([]);
  });
}

/** The focusable element of each new control's gallery section. */
const FOCUSABLE = {
  Button: ".ds-btn:not(:disabled)",
  IconButton: ".ds-btn-icon:not(:disabled)",
  Link: ".ds-link",
  Checkbox: ".ds-fc-box:not(:disabled)",
  Switch: ".ds-fc-sw:not(:disabled)",
  RadioGroup: ".ds-fc-radio:not(:disabled)",
  Select: ".ds-select-input:not(:disabled)",
};

for (const [section, selector] of Object.entries(FOCUSABLE)) {
  test(`PRM-30 a ${section} focused by keyboard shows an outline in forced colors`, async ({ page }) => {
    await forced(page, section);
    const control = page.locator(`#${section} ${selector}`).first();
    await page.keyboard.press("Tab");
    await control.focus();
    await expect(control).toBeFocused();
    expect(await control.evaluate((el) => el.matches(":focus-visible"))).toBe(true);
    const outline = await control.evaluate((el) => {
      const s = getComputedStyle(el);
      return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) };
    });
    expect(outline.style).not.toBe("none");
    expect(outline.width).toBeGreaterThan(0);
  });
}

for (const theme of THEMES) {
  test(`OVL-07 the border of the open Dialog, popover panel, tip and menu differs from their background in forced colors, ${theme}`, async ({
    page,
  }) => {
    for (const id of OVERLAYS) {
      // A fresh page each time: an open Dialog makes the rest of the page inert.
      await forced(page, id, theme);
      const panel = await openOverlay(page, id);
      const s = await panel.evaluate((el) => {
        const c = getComputedStyle(el);
        return {
          border: c.borderTopColor,
          background: c.backgroundColor,
          width: c.borderTopWidth,
          style: c.borderTopStyle,
        };
      });
      expect(s.style, id).not.toBe("none");
      expect(parseFloat(s.width), id).toBeGreaterThan(0);
      expect(painted(s.border), `${id} border ${s.border}`).toBe(true);
      expect(s.border, id).not.toBe(s.background);
    }
  });
}

for (const theme of THEMES) {
  test(`DIS-06 the selected tab bar, the Accordion marker and the current page differ from the page in forced colors, ${theme}`, async ({
    page,
  }) => {
    await forced(page, "Tabs", theme);
    const body = await bodyBackground(page);
    const bar = await first(page, "#Tabs .ds-tab[aria-selected='true']::after");
    expect(painted(bar.background), `bar ${bar.background}`).toBe(true);
    expect(bar.background, "bar").not.toBe(body);
    // The marker keeps its square by a border and its sign by the text colour; its fill is the page.
    await openStory(page, "Accordion", theme);
    const marker = await first(page, "#Accordion .ds-accordion-summary::before");
    for (const [part, colour] of [
      ["border", marker.border],
      ["sign", marker.color],
    ])
      expect(colour, `marker ${part}`).not.toBe(body);
    await openStory(page, "Pagination", theme);
    const current = await first(page, "#Pagination .ds-pagination-item[aria-current='page']");
    expect(painted(current.background), `page ${current.background}`).toBe(true);
    expect(current.background, "current page").not.toBe(body);
    expect(current.color, "current page text").not.toBe(current.background);
  });
}

/** The focusable element of each disclosure section whose focus ring is a shadow without forced colors. */
const DISCLOSURE_FOCUS = {
  Accordion: ".ds-accordion-summary",
  Pagination: "a.ds-pagination-page",
  Tabs: ".ds-tabs-panel:not([hidden])",
};

for (const [name, selector] of Object.entries(DISCLOSURE_FOCUS)) {
  test(`DIS-06 a ${name} element focused by keyboard shows an outline in forced colors`, async ({ page }) => {
    await forced(page, name);
    const target = page.locator(`#${name} ${selector}`).first();
    await page.keyboard.press("Tab");
    await target.focus();
    await expect(target).toBeFocused();
    expect(await target.evaluate((el) => el.matches(":focus-visible"))).toBe(true);
    const outline = await target.evaluate((el) => {
      const s = getComputedStyle(el);
      return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) };
    });
    expect(outline.style).not.toBe("none");
    expect(outline.width).toBeGreaterThan(0);
  });
}

for (const theme of THEMES) {
  test(`FBL-06 the lit Spinner cell, the toast border, the Divider and the Icon strokes differ from the page in forced colors, ${theme}`, async ({
    page,
  }) => {
    await forced(page, "Spinner", theme);
    const body = await bodyBackground(page);
    // With reduced motion the first two cells are lit and stand still.
    await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
    const lit = await first(page, "#Spinner .ds-spin-cell");
    expect(painted(lit.background), `cell ${lit.background}`).toBe(true);
    expect(lit.background, "lit cell").not.toBe(body);
    await openStory(page, "Toaster", theme);
    const toaster = page.locator("#Toaster");
    await toaster.getByRole("button", { name: "Assign", exact: true }).click();
    await toaster.getByRole("button", { name: "Upload", exact: true }).click();
    await expect(page.locator(".ds-toast")).toHaveCount(2);
    const borders = await page.locator(".ds-toast").evaluateAll((all) =>
      all.map((t) => {
        const s = getComputedStyle(t);
        return { color: s.borderTopColor, width: parseFloat(s.borderTopWidth), background: s.backgroundColor };
      }),
    );
    for (const b of borders) {
      expect(b.width).toBeGreaterThan(0);
      expect(b.color).not.toBe(b.background);
      expect(b.color).not.toBe(body);
    }
    await openStory(page, "Divider", theme);
    const lines = await page.locator("#Divider hr.ds-divider").evaluateAll((all) =>
      all.map((d) => {
        const s = getComputedStyle(d);
        const vertical = d.getAttribute("aria-orientation") === "vertical";
        return {
          color: vertical ? s.borderLeftColor : s.borderTopColor,
          width: parseFloat(vertical ? s.borderLeftWidth : s.borderTopWidth),
        };
      }),
    );
    expect(lines.length).toBeGreaterThanOrEqual(4);
    for (const l of lines) {
      expect(l.width).toBeGreaterThan(0);
      expect(l.color).not.toBe(body);
    }
    await openStory(page, "Icon", theme);
    const strokes = await page
      .locator("#Icon svg.ds-icon path")
      .evaluateAll((all) => [...new Set(all.map((p) => getComputedStyle(p).stroke))]);
    expect(strokes.length).toBeGreaterThan(0);
    for (const s of strokes) expect(s, "icon stroke").not.toBe(body);
  });
}
