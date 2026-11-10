import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { renderToStaticMarkup } from "react-dom/server";
import { Spinner } from "../../src/components/Spinner";

test("SPN-01 a Spinner is a status with the text Loading as its accessible name", async ({ page }) => {
  await page.setContent(`<body>${renderToStaticMarkup(<Spinner />)}</body>`);
  const status = page.getByRole("status", { name: "Loading", exact: true });
  await expect(status).toHaveCount(1);
  await expect(status).toContainText("Loading");
  await expect(status).toBeVisible();
});

test("SPN-01 labels.label replaces the text and the accessible name", async ({ page }) => {
  await page.setContent(`<body>${renderToStaticMarkup(<Spinner labels={{ label: "Carregando" }} />)}</body>`);
  const status = page.getByRole("status", { name: "Carregando", exact: true });
  await expect(status).toHaveCount(1);
  await expect(status).toContainText("Carregando");
  await expect(page.getByText("Loading")).toHaveCount(0);
});

test("SPN-01 an empty labels.label falls back to Loading", async ({ page }) => {
  await page.setContent(`<body>${renderToStaticMarkup(<Spinner labels={{ label: "" }} />)}</body>`);
  await expect(page.getByRole("status", { name: "Loading", exact: true })).toHaveCount(1);
});

test("SPN-04 the Spinner moves only inside prefers-reduced-motion: no-preference, in dist/styles.css", () => {
  const css = readFileSync("dist/styles.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const start = css.indexOf("@media (prefers-reduced-motion: no-preference)");
  expect(start).toBeGreaterThan(-1);
  let depth = 0;
  let end = css.indexOf("{", start);
  for (let i = end; i < css.length; i++) {
    if (css[i] === "{") depth++;
    if (css[i] === "}" && --depth === 0) {
      end = i + 1;
      break;
    }
  }
  const guarded = css.slice(start, end);
  const outside = css.slice(0, start) + css.slice(end);
  expect(guarded).toMatch(/\.ds-spin-cell[^{]*\{[^}]*animation: ds-spin 800ms steps\(1\) infinite/);
  // Outside the guard no spinner rule starts an animation; the keyframes only describe one.
  expect(outside).not.toMatch(/\.ds-spin[^{]*\{[^}]*animation/);
});
