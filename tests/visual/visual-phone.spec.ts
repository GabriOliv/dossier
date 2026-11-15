import { expect, test } from "@playwright/test";
import {
  eachSection,
  expectIsolated,
  expectOpenShot,
  expectStable,
  openSection,
  OVERLAYS,
  section,
  SECTIONS,
  shotTitle,
  STILL,
  THEMES,
} from "./visual";

// Runs in the visual-phone project only (playwright.config.ts).
for (const theme of THEMES) {
  test(`SUI-08 every section has no horizontal scroll at phone width, and VIS-02 every section equals its ${theme} reference in visual-phone`, async ({
    page,
  }) => {
    await eachSection(page, theme, async (id) => {
      // scrollWidth against clientWidth: innerWidth grows with the page on a phone.
      const m = await page.evaluate(
        (id) => ({
          scroll: document.documentElement.scrollWidth,
          client: document.documentElement.clientWidth,
          section: document.getElementById(id)!.scrollWidth,
          box: document.getElementById(id)!.clientWidth,
        }),
        id,
      );
      expect
        .soft(m.scroll, `${id} scrollWidth ${m.scroll} against clientWidth ${m.client}`)
        .toBeLessThanOrEqual(m.client);
      expect
        .soft(m.section, `${id} section scrollWidth ${m.section} against clientWidth ${m.box}`)
        .toBeLessThanOrEqual(m.box);
      await expect
        .soft(section(page, id), shotTitle(id, theme, "visual-phone"))
        .toHaveScreenshot(`${id}-${theme}.png`, STILL);
    });
  });
}

for (const theme of THEMES) {
  for (const id of OVERLAYS) {
    test(`OVL-08 ${id} open equals its ${theme} reference in visual-phone`, async ({ page }) => {
      await expectOpenShot(page, id, theme);
    });
  }
}

test("VIS-30 a section taller than the window is captured whole", async ({ page }) => {
  await openSection(page, "paper", "TestRunReport");
  const window = page.viewportSize()!.height;
  const tall = section(page, "TestRunReport");
  const box = (await tall.boundingBox())!;
  expect(box.height).toBeGreaterThan(window);
  const png = await tall.screenshot(STILL);
  const ratio = await page.evaluate(() => devicePixelRatio);
  // PNG height sits at bytes 20-23 of the IHDR chunk.
  expect(Math.abs(png.readUInt32BE(20) - box.height * ratio)).toBeLessThanOrEqual(ratio);
});

for (const theme of THEMES) {
  test(`VIS-05 two loads of the gallery give the same capture of every section at phone width, ${theme}`, async ({
    page,
  }) => {
    await expectStable(page, theme);
  });
}

for (const theme of THEMES) {
  test(`FBL-09 a capture holds only its section: the menu height and the section order change none, ${theme} in visual-phone`, async ({
    page,
  }) => {
    await expectIsolated(page, theme);
  });
}
