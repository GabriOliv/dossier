import { existsSync } from "node:fs";
import { expect, test } from "@playwright/test";
import {
  expectIsolated,
  expectOpenShot,
  expectStable,
  openSection,
  OVERLAYS,
  references,
  section,
  SECTIONS,
  shotTitle,
  STILL,
  THEMES,
} from "./visual";

// Runs in the gallery project only (playwright.config.ts).
for (const theme of THEMES) {
  for (const id of SECTIONS) {
    test(`VIS-01 ${shotTitle(id, theme, "gallery")}`, async ({ page }) => {
      await openSection(page, theme, id);
      await expect(section(page, id)).toHaveScreenshot(`${id}-${theme}.png`, STILL);
    });
  }
}

test("VIS-03 a section that differs fails with its name, theme and project, and saves the diff image", async ({
  page,
}) => {
  expect(shotTitle("Tag", "void", "gallery")).toBe("Tag equals its void reference in gallery");
  expect(test.info().snapshotPath("Tag-void.png")).toMatch(/__screenshots__\/gallery\/Tag-void\.png$/);
  await openSection(page, "void", "Tag");
  await page.addStyleTag({ content: "#Tag .ds-tag { color: rgb(255, 0, 0) !important; }" });
  const error = await expect(section(page, "Tag"))
    .toHaveScreenshot("Tag-void.png", STILL)
    .then(
      () => null,
      (e: Error) => e,
    );
  expect(error?.message).toMatch(/pixels .* are different/);
  expect(error?.message).toContain("Snapshot: Tag-void.png");
  expect(existsSync(test.info().outputPath("Tag-void-diff.png"))).toBe(true);
});

for (const theme of THEMES) {
  for (const id of OVERLAYS) {
    test(`OVL-08 ${id} open equals its ${theme} reference in gallery`, async ({ page }) => {
      await expectOpenShot(page, id, theme);
    });
  }
}

test("VIS-04 there is exactly one reference per section, theme and project", () => {
  expect(SECTIONS).toHaveLength(50);
  // The overlay sections also have one reference with the overlay open (OVL-08).
  const expected = [
    ...SECTIONS.flatMap((id) => THEMES.map((t) => `${id}-${t}.png`)),
    ...OVERLAYS.flatMap((id) => THEMES.map((t) => `${id}-open-${t}.png`)),
  ].sort();
  expect(references("gallery")).toEqual(expected);
  expect(references("gallery-phone")).toEqual(expected);
  expect(expected.length * 2).toBe(324);
});

const FEEDBACK = ["Icon", "Spinner", "Skeleton", "Stack", "Grid", "Divider", "Toaster"];

test("FBL-07 Icon, Spinner, Skeleton, Stack, Grid, Divider and Toaster each have a reference per theme in both projects", () => {
  for (const project of ["gallery", "gallery-phone"]) {
    const files = references(project);
    for (const id of FEEDBACK)
      for (const theme of THEMES) expect(files, `${project}: ${id}-${theme}.png`).toContain(`${id}-${theme}.png`);
  }
});

test("FBL-07 the Spinner is captured with its animation stopped: two captures apart in time are equal", async ({
  page,
}) => {
  expect(STILL.animations).toBe("disabled");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await openSection(page, "paper", "Spinner");
  const cells = section(page, "Spinner").locator(".ds-spin-cell").first();
  expect(await cells.evaluate((c) => getComputedStyle(c).animationName)).not.toBe("none");
  const a = await section(page, "Spinner").screenshot(STILL);
  await page.waitForTimeout(300); // more than one 200 ms step
  const b = await section(page, "Spinner").screenshot(STILL);
  expect(a.equals(b)).toBe(true);
});

test("DIS-07 Tabs, Accordion and Pagination each have a reference per theme in both projects", () => {
  for (const project of ["gallery", "gallery-phone"]) {
    const files = references(project);
    for (const id of ["Tabs", "Accordion", "Pagination"])
      for (const theme of THEMES) expect(files, `${project}: ${id}-${theme}.png`).toContain(`${id}-${theme}.png`);
  }
});

test("OVL-08 each overlay section has a closed and an open reference per theme in both projects", () => {
  for (const project of ["gallery", "gallery-phone"]) {
    const files = references(project);
    for (const id of OVERLAYS)
      for (const theme of THEMES)
        for (const file of [`${id}-${theme}.png`, `${id}-open-${theme}.png`])
          expect(files, `${project}: ${file}`).toContain(file);
  }
});

for (const theme of THEMES) {
  test(`VIS-05 two loads of the gallery give the same capture of every section, ${theme}`, async ({ page }) => {
    await expectStable(page, theme);
  });
}

test("VIS-31 a focused TextField shows no text caret in the capture", async ({ page }) => {
  await openSection(page, "paper", "TextField");
  await page.locator("#TextField input").first().focus();
  const field = section(page, "TextField");
  const a = await field.screenshot(STILL);
  await page.waitForTimeout(600); // half of a caret blink cycle and more
  const b = await field.screenshot(STILL);
  expect(a.equals(b)).toBe(true);
  expect(STILL.caret).toBe("hide");
});

for (const theme of THEMES) {
  test(`FBL-09 a capture holds only its section: the menu height and the section order change none, ${theme} in gallery`, async ({
    page,
  }) => {
    await expectIsolated(page, theme);
  });
}
