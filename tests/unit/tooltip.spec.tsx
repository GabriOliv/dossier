import { expect, test, type Page } from "@playwright/test";
import { onEachReact } from "./overlay-mount";

// Each test runs on React 18 and on React 19, on the Tooltip scene of overlay-entry.tsx: a Tooltip `Copiar` (`#tip`)
// on `#trigger`, then `#other`. The page clock is paused, so only page.clock.runFor moves the 500 ms delay.
const trigger = (page: Page) => page.locator("#trigger");
const tip = (page: Page) => page.locator("#tip");
const isShown = (page: Page) => tip(page).evaluate((t) => t.matches(":popover-open"));
const center = async (page: Page, selector: string): Promise<[number, number]> => {
  const b = (await page.locator(selector).boundingBox())!;
  return [b.x + b.width / 2, b.y + b.height / 2];
};
const hover = async (page: Page, selector: string) => page.mouse.move(...(await center(page, selector)));
/** (1000, 600) is empty page, away from the trigger and the tip. */
const away = (page: Page) => page.mouse.move(1000, 600);

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-08T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-11-08T00:00:01Z"));
});

/** Mounts the scene on each React with the pointer away from it, then runs `run`. */
const each = (page: Page, props: Record<string, unknown>, run: () => Promise<void>) =>
  onEachReact(page, "Tooltip", props, async () => {
    await away(page);
    await run();
  });

test("TIP-01 the trigger's aria-describedby points to a role tooltip element with the content", async ({ page }) => {
  await each(page, {}, async () => {
    await expect(trigger(page)).toHaveAttribute("aria-describedby", "tip");
    await expect(tip(page)).toHaveAttribute("role", "tooltip");
    await expect(tip(page)).toHaveText("Copiar");
    await expect(trigger(page)).toHaveAccessibleDescription("Copiar");
    expect(await isShown(page)).toBe(false);
  });
});

test("TIP-02 the tip shows once the pointer has stayed on the trigger for 500 ms", async ({ page }) => {
  await each(page, {}, async () => {
    await hover(page, "#trigger");
    await page.clock.runFor(499);
    expect(await isShown(page)).toBe(false);
    await expect(tip(page)).toBeHidden();
    await page.clock.runFor(1);
    expect(await isShown(page)).toBe(true);
    await expect(tip(page)).toBeVisible();
  });
});

test("TIP-03 keyboard focus on the trigger shows the tip after 500 ms", async ({ page }) => {
  await each(page, {}, async () => {
    await page.keyboard.press("Tab");
    await expect(trigger(page)).toBeFocused();
    await page.clock.runFor(499);
    expect(await isShown(page)).toBe(false);
    await page.clock.runFor(1);
    expect(await isShown(page)).toBe(true);
    await expect(tip(page)).toBeVisible();
  });
});

test("TIP-04 a pointer that leaves the trigger before 500 ms never shows the tip", async ({ page }) => {
  await each(page, {}, async () => {
    await hover(page, "#trigger");
    await page.clock.runFor(300);
    await away(page);
    await page.clock.runFor(1000);
    expect(await isShown(page)).toBe(false);
    // The same for focus that leaves before 500 ms.
    await page.keyboard.press("Tab");
    await page.clock.runFor(300);
    await page.keyboard.press("Tab");
    await expect(page.locator("#other")).toBeFocused();
    await page.clock.runFor(1000);
    expect(await isShown(page)).toBe(false);
  });
});

test("TIP-05 the tip stays while the pointer moves from the trigger onto it, and hides once the pointer leaves both", async ({
  page,
}) => {
  await each(page, {}, async () => {
    await hover(page, "#trigger");
    await page.clock.runFor(500);
    expect(await isShown(page)).toBe(true);
    await hover(page, "#tip");
    await page.clock.runFor(1000);
    expect(await isShown(page)).toBe(true);
    await hover(page, "#trigger");
    await page.clock.runFor(1000);
    expect(await isShown(page)).toBe(true);
    await away(page);
    await page.clock.runFor(100);
    expect(await isShown(page)).toBe(false);
  });
});

test("TIP-06 Escape hides the visible tip and focus stays on the trigger", async ({ page }) => {
  await each(page, {}, async () => {
    await page.keyboard.press("Tab");
    await page.clock.runFor(500);
    expect(await isShown(page)).toBe(true);
    await page.keyboard.press("Escape");
    expect(await isShown(page)).toBe(false);
    await expect(trigger(page)).toBeFocused();
    await page.clock.runFor(1000);
    expect(await isShown(page)).toBe(false);
    // Escape also hides a tip the pointer brought, with the pointer still on the trigger.
    await page.keyboard.press("Tab");
    await hover(page, "#trigger");
    await page.clock.runFor(500);
    expect(await isShown(page)).toBe(true);
    await page.keyboard.press("Escape");
    expect(await isShown(page)).toBe(false);
  });
});

test("TIP-07 the tip hides when the trigger loses focus with the pointer over neither the trigger nor the tip", async ({
  page,
}) => {
  await each(page, {}, async () => {
    await page.keyboard.press("Tab");
    await page.clock.runFor(500);
    expect(await isShown(page)).toBe(true);
    await page.keyboard.press("Tab");
    await expect(page.locator("#other")).toBeFocused();
    await page.clock.runFor(100);
    expect(await isShown(page)).toBe(false);
    // With the pointer on the trigger, losing focus keeps the tip until the pointer leaves too.
    await page.keyboard.press("Shift+Tab");
    await expect(trigger(page)).toBeFocused();
    await hover(page, "#trigger");
    await page.clock.runFor(500);
    expect(await isShown(page)).toBe(true);
    await page.keyboard.press("Tab");
    await page.clock.runFor(1000);
    expect(await isShown(page)).toBe(true);
    await away(page);
    await page.clock.runFor(100);
    expect(await isShown(page)).toBe(false);
  });
});

test("OVL-33 a Tooltip on a disabled element never shows", async ({ page }) => {
  await each(page, { disabled: true }, async () => {
    await expect(trigger(page)).toBeDisabled();
    await hover(page, "#trigger");
    await page.clock.runFor(1000);
    expect(await isShown(page)).toBe(false);
    await page.keyboard.press("Tab");
    await expect(page.locator("#other")).toBeFocused();
    await page.clock.runFor(1000);
    expect(await isShown(page)).toBe(false);
  });
});
