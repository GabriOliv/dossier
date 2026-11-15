import { readdirSync, readFileSync } from "node:fs";
import { expect, type Locator, type Page } from "@playwright/test";

export const THEMES = ["paper", "void", "blueprint"] as const;

/** Each Overview story: one per export of src/index.ts (SUI-10 holds the Storybook to them), then the composition. */
export const SECTIONS = [
  ...[...readFileSync(new URL("../../src/index.ts", import.meta.url), "utf8").matchAll(/export \{ (\w+),/g)].map(
    (m) => m[1],
  ),
  "TestRunReport",
];

/** Screenshot options that keep a capture still: no animation, no text caret. */
export const STILL = { animations: "disabled", caret: "hide" } as const;

/** The id of the Overview story of `name`: `DataHeader` is `overview--data-header`. */
export const storyId = (name: string) => `overview--${name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}`;

export const section = (page: Page, name: string): Locator => page.locator(`section#${name}`);

/** How long the Storybook preview may take to boot a story: with every worker loading it at once it can pass 5 s. */
const BOOT = { timeout: 30_000 };

/**
 * The story `id` (the Overview story of `name` by default) in `theme`, with the fonts loaded. A missing story fails on
 * its `section#<name>`, naming it.
 */
export async function openStory(page: Page, name: string, theme: string, id = storyId(name)): Promise<void> {
  await page.goto(`iframe.html?id=${id}&viewMode=story&globals=theme:${theme}`);
  await expect(page.locator("html"), `${name} (${id}) in ${theme}`).toHaveAttribute("data-theme", theme, BOOT);
  await expect(section(page, name), `${name} (${id}) in ${theme}`).toBeVisible(BOOT);
  await page.evaluate(() => document.fonts.ready);
}

/**
 * The test-only stories of stories/Fixtures.stories.tsx: tagged out of the sidebar and the docs, each holds the
 * `section#<section>` of the component it measures.
 */
export const FIXTURES = [
  { id: "fixtures--stack-gaps", section: "Stack" },
  { id: "fixtures--grid-layout", section: "Grid" },
  { id: "fixtures--divider-vertical", section: "Divider" },
  { id: "fixtures--spinner-buttons", section: "Spinner" },
] as const;
export type Fixture = (typeof FIXTURES)[number]["section"];

/** The fixture story of the component `name`, in `theme`, with the fonts loaded. */
export function openFixture(page: Page, name: Fixture, theme: string): Promise<void> {
  return openStory(page, name, theme, FIXTURES.find((f) => f.section === name)!.id);
}

/** Every Overview section on one page, in `theme`, with the fonts loaded: the tests that visit every section open it once. */
export async function openAll(page: Page, theme: string): Promise<void> {
  await page.goto(`iframe.html?id=overview--all&viewMode=story&globals=theme:${theme}`);
  await expect(page.locator("html"), `Overview/All in ${theme}`).toHaveAttribute("data-theme", theme, BOOT);
  await expect(
    page.locator("section[data-component], section[data-composition]"),
    `Overview/All in ${theme}`,
  ).toHaveCount(SECTIONS.length, BOOT);
  await page.evaluate(() => document.fonts.ready);
}

/**
 * Leaves only the section `name` of Overview/All on the page: every other section gets display none, so a capture holds
 * no pixel of them and the section sits at the top whatever their height or order.
 */
export async function isolate(page: Page, name: string): Promise<void> {
  await page.evaluate((only) => {
    let style = document.getElementById("gal-isolate");
    if (!style) {
      style = document.createElement("style");
      style.id = "gal-isolate";
      document.head.append(style);
    }
    style.textContent = `section[data-component]:not([id="${only}"]), section[data-composition]:not([id="${only}"]) { display: none !important; }`;
    window.scrollTo(0, 0);
  }, name);
}

/** Where the visual references are: one folder per visual project. */
export const REFERENCES = new URL("../visual/__screenshots__/", import.meta.url);

/** The reference PNG names of one project folder. */
export const references = (project: string): string[] => {
  try {
    return readdirSync(new URL(`${project}/`, REFERENCES)).sort();
  } catch {
    return [];
  }
};

/** The overlays of the Overview stories: each one opens from a control of its story. */
export const OVERLAYS = ["Dialog", "Popover", "Tooltip", "Menu"] as const;
export type Overlay = (typeof OVERLAYS)[number];

/** The panel each overlay story opens: the `<dialog>`, the popover panel, the tip and the menu. */
const PANEL: Record<Overlay, string> = {
  Dialog: "dialog[open]",
  Popover: ".ds-popover:not(.ds-menu)",
  Tooltip: ".ds-tooltip",
  Menu: ".ds-menu",
};

/** The element of the story `id` that opens its overlay. */
const OPENER: Record<Overlay, (s: Locator) => Locator> = {
  Dialog: (s) => s.getByRole("button", { name: "Open dialog", exact: true }),
  Popover: (s) => s.getByRole("button", { name: "Filters", exact: true }),
  Tooltip: (s) => s.getByRole("button", { name: "Copy", exact: true }),
  Menu: (s) => s.getByRole("button", { name: "Actions", exact: true }),
};

/** Opens the overlay of the story `id` the way a person does (click, or hover for the tip) and returns its panel. */
export async function openOverlay(page: Page, id: Overlay): Promise<Locator> {
  const opener = OPENER[id](section(page, id));
  await opener.scrollIntoViewIfNeeded();
  if (id === "Tooltip") await opener.hover();
  else await opener.click();
  const panel = section(page, id).locator(PANEL[id]);
  await expect(panel).toBeVisible();
  return panel;
}

/** What `property: value` computes to on the open story: a token name or a colour as the browser reads it. */
export const computed = (page: Page, property: string, value: string): Promise<string> =>
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

/** The computed value of `property` on `target`. */
export const styleOf = (target: Locator, property: string): Promise<string> =>
  target.evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), property);

/** Presses Tab until `target` has the focus, the way a keyboard reaches it; fails after 30 presses. */
export async function tabTo(page: Page, target: Locator): Promise<void> {
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press("Tab");
    if (await target.evaluate((el) => el === document.activeElement)) return;
  }
  throw new Error("Tab never reached the target");
}
