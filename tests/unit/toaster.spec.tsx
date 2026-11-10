import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { renderToString } from "react-dom/server";
import { Toaster, toast as serverToast } from "../../src/components/Toaster";
import { loadToaster, mountToaster, onEachReact, toast } from "./toaster-mount";

// Each browser test runs on React 18 and on React 19, on a blank page with dist/styles.css where `window.toast` is the
// package's toast(). The page clock is paused, so only page.clock.runFor moves the timers.
const region = (page: Page, name = "Notifications") => page.getByRole("region", { name });
const status = (page: Page) => region(page).locator('[role="status"]');
const alert = (page: Page) => region(page).locator('[role="alert"]');
/** The titles shown in the container, in order. */
const titles = (scope: ReturnType<Page["locator"]>) => scope.locator(".ds-toast-title").allTextContents();
const center = async (page: Page, selector: string): Promise<[number, number]> => {
  const b = (await page.locator(selector).first().boundingBox())!;
  return [b.x + b.width / 2, b.y + b.height / 2];
};
/** (10, 10) is empty page, away from the toasts at the bottom right. */
const away = (page: Page) => page.mouse.move(10, 10);
/** A button `#before`, ahead of the Toaster in tab order, for focus to move to. */
const addBefore = (page: Page) =>
  page.evaluate(() => document.body.insertAdjacentHTML("afterbegin", '<button id="before">Before</button>'));
/** What `property: value` computes to on an element of the page. */
const computed = (page: Page, property: string, value: string) =>
  page.evaluate(
    ([p, v]) => {
      const probe = document.body.appendChild(document.createElement("i"));
      probe.style.setProperty(p, v);
      const out = getComputedStyle(probe).getPropertyValue(p);
      probe.remove();
      return out;
    },
    [property, value] as const,
  );
const borders = (page: Page, selector: string) =>
  page
    .locator(selector)
    .evaluate((el) =>
      ["Top", "Right", "Bottom", "Left"].map((side) => getComputedStyle(el).getPropertyValue(`border-${side}-color`)),
    );

test.beforeEach(async ({ page }) => {
  await page.clock.install({ time: new Date("2026-11-08T00:00:00Z") });
  await page.clock.pauseAt(new Date("2026-11-08T00:00:01Z"));
});

test("TST-03 the region named Notifications holds an empty status and an empty alert container before any toast", async ({
  page,
}) => {
  await onEachReact(page, async () => {
    const id = await mountToaster(page);
    await expect(region(page)).toHaveCount(1);
    await expect(region(page)).toHaveAttribute("role", "region");
    await expect(region(page)).toHaveAttribute("aria-label", "Notifications");
    await expect(status(page)).toHaveCount(1);
    await expect(alert(page)).toHaveCount(1);
    await expect(status(page)).toBeEmpty();
    await expect(alert(page)).toBeEmpty();
    // labels.name renames the region, also when it changes after mount.
    await page.evaluate((i) => (window as any).renderToaster(i, { labels: { name: "Notificações" } }), id);
    await expect(region(page, "Notificações")).toHaveCount(1);
    await expect(region(page)).toHaveCount(0);
  });
});

test("TST-01 a toast from a handler shows its title, and its description, in the status container", async ({
  page,
}) => {
  await onEachReact(page, async () => {
    await mountToaster(page);
    await page.evaluate(() =>
      document.body.insertAdjacentHTML(
        "afterbegin",
        '<button id="save" onclick="toast({ title: \'Arquivo salvo\' })">Save</button>',
      ),
    );
    await page.locator("#save").click();
    await expect(status(page).locator(".ds-toast")).toHaveCount(1);
    await expect(status(page)).toContainText("Arquivo salvo");
    await expect(status(page).getByText("Arquivo salvo")).toBeVisible();
    await expect(alert(page)).toBeEmpty();
    await toast(page, { title: "Relatório", description: "12 linhas exportadas" });
    await expect(status(page).getByText("12 linhas exportadas")).toBeVisible();
    expect(await titles(status(page))).toEqual(["Arquivo salvo", "Relatório"]);
  });
});

test("TST-02 an error toast shows in the alert container with a contrast-error border", async ({ page }) => {
  await onEachReact(page, async () => {
    await mountToaster(page);
    await toast(page, { title: "Falha", tone: "error" });
    await expect(alert(page).getByText("Falha")).toBeVisible();
    await expect(status(page)).toBeEmpty();
  });
  for (const theme of ["paper", "void", "blueprint"]) {
    await loadToaster(page, false, theme);
    await mountToaster(page);
    await toast(page, { title: "Falha", tone: "error" });
    await toast(page, { title: "Arquivo salvo" });
    await expect(alert(page).locator(".ds-toast")).toHaveCount(1);
    const error = await computed(page, "color", "var(--ds-contrast-error)");
    const ink = await computed(page, "color", "var(--ds-ink)");
    expect(error).not.toBe(ink);
    expect(await borders(page, '[role="alert"] .ds-toast'), theme).toEqual([error, error, error, error]);
    // A default toast keeps the ink border.
    expect(await borders(page, '[role="status"] .ds-toast'), theme).toEqual([ink, ink, ink, ink]);
  }
});

test("TST-04 a default toast leaves the page 6 s after it shows", async ({ page }) => {
  await onEachReact(page, async () => {
    await mountToaster(page);
    await away(page);
    await toast(page, { title: "Arquivo salvo" });
    await expect(status(page).getByText("Arquivo salvo")).toBeVisible();
    await page.clock.runFor(5999);
    await expect(status(page).getByText("Arquivo salvo")).toBeVisible();
    await page.clock.runFor(1);
    await expect(status(page).locator(".ds-toast")).toHaveCount(0);
  });
});

test("TST-05 the pointer over a toast stops its time, and leaving runs what was left", async ({ page }) => {
  await onEachReact(page, async () => {
    await mountToaster(page);
    await away(page);
    await toast(page, { title: "Arquivo salvo" });
    await page.clock.runFor(2000);
    await page.mouse.move(...(await center(page, ".ds-toast")));
    await page.clock.runFor(60_000);
    await expect(status(page).getByText("Arquivo salvo")).toBeVisible();
    await away(page);
    await page.clock.runFor(3999);
    await expect(status(page).getByText("Arquivo salvo")).toBeVisible();
    await page.clock.runFor(1);
    await expect(status(page).locator(".ds-toast")).toHaveCount(0);
  });
});

test("TST-05 focus inside a toast stops its time, and with the pointer over it too, only leaving both runs it", async ({
  page,
}) => {
  await onEachReact(page, async () => {
    await addBefore(page);
    await mountToaster(page);
    await away(page);
    await toast(page, { title: "Arquivo salvo" });
    await page.clock.runFor(1000);
    await page.keyboard.press("Tab");
    await expect(page.locator("#before")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Close" })).toBeFocused();
    await page.clock.runFor(60_000);
    await expect(status(page).getByText("Arquivo salvo")).toBeVisible();
    // The pointer comes and goes while focus stays: still paused.
    await page.mouse.move(...(await center(page, ".ds-toast-title")));
    await away(page);
    await page.clock.runFor(60_000);
    await expect(status(page).getByText("Arquivo salvo")).toBeVisible();
    // Focus leaves with the pointer over the toast: still paused.
    await page.mouse.move(...(await center(page, ".ds-toast-title")));
    await page.keyboard.press("Shift+Tab");
    await expect(page.locator("#before")).toBeFocused();
    await page.clock.runFor(60_000);
    await expect(status(page).getByText("Arquivo salvo")).toBeVisible();
    // Both gone: the 5 s left run.
    await away(page);
    await page.clock.runFor(4999);
    await expect(status(page).getByText("Arquivo salvo")).toBeVisible();
    await page.clock.runFor(1);
    await expect(status(page).locator(".ds-toast")).toHaveCount(0);
  });
});

test("TST-06 an error toast and a toast with duration Infinity stay on the page", async ({ page }) => {
  await onEachReact(page, async () => {
    await mountToaster(page);
    await away(page);
    await toast(page, { title: "Falha", tone: "error" });
    await toast(page, { title: "Fixo", duration: Infinity });
    await page.clock.runFor(3600_000);
    await expect(alert(page).getByText("Falha")).toBeVisible();
    await expect(status(page).getByText("Fixo")).toBeVisible();
  });
});

test("TST-07 the close button, named Close or labels.close, takes its toast off the page", async ({ page }) => {
  await onEachReact(page, async () => {
    const id = await mountToaster(page);
    await toast(page, { title: "Arquivo salvo" });
    await toast(page, { title: "Falha", tone: "error" });
    await expect(page.getByRole("button", { name: "Close" })).toHaveCount(2);
    await status(page).getByRole("button", { name: "Close" }).click();
    await expect(status(page).locator(".ds-toast")).toHaveCount(0);
    await expect(alert(page).getByText("Falha")).toBeVisible();
    // labels.close names the button, also when it changes after mount.
    await page.evaluate((i) => (window as any).renderToaster(i, { labels: { close: "Fechar" } }), id);
    await expect(alert(page).getByRole("button", { name: "Fechar" })).toHaveCount(1);
    await alert(page).getByRole("button", { name: "Fechar" }).click();
    await expect(alert(page).locator(".ds-toast")).toHaveCount(0);
  });
});

test("TST-08 toast.dismiss with the id toast() returned takes that toast off and keeps the others", async ({
  page,
}) => {
  await onEachReact(page, async () => {
    await mountToaster(page);
    await toast(page, { title: "Um" });
    const two = await toast(page, { title: "Dois" });
    await toast(page, { title: "Três", tone: "error" });
    await page.evaluate((i) => (window as any).toast.dismiss(i), two);
    await expect(status(page).locator(".ds-toast")).toHaveCount(1);
    expect(await titles(status(page))).toEqual(["Um"]);
    expect(await titles(alert(page))).toEqual(["Três"]);
  });
});

test("TST-09 of five toasts three show, and each one closed lets the next in, in order of arrival", async ({
  page,
}) => {
  await onEachReact(page, async () => {
    await mountToaster(page);
    for (const title of ["1", "2", "3", "4", "5"]) await toast(page, { title });
    await expect(region(page).locator(".ds-toast")).toHaveCount(3);
    expect(await titles(status(page))).toEqual(["1", "2", "3"]);
    await status(page).locator(".ds-toast").first().getByRole("button", { name: "Close" }).click();
    await expect.poll(() => titles(status(page))).toEqual(["2", "3", "4"]);
    await status(page).locator(".ds-toast").first().getByRole("button", { name: "Close" }).click();
    await expect.poll(() => titles(status(page))).toEqual(["3", "4", "5"]);
  });
});

test("TST-10 a toast called before the Toaster mounts shows once it mounts", async ({ page }) => {
  await onEachReact(page, async () => {
    await toast(page, { title: "Arquivo salvo" });
    await page.clock.runFor(60_000);
    await mountToaster(page);
    await expect(status(page).getByText("Arquivo salvo")).toBeVisible();
  });
});

test("FBL-30 with two Toasters mounted, a toast shows only in the first one", async ({ page }) => {
  await onEachReact(page, async () => {
    const first = await mountToaster(page);
    const second = await mountToaster(page);
    await toast(page, { title: "Arquivo salvo" });
    await toast(page, { title: "Falha", tone: "error" });
    await expect(page.locator(`#${first} .ds-toast`)).toHaveCount(2);
    await expect(page.locator(`#${second} [role="status"]`)).toBeEmpty();
    await expect(page.locator(`#${second} [role="alert"]`)).toBeEmpty();
  });
});

test("FBL-31 toast() with an empty title shows nothing and returns null", async ({ page }) => {
  await onEachReact(page, async () => {
    await mountToaster(page);
    expect(await toast(page, { title: "" })).toBeNull();
    await expect(status(page)).toBeEmpty();
    await expect(alert(page)).toBeEmpty();
  });
});

test("FBL-32 toast.dismiss with an unknown id changes nothing and throws nothing", async ({ page }) => {
  await onEachReact(page, async () => {
    await mountToaster(page);
    await toast(page, { title: "Arquivo salvo" });
    await page.evaluate(() => (window as any).toast.dismiss("nope"));
    await expect(status(page).getByText("Arquivo salvo")).toBeVisible();
  });
});

test("FBL-33 a Toaster unmounted with toasts open drops them and their timers, with no console error", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") errors.push(m.text());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await onEachReact(page, async () => {
    const id = await mountToaster(page);
    for (const title of ["1", "2", "3", "4"]) await toast(page, { title });
    await toast(page, { title: "Falha", tone: "error" });
    await page.clock.runFor(1000);
    await page.evaluate((i) => (window as any).unmountToaster(i), id);
    await expect(page.locator(".ds-toaster")).toHaveCount(0);
    await page.clock.runFor(60_000);
    // A Toaster mounted afterwards finds none of them.
    await mountToaster(page);
    await expect(status(page)).toBeEmpty();
    await expect(alert(page)).toBeEmpty();
  });
  expect(errors).toEqual([]);
});

test("FBL-42 when the owner unmounts with toasts open, the other Toaster never shows them and shows a later toast", async ({
  page,
}) => {
  await onEachReact(page, async () => {
    const first = await mountToaster(page);
    const second = await mountToaster(page);
    await toast(page, { title: "Arquivo salvo" });
    await toast(page, { title: "Falha", tone: "error" });
    await expect(page.locator(`#${first} .ds-toast`)).toHaveCount(2);
    // Counts every node added to the other Toaster, so a toast it holds for a moment is caught too.
    await page.evaluate((i) => {
      const w = window as any;
      w.added = 0;
      new MutationObserver((records) => records.forEach((r) => (w.added += r.addedNodes.length))).observe(
        document.getElementById(i)!,
        { childList: true, subtree: true },
      );
    }, second);
    await page.evaluate((i) => (window as any).unmountToaster(i), first);
    await expect(page.locator(".ds-toaster")).toHaveCount(1);
    await page.clock.runFor(60_000);
    await expect(page.locator(`#${second} [role="status"]`)).toBeEmpty();
    await expect(page.locator(`#${second} [role="alert"]`)).toBeEmpty();
    expect(await page.evaluate(() => (window as any).added)).toBe(0);
    await toast(page, { title: "Depois" });
    await expect(page.locator(`#${second} [role="status"]`).getByText("Depois")).toBeVisible();
  });
});

test("TST-12 the Toaster renders on the server as the empty region, even with a toast queued", () => {
  const id = serverToast({ title: "Arquivo salvo" });
  const html = renderToString(<Toaster />);
  serverToast.dismiss(id!);
  expect(html).toMatch(/^<section popover="manual" role="region" aria-label="Notifications" class="ds-toaster">/);
  expect(html).toContain('<div role="status" class="ds-toaster-list"></div>');
  expect(html).toContain('<div role="alert" class="ds-toaster-list"></div>');
  expect(html).not.toContain("Arquivo salvo");
  expect(readFileSync("src/components/Toaster.tsx", "utf8").split("\n")[0]).toBe('"use client";');
  expect(readFileSync("dist/components/Toaster.js", "utf8").split("\n")[0]).toBe('"use client";');
});
