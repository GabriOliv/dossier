import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { createElement, Fragment, type ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Checkbox } from "../../src/components/Checkbox";
import { RadioGroup } from "../../src/components/RadioGroup";
import { Select } from "../../src/components/Select";
import { Switch } from "../../src/components/Switch";
import { TextField } from "../../src/components/TextField";

// The form controls (Checkbox, Switch, RadioGroup, Select) are checked on blank pages of their own that hold
// dist/styles.css under the theme, so each case is measured alone, away from the gallery layout.
const THEMES = ["paper", "void", "blueprint"] as const;
const styles = readFileSync("dist/styles.css", "utf8");

/** A page in `theme` holding the static markup of `elements`, rendered together so their ids differ, with styles.css. */
async function open(page: Page, theme: string, ...elements: ReactElement[]): Promise<void> {
  const body = renderToStaticMarkup(createElement(Fragment, null, ...elements));
  await page.setContent(`<!doctype html><html data-theme="${theme}"><head></head><body>${body}</body></html>`);
  await page.addStyleTag({ content: styles });
}
/** What `value` computes to for `property`, e.g. `var(--ds-signal)` for `color`, read on a throwaway element. */
const resolve = (page: Page, property: string, value: string) =>
  page.evaluate(
    ([p, v]) => {
      const el = document.createElement("i");
      (el.style as any)[p] = v;
      document.body.append(el);
      const out = (getComputedStyle(el) as any)[p] as string;
      el.remove();
      return out;
    },
    [property, value],
  );
/** What the system colour `name` (Canvas, Highlight…) computes to, read on an element the forced colors leave alone. */
const systemColor = (page: Page, name: string) =>
  page.evaluate((n) => {
    const el = document.createElement("i");
    el.style.cssText = `forced-color-adjust: none; background-color: ${n}`;
    document.body.append(el);
    const out = getComputedStyle(el).backgroundColor;
    el.remove();
    return out;
  }, name);
/** The box of the first element matching `selector`, in page pixels. */
const rect = (page: Page, selector: string) =>
  page.evaluate((sel) => {
    const r = document.querySelector(sel)!.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  }, selector);
/** The computed `properties` of the first element matching `selector`. */
const style = (page: Page, selector: string, properties: string[]) =>
  page.evaluate(
    ([sel, props]) => {
      const s = getComputedStyle(document.querySelector(sel)!) as any;
      return Object.fromEntries(props.map((p) => [p, s[p] as string]));
    },
    [selector, properties] as const,
  );

for (const theme of THEMES) {
  test(`CHK-01 the field is a grid of 8px rows 420px wide at most, its row a 12px flex line, its box 20px square and centred on the first text line (${theme})`, async ({
    page,
  }) => {
    await open(page, theme, createElement(Checkbox, { label: "Aceito", hint: "Soft.", id: "c" }));
    const [ink, paper] = await Promise.all(["--ds-ink", "--ds-paper"].map((t) => resolve(page, "color", `var(${t})`)));
    expect(await style(page, ".ds-fc", ["display", "rowGap", "maxWidth", "color"])).toEqual({
      display: "grid",
      rowGap: "8px",
      maxWidth: "420px",
      color: ink,
    });
    expect(await style(page, ".ds-fc-row", ["display", "columnGap"])).toEqual({ display: "flex", columnGap: "12px" });
    expect(await style(page, ".ds-fc-ctl", ["position", "display"])).toEqual({ position: "relative", display: "grid" });
    const [ctl, box] = [await rect(page, ".ds-fc-ctl"), await rect(page, "#c")];
    expect({ ctlHeight: ctl.height, w: box.width, h: box.height, dx: box.x - ctl.x, dy: box.y - ctl.y }).toEqual({
      ctlHeight: 21,
      w: 20,
      h: 20,
      dx: 0,
      dy: 0.5,
    });
    expect(
      await style(page, "#c", [
        "appearance",
        "backgroundColor",
        "borderTopColor",
        "borderTopWidth",
        "borderTopStyle",
        "borderTopLeftRadius",
        "outlineStyle",
      ]),
    ).toEqual({
      appearance: "none",
      backgroundColor: paper,
      borderTopColor: ink,
      borderTopWidth: "1px",
      borderTopStyle: "solid",
      borderTopLeftRadius: "0px",
      outlineStyle: "none",
    });
  });

  test(`CHK-03 a checked Checkbox is filled with --ds-signal and an unchecked one is not (${theme})`, async ({
    page,
  }) => {
    await open(
      page,
      theme,
      createElement(Checkbox, { label: "Off", id: "off" }),
      createElement(Checkbox, { label: "On", id: "on", defaultChecked: true }),
    );
    const [signal, paper, ink] = await Promise.all(
      ["--ds-signal", "--ds-paper", "--ds-ink"].map((t) => resolve(page, "color", `var(${t})`)),
    );
    expect(await style(page, "#on", ["backgroundColor", "borderTopColor"])).toEqual({
      backgroundColor: signal,
      borderTopColor: signal,
    });
    expect(await style(page, "#off", ["backgroundColor", "borderTopColor"])).toEqual({
      backgroundColor: paper,
      borderTopColor: ink,
    });
  });

  test(`CHK-03 the tick of a checked Checkbox is a 2px corner in --ds-on-signal, turned 45 degrees and centred on the box; an unchecked one shows none (${theme})`, async ({
    page,
  }) => {
    await open(
      page,
      theme,
      createElement(Checkbox, { label: "Off", id: "off" }),
      createElement(Checkbox, { label: "On", id: "on", defaultChecked: true }),
    );
    const onSignal = await resolve(page, "color", "var(--ds-on-signal)");
    const tick = "#on + .ds-fc-tick";
    expect(
      await style(page, tick, [
        "display",
        "position",
        "width",
        "height",
        "borderTopWidth",
        "borderLeftWidth",
        "borderRightWidth",
        "borderBottomWidth",
        "borderRightColor",
        "borderBottomColor",
        "pointerEvents",
      ]),
    ).toEqual({
      display: "block",
      position: "absolute",
      width: "5px",
      height: "10px",
      borderTopWidth: "0px",
      borderLeftWidth: "0px",
      borderRightWidth: "2px",
      borderBottomWidth: "2px",
      borderRightColor: onSignal,
      borderBottomColor: onSignal,
      pointerEvents: "none",
    });
    expect((await style(page, tick, ["transform"])).transform).toBe(
      await resolve(page, "transform", "translateY(-1px) rotate(45deg)"),
    );
    const [t, box] = [await rect(page, tick), await rect(page, "#on")];
    expect(Math.abs(t.x + t.width / 2 - (box.x + box.width / 2))).toBeLessThan(0.5);
    expect(Math.abs(t.y + t.height / 2 + 1 - (box.y + box.height / 2))).toBeLessThan(0.5);
    // A click on the tick reaches the input.
    expect(
      await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.id, [
        t.x + t.width / 2,
        t.y + t.height / 2,
      ] as const),
    ).toBe("on");
    expect((await style(page, "#off + .ds-fc-tick", ["display"])).display).toBe("none");
  });

  test(`CHK-03 a Checkbox focused by keyboard shows --ds-focus-ring and no outline (${theme})`, async ({ page }) => {
    await open(page, theme, createElement(Checkbox, { label: "Aceito", id: "c" }));
    await page.keyboard.press("Tab");
    await expect(page.locator("#c")).toBeFocused();
    const ring = await resolve(page, "boxShadow", "var(--ds-focus-ring)");
    expect(ring).not.toBe("none");
    expect(await style(page, "#c", ["boxShadow", "outlineStyle"])).toEqual({ boxShadow: ring, outlineStyle: "none" });
  });

  test(`CHK-05 an error draws the box with a 2px --ds-contrast-error border and the text in --ds-contrast-error (${theme})`, async ({
    page,
  }) => {
    await open(page, theme, createElement(Checkbox, { label: "Aceito", id: "c", error: "Accept to go on." }));
    const error = await resolve(page, "color", "var(--ds-contrast-error)");
    expect(await style(page, "#c", ["borderTopColor", "borderTopWidth", "borderTopStyle"])).toEqual({
      borderTopColor: error,
      borderTopWidth: "2px",
      borderTopStyle: "solid",
    });
    expect((await style(page, ".ds-fc-text", ["color"])).color).toBe(error);
  });

  test(`CHK-11 a disabled Checkbox has a dashed border and --ds-ink-muted text, also with an error (${theme})`, async ({
    page,
  }) => {
    await open(
      page,
      theme,
      createElement(Checkbox, { label: "Aceito", id: "c", disabled: true }),
      createElement(Checkbox, { label: "Bad", id: "e", disabled: true, error: "Nope." }),
    );
    const muted = await resolve(page, "color", "var(--ds-ink-muted)");
    expect(await style(page, "#c", ["borderTopStyle"])).toEqual({ borderTopStyle: "dashed" });
    expect((await style(page, ".ds-fc-off .ds-fc-text", ["color"])).color).toBe(muted);
    expect(await style(page, "#e", ["borderTopStyle"])).toEqual({ borderTopStyle: "dashed" });
  });
}

for (const theme of THEMES) {
  test(`CHK-10 a Switch that is on has a 36px by 20px track filled with --ds-signal, one that is off has a --ds-paper track (${theme})`, async ({
    page,
  }) => {
    await open(
      page,
      theme,
      createElement(Switch, { label: "Off", id: "off" }),
      createElement(Switch, { label: "On", id: "on", defaultChecked: true }),
    );
    const [signal, paper, ink] = await Promise.all(
      ["--ds-signal", "--ds-paper", "--ds-ink"].map((t) => resolve(page, "color", `var(${t})`)),
    );
    expect(await style(page, "#on", ["backgroundColor", "borderTopColor"])).toEqual({
      backgroundColor: signal,
      borderTopColor: signal,
    });
    expect(await style(page, "#off", ["backgroundColor", "borderTopColor"])).toEqual({
      backgroundColor: paper,
      borderTopColor: ink,
    });
    for (const id of ["#on", "#off"]) {
      const { width, height } = await rect(page, id);
      expect({ id, width, height }).toEqual({ id, width: 36, height: 20 });
    }
  });

  test(`CHK-09 the button of a Switch is a 12px square at the left end when off and at the right end when on, centred on the track (${theme})`, async ({
    page,
  }) => {
    await open(
      page,
      theme,
      createElement(Switch, { label: "Off", id: "off" }),
      createElement(Switch, { label: "On", id: "on", defaultChecked: true }),
    );
    const [onSignal, ink] = await Promise.all(
      ["--ds-on-signal", "--ds-ink"].map((t) => resolve(page, "color", `var(${t})`)),
    );
    for (const [id, dx, color] of [
      ["off", 4, ink],
      ["on", 20, onSignal],
    ] as const) {
      const [track, thumb] = [await rect(page, `#${id}`), await rect(page, `#${id} + .ds-fc-thumb`)];
      expect(
        { id, dx: thumb.x - track.x, w: thumb.width, h: thumb.height, dy: thumb.y + 6 - (track.y + 10) },
        id,
      ).toEqual({ id, dx, w: 12, h: 12, dy: 0 });
      expect(await style(page, `#${id} + .ds-fc-thumb`, ["backgroundColor", "position", "pointerEvents"])).toEqual({
        backgroundColor: color,
        position: "absolute",
        pointerEvents: "none",
      });
    }
  });
}

for (const theme of THEMES) {
  test(`CHK-12 in forced colors the tick of a checked Checkbox differs from the box and the track of a Switch that is on from one that is off (${theme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await open(
      page,
      theme,
      createElement(Checkbox, { label: "Box", id: "box", defaultChecked: true }),
      createElement(Switch, { label: "Off", id: "off" }),
      createElement(Switch, { label: "On", id: "on", defaultChecked: true }),
    );
    const box = await style(page, "#box", ["backgroundColor"]);
    const tick = await style(page, "#box + .ds-fc-tick", ["borderBottomColor", "borderRightColor"]);
    expect(tick.borderBottomColor).not.toBe(box.backgroundColor);
    expect(tick.borderRightColor).toBe(tick.borderBottomColor);
    expect(tick.borderBottomColor).not.toBe("rgba(0, 0, 0, 0)");
    const on = await style(page, "#on", ["backgroundColor"]);
    const off = await style(page, "#off", ["backgroundColor"]);
    expect(on.backgroundColor).not.toBe(off.backgroundColor);
    expect(on.backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    // The Switch is drawn in system colours: Canvas and CanvasText when off, Highlight when on, and its button shows
    // against both.
    const [canvas, canvasText, highlight] = await Promise.all(
      ["Canvas", "CanvasText", "Highlight"].map((c) => systemColor(page, c)),
    );
    expect(await style(page, "#off", ["backgroundColor", "borderTopColor"])).toEqual({
      backgroundColor: canvas,
      borderTopColor: canvasText,
    });
    expect(await style(page, "#on", ["backgroundColor", "borderTopColor"])).toEqual({
      backgroundColor: highlight,
      borderTopColor: highlight,
    });
    expect((await style(page, "#off + .ds-fc-thumb", ["backgroundColor"])).backgroundColor).toBe(canvasText);
    expect((await style(page, "#on + .ds-fc-thumb", ["backgroundColor"])).backgroundColor).not.toBe(highlight);
  });
}

const plans = [
  { value: "a", label: "Basic" },
  { value: "b", label: "Team" },
  { value: "c", label: "Company" },
];

for (const theme of THEMES) {
  test(`RAD-01 the group is a borderless fieldset whose legend and rows are 8px apart, and each radio sits at the left of its row (${theme})`, async ({
    page,
  }) => {
    await open(page, theme, createElement(RadioGroup, { label: "Plano", options: plans, id: "g", hint: "Soft." }));
    expect(
      await style(page, "#g", ["display", "rowGap", "minWidth", "marginTop", "paddingTop", "borderTopWidth"]),
    ).toEqual({
      display: "grid",
      rowGap: "8px",
      minWidth: "0px",
      marginTop: "0px",
      paddingTop: "0px",
      borderTopWidth: "0px",
    });
    expect(await style(page, "legend", ["paddingTop", "paddingLeft", "marginBottom"])).toEqual({
      paddingTop: "0px",
      paddingLeft: "0px",
      marginBottom: "8px",
    });
    const rows = await page.locator(".ds-fc-row").evaluateAll((all) =>
      all.map((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top, bottom: r.bottom, left: r.left };
      }),
    );
    expect(rows).toHaveLength(3);
    expect(rows[1].top - rows[0].bottom).toBe(8);
    expect(rows[2].top - rows[1].bottom).toBe(8);
    const legend = await rect(page, "legend");
    expect(rows[0].top - (legend.y + legend.height)).toBe(8);
    const hint = await rect(page, ".ds-tf-msg");
    expect(hint.y - rows[2].bottom).toBe(8);
  });

  test(`RAD-08 every radio is a 20px circle (50% radius) with a --ds-paper fill, and the checked one draws a 10px --ds-signal dot at its centre (${theme})`, async ({
    page,
  }) => {
    await open(
      page,
      theme,
      createElement(RadioGroup, { label: "Plano", options: plans, defaultValue: "b", name: "plan" }),
    );
    const [signal, paper, ink] = await Promise.all(
      ["--ds-signal", "--ds-paper", "--ds-ink"].map((t) => resolve(page, "color", `var(${t})`)),
    );
    for (const n of [0, 1, 2]) {
      const radio = page.locator("input").nth(n);
      const s = await radio.evaluate((el) => {
        const c = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return {
          radius: c.borderTopLeftRadius,
          bg: c.backgroundColor,
          border: c.borderTopColor,
          width: r.width,
          height: r.height,
        };
      });
      expect(s, `radio ${n}`).toEqual({ radius: "50%", bg: paper, border: ink, width: 20, height: 20 });
    }
    const dots = page.locator(".ds-fc-pip");
    const readDot = (n: number) =>
      dots.nth(n).evaluate((el) => {
        const c = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        const box = el.previousElementSibling!.getBoundingClientRect();
        return {
          display: c.display,
          bg: c.backgroundColor,
          radius: c.borderTopLeftRadius,
          pointerEvents: c.pointerEvents,
          size: [r.width, r.height],
          dx: r.x + r.width / 2 - (box.x + box.width / 2),
          dy: r.y + r.height / 2 - (box.y + box.height / 2),
        };
      });
    expect(await readDot(1)).toEqual({
      display: "block",
      bg: signal,
      radius: "50%",
      pointerEvents: "none",
      size: [10, 10],
      dx: 0,
      dy: 0,
    });
    expect((await readDot(0)).display).toBe("none");
    expect((await readDot(2)).display).toBe("none");
  });

  test(`RAD-06 an error draws the radios with a 2px --ds-contrast-error border and the legend in --ds-contrast-error, not the option texts (${theme})`, async ({
    page,
  }) => {
    await open(page, theme, createElement(RadioGroup, { label: "Plano", options: plans, error: "Pick a plan." }));
    const [error, ink] = await Promise.all(
      ["--ds-contrast-error", "--ds-ink"].map((t) => resolve(page, "color", `var(${t})`)),
    );
    expect(await style(page, "input", ["borderTopColor", "borderTopWidth", "borderTopStyle"])).toEqual({
      borderTopColor: error,
      borderTopWidth: "2px",
      borderTopStyle: "solid",
    });
    expect((await style(page, "legend", ["color"])).color).toBe(error);
    expect((await style(page, ".ds-fc-text", ["color"])).color).toBe(ink);
  });

  test(`RAD-07 a disabled option has a dashed radio and --ds-ink-muted text, the others do not (${theme})`, async ({
    page,
  }) => {
    await open(
      page,
      theme,
      createElement(RadioGroup, {
        label: "Plano",
        options: [plans[0], { ...plans[1], disabled: true }, plans[2]],
      }),
    );
    const [muted, ink] = await Promise.all(
      ["--ds-ink-muted", "--ds-ink"].map((t) => resolve(page, "color", `var(${t})`)),
    );
    const read = (n: number) =>
      page
        .locator(".ds-fc-row")
        .nth(n)
        .evaluate((row) => ({
          border: getComputedStyle(row.querySelector("input")!).borderTopStyle,
          text: getComputedStyle(row.querySelector(".ds-fc-text")!).color,
        }));
    expect(await read(0)).toEqual({ border: "solid", text: ink });
    expect(await read(1)).toEqual({ border: "dashed", text: muted });
    expect(await read(2)).toEqual({ border: "solid", text: ink });
  });

  test(`RAD-09 in forced colors the dot of the checked radio is painted in Highlight, apart from its circle (${theme})`, async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: "active" });
    await open(page, theme, createElement(RadioGroup, { label: "Plano", options: plans, defaultValue: "b" }));
    const highlight = await systemColor(page, "Highlight");
    const dot = await style(page, "input:checked + .ds-fc-pip", ["backgroundColor"]);
    const circle = await style(page, "input:checked", ["backgroundColor"]);
    expect(dot.backgroundColor).toBe(highlight);
    expect(dot.backgroundColor).not.toBe(circle.backgroundColor);
  });
}

const countries = [
  { value: "br", label: "Brasil" },
  { value: "pt", label: "Portugal" },
];
const BORDERS = [
  "borderTopWidth",
  "borderRightWidth",
  "borderBottomWidth",
  "borderLeftWidth",
  "borderTopStyle",
  "borderRightStyle",
  "borderBottomStyle",
  "borderLeftStyle",
  "borderTopColor",
  "borderRightColor",
  "borderBottomColor",
  "borderLeftColor",
];

for (const theme of THEMES) {
  test(`SEL-06 the select has square corners and the border of the TextField in the normal, error and disabled states (${theme})`, async ({
    page,
  }) => {
    await open(
      page,
      theme,
      createElement(Select, { label: "País", options: countries, id: "s-normal" }),
      createElement(TextField, { label: "País", id: "t-normal" }),
      createElement(Select, { label: "País", options: countries, id: "s-error", error: "Pick one." }),
      createElement(TextField, { label: "País", id: "t-error", error: "Pick one." }),
      createElement(Select, { label: "País", options: countries, id: "s-off", disabled: true }),
      createElement(TextField, { label: "País", id: "t-off", disabled: true }),
    );
    for (const state of ["normal", "error", "off"]) {
      const select = await style(page, `#s-${state}`, [...BORDERS, "borderTopLeftRadius", "borderBottomRightRadius"]);
      const field = await style(page, `#t-${state}`, BORDERS);
      expect(select.borderTopLeftRadius, state).toBe("0px");
      expect(select.borderBottomRightRadius, state).toBe("0px");
      for (const side of BORDERS) expect(select[side], `${state} ${side}`).toBe(field[side]);
    }
    // The states differ from one another, so the equality above is not between three blank borders.
    const [normal, error, off] = await Promise.all(
      ["normal", "error", "off"].map((s) => style(page, `#s-${s}`, ["borderTopWidth", "borderTopStyle"])),
    );
    expect([normal, error, off]).toEqual([
      { borderTopWidth: "1px", borderTopStyle: "solid" },
      { borderTopWidth: "2px", borderTopStyle: "solid" },
      { borderTopWidth: "1px", borderTopStyle: "dashed" },
    ]);
  });

  test(`SEL-01 the select hides the native arrow and draws its own 10px by 6px arrow, centred 12px from the right edge, in --ds-ink and never taking a click (${theme})`, async ({
    page,
  }) => {
    await open(page, theme, createElement(Select, { label: "País", options: countries, id: "s" }));
    const ink = await resolve(page, "color", "var(--ds-ink)");
    expect(await style(page, "#s", ["appearance", "paddingRight"])).toEqual({
      appearance: "none",
      paddingRight: "34px",
    });
    expect(await style(page, ".ds-select-box", ["position"])).toEqual({ position: "relative" });
    expect(await style(page, ".ds-select-arrow", ["position", "pointerEvents", "fill"])).toEqual({
      position: "absolute",
      pointerEvents: "none",
      fill: ink,
    });
    const [box, arrow] = [await rect(page, "#s"), await rect(page, ".ds-select-arrow")];
    expect({ w: arrow.width, h: arrow.height, right: box.x + box.width - (arrow.x + arrow.width) }).toEqual({
      w: 10,
      h: 6,
      right: 12,
    });
    expect(Math.abs(arrow.y + arrow.height / 2 - (box.y + box.height / 2))).toBeLessThan(0.5);
    // A click on the arrow reaches the select.
    expect(
      await page.evaluate(([x, y]) => document.elementFromPoint(x, y)?.id, [
        arrow.x + arrow.width / 2,
        arrow.y + arrow.height / 2,
      ] as const),
    ).toBe("s");
  });

  test(`SEL-06 an error keeps the room for the arrow in the right padding (${theme})`, async ({ page }) => {
    await open(page, theme, createElement(Select, { label: "País", options: countries, id: "s", error: "Pick one." }));
    expect((await style(page, "#s", ["paddingRight"])).paddingRight).toBe("34px");
  });
}
