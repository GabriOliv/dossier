import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as lib from "../../src/index";
import { calls, load, mount, refIs } from "./mount";
import { onEachReact, overlayCalls } from "./overlay-mount";

/**
 * Each component with minimal props that render (plain data, for the browser too), the tag of the element that gets
 * its ref and native attributes, and, when that element is not the root, a selector for it inside the component.
 */
const CASES_API: [name: string, props: Record<string, unknown>, tag: string, target?: string][] = [
  ["Tag", { children: "Live" }, "span"],
  ["StatusFlag", { status: "pass" }, "span"],
  ["Redacted", {}, "span"],
  ["Assertion", { expected: "1", actual: "1" }, "div"],
  ["BarChart", { data: [{ label: "A", value: 1 }] }, "div"],
  ["CheckLog", { checks: [{ label: "a", result: "pass" }] }, "div"],
  ["Meter", { label: "M", value: 3 }, "div"],
  ["Readout", { label: "R", value: "1" }, "div"],
  ["ToleranceBar", { label: "T", value: 1, max: 2 }, "div"],
  ["Transcript", { lines: [{ speaker: "A", text: "hi" }] }, "div"],
  ["Hierarchy", { root: { label: "R" } }, "div"],
  ["Contents", { items: [{ title: "One" }] }, "ol"],
  ["Footnotes", { notes: [{ text: "n" }] }, "ol"],
  ["Timeline", { events: [{ at: "1", label: "a" }] }, "ol"],
  ["FieldList", { fields: [{ label: "L", value: "v" }] }, "dl"],
  ["DataTable", { columns: [{ key: "a", label: "A" }], rows: [{ a: "1" }] }, "table"],
  ["Quote", { children: "Q" }, "figure"],
  ["Connector", {}, "svg"],
  ["Dimension", {}, "svg"],
  ["LineChart", { data: [{ x: "a", y: 1 }] }, "svg"],
  ["Schematic", {}, "svg"],
  ["ProportionDial", { value: 40 }, "svg"],
  ["StageIcon", { stage: "A" }, "svg"],
  ["SectionTitle", { title: "S" }, "div"],
  ["DataHeader", { title: "D" }, "header"],
  ["Comparison", { columns: [{ title: "A" }] }, "div"],
  ["ErrorNotice", { title: "E" }, "section"],
  ["TextField", { label: "L" }, "input", "input"],
  ["Button", { children: "Salvar" }, "button"],
  ["IconButton", { label: "Fechar" }, "button"],
  ["Link", { href: "#", children: "Docs" }, "a"],
  ["Checkbox", { label: "Aceito" }, "input", "input"],
  ["Switch", { label: "Notificações" }, "input", "input"],
  ["RadioGroup", { label: "Plano", options: [{ value: "a", label: "A" }] }, "fieldset"],
  ["Select", { label: "País", options: [{ value: "br", label: "Brasil" }] }, "select", "select"],
  ["Tabs", { tabs: [{ value: "a", label: "A", content: "Painel A" }] }, "div"],
  ["Accordion", { items: [{ title: "Envio", content: "Em dois dias." }] }, "div"],
  ["Pagination", { page: 2, total: 5 }, "nav"],
  ["Icon", { name: "check" }, "svg"],
  ["Spinner", {}, "span"],
  ["Skeleton", {}, "div"],
  ["Stack", { children: "A" }, "div"],
  ["Grid", { columns: 2, children: "A" }, "div"],
  ["Divider", {}, "hr"],
  ["Toaster", {}, "section"],
];

const html = (name: string, props: object) => renderToStaticMarkup(createElement((lib as any)[name], props));

/** Tag and attributes (names lowercased, as HTML reads them) of the root of `markup`, or of its first `tag`. */
function root(markup: string, tag?: string): { tag: string; attrs: Record<string, string> } {
  const all = [...markup.matchAll(/<([\w-]+)((?:\s+[\w:-]+(?:="[^"]*")?)*)\s*\/?>/g)];
  const m = tag ? all.find((e) => e[1] === tag) : markup.startsWith("<") ? all[0] : undefined;
  if (!m) throw new Error("no " + (tag ?? "root") + " element in " + markup);
  return {
    tag: m[1],
    attrs: Object.fromEntries(
      [...m[2].matchAll(/([\w:-]+)(?:="([^"]*)")?/g)].map((a) => [a[1].toLowerCase(), a[2] ?? ""]),
    ),
  };
}

const classes = (attrs: Record<string, string>) => (attrs.class ?? "").split(" ").filter(Boolean);

const VERSIONS = [
  [false, "18."],
  [true, "19."],
] as const;

test("API-01 ref receives the root element on React 18 and 19", async ({ page }) => {
  for (const [react19, major] of VERSIONS) {
    await load(page, react19);
    for (const [name, props, tag, target] of CASES_API) {
      const r = await mount(page, name, props);
      expect(r.version.startsWith(major), r.version).toBe(true);
      const refIsTarget = target ? await refIs(page, r.id, target) : r.refIsRoot;
      expect({ ref: r.ref, refIsTarget }, `${name} on React ${r.version}`).toEqual({ ref: tag, refIsTarget: true });
    }
  }
});

test("API-02 native attributes reach the root", () => {
  for (const [name, props, tag, target] of CASES_API) {
    const extra = { id: "x", "data-testid": "t", "aria-describedby": "d", style: { marginTop: 4 } };
    const r = root(html(name, { ...props, ...extra }), target);
    expect(r.tag, name).toBe(tag);
    expect(r.attrs, name).toMatchObject({ id: "x", "data-testid": "t", "aria-describedby": "d" });
    expect(r.attrs.style.split(";"), name).toContain("margin-top:4px");
  }
});

test("API-03 className is added to the root classes", () => {
  for (const [name, props] of CASES_API) {
    const before = classes(root(html(name, props)).attrs);
    const after = classes(root(html(name, { ...props, className: "x" })).attrs);
    expect(before, name).not.toContain("x");
    expect(after, name).toEqual(expect.arrayContaining([...before, "x"]));
  }
});

test("API-04 onClick on the root fires once per click", async ({ page }) => {
  for (const [react19] of VERSIONS) {
    await load(page, react19);
    for (const [name, props, , target] of CASES_API) {
      const r = await mount(page, name, props, ["onClick"]);
      const el = page.locator(`#${r.id} ${target ?? "> *"}`).first();
      await el.dispatchEvent("click");
      expect(await calls(page, r.id), `${name} on React ${r.version}`).toEqual({ onClick: 1 });
      await el.dispatchEvent("click");
      expect(await calls(page, r.id), `${name} on React ${r.version}`).toEqual({ onClick: 2 });
    }
  }
});

const types = readFileSync(new URL("./api-types.ts", import.meta.url), "utf8");

test("API-07 api-types.ts accepts native attributes for every component", () => {
  for (const [name] of CASES_API) expect(types).toContain(`export const ${name}Accepts: L.${name}Props = {`);
});

test("API-08 api-types.ts rejects dangerouslySetInnerHTML for every component", () => {
  for (const [name] of CASES_API) {
    expect(types).toContain(
      `// @ts-expect-error dangerouslySetInnerHTML is not a prop\nexport const ${name}NoInnerHTML: L.${name}Props = {`,
    );
    expect(types).toMatch(new RegExp(`${name}NoInnerHTML: .*dangerouslySetInnerHTML: html`));
  }
});

test("API-06 consumer role and style win on Redacted", () => {
  const r = root(html("Redacted", { role: "presentation", style: { width: "3em", color: "red" } }));
  expect(r.attrs.role).toBe("presentation");
  expect(r.attrs.style).toBe("width:3em;color:red");
});

test("API-30 Tag and StatusFlag render element children as-is", () => {
  expect(html("Tag", { children: <a href="/x">doc</a> })).toBe(
    '<span class="ds-t-label ds-tag ds-tag-outline"><a href="/x">doc</a></span>',
  );
  expect(html("StatusFlag", { status: "pass", children: <em>ok</em> })).toBe(
    '<span class="ds-t-label ds-flag ds-flag-pass"><span class="ds-flag-dot" aria-hidden="true"></span><em>ok</em></span>',
  );
});

test("API-31 string children keep their case in the DOM; the CSS uppercases them (I18N-20)", () => {
  expect(html("Tag", { children: "doc" })).toBe('<span class="ds-t-label ds-tag ds-tag-outline">doc</span>');
  expect(html("StatusFlag", { status: "pass", children: "Active" })).toBe(
    '<span class="ds-t-label ds-flag ds-flag-pass"><span class="ds-flag-dot" aria-hidden="true"></span>Active</span>',
  );
});

test("API-35 every part of mixed children keeps its case in the DOM (I18N-20)", () => {
  expect(html("Tag", { children: ["v", 2, "b"] })).toBe('<span class="ds-t-label ds-tag ds-tag-outline">v2b</span>');
  expect(
    html("Tag", {
      children: [
        "see ",
        <a key="a" href="/x">
          doc
        </a>,
      ],
    }),
  ).toBe('<span class="ds-t-label ds-tag ds-tag-outline">see <a href="/x">doc</a></span>');
  expect(html("StatusFlag", { status: "pass", children: ["run ", 3] })).toBe(
    '<span class="ds-t-label ds-flag ds-flag-pass"><span class="ds-flag-dot" aria-hidden="true"></span>run 3</span>',
  );
});

test("API-05 consumer aria-label wins on BarChart", () => {
  const r = root(html("BarChart", { data: [{ label: "A", value: 1 }], title: "Sales", "aria-label": "Vendas" }));
  expect(r.attrs["aria-label"]).toBe("Vendas");
});

test("API-09 component title prop is not an HTML attribute", () => {
  for (const [name, props, text] of [
    ["CheckLog", { checks: [] }, "Run"],
    ["BarChart", { data: [] }, undefined],
    ["Transcript", { lines: [] }, "Run"],
    ["Hierarchy", { root: { label: "R" } }, undefined],
    ["DataHeader", {}, "Run"],
    ["SectionTitle", {}, "Run"],
    ["ErrorNotice", {}, "Run"],
  ] as const) {
    const markup = html(name, { ...props, title: "Run" });
    expect(root(markup).attrs, name).not.toHaveProperty("title");
    if (text) expect(markup, name).toContain(`>${text}<`);
    else expect(root(markup).attrs["aria-label"], name).toBe("Run");
  }
});

test("API-32 components that render nothing leave the ref null", async ({ page }) => {
  for (const [react19] of VERSIONS) {
    await load(page, react19);
    for (const [name, props] of [
      ["Hierarchy", {}],
      ["StageIcon", { stage: "Z" }],
    ] as const) {
      const r = await mount(page, name, props);
      expect({ ref: r.ref, text: r.text }, `${name} on React ${r.version}`).toEqual({ ref: null, text: "" });
      await expect(page.locator(`#${r.id} > *`)).toHaveCount(0);
    }
  }
});

/** Each component with a `level` prop, minimal props, and the tag its title uses today. */
const HEADINGS: [name: string, props: Record<string, unknown>, tag: string][] = [
  ["DataHeader", { title: "Run", code: "C", kicker: "K", meta: "M" }, "h1"],
  ["SectionTitle", { index: 2, title: "Run", meta: "M" }, "h2"],
  [
    "Comparison",
    {
      columns: [
        { title: "A", lead: "L", items: ["i"] },
        { title: "B", active: true },
      ],
    },
    "h3",
  ],
  ["ErrorNotice", { title: "Run", code: "E1", meta: "M", children: "Body", items: ["i"], action: "Retry" }, "h3"],
];

const headingTags = (markup: string) => [...markup.matchAll(/<(h\d)[ >]/g)].map((m) => m[1]);

test("API-23 level sets the heading tag", () => {
  for (const [name, props, tag] of HEADINGS) {
    const today = html(name, props);
    for (const level of [1, 2, 3, 4, 5, 6]) {
      const h = "h" + level;
      const want = today.replaceAll("<" + tag + " ", "<" + h + " ").replaceAll("</" + tag + ">", "</" + h + ">");
      expect(html(name, { ...props, level }), `${name} level ${level}`).toBe(want);
      expect(headingTags(want), `${name} level ${level}`).toContain(h);
    }
  }
});

test("API-24 default heading tag", () => {
  for (const [name, props, tag] of HEADINGS) {
    const tags = headingTags(html(name, props));
    expect(tags.length, name).toBeGreaterThan(0);
    expect(new Set(tags), name).toEqual(new Set([tag]));
  }
});

test("API-25 invalid level falls back to the default tag", () => {
  for (const [name, props] of HEADINGS) {
    for (const level of [0, 7, 2.5]) {
      expect(html(name, { ...props, level }), `${name} level ${level}`).toBe(html(name, props));
    }
  }
});

test("API-33 running DataHeader ignores level", () => {
  const props = { variant: "running", title: "T", code: "C", kicker: "K", meta: "03 / 12" };
  const today = html("DataHeader", props);
  expect(headingTags(today)).toEqual([]);
  for (const level of [1, 2, 3, 4, 5, 6]) expect(html("DataHeader", { ...props, level }), `level ${level}`).toBe(today);
});

test("API-12 TextField ref is the input or textarea", async ({ page }) => {
  for (const [react19] of VERSIONS) {
    await load(page, react19);
    for (const [props, tag] of [
      [{ label: "L" }, "input"],
      [{ label: "L", multiline: true }, "textarea"],
    ] as const) {
      const r = await mount(page, "TextField", props);
      const label = `${tag} on React ${r.version}`;
      expect({ ref: r.ref, refIsField: await refIs(page, r.id, tag) }, label).toEqual({ ref: tag, refIsField: true });
      await page.evaluate((i) => (window as any).refs[i].focus(), r.id);
      await expect(page.locator(`#${r.id} ${tag}`), label).toBeFocused();
    }
  }
});

test("API-13 TextField native attributes reach the input only", () => {
  const markup = html("TextField", { label: "L", autoComplete: "email", maxLength: 20, "data-testid": "t" });
  expect(root(markup, "input").attrs).toMatchObject({ autocomplete: "email", maxlength: "20", "data-testid": "t" });
  const wrapper = root(markup);
  expect(wrapper.tag).toBe("div");
  for (const attr of ["autocomplete", "maxlength", "data-testid"]) expect(wrapper.attrs).not.toHaveProperty(attr);
});

test("API-14 TextField className stays on the wrapper", () => {
  const markup = html("TextField", { label: "L", className: "x" });
  expect(root(markup).tag).toBe("div");
  expect(classes(root(markup).attrs)).toContain("x");
  expect(classes(root(markup, "input").attrs)).not.toContain("x");
});

test("API-15 TextField consumer id links label and hint", () => {
  const markup = html("TextField", { label: "Email", id: "email", hint: "We never share it." });
  expect(root(markup, "input").attrs).toMatchObject({ id: "email", "aria-describedby": "email-msg" });
  expect(root(markup, "label").attrs.for).toBe("email");
  expect(markup).toContain('<div id="email-msg" class="ds-t-caption ds-tf-msg">We never share it.</div>');
});

test("API-16 TextField consumer id links the error", () => {
  const markup = html("TextField", { label: "Email", id: "email", error: "Enter an email." });
  expect(root(markup, "input").attrs).toMatchObject({ id: "email", "aria-describedby": "email-msg" });
  expect(root(markup, "label").attrs.for).toBe("email");
  expect(markup).toContain('<div id="email-msg" class="ds-t-caption ds-tf-msg ds-tf-error">');
  expect(markup).toContain("<span>Enter an email.</span>");
});

test("API-17 TextField onBlur fires once", async ({ page }) => {
  for (const [react19] of VERSIONS) {
    await load(page, react19);
    const r = await mount(page, "TextField", { label: "L" }, ["onBlur"]);
    const input = page.locator(`#${r.id} input`);
    await input.focus();
    expect(await calls(page, r.id), `React ${r.version}`).toEqual({ onBlur: 0 });
    await input.blur();
    expect(await calls(page, r.id), `React ${r.version}`).toEqual({ onBlur: 1 });
  }
});

test("API-34 consumer aria-describedby replaces the hint link", () => {
  const markup = html("TextField", { label: "L", "aria-describedby": "ext", hint: "Hint." });
  expect(root(markup, "input").attrs["aria-describedby"]).toBe("ext");
});

test("PRM-02 the seven primitives are in the common tables, each with the element of the spec that gets the ref and the native attributes", () => {
  // The spec's "ref e atributos nativos" premise: the root for Button, IconButton, Link and RadioGroup (the fieldset);
  // the input or select, with `className` on the div around it, for Checkbox, Switch and Select.
  const want: Record<string, [tag: string, target: string | undefined]> = {
    Button: ["button", undefined],
    IconButton: ["button", undefined],
    Link: ["a", undefined],
    Checkbox: ["input", "input"],
    Switch: ["input", "input"],
    RadioGroup: ["fieldset", undefined],
    Select: ["select", "select"],
  };
  for (const [name, [tag, target]] of Object.entries(want)) {
    const found = CASES_API.filter(([n]) => n === name);
    expect(found.length, name).toBe(1);
    expect([found[0][2], found[0][3]], name).toEqual([tag, target]);
    const markup = html(name, { ...found[0][1], className: "x" });
    const rootEl = root(markup);
    if (target) {
      expect(rootEl.tag, name).toBe("div");
      expect(classes(rootEl.attrs), name).toContain("x");
      expect(classes(root(markup, target).attrs), name).not.toContain("x");
    } else {
      expect(rootEl.tag, name).toBe(tag);
      expect(classes(rootEl.attrs), name).toContain("x");
    }
    // API-07 and API-08 hold the type table to the same list.
    expect(types, name).toContain(`export const ${name}Accepts: L.${name}Props = {`);
    expect(types, name).toContain(`export const ${name}NoInnerHTML: L.${name}Props = {`);
  }
});

test("OVL-04 Dialog, Popover, Tooltip and Menu give ref and the native attributes to the dialog or the panel, on React 18 and 19", async ({
  page,
}) => {
  // The spec's "ref (para o <dialog> ou o painel)": Dialog -> the <dialog>; Popover, Tooltip and Menu -> their panel.
  const want: Record<string, { tag: string; own: string; attrs: Record<string, string> }> = {
    Dialog: { tag: "dialog", own: "ds-dialog", attrs: {} },
    Popover: { tag: "div", own: "ds-popover", attrs: { popover: "auto" } },
    Tooltip: { tag: "div", own: "ds-tooltip", attrs: { popover: "manual", role: "tooltip" } },
    Menu: { tag: "div", own: "ds-menu", attrs: { popover: "auto", role: "menu" } },
  };
  await onEachReact(page, "Refs", {}, async (id) => {
    for (const [name, { tag, own, attrs }] of Object.entries(want)) {
      const got = await page.evaluate((n) => {
        const ref = (window as any).overlayRefs[n] as HTMLElement | null;
        const byId = document.getElementById("r-" + n);
        if (byId) byId.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        return ref && byId
          ? {
              same: ref === byId,
              tag: ref.tagName.toLowerCase(),
              classes: [...ref.classList],
              testid: ref.getAttribute("data-testid"),
              label: ref.getAttribute("aria-label"),
              marginTop: ref.style.marginTop,
              attrs: Object.fromEntries(["popover", "role"].map((a) => [a, ref.getAttribute(a)])),
            }
          : null;
      }, name);
      expect(got, name).not.toBeNull();
      expect({ same: got!.same, tag: got!.tag }, name).toEqual({ same: true, tag });
      expect(got!.classes, name).toEqual(expect.arrayContaining([own, "x"]));
      expect({ testid: got!.testid, label: got!.label, marginTop: got!.marginTop }, name).toEqual({
        testid: name,
        label: "L-" + name,
        marginTop: "4px",
      });
      expect(got!.attrs, name).toMatchObject(attrs);
      expect((await overlayCalls(page, id))["onClick:" + name], name).toBe(1);
    }
  });
  for (const name of Object.keys(want)) {
    expect(types, name).toContain(`export const ${name}Accepts: L.${name}Props = {`);
    expect(types, name).toContain(`export const ${name}NoInnerHTML: L.${name}Props = {`);
  }
});

test("DIS-03 Tabs, Accordion and Pagination are in the common tables and give ref and the native attributes to their root, on React 18 and 19", async ({
  page,
}) => {
  // The spec's "ref (para o elemento raiz)": Tabs and Accordion -> the div, Pagination -> the nav.
  const want: Record<string, string> = { Tabs: "div", Accordion: "div", Pagination: "nav" };
  for (const [name, tag] of Object.entries(want)) {
    const found = CASES_API.filter(([n]) => n === name);
    expect(found.length, name).toBe(1);
    expect([found[0][2], found[0][3]], name).toEqual([tag, undefined]);
    // API-02 and API-03 hold the markup to the same list: id, data and aria attributes, style and className on the root.
    const markup = html(name, { ...found[0][1], id: "x", "data-testid": "t", "aria-describedby": "d", className: "k" });
    expect(root(markup).tag, name).toBe(tag);
    expect(root(markup).attrs, name).toMatchObject({ id: "x", "data-testid": "t", "aria-describedby": "d" });
    expect(classes(root(markup).attrs), name).toContain("k");
    // API-07 and API-08 hold the type table to the same list.
    expect(types, name).toContain(`export const ${name}Accepts: L.${name}Props = {`);
    expect(types, name).toContain(`export const ${name}NoInnerHTML: L.${name}Props = {`);
  }
  for (const [react19, major] of VERSIONS) {
    await load(page, react19);
    for (const [name, tag] of Object.entries(want)) {
      const r = await mount(page, name, propsOf(name), ["onClick"]);
      expect(r.version.startsWith(major), r.version).toBe(true);
      expect({ ref: r.ref, refIsRoot: r.refIsRoot }, `${name} on React ${r.version}`).toEqual({
        ref: tag,
        refIsRoot: true,
      });
      await page.locator(`#${r.id} > *`).first().dispatchEvent("click");
      expect(await calls(page, r.id), `${name} on React ${r.version}`).toEqual({ onClick: 1 });
    }
  }
  function propsOf(name: string) {
    return CASES_API.find(([n]) => n === name)![1];
  }
});

test("FBL-03 Icon, Spinner, Skeleton, Stack, Grid, Divider and Toaster are in the common tables and give ref and the native attributes to their root, on React 18 and 19", async ({
  page,
}) => {
  const want: Record<string, string> = {
    Icon: "svg",
    Spinner: "span",
    Skeleton: "div",
    Stack: "div",
    Grid: "div",
    Divider: "hr",
    Toaster: "section",
  };
  for (const [name, tag] of Object.entries(want)) {
    const found = CASES_API.filter(([n]) => n === name);
    expect(found.length, name).toBe(1);
    expect([found[0][2], found[0][3]], name).toEqual([tag, undefined]);
    const markup = html(name, { ...found[0][1], id: "x", "data-testid": "t", "aria-describedby": "d", className: "k" });
    expect(root(markup).tag, name).toBe(tag);
    expect(root(markup).attrs, name).toMatchObject({ id: "x", "data-testid": "t", "aria-describedby": "d" });
    expect(classes(root(markup).attrs), name).toContain("k");
    expect(types, name).toContain(`export const ${name}Accepts: L.${name}Props = {`);
    expect(types, name).toContain(`export const ${name}NoInnerHTML: L.${name}Props = {`);
  }
  for (const [react19, major] of VERSIONS) {
    await load(page, react19);
    for (const [name, tag] of Object.entries(want)) {
      const r = await mount(page, name, CASES_API.find(([n]) => n === name)![1], ["onClick"]);
      expect(r.version.startsWith(major), r.version).toBe(true);
      expect({ ref: r.ref, refIsRoot: r.refIsRoot }, `${name} on React ${r.version}`).toEqual({
        ref: tag,
        refIsRoot: true,
      });
      await page.locator(`#${r.id} > *`).first().dispatchEvent("click");
      expect(await calls(page, r.id), `${name} on React ${r.version}`).toEqual({ onClick: 1 });
    }
  }
});
