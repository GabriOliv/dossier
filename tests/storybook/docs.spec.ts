import { readFileSync } from "node:fs";
import { devices, expect, test } from "@playwright/test";

interface Entry {
  id: string;
  title: string;
  type: string;
}

// The built Storybook: run `npm run build:storybook` first.
const index = JSON.parse(readFileSync("storybook-static/index.json", "utf8")) as { entries: Record<string, Entry> };
const docs = Object.values(index.entries).filter((e) => e.type === "docs");
const url = (id: string) => `iframe.html?viewMode=docs&id=${id}`;

test("GOV-24 the built Storybook has one docs page for each exported component", async () => {
  const lib = (await import("../../dist/index.js")) as Record<string, any>;
  const exported = Object.keys(lib)
    .filter(
      (k) =>
        /^[A-Z]/.test(k) &&
        (typeof lib[k] === "function" ||
          [Symbol.for("react.forward_ref"), Symbol.for("react.memo")].includes(lib[k]?.$$typeof)),
    )
    .sort();
  // The title is Components/<Name>: a page that fails to index would be missing here.
  expect(docs.map((e) => e.title.replace(/^Components\//, "")).sort()).toEqual(exported);
});

for (const { id, title } of docs) {
  test(`GOV-24 ${title} docs page opens with its content and no error`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(`console: ${m.text()}`);
    });
    await page.goto(url(id));
    // Real content, so an error page cannot pass: the Usage heading and the props table.
    await expect(page.getByRole("heading", { name: "Usage", level: 2 })).toBeVisible();
    await expect(page.locator("table.docblock-argstable")).toBeVisible();
    await page.waitForLoadState("networkidle");
    expect(errors).toEqual([]);
  });

  test(`GOV-43 ${title} docs page has no horizontal scroll on a phone`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ ...devices["Pixel 7"], baseURL });
    try {
      const page = await context.newPage();
      await page.goto(url(id));
      await expect(page.getByRole("heading", { name: "Usage", level: 2 })).toBeVisible();
      await page.waitForLoadState("networkidle");
      // scrollWidth against clientWidth: innerWidth grows with the page on a phone.
      const { scroll, client } = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      expect(scroll, `scrollWidth ${scroll} against clientWidth ${client}`).toBeLessThanOrEqual(client);
    } finally {
      await context.close();
    }
  });
}
