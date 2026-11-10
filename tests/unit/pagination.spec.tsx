import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { expect, test, type Page } from "@playwright/test";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { disclosureCalls, onEachReact } from "./disclosure-mount";

// Each browser test runs on React 18 and on React 19, on the Pagination scene of disclosure-entry.tsx: with `links`
// page n links to `?page=n`, with `change` each onChange is counted as `onChange:<page>:<event>:<tag>`.
const nav = (page: Page) => page.getByRole("navigation");
const texts = (page: Page) => page.locator("#pg li").allTextContents();
const calls = (page: Page, id: string) => expect.poll(() => disclosureCalls(page, id));

test("PAG-01 page 5 of 20 with href is a nav Pagination with Previous, 1, …, 4, 5, 6, …, 20, Next, each number a link to href(n)", async ({
  page,
}) => {
  await onEachReact(page, "Pagination", { page: 5, total: 20, links: true }, async () => {
    await expect(nav(page)).toHaveAccessibleName("Pagination");
    expect(await nav(page).evaluate((el) => el.tagName)).toBe("NAV");
    expect(await texts(page)).toEqual(["Previous", "1", "…", "4", "5", "6", "…", "20", "Next"]);
    for (const n of [1, 4, 5, 6, 20]) {
      const link = page.getByRole("link", { name: `Page ${n}`, exact: true });
      await expect(link).toHaveText(String(n));
      await expect(link).toHaveAttribute("href", `?page=${n}`);
    }
    await expect(page.locator("#pg a")).toHaveCount(7);
  });
});

test("PAG-02 the current page has aria-current page, and each number is named Page <n> or by labels.page", async ({
  page,
}) => {
  await onEachReact(page, "Pagination", { page: 5, total: 20, links: true }, async () => {
    await expect(page.locator("#pg [aria-current]")).toHaveCount(1);
    await expect(page.getByRole("link", { name: "Page 5", exact: true })).toHaveAttribute("aria-current", "page");
    for (const n of [1, 4, 6, 20])
      await expect(page.getByRole("link", { name: `Page ${n}`, exact: true })).not.toHaveAttribute("aria-current");
  });
  await onEachReact(page, "Pagination", { page: 2, total: 3, labels: { page: "Página" } }, async () => {
    for (const n of [1, 2, 3])
      await expect(page.getByRole("button", { name: `Página ${n}`, exact: true })).toHaveText(String(n));
    await expect(page.getByRole("button", { name: "Página 2" })).toHaveAttribute("aria-current", "page");
  });
});

test("PAG-03 without href each number, Previous and Next is a button type=button, and a click on a number calls onChange once with it", async ({
  page,
}) => {
  await onEachReact(page, "Pagination", { page: 5, total: 20, change: true }, async (id) => {
    await expect(page.locator("#pg a")).toHaveCount(0);
    const controls = page.locator("#pg li > :not(.ds-pagination-gap)");
    await expect(controls).toHaveCount(7);
    for (const el of await controls.all()) {
      expect(await el.evaluate((b) => b.tagName)).toBe("BUTTON");
      await expect(el).toHaveAttribute("type", "button");
    }
    await expect(page.getByRole("button", { name: "Previous" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Next" })).toBeVisible();
    await page.getByRole("button", { name: "Page 4", exact: true }).click();
    await calls(page, id).toEqual({ "onChange:4:click:BUTTON": 1 });
    await page.getByRole("button", { name: "Page 20", exact: true }).click();
    await calls(page, id).toEqual({ "onChange:4:click:BUTTON": 1, "onChange:20:click:BUTTON": 1 });
  });
});

test("PAG-04 with href and onChange a click on a number calls onChange once with it and the click event, which can cancel the navigation", async ({
  page,
}) => {
  await onEachReact(
    page,
    "Pagination",
    { page: 5, total: 20, links: true, change: true, prevent: true },
    async (id) => {
      const before = page.url();
      await page.getByRole("link", { name: "Page 4", exact: true }).click();
      await calls(page, id).toEqual({ "onChange:4:click:A": 1 });
      // The handler's preventDefault reached the browser: the link was not followed.
      expect(page.url()).toBe(before);
      await expect(page.locator("#pg")).toBeVisible();
    },
  );
});

test("PAG-05 on page 1 Previous is a disabled button or an aria-disabled span without href, and on the last page so is Next", async ({
  page,
}) => {
  await onEachReact(page, "Pagination", { page: 1, total: 5, change: true }, async (id) => {
    await expect(page.getByRole("button", { name: "Previous" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Next" })).toBeEnabled();
    await page.getByRole("button", { name: "Previous" }).click({ force: true });
    await page.getByRole("button", { name: "Next" }).click();
    await calls(page, id).toEqual({ "onChange:2:click:BUTTON": 1 });
  });
  await onEachReact(page, "Pagination", { page: 5, total: 5 }, async () => {
    await expect(page.getByRole("button", { name: "Next" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Previous" })).toBeEnabled();
  });
  await onEachReact(page, "Pagination", { page: 1, total: 5, links: true }, async () => {
    const previous = page.locator("#pg li").first().locator(":scope > *");
    expect(await previous.evaluate((el) => el.tagName)).toBe("SPAN");
    await expect(previous).toHaveText("Previous");
    await expect(previous).toHaveAttribute("aria-disabled", "true");
    await expect(previous).not.toHaveAttribute("href");
    await expect(page.getByRole("link", { name: "Next" })).toHaveAttribute("href", "?page=2");
  });
  await onEachReact(page, "Pagination", { page: 5, total: 5, links: true }, async () => {
    const next = page.locator("#pg li").last().locator(":scope > *");
    expect(await next.evaluate((el) => el.tagName)).toBe("SPAN");
    await expect(next).toHaveText("Next");
    await expect(next).toHaveAttribute("aria-disabled", "true");
    await expect(next).not.toHaveAttribute("href");
    await expect(page.getByRole("link", { name: "Previous" })).toHaveAttribute("href", "?page=4");
  });
});

test("PAG-08 with total 1 or less Pagination renders nothing", async ({ page }) => {
  for (const total of [1, 0]) {
    await onEachReact(page, "Pagination", { page: 1, total, links: true }, async (id) => {
      expect(await page.locator("#" + id).innerHTML(), `total ${total}`).toBe("");
    });
  }
});

test("PAG-09 a page below 1 shows as page 1 and one above total as the last page", async ({ page }) => {
  await onEachReact(page, "Pagination", { page: 0, total: 20 }, async () => {
    await expect(page.getByRole("button", { name: "Page 1", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(await texts(page)).toEqual(["Previous", "1", "2", "3", "4", "5", "…", "20", "Next"]);
  });
  await onEachReact(page, "Pagination", { page: 25, total: 20 }, async () => {
    await expect(page.getByRole("button", { name: "Page 20", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(await texts(page)).toEqual(["Previous", "1", "…", "16", "17", "18", "19", "20", "Next"]);
  });
});

test("PAG-10 the Pagination file of dist has no use client, and with href it renders on the server", async () => {
  const file = "dist/components/Pagination.js";
  expect(readFileSync(file, "utf8").split("\n")[0]).not.toMatch(/use client/);
  expect(readFileSync("src/components/Pagination.tsx", "utf8")).not.toMatch(/^\s*["']use client["']/);
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
  const { Pagination } = await import(pathToFileURL(resolve(file)).href);
  const html = renderToString(createElement(Pagination, { page: 2, total: 3, href: (n: number) => `/runs/${n}` }));
  expect(html).toContain('<nav aria-label="Pagination"');
  for (const n of [1, 2, 3]) expect(html).toContain(`href="/runs/${n}"`);
  expect(html).toContain('aria-current="page"');
});
