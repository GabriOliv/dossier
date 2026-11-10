import { expect, test, type Page } from "@playwright/test";
import { onEachReact, overlayCalls } from "./overlay-mount";

// Each test runs on React 18 and on React 19, on the Menu scene of overlay-entry.tsx: `#trigger` opens the menu
// `#menu` with the items Editar, Duplicar and Excluir unless `labels` says otherwise, and `#after` follows it.
const trigger = (page: Page) => page.locator("#trigger");
const menu = (page: Page) => page.getByRole("menu");
const item = (page: Page, name: string) => page.getByRole("menuitem", { name });
const isOpen = (page: Page) => page.locator("#menu").evaluate((m) => m.matches(":popover-open"));
const calls = (page: Page, id: string) => overlayCalls(page, id);
/** The page at (1000, 500) is the tall empty block under the scene: nothing there takes focus. */
const clickOutside = (page: Page) => page.mouse.click(1000, 500);
/** The tabindex of each item, in order: the roving tabindex leaves 0 only on the focused one. */
const tabIndexes = (page: Page) =>
  page.locator('[role="menuitem"]').evaluateAll((all) => all.map((el) => el.getAttribute("tabindex")));
const rects = (page: Page) =>
  page.evaluate(() => {
    const r = (id: string) => document.getElementById(id)!.getBoundingClientRect().toJSON() as DOMRect;
    return { trigger: r("trigger"), menu: r("menu") };
  });

test("MNU-01 a click on the trigger opens a menu of three menuitems, marks the trigger and focuses the first enabled item", async ({
  page,
}) => {
  await onEachReact(page, "Menu", {}, async () => {
    await expect(trigger(page)).toHaveAttribute("aria-haspopup", "menu");
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
    await expect(menu(page)).toHaveCount(0);
    await trigger(page).click();
    await expect(menu(page)).toBeVisible();
    await expect(menu(page).getByRole("menuitem")).toHaveText(["Editar", "Duplicar", "Excluir"]);
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
    await expect(trigger(page)).toHaveAttribute("aria-controls", "menu");
    await expect(item(page, "Editar")).toBeFocused();
  });
  await onEachReact(page, "Menu", { disabled: [0] }, async () => {
    await trigger(page).click();
    await expect(item(page, "Duplicar")).toBeFocused();
  });
});

test("MNU-02 Enter, Space or the down arrow on the focused trigger opens the menu with focus on the first enabled item", async ({
  page,
}) => {
  for (const props of [{}, { disabled: [0] }]) {
    await onEachReact(page, "Menu", props, async () => {
      const first = "disabled" in props ? "Duplicar" : "Editar";
      for (const key of ["Enter", "Space", "ArrowDown"]) {
        await trigger(page).focus();
        await page.keyboard.press(key);
        await expect(menu(page), key).toBeVisible();
        await expect(item(page, first), key).toBeFocused();
        await expect(trigger(page)).toHaveAttribute("aria-expanded", "true");
        await page.keyboard.press("Escape");
        await expect(menu(page)).toHaveCount(0);
      }
      // The down arrow does not scroll the page.
      expect(await page.evaluate(() => scrollY)).toBe(0);
    });
  }
});

test("MNU-03 the down arrow on the last item goes to the first enabled item, the up arrow on the first to the last", async ({
  page,
}) => {
  await onEachReact(page, "Menu", {}, async () => {
    await trigger(page).click();
    await expect(item(page, "Editar")).toBeFocused();
    expect(await tabIndexes(page)).toEqual(["0", "-1", "-1"]);
    await page.keyboard.press("ArrowDown");
    await expect(item(page, "Duplicar")).toBeFocused();
    expect(await tabIndexes(page)).toEqual(["-1", "0", "-1"]);
    await page.keyboard.press("ArrowDown");
    await expect(item(page, "Excluir")).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(item(page, "Editar")).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await expect(item(page, "Excluir")).toBeFocused();
    expect(await tabIndexes(page)).toEqual(["-1", "-1", "0"]);
    await page.keyboard.press("ArrowUp");
    await expect(item(page, "Duplicar")).toBeFocused();
  });
  // With the first item disabled, down from the last wraps to the first enabled one, and up from it to the last.
  await onEachReact(page, "Menu", { disabled: [0] }, async () => {
    await trigger(page).click();
    await expect(item(page, "Duplicar")).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(item(page, "Excluir")).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(item(page, "Duplicar")).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await expect(item(page, "Excluir")).toBeFocused();
  });
});

test("MNU-04 Home and End move focus to the first and the last enabled item", async ({ page }) => {
  await onEachReact(page, "Menu", {}, async () => {
    await trigger(page).click();
    await page.keyboard.press("End");
    await expect(item(page, "Excluir")).toBeFocused();
    await page.keyboard.press("Home");
    await expect(item(page, "Editar")).toBeFocused();
  });
  await onEachReact(
    page,
    "Menu",
    { labels: ["Editar", "Duplicar", "Mover", "Excluir"], disabled: [0, 3] },
    async () => {
      await trigger(page).click();
      await page.keyboard.press("End");
      await expect(item(page, "Mover")).toBeFocused();
      await page.keyboard.press("Home");
      await expect(item(page, "Duplicar")).toBeFocused();
      // Neither scrolled the page.
      expect(await page.evaluate(() => scrollY)).toBe(0);
    },
  );
});

test("MNU-05 Enter or a click on an item calls its onSelect once, closes the menu and moves focus back to the trigger", async ({
  page,
}) => {
  await onEachReact(page, "Menu", {}, async (id) => {
    await trigger(page).click();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await expect.poll(() => calls(page, id)).toEqual({ "onSelect:Duplicar": 1 });
    await expect(menu(page)).toHaveCount(0);
    expect(await isOpen(page)).toBe(false);
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
    await expect(trigger(page)).toBeFocused();
    await trigger(page).click();
    await item(page, "Excluir").click();
    await expect.poll(() => calls(page, id)).toEqual({ "onSelect:Duplicar": 1, "onSelect:Excluir": 1 });
    await expect(menu(page)).toHaveCount(0);
    await expect(trigger(page)).toBeFocused();
  });
});

test("MNU-06 Escape, Tab or a click outside closes the menu without onSelect, and Escape moves focus back to the trigger", async ({
  page,
}) => {
  await onEachReact(page, "Menu", {}, async (id) => {
    await trigger(page).click();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Escape");
    await expect.poll(() => isOpen(page)).toBe(false);
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
    await expect(trigger(page)).toBeFocused();
    await trigger(page).click();
    await page.keyboard.press("Tab");
    await expect.poll(() => isOpen(page)).toBe(false);
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
    expect(await page.evaluate(() => !!document.activeElement?.closest("#menu"))).toBe(false);
    await trigger(page).click();
    await clickOutside(page);
    await expect.poll(() => isOpen(page)).toBe(false);
    await expect(trigger(page)).toHaveAttribute("aria-expanded", "false");
    expect(await calls(page, id)).toEqual({});
  });
});

test("MNU-07 a disabled item has aria-disabled, the arrows skip it and a click on it does not call onSelect", async ({
  page,
}) => {
  await onEachReact(page, "Menu", { disabled: [1] }, async (id) => {
    await trigger(page).click();
    await expect(item(page, "Duplicar")).toHaveAttribute("aria-disabled", "true");
    await expect(item(page, "Editar")).not.toHaveAttribute("aria-disabled");
    await expect(item(page, "Excluir")).not.toHaveAttribute("aria-disabled");
    await expect(item(page, "Editar")).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(item(page, "Excluir")).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await expect(item(page, "Editar")).toBeFocused();
    // Playwright waits for an aria-disabled element to be enabled: force clicks it as it is.
    await item(page, "Duplicar").click({ force: true });
    expect(await calls(page, id)).toEqual({});
    expect(await isOpen(page)).toBe(true);
  });
});

test("MNU-09 the menu opens below the trigger left-aligned, above it when it does not fit, and follows a scroll", async ({
  page,
}) => {
  await onEachReact(page, "Menu", {}, async () => {
    await trigger(page).click();
    await expect.poll(() => isOpen(page)).toBe(true);
    const before = await rects(page);
    expect(before.menu.top).toBeGreaterThanOrEqual(before.trigger.bottom);
    expect(before.menu.top - before.trigger.bottom).toBeLessThanOrEqual(8);
    expect(before.menu.left).toBe(before.trigger.left);
    await page.evaluate(() => scrollTo(0, 60));
    await expect.poll(async () => (await rects(page)).menu.top).toBe(before.menu.top - 60);
    const after = await rects(page);
    expect(after.trigger.top).toBe(before.trigger.top - 60);
    expect(after.menu.left).toBe(after.trigger.left);
  });
  // The trigger starts at 658 px of the 720 px window: the three items do not fit in the 40 px under it.
  await onEachReact(page, "Menu", { top: 650 }, async () => {
    await trigger(page).click();
    await expect.poll(() => isOpen(page)).toBe(true);
    const r = await rects(page);
    expect(r.trigger.bottom + r.menu.height).toBeGreaterThan(720);
    expect(r.menu.bottom).toBeLessThanOrEqual(r.trigger.top);
    expect(r.trigger.top - r.menu.bottom).toBeLessThanOrEqual(8);
    expect(r.menu.left).toBe(r.trigger.left);
  });
});

test("OVL-31 a Menu whose trigger is not a React element renders the trigger as it came and no menu", async ({
  page,
}) => {
  const errors: Error[] = [];
  page.on("pageerror", (e) => errors.push(e));
  // The scene renders a spacer, the Menu, then `#after` and another spacer.
  const nodes = (id: string) =>
    page
      .locator(`#${id}`)
      .evaluate((c) => [...c.childNodes].map((n) => (n.nodeType === 3 ? n.textContent : n.nodeName)));
  await onEachReact(page, "Menu", { trigger: "Ações" }, async (id) => {
    expect(await nodes(id)).toEqual(["DIV", "Ações", "BUTTON", "DIV"]);
    await expect(page.locator('[popover], [role="menu"]')).toHaveCount(0);
  });
  await onEachReact(page, "Menu", { trigger: null }, async (id) => {
    expect(await nodes(id)).toEqual(["DIV", "BUTTON", "DIV"]);
    await expect(page.locator('[popover], [role="menu"]')).toHaveCount(0);
  });
  expect(errors).toEqual([]);
});

test("OVL-32 a Menu with no items leaves the trigger aria-disabled and opens nothing", async ({ page }) => {
  await onEachReact(page, "Menu", { labels: [] }, async () => {
    await expect(trigger(page)).toHaveAttribute("aria-disabled", "true");
    await trigger(page).click({ force: true });
    await trigger(page).focus();
    for (const key of ["Enter", "Space", "ArrowDown"]) await page.keyboard.press(key);
    await expect(page.locator('[popover], [role="menu"], [role="menuitem"]')).toHaveCount(0);
    await expect(trigger(page)).not.toHaveAttribute("aria-expanded", "true");
    await expect(trigger(page)).toBeFocused();
  });
});
