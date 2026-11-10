import { existsSync } from "node:fs";
import { expect, test } from "@playwright/test";
import config from "../../playwright.config";

const project = (name: string) => config.projects!.find((p) => p.name === name)!;

test("VIS-06 a screenshot without a reference fails and writes no reference", async ({ page }) => {
  expect(config.updateSnapshots).toBe("none");
  for (const name of ["gallery", "gallery-phone"])
    expect(project(name).snapshotPathTemplate).toBe("{testDir}/__screenshots__/{projectName}/{arg}{ext}");
  const file = test.info().snapshotPath("vis-06-missing.png");
  expect(existsSync(file)).toBe(false);
  await page.setContent("<p>VIS-06</p>");
  const error = await expect(page)
    .toHaveScreenshot("vis-06-missing.png")
    .then(
      () => null,
      (e: Error) => e,
    );
  expect(error?.message).toMatch(/snapshot doesn't exist/i);
  expect(existsSync(file)).toBe(false);
});

test("VIS-15 a markup snapshot that does not exist fails and is not written", () => {
  expect(project("unit").snapshotPathTemplate).toBe("{testDir}/__snapshots__/{arg}{ext}");
  const file = test.info().snapshotPath("vis-15-missing.html");
  expect(existsSync(file)).toBe(false);
  let error: Error | null = null;
  try {
    expect("<p>VIS-15</p>").toMatchSnapshot("vis-15-missing.html");
  } catch (e) {
    error = e as Error;
  }
  expect(error?.message).toMatch(/snapshot doesn't exist/i);
  expect(existsSync(file)).toBe(false);
});
