import { devices, expect, test } from "@playwright/test";
import { computed, openOverlay, openStory, styleOf, THEMES } from "../support/story";

// Computed styles of the overlays in each theme, measured on the Dialog and Menu stories, opened the way a person does.

for (const theme of THEMES) {
  test(`DLG-11 the open Dialog has a hatched opaque backdrop, no shadow and a 2px border, ${theme}`, async ({
    page,
  }) => {
    await openStory(page, "Dialog", theme);
    const panel = await openOverlay(page, "Dialog");
    const s = await panel.evaluate((d) => {
      const own = getComputedStyle(d);
      const back = getComputedStyle(d, "::backdrop");
      return {
        image: back.backgroundImage,
        backOpacity: back.opacity,
        opacity: own.opacity,
        shadow: own.boxShadow,
        widths: [own.borderTopWidth, own.borderRightWidth, own.borderBottomWidth, own.borderLeftWidth],
        style: own.borderTopStyle,
      };
    });
    const ruleSoft = await computed(page, "color", "var(--ds-rule-soft)");
    expect(s.image).toMatch(/^repeating-linear-gradient\(45deg, /);
    expect(s.image).toContain(ruleSoft);
    expect(s.backOpacity).toBe("1");
    expect(s.opacity).toBe("1");
    expect(s.shadow).toBe("none");
    expect(s.widths).toEqual(["2px", "2px", "2px", "2px"]);
    expect(s.style).toBe("solid");
    // Only the hatch lines paint: no colour of the backdrop is translucent.
    for (const alpha of s.image.matchAll(/rgba\([^)]*,\s*([\d.]+)\)/g)) expect(Number(alpha[1])).toBe(0);
  });

  test(`OVL-34 at the gallery-phone width the Dialog fits the window with no horizontal page scroll, ${theme}`, async ({
    page,
  }) => {
    await page.setViewportSize(devices["Pixel 7"].viewport);
    await openStory(page, "Dialog", theme);
    const panel = await openOverlay(page, "Dialog");
    const fit = await panel.evaluate((d) => {
      const r = d.getBoundingClientRect();
      const root = document.documentElement;
      return { left: r.left, right: r.right, width: root.clientWidth, scroll: root.scrollWidth };
    });
    expect(fit.width).toBe(devices["Pixel 7"].viewport.width);
    expect(fit.left).toBeGreaterThanOrEqual(0);
    expect(fit.right).toBeLessThanOrEqual(fit.width);
    expect(fit.scroll).toBeLessThanOrEqual(fit.width);
  });

  test(`MNU-08 the text of a danger item computes to --ds-contrast-error, ${theme}`, async ({ page }) => {
    await openStory(page, "Menu", theme);
    const menu = await openOverlay(page, "Menu");
    const error = await computed(page, "color", "var(--ds-contrast-error)");
    expect(await styleOf(menu.getByRole("menuitem", { name: "Delete" }), "color")).toBe(error);
    // An item without the tone keeps the ink.
    expect(await styleOf(menu.getByRole("menuitem", { name: "Edit" }), "color")).toBe(
      await computed(page, "color", "var(--ds-ink)"),
    );
    expect(error).not.toBe(await computed(page, "color", "var(--ds-ink)"));
  });
}
