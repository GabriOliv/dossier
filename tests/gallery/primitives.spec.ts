import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { openTheme, references, section, THEMES } from "./visual";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const PRIMITIVES = ["Button", "IconButton", "Link", "Checkbox", "Switch", "RadioGroup", "Select"];

/** How many elements of `section#<id>` match each selector: the variants and states the section must show. */
const SHOWS: Record<string, Record<string, number>> = {
  Button: {
    "button.ds-btn-outline": 4,
    "button.ds-btn-solid": 4,
    "button.ds-btn-text": 4,
    "button.ds-btn-danger": 3,
    "button.ds-btn-sm": 3,
    "button:disabled": 3,
  },
  IconButton: {
    "button.ds-btn-icon.ds-btn-outline": 3,
    "button.ds-btn-icon.ds-btn-solid": 2,
    "button.ds-btn-icon.ds-btn-text": 1,
    "button.ds-btn-icon.ds-btn-danger": 1,
    "button.ds-btn-icon.ds-btn-sm": 1,
    "button.ds-btn-icon:disabled": 1,
    "button.ds-btn-icon[aria-label]": 6,
  },
  Link: { "a.ds-link": 2, "a.ds-link[href]": 2 },
  Checkbox: {
    'input[type="checkbox"]': 6,
    "input:checked": 2,
    "input[required]": 1,
    'input[aria-invalid="true"]': 1,
    "input:disabled": 2,
    ".ds-tf-msg:not(.ds-tf-error)": 1,
    ".ds-tf-error": 1,
  },
  Switch: {
    'input[role="switch"]': 6,
    "input:checked": 2,
    "input[required]": 1,
    'input[aria-invalid="true"]': 1,
    "input:disabled": 2,
    ".ds-tf-msg:not(.ds-tf-error)": 1,
    ".ds-tf-error": 1,
  },
  RadioGroup: {
    "fieldset > legend": 5,
    'input[type="radio"]': 15,
    "input:checked": 3,
    "input[required]": 3,
    'input[aria-invalid="true"]': 3,
    "input:disabled": 4,
    ".ds-tf-msg:not(.ds-tf-error)": 1,
    ".ds-tf-error": 1,
  },
  Select: {
    select: 4,
    "select > option": 14,
    'select > option[value=""][disabled]': 2,
    "select[required]": 1,
    'select[aria-invalid="true"]': 1,
    "select:disabled": 1,
    ".ds-tf-msg:not(.ds-tf-error)": 1,
    ".ds-tf-error": 1,
  },
};

/** The rule that names each control: it passing on the section shows the scan reached the controls. */
const NAMED_BY: Record<string, string> = {
  Button: "button-name",
  IconButton: "button-name",
  Link: "link-name",
  Checkbox: "label",
  Switch: "label",
  RadioGroup: "label",
  Select: "select-name",
};

const scan = (page: Page, id: string) => new AxeBuilder({ page }).include(`#${id}`).withTags(TAGS).analyze();

for (const theme of THEMES) {
  test(`PRM-05 each of the seven new sections shows its variants and states and axe finds no violation in it (${theme})`, async ({
    page,
  }, info) => {
    // Seven axe scans of a gallery of 50 sections pass 30 s under a full parallel run; the assertions are the same.
    test.setTimeout(120_000);
    await openTheme(page, theme);
    for (const id of PRIMITIVES) {
      await expect(section(page, id), id).toHaveAttribute("data-component", id);
      await expect(page.locator(`section#${id} > h2`), id).toHaveText(id);
      for (const [selector, min] of Object.entries(SHOWS[id]))
        expect(await section(page, id).locator(selector).count(), `${id} ${selector}`).toBeGreaterThanOrEqual(min);
      const r = await scan(page, id);
      expect(
        r.passes.map((p) => p.id),
        id,
      ).toContain(NAMED_BY[id]);
      const report = r.violations
        .map(
          (v) => `${info.project.name} ${theme} ${id}: ${v.id} at ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
        )
        .join("\n");
      expect(r.violations, report).toEqual([]);
    }
  });
}

test("PRM-05 the nav links jump to the seven new sections", async ({ page }) => {
  await page.goto(".");
  for (const name of PRIMITIVES) {
    await page.getByRole("navigation", { name: "Components" }).getByRole("link", { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`#${name}$`));
    await expect(section(page, name)).toBeInViewport();
  }
});

test("PRM-06 each new section has a reference capture per theme in both projects", () => {
  for (const project of ["gallery", "gallery-phone"]) {
    const files = references(project);
    for (const id of PRIMITIVES)
      for (const theme of THEMES) expect(files, `${project}: ${id}-${theme}.png`).toContain(`${id}-${theme}.png`);
  }
});

test("PRM-06 the new sections declare no transition or animation", async ({ page }) => {
  await page.goto(".");
  const found = await page.evaluate((ids) => {
    const moving: string[] = [];
    for (const id of ids)
      for (const el of document.querySelectorAll(`section#${id} *`)) {
        const s = getComputedStyle(el);
        if (s.transitionDuration.split(",").some((d) => parseFloat(d) > 0))
          moving.push(`${id}: transition on ${el.className}`);
        if (s.animationName !== "none") moving.push(`${id}: animation on ${el.className}`);
      }
    return moving;
  }, PRIMITIVES);
  expect(found).toEqual([]);
});
