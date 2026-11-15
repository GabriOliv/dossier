import { expect, test, type Page } from "@playwright/test";
import { isolate, openAll, openOverlay, OVERLAYS, section, SECTIONS, STILL, type Overlay } from "../support/story";

export { isolate, openAll, OVERLAYS, references, section, SECTIONS, STILL, THEMES } from "../support/story";

/** Overview/All in `theme` with only the section `id` on it, the fonts loaded. */
export async function openSection(page: Page, theme: string, id: string): Promise<void> {
  await openAll(page, theme);
  await isolate(page, id);
}

/**
 * Overview/All opened once in `theme`; each section of `SECTIONS` alone on the page in turn, a soft assertion per
 * section (its name in the message), so one failing section does not hide the others.
 */
export async function eachSection(page: Page, theme: string, check: (id: string) => Promise<void>): Promise<void> {
  test.setTimeout(180_000);
  await openAll(page, theme);
  for (const id of SECTIONS) {
    await isolate(page, id);
    await check(id);
  }
}

/** The title of a reference test: a failure names the section, the theme and the project. */
export const shotTitle = (id: string, theme: string, project: string) =>
  `${id} equals its ${theme} reference in ${project}`;

/** Two loads of Overview/All in `theme` give byte-equal captures of every section, taken one after another. */
export async function expectStable(page: Page, theme: string): Promise<void> {
  const shots = async () => {
    const out: Buffer[] = [];
    await eachSection(page, theme, async (id) => void out.push(await section(page, id).screenshot(STILL)));
    return out;
  };
  const [a, b] = [await shots(), await shots()];
  a.forEach((png, i) => expect.soft(png.equals(b[i]), `${SECTIONS[i]} ${theme}`).toBe(true));
}

/**
 * Compares the page with the reference `<id>-open-<theme>.png` with the overlay open: the whole window for the Dialog
 * (its backdrop covers the page), else the box that holds the section and its open panel.
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
 * FBL-09: each probe captured alone equals its capture after 80 links in odd-sized type and a section of fractional
 * height are put after it: no capture depends on the content around the section, and no other section has a box. The
 * links and the section go in front of nothing, and content put in front would move the section by a fraction of a
 * pixel, which a capture of the section does follow.
 */
export async function expectIsolated(page: Page, theme: string): Promise<void> {
  await openAll(page, theme);
  const plain: Buffer[] = [];
  for (const id of PROBES) {
    await isolate(page, id);
    // Only the section is laid out: no other section has a box.
    const sections = await page.evaluate(() =>
      [...document.querySelectorAll("section[data-component], section[data-composition]")]
        .filter((e) => e.getClientRects().length > 0)
        .map((e) => e.id),
    );
    expect.soft(sections, id).toEqual([id]);
    plain.push(await section(page, id).screenshot(STILL));
  }
  // A new load, the probes in the same order: the generic monospace of the captions resolves to another system font
  // after some captures (WenQuanYi Zen Hei Mono, then Liberation Mono), so both rounds need the same capture history.
  await openAll(page, theme);
  for (const [i, id] of PROBES.entries()) {
    await isolate(page, id);
    await page.evaluate((id) => {
      const target = document.getElementById(id)!;
      const list = document.createElement("ul");
      list.id = "ExtraList";
      for (let n = 0; n < 80; n++) {
        const li = list.appendChild(document.createElement("li"));
        const a = li.appendChild(document.createElement("a"));
        a.href = "#x" + n;
        a.textContent = "Extra" + n;
        a.style.fontSize = "17.3px";
      }
      const extra = document.createElement("section");
      extra.className = "gal-section";
      extra.id = "Extra";
      extra.style.height = "333.5px";
      target.after(list, extra);
    }, id);
    const moved = await section(page, id).screenshot(STILL);
    expect.soft(moved.equals(plain[i]), `${id} ${theme}`).toBe(true);
    await page.evaluate(() => document.querySelectorAll("#ExtraList, #Extra").forEach((e) => e.remove()));
  }
}
