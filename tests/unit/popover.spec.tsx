import { expect, test, type Page } from "@playwright/test";
import { onEachReact, overlayCalls } from "./overlay-mount";

// Each test runs on React 18 and on React 19, on the Popover scene of overlay-entry.tsx: `#trigger` opens the panel
// `#panel`, which holds `#inside` and `#last`, and `#after` follows it in the page.
const trigger = (page: Page) => page.locator("#trigger");
const panel = (page: Page) => page.locator("#panel");
const isOpen = (page: Page) => panel(page).evaluate((p) => p.matches(":popover-open"));
const calls = (page: Page, id: string) => expect.poll(() => overlayCalls(page, id));
/** The page at (1000, 500) is the tall empty block under the scene: nothing there takes focus. */
const clickOutside = (page: Page) => page.mouse.click(1000, 500);
const rects = (page: Page) =>
  page.evaluate(() => {
    const r = (id: string) => document.getElementById(id)!.getBoundingClientRect().toJSON() as DOMRect;
    return { trigger: r("trigger"), panel: r("panel") };
  });

test("POP-01 a click on the trigger opens the panel in the top layer, with aria-expanded and aria-controls on the trigger", async ({
  page,
}) => {
  await onEachReact(page, "Popover", {}, async (id) => {
    expect(await isOpen(page)).toBe(false);
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
    await trigger(page).click();
    await expect.poll(() => isOpen(page)).toBe(true);
    await expect(panel(page)).toHaveAttribute("popover", "auto");
    await expect(panel(page)).toBeVisible();
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
    await expect(trigger(page)).toHaveAttribute("aria-controls", "panel");
    // The trigger's own onClick still runs.
    await calls(page, id).toEqual({ onClick: 1, "onOpenChange:true": 1 });
  });
});

test("POP-02 Escape closes the panel, sets aria-expanded false and moves focus from inside the panel to the trigger", async ({
  page,
}) => {
  await onEachReact(page, "Popover", {}, async (id) => {
    await trigger(page).click();
    await page.locator("#inside").click();
    await expect(page.locator("#inside")).toBeFocused();
    await page.keyboard.press("Escape");
    await expect.poll(() => isOpen(page)).toBe(false);
    await expect(panel(page)).toBeHidden();
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
    await expect(trigger(page)).toBeFocused();
    await calls(page, id).toEqual({ onClick: 1, "onOpenChange:true": 1, "onOpenChange:false": 1 });
  });
});

test("POP-02 a click outside closes the panel, sets aria-expanded false and moves focus from inside the panel to the trigger", async ({
  page,
}) => {
  await onEachReact(page, "Popover", {}, async (id) => {
    await trigger(page).click();
    await page.locator("#inside").click();
    await clickOutside(page);
    await expect.poll(() => isOpen(page)).toBe(false);
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
    await expect(trigger(page)).toBeFocused();
    await calls(page, id).toEqual({ onClick: 1, "onOpenChange:true": 1, "onOpenChange:false": 1 });
    // A click inside the panel leaves it open.
    await trigger(page).click();
    const box = (await panel(page).boundingBox())!;
    await page.mouse.click(box.x + 2, box.y + 2);
    expect(await isOpen(page)).toBe(true);
  });
});

test("POP-02 Escape with focus on the trigger closes the panel and leaves focus on the trigger", async ({ page }) => {
  await onEachReact(page, "Popover", {}, async () => {
    await trigger(page).focus();
    await page.keyboard.press("Enter");
    await expect.poll(() => isOpen(page)).toBe(true);
    await page.keyboard.press("Escape");
    await expect.poll(() => isOpen(page)).toBe(false);
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
    await expect(trigger(page)).toBeFocused();
  });
});

test("POP-03 the open panel sits below the trigger, left-aligned with it", async ({ page }) => {
  await onEachReact(page, "Popover", {}, async () => {
    await trigger(page).click();
    await expect.poll(() => isOpen(page)).toBe(true);
    const r = await rects(page);
    expect(r.panel.top).toBeGreaterThanOrEqual(r.trigger.bottom);
    expect(r.panel.top - r.trigger.bottom).toBeLessThanOrEqual(8);
    expect(r.panel.left).toBe(r.trigger.left);
  });
});

test("POP-04 a panel that does not fit below the trigger opens above it", async ({ page }) => {
  // The trigger starts at 658 px of the 720 px window: the panel does not fit in the 40 px under it.
  await onEachReact(page, "Popover", { top: 650 }, async () => {
    await trigger(page).click();
    await expect.poll(() => isOpen(page)).toBe(true);
    const r = await rects(page);
    expect(r.trigger.bottom + r.panel.height).toBeGreaterThan(720);
    expect(r.panel.bottom).toBeLessThanOrEqual(r.trigger.top);
    expect(r.trigger.top - r.panel.bottom).toBeLessThanOrEqual(8);
    expect(r.panel.left).toBe(r.trigger.left);
  });
});

test("POP-05 while the panel is open and the page scrolls, the panel stays tied to the trigger", async ({ page }) => {
  await onEachReact(page, "Popover", {}, async () => {
    await trigger(page).click();
    await expect.poll(() => isOpen(page)).toBe(true);
    const before = await rects(page);
    await page.evaluate(() => scrollTo(0, 60));
    await expect.poll(async () => (await rects(page)).panel.top).toBe(before.panel.top - 60);
    const after = await rects(page);
    expect(after.trigger.top).toBe(before.trigger.top - 60);
    expect(after.panel.top - after.trigger.bottom).toBe(before.panel.top - before.trigger.bottom);
    expect(after.panel.left).toBe(after.trigger.left);
    expect(await isOpen(page)).toBe(true);
  });
});

test("POP-06 a controlled Popover opens and closes by open, and each gesture calls onOpenChange once with the value asked", async ({
  page,
}) => {
  await onEachReact(page, "Popover", { controlled: true }, async (id) => {
    await trigger(page).click();
    await expect.poll(() => isOpen(page)).toBe(true);
    await calls(page, id).toEqual({ onClick: 1, "onOpenChange:true": 1 });
    // A second click on the trigger asks to close.
    await trigger(page).click();
    await expect.poll(() => isOpen(page)).toBe(false);
    await calls(page, id).toEqual({ onClick: 2, "onOpenChange:true": 1, "onOpenChange:false": 1 });
    await trigger(page).click();
    await page.keyboard.press("Escape");
    await expect.poll(() => isOpen(page)).toBe(false);
    await calls(page, id).toEqual({ onClick: 3, "onOpenChange:true": 2, "onOpenChange:false": 2 });
    await trigger(page).click();
    await clickOutside(page);
    await expect.poll(() => isOpen(page)).toBe(false);
    await calls(page, id).toEqual({ onClick: 4, "onOpenChange:true": 3, "onOpenChange:false": 3 });
  });
});

test("POP-06 when onOpenChange leaves open as it was, the panel neither opens nor closes", async ({ page }) => {
  await onEachReact(page, "Popover", { controlled: true, keep: true }, async (id) => {
    await trigger(page).click();
    await calls(page, id).toEqual({ onClick: 1, "onOpenChange:true": 1 });
    expect(await isOpen(page)).toBe(false);
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
  });
  await onEachReact(page, "Popover", { controlled: true, keep: true, open: true }, async (id) => {
    await expect.poll(() => isOpen(page)).toBe(true);
    await page.keyboard.press("Escape");
    await calls(page, id).toEqual({ "onOpenChange:false": 1 });
    await expect.poll(() => isOpen(page)).toBe(true);
    await clickOutside(page);
    await calls(page, id).toEqual({ "onOpenChange:false": 2 });
    await expect.poll(() => isOpen(page)).toBe(true);
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
  });
});

test("POP-07 the panel does not hold focus: Tab from its last element leaves it", async ({ page }) => {
  await onEachReact(page, "Popover", {}, async () => {
    await trigger(page).click();
    await expect(trigger(page)).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.locator("#inside")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.locator("#last")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.locator("#after")).toBeFocused();
  });
});

test("OVL-31 a Popover whose trigger is not a React element renders the trigger as it came and no panel", async ({
  page,
}) => {
  const errors: Error[] = [];
  page.on("pageerror", (e) => errors.push(e));
  // The scene renders a spacer, the Popover, then `#after` and another spacer.
  const texts = (id: string) =>
    page
      .locator(`#${id}`)
      .evaluate((c) => [...c.childNodes].map((n) => (n.nodeType === 3 ? n.textContent : n.nodeName)));
  await onEachReact(page, "Popover", { trigger: "Filtros" }, async (id) => {
    expect(await texts(id)).toEqual(["DIV", "Filtros", "BUTTON", "DIV"]);
    await expect(page.locator("[popover]")).toHaveCount(0);
  });
  await onEachReact(page, "Popover", { trigger: null }, async (id) => {
    expect(await texts(id)).toEqual(["DIV", "BUTTON", "DIV"]);
    await expect(page.locator("[popover]")).toHaveCount(0);
  });
  expect(errors).toEqual([]);
});
