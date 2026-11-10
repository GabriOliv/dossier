import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { expect, test, type Page } from "@playwright/test";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { mountDisclosure, onEachReact } from "./disclosure-mount";

// Each browser test runs on React 18 and on React 19, on the Accordion scene of disclosure-entry.tsx: an Accordion
// `#acc` with the items Envio, Trocas and Pagamento, each with the content `Texto de <title>`.
const items = (page: Page, root = "#acc") => page.locator(`${root} > details`);
const summary = (page: Page, title: string) => page.locator("summary", { hasText: title });
/** Which items of `root` are open, in order. */
const opened = (page: Page, root = "#acc") =>
  page.$$eval(`${root} > details`, (all) => all.map((d) => (d as HTMLDetailsElement).open));

test("ACC-01 three items are three details, each a summary with the title and then the content", async ({ page }) => {
  await onEachReact(page, "Accordion", {}, async () => {
    await expect(items(page)).toHaveCount(3);
    const parts = await items(page).evaluateAll((all) =>
      all.map((d) => [...d.children].map((c) => [c.tagName, c.textContent])),
    );
    expect(parts).toEqual(
      ["Envio", "Trocas", "Pagamento"].map((t) => [
        ["SUMMARY", t],
        ["DIV", `Texto de ${t}`],
      ]),
    );
  });
});

test("ACC-02 an item with defaultOpen has the open attribute, and the others do not", async ({ page }) => {
  await onEachReact(page, "Accordion", { open: [1] }, async () => {
    expect(await items(page).evaluateAll((all) => all.map((d) => d.hasAttribute("open")))).toEqual([
      false,
      true,
      false,
    ]);
    await expect(page.getByText("Texto de Trocas")).toBeVisible();
    await expect(page.getByText("Texto de Envio")).toBeHidden();
  });
});

test("ACC-03 a click on the summary, Enter and Space on it each toggle the item", async ({ page }) => {
  await onEachReact(page, "Accordion", {}, async () => {
    await summary(page, "Envio").click();
    expect(await opened(page)).toEqual([true, false, false]);
    await expect(page.getByText("Texto de Envio")).toBeVisible();
    await summary(page, "Envio").click();
    expect(await opened(page)).toEqual([false, false, false]);
    await summary(page, "Trocas").focus();
    const toggles: boolean[][] = [];
    for (const key of ["Enter", "Enter", "Space", "Space", "Enter"]) {
      await page.keyboard.press(key);
      toggles.push(await opened(page));
    }
    const shut = [false, false, false];
    const trocas = [false, true, false];
    expect(toggles).toEqual([trocas, shut, trocas, shut, trocas]);
    await expect(summary(page, "Trocas")).toBeFocused();
  });
});

test("ACC-04 with exclusive every item shares one name, another exclusive Accordion has another, and opening an item closes the open one", async ({
  page,
}) => {
  await onEachReact(page, "Accordion", { exclusive: true }, async () => {
    await mountDisclosure(page, "Accordion", { id: "other", exclusive: true, titles: ["Um", "Dois"] });
    const names = (root: string) => items(page, root).evaluateAll((all) => all.map((d) => d.getAttribute("name")));
    const mine = await names("#acc");
    const theirs = await names("#other");
    expect(mine[0]).toBeTruthy();
    expect(new Set(mine).size).toBe(1);
    expect(mine).toHaveLength(3);
    expect(new Set(theirs).size).toBe(1);
    expect(theirs[0]).toBeTruthy();
    expect(theirs[0]).not.toBe(mine[0]);

    await summary(page, "Envio").click();
    await summary(page, "Um").click();
    expect(await opened(page)).toEqual([true, false, false]);
    expect(await opened(page, "#other")).toEqual([true, false]);
    await summary(page, "Pagamento").click();
    expect(await opened(page)).toEqual([false, false, true]);
    await summary(page, "Trocas").focus();
    await page.keyboard.press("Enter");
    expect(await opened(page)).toEqual([false, true, false]);
    expect(await opened(page, "#other")).toEqual([true, false]);
  });
});

test("ACC-05 without exclusive more than one item stays open at a time", async ({ page }) => {
  await onEachReact(page, "Accordion", {}, async () => {
    expect(await items(page).evaluateAll((all) => all.map((d) => d.hasAttribute("name")))).toEqual([
      false,
      false,
      false,
    ]);
    await summary(page, "Envio").click();
    await summary(page, "Trocas").click();
    await summary(page, "Pagamento").focus();
    await page.keyboard.press("Enter");
    expect(await opened(page)).toEqual([true, true, true]);
  });
});

test("DIS-32 with no items Accordion renders nothing", async ({ page }) => {
  await onEachReact(page, "Accordion", { titles: [] }, async (id) => {
    expect(await page.locator("#" + id).innerHTML()).toBe("");
  });
});

test("ACC-08 the Accordion file of dist has no use client, and it renders on the server", async () => {
  const file = "dist/components/Accordion.js";
  expect(readFileSync(file, "utf8").split("\n")[0]).not.toMatch(/use client/);
  expect(readFileSync("src/components/Accordion.tsx", "utf8")).not.toMatch(/^\s*["']use client["']/);
  // Under the react-server condition the file imports nothing that React's server build lacks.
  const r = JSON.parse(
    execFileSync(
      "node",
      ["--conditions=react-server", "--import", "./tests/ssr/register-react19.mjs", "tests/ssr/react-server.mjs"],
      { encoding: "utf8" },
    ),
  ) as { checked: string[]; reported: { file: string }[] };
  expect(r.checked).toContain(file);
  expect(r.reported.filter((x) => x.file === file)).toEqual([]);
  const { Accordion } = await import(pathToFileURL(resolve(file)).href);
  const html = renderToString(
    createElement(Accordion, {
      exclusive: true,
      items: [
        { title: "Envio", content: "Texto de Envio", defaultOpen: true },
        { title: "Trocas", content: "Texto de Trocas" },
      ],
    }),
  );
  expect(html.match(/<details /g)).toHaveLength(2);
  expect(html).toMatch(/<details class="ds-accordion-item" name="ds-acc-[\w-]+" open="">/);
  expect(html).toContain('<summary class="ds-t-body ds-accordion-summary">Trocas</summary>');
});
