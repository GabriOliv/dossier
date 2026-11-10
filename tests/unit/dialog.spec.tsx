import { expect, test, type Page } from "@playwright/test";
import { onEachReact, overlayCalls } from "./overlay-mount";

// Each test runs on React 18 and on React 19, on the scenes of overlay-entry.tsx: `#opener` opens a Dialog that holds
// its close button, `#first` and `#last`, and `onClose` closes it unless `keep`.
const dialog = (page: Page) => page.locator("dialog");
const close = (page: Page) => page.getByRole("button", { name: "Close" });
const isModal = (page: Page) => dialog(page).evaluate((d) => d.matches(":modal"));
const calls = (page: Page, id: string) => expect.poll(() => overlayCalls(page, id));
const focusedId = (page: Page) =>
  page.evaluate(() => document.activeElement?.id || document.activeElement?.getAttribute("aria-label"));

test("DLG-01 an open Dialog is a modal dialog named by a heading with its title", async ({ page }) => {
  await onEachReact(page, "Dialog", { open: true }, async () => {
    await expect(dialog(page)).toHaveJSProperty("open", true);
    expect(await isModal(page)).toBe(true);
    const titleId = await dialog(page).getAttribute("aria-labelledby");
    expect(titleId).toBeTruthy();
    await expect(page.locator(`[id="${titleId}"]`)).toHaveText("Excluir arquivo");
    await expect(page.locator(`[id="${titleId}"]`)).toHaveRole("heading");
    await expect(page.getByRole("dialog", { name: "Excluir arquivo" })).toBeVisible();
  });
});

test("DLG-02 description is the dialog's description, and without it the dialog has no aria-describedby", async ({
  page,
}) => {
  await onEachReact(page, "Dialog", { open: true, description: "Esta ação não pode ser desfeita." }, async () => {
    const descId = await dialog(page).getAttribute("aria-describedby");
    expect(descId).toBeTruthy();
    await expect(page.locator(`[id="${descId}"]`)).toHaveText("Esta ação não pode ser desfeita.");
    await expect(page.getByRole("dialog")).toHaveAccessibleDescription("Esta ação não pode ser desfeita.");
  });
  await onEachReact(page, "Dialog", { open: true }, async () => {
    await expect(dialog(page)).not.toHaveAttribute("aria-describedby");
  });
});

test("DLG-03 opening the Dialog moves focus to its first focusable element, the close button", async ({ page }) => {
  await onEachReact(page, "Dialog", {}, async () => {
    await page.click("#opener");
    await expect(close(page)).toBeFocused();
    expect(await close(page).evaluate((b) => !!b.closest("dialog"))).toBe(true);
  });
});

test("DLG-04 Tab and Shift+Tab cycle only through the focusable elements of the open Dialog", async ({ page }) => {
  await onEachReact(page, "Dialog", {}, async () => {
    await page.click("#opener");
    await expect(close(page)).toBeFocused();
    const forward: unknown[] = [];
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("Tab");
      forward.push(await focusedId(page));
    }
    expect(forward).toEqual(["first", "last", "Close", "first"]);
    const back: unknown[] = [];
    for (let i = 0; i < 4; i++) {
      await page.keyboard.press("Shift+Tab");
      back.push(await focusedId(page));
    }
    expect(back).toEqual(["Close", "last", "first", "Close"]);
  });
});

test("DLG-05 Escape on the open Dialog calls onClose once", async ({ page }) => {
  await onEachReact(page, "Dialog", {}, async (id) => {
    await page.click("#opener");
    await page.keyboard.press("Escape");
    await calls(page, id).toEqual({ onClose: 1 });
  });
});

test("DLG-06 the close button is named Close, or by labels.close, and a click on it calls onClose once", async ({
  page,
}) => {
  await onEachReact(page, "Dialog", {}, async (id) => {
    await page.click("#opener");
    await close(page).click();
    await calls(page, id).toEqual({ onClose: 1 });
  });
  await onEachReact(page, "Dialog", { open: true, labels: { close: "Fechar" } }, async (id) => {
    await expect(close(page)).toHaveCount(0);
    await page.getByRole("button", { name: "Fechar" }).click();
    await calls(page, id).toEqual({ onClose: 1 });
  });
});

test("DLG-07 a click on the backdrop, outside the Dialog, calls onClose once", async ({ page }) => {
  await onEachReact(page, "Dialog", {}, async (id) => {
    await page.click("#opener");
    // The dialog is centred and at most 560 px wide in a 1280 px window: (5, 5) is on the backdrop.
    await page.mouse.click(5, 5);
    await calls(page, id).toEqual({ onClose: 1 });
    await expect(dialog(page)).toHaveJSProperty("open", false);
  });
});

test("DLG-07 a click inside the Dialog, on its padding or content, does not call onClose", async ({ page }) => {
  await onEachReact(page, "Dialog", { keep: true }, async (id) => {
    await page.click("#opener");
    const box = (await dialog(page).boundingBox())!;
    await page.mouse.click(box.x + 4, box.y + 4);
    await page.mouse.click(box.x + box.width / 2, box.y + box.height - 4);
    await page.click("#first");
    expect(await overlayCalls(page, id)).toEqual({});
  });
});

test("DLG-08 an alert Dialog has role alertdialog and a click on the backdrop does not call onClose", async ({
  page,
}) => {
  await onEachReact(page, "Dialog", { alert: true }, async (id) => {
    await page.click("#opener");
    await expect(dialog(page)).toHaveAttribute("role", "alertdialog");
    await expect(page.getByRole("alertdialog", { name: "Excluir arquivo" })).toBeVisible();
    await page.mouse.click(5, 5);
    await expect(dialog(page)).toHaveJSProperty("open", true);
    expect(await overlayCalls(page, id)).toEqual({});
    // Escape still closes it.
    await page.keyboard.press("Escape");
    await calls(page, id).toEqual({ onClose: 1 });
  });
  await onEachReact(page, "Dialog", { open: true }, async () => {
    await expect(dialog(page)).not.toHaveAttribute("role");
  });
});

test("DLG-09 when open turns false the dialog closes and focus goes back to the element focused before", async ({
  page,
}) => {
  await onEachReact(page, "Dialog", {}, async () => {
    await page.click("#opener");
    await expect(close(page)).toBeFocused();
    await page.keyboard.press("Tab");
    await close(page).click();
    await expect(dialog(page)).toHaveJSProperty("open", false);
    await expect(page.locator("#opener")).toBeFocused();
    // The same through Escape, from focus on the input.
    await page.click("#opener");
    await page.click("#first");
    await page.keyboard.press("Escape");
    await expect(dialog(page)).toHaveJSProperty("open", false);
    await expect(page.locator("#opener")).toBeFocused();
  });
});

test("DLG-10 the page does not scroll while the Dialog is open, and overflow comes back on close", async ({ page }) => {
  await onEachReact(page, "Dialog", {}, async () => {
    const overflow = () => page.evaluate(() => getComputedStyle(document.documentElement).overflow);
    const before = await overflow();
    expect(before).not.toBe("hidden");
    await page.click("#opener");
    expect(await overflow()).toBe("hidden");
    await page.mouse.wheel(0, 800);
    expect(await page.evaluate(() => scrollY)).toBe(0);
    await close(page).click();
    expect(await overflow()).toBe(before);
    await page.mouse.wheel(0, 800);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(0);
  });
});

test("DLG-12 when onClose leaves open true, the Dialog stays open after Escape", async ({ page }) => {
  await onEachReact(page, "Dialog", { keep: true }, async (id) => {
    await page.click("#opener");
    await page.keyboard.press("Escape");
    await calls(page, id).toEqual({ onClose: 1 });
    await page.keyboard.press("Escape");
    await calls(page, id).toEqual({ onClose: 2 });
    await expect(dialog(page)).toHaveJSProperty("open", true);
    expect(await isModal(page)).toBe(true);
  });
});

test("OVL-30 Escape in a Dialog opened from another closes only the top one, and focus goes back inside the first", async ({
  page,
}) => {
  await onEachReact(page, "Nested", {}, async (id) => {
    await page.click("#opener");
    await page.click("#inner-opener");
    await expect(page.locator("#inner")).toHaveJSProperty("open", true);
    await page.keyboard.press("Escape");
    await calls(page, id).toEqual({ inner: 1 });
    await expect(page.locator("#inner")).toHaveJSProperty("open", false);
    await expect(page.locator("#outer")).toHaveJSProperty("open", true);
    expect(await page.locator("#outer").evaluate((d) => d.matches(":modal"))).toBe(true);
    await expect(page.locator("#inner-opener")).toBeFocused();
    // The next Escape closes the first.
    await page.keyboard.press("Escape");
    await calls(page, id).toEqual({ inner: 1, outer: 1 });
    await expect(page.locator("#opener")).toBeFocused();
  });
});

test("DLG-07 a drag that starts inside the Dialog and ends on the backdrop does not call onClose", async ({ page }) => {
  await onEachReact(page, "Dialog", { keep: true }, async (id) => {
    await page.click("#opener");
    await page.fill("#first", "relatorio");
    const field = (await page.locator("#first").boundingBox())!;
    await page.mouse.move(field.x + 4, field.y + field.height / 2);
    await page.mouse.down();
    await page.mouse.move(5, 5, { steps: 4 });
    await page.mouse.up();
    expect(await overlayCalls(page, id)).toEqual({});
    await expect(dialog(page)).toHaveJSProperty("open", true);
    // A press and a release both on the backdrop still close it.
    await page.mouse.click(5, 5);
    await calls(page, id).toEqual({ onClose: 1 });
  });
});

test("OVL-35 Escape with a Popover, a Menu or a Tooltip open inside a Dialog closes only that overlay", async ({
  page,
}) => {
  await onEachReact(page, "InDialog", {}, async (id) => {
    const isOpen = (sel: string) => page.locator(sel).evaluate((el) => el.matches(":popover-open"));
    await expect(page.locator("#dlg")).toHaveJSProperty("open", true);
    // Popover
    await page.click("#p-trigger");
    expect(await isOpen("#p-panel")).toBe(true);
    await page.click("#p-inside");
    await page.keyboard.press("Escape");
    await expect.poll(() => isOpen("#p-panel")).toBe(false);
    await expect(page.locator("#p-trigger")).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#dlg")).toHaveJSProperty("open", true);
    // Menu
    await page.click("#m-trigger");
    await expect(page.getByRole("menuitem", { name: "Editar" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect.poll(() => isOpen("#m-menu")).toBe(false);
    await expect(page.locator("#m-trigger")).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#m-trigger")).toBeFocused();
    await expect(page.locator("#dlg")).toHaveJSProperty("open", true);
    // Tooltip, shown by keyboard focus
    await page.keyboard.press("Tab");
    await expect(page.locator("#t-trigger")).toBeFocused();
    await expect.poll(() => isOpen("#t-tip"), { timeout: 2000 }).toBe(true);
    await page.keyboard.press("Escape");
    await expect.poll(() => isOpen("#t-tip")).toBe(false);
    await expect(page.locator("#t-trigger")).toBeFocused();
    await expect(page.locator("#dlg")).toHaveJSProperty("open", true);
    expect(await overlayCalls(page, id)).toEqual({});
    // With nothing open on top, Escape closes the Dialog.
    await page.keyboard.press("Escape");
    await calls(page, id).toEqual({ onClose: 1 });
    await expect(page.locator("#dlg")).toHaveJSProperty("open", false);
  });
});
