import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { disclosureCalls, onEachReact } from "./disclosure-mount";

// Each test runs on React 18 and on React 19, on the scenes of disclosure-entry.tsx: `#before`, a Tabs `#tabs` with
// Resumo (a), Checks (b) and Logs (c), each panel `Painel <label>`, and `#after`. onChange counts `onChange:<value>`.
const tab = (page: Page, name: string) => page.getByRole("tab", { name, exact: true });
const tabs = (page: Page) => page.locator("#tabs [role=tab]");
const panels = (page: Page) => page.locator("#tabs [role=tabpanel]");
const calls = (page: Page, id: string) => expect.poll(() => disclosureCalls(page, id));
/** Each tab's aria-selected and tabindex, in order. */
const state = (page: Page) =>
  tabs(page).evaluateAll((all) => all.map((t) => [t.getAttribute("aria-selected"), t.getAttribute("tabindex")]));
/** The text of each shown panel. */
const shown = (page: Page) =>
  panels(page).evaluateAll((all) => all.filter((p) => (p as HTMLElement).checkVisibility()).map((p) => p.textContent));
const focused = (page: Page) => page.evaluate(() => document.activeElement?.textContent);
/** Presses each key and gives, after each, the focused element's text, the selected tab and the shown panels. */
async function press(page: Page, keys: string[]) {
  const out: [string | null | undefined, string | null, (string | null)[]][] = [];
  for (const key of keys) {
    await page.keyboard.press(key);
    const selected = await page.locator('#tabs [role=tab][aria-selected="true"]').allTextContents();
    out.push([await focused(page), selected.join() || null, await shown(page)]);
  }
  return out;
}
const S = (label: string) => [label, label, [`Painel ${label}`]];

test("TAB-01 three tabs are a tablist with three tabs and three tabpanels, each tab controlling its panel and each panel labelled by its tab", async ({
  page,
}) => {
  await onEachReact(page, "Tabs", {}, async () => {
    await expect(page.getByRole("tablist", { name: "Visões do run" })).toHaveCount(1);
    await expect(page.locator("#tabs [role=tablist] > [role=tab]")).toHaveCount(3);
    await expect(panels(page)).toHaveCount(3);
    const pairs = await page.$$eval("#tabs [role=tab]", (all) =>
      all.map((t) => {
        const panel = document.getElementById(t.getAttribute("aria-controls")!);
        return [
          t.textContent,
          panel?.getAttribute("role"),
          panel?.getAttribute("aria-labelledby") === t.id,
          panel?.textContent,
        ];
      }),
    );
    expect(pairs).toEqual([
      ["Resumo", "tabpanel", true, "Painel Resumo"],
      ["Checks", "tabpanel", true, "Painel Checks"],
      ["Logs", "tabpanel", true, "Painel Logs"],
    ]);
    const ids = await tabs(page).evaluateAll((all) => all.map((t) => t.id));
    expect(new Set(ids).size).toBe(3);
    await expect(page.getByRole("tabpanel", { name: "Resumo" })).toHaveText("Painel Resumo");
  });
});

test("TAB-02 with no value nor defaultValue the first enabled tab is selected with tabindex 0, the others are not, and only its panel shows", async ({
  page,
}) => {
  await onEachReact(page, "Tabs", {}, async () => {
    expect(await state(page)).toEqual([
      ["true", "0"],
      ["false", "-1"],
      ["false", "-1"],
    ]);
    expect(await shown(page)).toEqual(["Painel Resumo"]);
  });
  const firstOff = [
    { value: "a", label: "Resumo", disabled: true },
    { value: "b", label: "Checks" },
    { value: "c", label: "Logs" },
  ];
  await onEachReact(page, "Tabs", { tabs: firstOff }, async () => {
    expect(await state(page)).toEqual([
      ["false", "-1"],
      ["true", "0"],
      ["false", "-1"],
    ]);
    expect(await shown(page)).toEqual(["Painel Checks"]);
  });
  // defaultValue picks another first tab.
  await onEachReact(page, "Tabs", { defaultValue: "c" }, async () => {
    expect(await shown(page)).toEqual(["Painel Logs"]);
    await expect(tab(page, "Logs")).toHaveAttribute("tabindex", "0");
  });
});

test("TAB-03 ArrowRight moves focus to the next enabled tab, selects it and shows its panel, and from the last goes to the first", async ({
  page,
}) => {
  await onEachReact(page, "Tabs", {}, async (id) => {
    await page.focus("#before");
    await page.keyboard.press("Tab");
    await expect(tab(page, "Resumo")).toBeFocused();
    expect(await press(page, ["ArrowRight", "ArrowRight", "ArrowRight", "ArrowRight"])).toEqual([
      S("Checks"),
      S("Logs"),
      S("Resumo"),
      S("Checks"),
    ]);
    expect(await state(page)).toEqual([
      ["false", "-1"],
      ["true", "0"],
      ["false", "-1"],
    ]);
    await calls(page, id).toEqual({ "onChange:b": 2, "onChange:c": 1, "onChange:a": 1 });
  });
});

test("TAB-04 ArrowLeft, Home and End move focus and selection to the previous, the first and the last enabled tab", async ({
  page,
}) => {
  await onEachReact(page, "Tabs", {}, async () => {
    await tab(page, "Resumo").focus();
    expect(await press(page, ["ArrowLeft", "ArrowLeft", "Home", "End", "End", "ArrowLeft", "Home", "Home"])).toEqual([
      S("Logs"),
      S("Checks"),
      S("Resumo"),
      S("Logs"),
      S("Logs"),
      S("Checks"),
      S("Resumo"),
      S("Resumo"),
    ]);
    // The keys are the tabs': the page does not scroll on Home and End.
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });
});

test("TAB-05 a click on a tab selects it and calls onChange once with its value", async ({ page }) => {
  await onEachReact(page, "Tabs", {}, async (id) => {
    await tab(page, "Logs").click();
    await expect(tab(page, "Logs")).toHaveAttribute("aria-selected", "true");
    await expect(tab(page, "Logs")).toHaveAttribute("tabindex", "0");
    await expect(tab(page, "Resumo")).toHaveAttribute("aria-selected", "false");
    expect(await shown(page)).toEqual(["Painel Logs"]);
    await calls(page, id).toEqual({ "onChange:c": 1 });
    // A second click on the selected tab changes nothing.
    await tab(page, "Logs").click();
    await calls(page, id).toEqual({ "onChange:c": 1 });
  });
});

test("TAB-06 with value b and onChange tab b is selected, and a gesture on another tab calls onChange without changing the selection until value changes", async ({
  page,
}) => {
  await onEachReact(page, "Tabs", { controlled: true, keep: true, value: "b" }, async (id) => {
    await expect(tab(page, "Checks")).toHaveAttribute("aria-selected", "true");
    expect(await shown(page)).toEqual(["Painel Checks"]);
    await tab(page, "Logs").click();
    await calls(page, id).toEqual({ "onChange:c": 1 });
    await expect(tab(page, "Checks")).toHaveAttribute("aria-selected", "true");
    await expect(tab(page, "Logs")).toHaveAttribute("aria-selected", "false");
    expect(await shown(page)).toEqual(["Painel Checks"]);
    // The arrow goes on from the focused tab, Logs, to Resumo, and only asks for it.
    await page.keyboard.press("ArrowRight");
    await expect(tab(page, "Resumo")).toBeFocused();
    await calls(page, id).toEqual({ "onChange:c": 1, "onChange:a": 1 });
    expect(await shown(page)).toEqual(["Painel Checks"]);
  });
  await onEachReact(page, "Tabs", { controlled: true, value: "b" }, async (id) => {
    await tab(page, "Logs").click();
    await calls(page, id).toEqual({ "onChange:c": 1 });
    await expect(tab(page, "Logs")).toHaveAttribute("aria-selected", "true");
    expect(await shown(page)).toEqual(["Painel Logs"]);
  });
});

test("TAB-07 a disabled tab has aria-disabled, the arrows skip it and a click on it leaves the selection", async ({
  page,
}) => {
  const middleOff = [
    { value: "a", label: "Resumo" },
    { value: "b", label: "Checks", disabled: true },
    { value: "c", label: "Logs" },
  ];
  await onEachReact(page, "Tabs", { tabs: middleOff }, async (id) => {
    await expect(tab(page, "Checks")).toHaveAttribute("aria-disabled", "true");
    await expect(tab(page, "Resumo")).not.toHaveAttribute("aria-disabled");
    await tab(page, "Resumo").focus();
    expect(await press(page, ["ArrowRight", "ArrowLeft", "End", "ArrowLeft"])).toEqual([
      S("Logs"),
      S("Resumo"),
      S("Logs"),
      S("Resumo"),
    ]);
    // Playwright waits for an aria-disabled element to be enabled: force sends the mouse click anyway.
    await tab(page, "Checks").click({ force: true });
    await expect(tab(page, "Resumo")).toHaveAttribute("aria-selected", "true");
    await expect(tab(page, "Checks")).toHaveAttribute("aria-selected", "false");
    expect(await shown(page)).toEqual(["Painel Resumo"]);
    await calls(page, id).toEqual({ "onChange:c": 2, "onChange:a": 2 });
  });
});

test("TAB-08 Tab out of the tablist moves focus to the shown panel, which has tabindex 0", async ({ page }) => {
  await onEachReact(page, "Tabs", {}, async () => {
    await page.focus("#before");
    await page.keyboard.press("Tab");
    await page.keyboard.press("ArrowRight");
    await expect(tab(page, "Checks")).toBeFocused();
    await page.keyboard.press("Tab");
    const panel = page.getByRole("tabpanel", { name: "Checks" });
    await expect(panel).toBeFocused();
    await expect(panel).toHaveAttribute("tabindex", "0");
    await page.keyboard.press("Tab");
    await expect(page.locator("#after")).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(tab(page, "Checks")).toBeFocused();
  });
});

test("TAB-11 a value that is not among the tabs selects no tab and shows no panel, without error, and the first enabled tab has tabindex 0", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await onEachReact(page, "Tabs", { controlled: true, keep: true, value: "z" }, async () => {
    expect(await state(page)).toEqual([
      ["false", "0"],
      ["false", "-1"],
      ["false", "-1"],
    ]);
    expect(await shown(page)).toEqual([]);
  });
  const firstOff = [
    { value: "a", label: "Resumo", disabled: true },
    { value: "b", label: "Checks" },
    { value: "c", label: "Logs" },
  ];
  await onEachReact(page, "Tabs", { controlled: true, keep: true, value: "z", tabs: firstOff }, async () => {
    expect(await state(page)).toEqual([
      ["false", "-1"],
      ["false", "0"],
      ["false", "-1"],
    ]);
    expect(await shown(page)).toEqual([]);
  });
  expect(errors).toEqual([]);
});

test("DIS-30 with no tabs Tabs renders an empty tablist and no panel, without error", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await onEachReact(page, "Tabs", { tabs: [] }, async () => {
    await expect(page.getByRole("tablist")).toHaveCount(1);
    await expect(tabs(page)).toHaveCount(0);
    await expect(panels(page)).toHaveCount(0);
  });
  expect(errors).toEqual([]);
});

test("DIS-31 with every tab disabled no tab is selected and the arrows do not move focus", async ({ page }) => {
  const allOff = [
    { value: "a", label: "Resumo", disabled: true },
    { value: "b", label: "Checks", disabled: true },
    { value: "c", label: "Logs", disabled: true },
  ];
  await onEachReact(page, "Tabs", { tabs: allOff }, async (id) => {
    await expect(page.locator('#tabs [aria-selected="true"]')).toHaveCount(0);
    expect(await shown(page)).toEqual([]);
    await tab(page, "Checks").focus();
    for (const key of ["ArrowRight", "ArrowLeft", "Home", "End"]) {
      await page.keyboard.press(key);
      await expect(tab(page, "Checks"), key).toBeFocused();
    }
    await expect(page.locator('#tabs [aria-selected="true"]')).toHaveCount(0);
    expect(await disclosureCalls(page, id)).toEqual({});
  });
});

test("TAB-03 inside a Dialog the arrows move between the tabs and leave the Dialog open, Tab reaches the panel, and Escape still closes the Dialog", async ({
  page,
}) => {
  await onEachReact(page, "TabsInDialog", {}, async (id) => {
    await tab(page, "Resumo").focus();
    expect(await press(page, ["ArrowRight", "ArrowRight", "ArrowLeft"])).toEqual([S("Checks"), S("Logs"), S("Checks")]);
    await expect(page.locator("#dlg")).toHaveJSProperty("open", true);
    await page.keyboard.press("Tab");
    await expect(page.getByRole("tabpanel", { name: "Checks" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.locator("#last")).toBeFocused();
    await page.keyboard.press("Escape");
    await calls(page, id).toEqual({ "onChange:b": 2, "onChange:c": 1, onClose: 1 });
  });
});

test("DIS-02 the source of Tabs starts with use client", () => {
  expect(readFileSync("src/components/Tabs.tsx", "utf8").split("\n")[0]).toBe('"use client";');
  expect(readFileSync("dist/components/Tabs.js", "utf8").split("\n")[0]).toBe('"use client";');
});

test("TAB-02 tabs that arrive after mount, or a selected tab that is removed, leave the first enabled tab selected", async ({
  page,
}) => {
  const later = [
    { value: "a", label: "Resumo" },
    { value: "b", label: "Checks" },
    { value: "c", label: "Logs" },
  ];
  await onEachReact(page, "Tabs", { tabs: [], then: later }, async () => {
    await expect(page.getByRole("tab")).toHaveCount(3);
    expect(await state(page)).toEqual([
      ["true", "0"],
      ["false", "-1"],
      ["false", "-1"],
    ]);
    expect(await shown(page)).toEqual(["Painel Resumo"]);
  });
  await onEachReact(page, "Tabs", { defaultValue: "a", then: later.slice(1) }, async () => {
    await expect(page.getByRole("tab")).toHaveCount(2);
    expect(await state(page)).toEqual([
      ["true", "0"],
      ["false", "-1"],
    ]);
    expect(await shown(page)).toEqual(["Painel Checks"]);
  });
});
