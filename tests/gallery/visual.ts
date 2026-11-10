import { readdirSync, readFileSync } from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";

export const THEMES = ["paper", "void", "blueprint"] as const;

/** Each gallery section: one per export of src/index.ts (GAL-01 holds the gallery to them), then the composition. */
export const SECTIONS = [
  ...[...readFileSync(new URL("../../src/index.ts", import.meta.url), "utf8").matchAll(/export \{ (\w+),/g)].map(
    (m) => m[1],
  ),
  "TestRunReport",
];

/** Screenshot options that keep a capture still: no animation, no text caret. */
export const STILL = { animations: "disabled", caret: "hide" } as const;

/** The gallery in `theme`, with the fonts loaded. */
export async function openTheme(page: Page, theme: string): Promise<void> {
  await page.goto(`?theme=${theme}`);
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
  await page.evaluate(() => document.fonts.ready);
}

export const section = (page: Page, id: string) => page.locator(`section#${id}`);

/**
 * Leaves only the section `id` on the page: the header, the menu, the theme buttons and every other section
 * get display none, so a capture holds no pixel of them and the section sits at the top whatever their height or
 * order. An open overlay of a hidden section is hidden with it.
 */
export async function isolate(page: Page, id: string): Promise<void> {
  await page.evaluate((only) => {
    let style = document.getElementById("gal-isolate");
    if (!style) {
      style = document.createElement("style");
      style.id = "gal-isolate";
      document.head.append(style);
    }
    style.textContent = `.gal-wrap > :not(main), main > section:not([id="${only}"]) { display: none !important; }`;
    window.scrollTo(0, 0);
  }, id);
}

/** The gallery in `theme` with only the section `id` on it. */
export async function openSection(page: Page, theme: string, id: string): Promise<void> {
  await openTheme(page, theme);
  await isolate(page, id);
}

/** The title of a reference test: a failure names the section, the theme and the project. */
export const shotTitle = (id: string, theme: string, project: string) =>
  `${id} equals its ${theme} reference in ${project}`;

/** The reference PNG names of one project folder. */
export const references = (project: string): string[] => {
  try {
    return readdirSync(new URL(`./__screenshots__/${project}/`, import.meta.url)).sort();
  } catch {
    return [];
  }
};

/** Two loads of the gallery in `theme` give byte-equal captures of every section, taken one after another. */
export async function expectStable(page: Page, theme: string): Promise<void> {
  // Two loads and a capture of each of the 50 sections, each one alone: more than the default 30 s under load.
  test.setTimeout(120_000);
  const shots = async () => {
    await openTheme(page, theme);
    const out: Buffer[] = [];
    for (const id of SECTIONS) {
      await isolate(page, id);
      out.push(await section(page, id).screenshot(STILL));
    }
    return out;
  };
  const [a, b] = [await shots(), await shots()];
  a.forEach((png, i) => expect(png.equals(b[i]), `${SECTIONS[i]} ${theme}`).toBe(true));
}

/** The overlays of primitives-overlays: each section also has a reference with the overlay open (`<id>-open-<theme>.png`). */
export const OVERLAYS = ["Dialog", "Popover", "Tooltip", "Menu"] as const;
export type Overlay = (typeof OVERLAYS)[number];

/** The panel each overlay section opens: the `<dialog>`, the popover panel, the tip and the menu. */
const PANEL: Record<Overlay, string> = {
  Dialog: "dialog[open]",
  Popover: ".ds-popover:not(.ds-menu)",
  Tooltip: ".ds-tooltip",
  Menu: ".ds-menu",
};

/** The element of the gallery section `id` that opens its overlay. */
const OPENER: Record<Overlay, (s: Locator) => Locator> = {
  Dialog: (s) => s.getByRole("button", { name: "Open dialog", exact: true }),
  Popover: (s) => s.getByRole("button", { name: "Filters", exact: true }),
  Tooltip: (s) => s.getByRole("button", { name: "Copy", exact: true }),
  Menu: (s) => s.getByRole("button", { name: "Actions", exact: true }),
};

/** Opens the overlay of the gallery section `id` the way a person does (click, or hover for the tip) and returns its panel. */
export async function openOverlay(page: Page, id: Overlay): Promise<Locator> {
  const opener = OPENER[id](section(page, id));
  await opener.scrollIntoViewIfNeeded();
  if (id === "Tooltip") await opener.hover();
  else await opener.click();
  const panel = section(page, id).locator(PANEL[id]);
  await expect(panel).toBeVisible();
  return panel;
}

/**
 * Compares the page with the reference `<id>-open-<theme>.png` with the overlay open and only its section on the page:
 * the whole window for the Dialog (its backdrop covers the page), else the box that holds the section and its open
 * panel.
 */
export async function expectOpenShot(page: Page, id: Overlay, theme: string): Promise<void> {
  await openSection(page, theme, id);
  const panel = await openOverlay(page, id);
  const name = `${id}-open-${theme}.png`;
  if (id === "Dialog") return expect(page).toHaveScreenshot(name, STILL);
  const [a, b] = [(await section(page, id).boundingBox())!, (await panel.boundingBox())!];
  const [x, y] = [Math.min(a.x, b.x), Math.min(a.y, b.y)];
  const clip = {
    x,
    y,
    width: Math.max(a.x + a.width, b.x + b.width) - x,
    height: Math.max(a.y + a.height, b.y + b.height) - y,
  };
  await expect(page).toHaveScreenshot(name, { ...STILL, clip });
}

/** Sections FBL-09 captures twice: short and tall, plain and with state, and the composition. */
const PROBES = ["Tag", "Button", "Spinner", "Toaster", "Pagination", "TestRunReport"];

/**
 * FBL-09: each probe captured alone equals its capture after the menu grows by 80 links in odd-sized type, the
 * sections are put in reverse order and a section of fractional height goes in front: no capture depends on the menu,
 * on the order or on another section.
 */
export async function expectIsolated(page: Page, theme: string): Promise<void> {
  await openTheme(page, theme);
  const plain: Buffer[] = [];
  for (const id of PROBES) {
    await isolate(page, id);
    // Only the section is laid out: no header, menu or other section has a box.
    const shown = await page.evaluate(() =>
      [...document.querySelectorAll(".gal-wrap > :not(main), main > section")]
        .filter((e) => e.getClientRects().length > 0)
        .map((e) => e.id || e.className),
    );
    expect(shown, id).toEqual([id]);
    plain.push(await section(page, id).screenshot(STILL));
  }
  await openTheme(page, theme);
  await page.evaluate(() => {
    const list = document.querySelector(".gal-nav ul")!;
    for (let i = 0; i < 80; i++) {
      const li = list.appendChild(document.createElement("li"));
      const a = li.appendChild(document.createElement("a"));
      a.href = "#x" + i;
      a.textContent = "Extra" + i;
      a.style.fontSize = "17.3px";
    }
    const main = document.querySelector("main")!;
    for (const s of [...main.children].reverse()) main.append(s);
    const extra = document.createElement("section");
    extra.className = "gal-section";
    extra.id = "Extra";
    extra.style.height = "333.5px";
    main.prepend(extra);
  });
  for (const [i, id] of PROBES.entries()) {
    await isolate(page, id);
    const moved = await section(page, id).screenshot(STILL);
    expect(moved.equals(plain[i]), `${id} ${theme}`).toBe(true);
  }
}
