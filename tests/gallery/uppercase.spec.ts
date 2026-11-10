import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

/** Every element whose text Dossier uppercased in JS (up() or a literal), now uppercased by CSS. */
const UPPERCASED = [
  ".ds-header-title",
  ".ds-header-code",
  ".ds-header-kicker",
  ".ds-header-metatext",
  ".ds-running-title",
  ".ds-running-code",
  ".ds-running-kicker",
  ".ds-running-meta",
  ".ds-section-index",
  ".ds-section-title",
  ".ds-section-meta",
  ".ds-readout-label",
  ".ds-table-caption",
  ".ds-table th",
  ".ds-field-label",
  ".ds-tag",
  ".ds-flag",
  ".ds-tree-code",
  ".ds-quote-text",
  ".ds-statement-kicker",
  ".ds-quote-source",
  ".ds-log-title",
  ".ds-log-id",
  ".ds-log-sum",
  ".ds-assert-label",
  ".ds-assert-row dt",
  ".ds-bar-label",
  ".ds-cmp-code",
  ".ds-cmp-title",
  ".ds-dim-text",
  ".ds-errnote-code",
  ".ds-errnote-meta",
  ".ds-errnote-title",
  ".ds-errnote-action",
  ".ds-lc-xlabel",
  ".ds-meter-label",
  ".ds-pd-label",
  ".ds-pd-text",
  ".ds-sch-text",
  ".ds-tf-label",
  ".ds-tl-at",
  ".ds-tol-label",
  ".ds-tol-word",
  ".ds-toc-title",
  ".ds-tr-title",
  ".ds-tr-speaker",
];

test("I18N-21 every element whose text was uppercased in JS has text-transform uppercase in the gallery", async ({
  page,
}) => {
  await page.goto(".");
  const found = await page.evaluate(
    (selectors) =>
      selectors.map((s) => {
        const els = [...document.querySelectorAll(s)];
        return {
          s,
          count: els.length,
          other: els.map((e) => getComputedStyle(e).textTransform).filter((t) => t !== "uppercase"),
        };
      }),
    UPPERCASED,
  );
  expect(
    found.filter((f) => f.count === 0).map((f) => f.s),
    "selectors with no element in the gallery",
  ).toEqual([]);
  expect(found.filter((f) => f.other.length).map((f) => `${f.s}: ${f.other.join(", ")}`)).toEqual([]);
});

test("I18N-21 an element child of a Tag or a StatusFlag keeps its own case, as Dossier uppercased only their text", async ({
  page,
}) => {
  await page.goto(".");
  const found = await page.evaluate(() =>
    ["ds-tag", "ds-flag"].map((c) => {
      const root = document.createElement("span");
      root.className = c;
      root.innerHTML = "Ab <b>Cd</b>";
      document.body.append(root);
      return [c, getComputedStyle(root).textTransform, getComputedStyle(root.querySelector("b")!).textTransform];
    }),
  );
  expect(found).toEqual([
    ["ds-tag", "uppercase", "none"],
    ["ds-flag", "uppercase", "none"],
  ]);
});

/** The sections added after visual-tests (primitives-actions-forms, primitives-overlays, primitives-disclosure, primitives-feedback-layout): VIS-04, PRM-06, OVL-08, DIS-07 and FBL-07 hold their references. */
const ADDED = [
  "Button",
  "IconButton",
  "Link",
  "Checkbox",
  "Switch",
  "RadioGroup",
  "Select",
  "Dialog",
  "Popover",
  "Tooltip",
  "Menu",
  "Tabs",
  "Accordion",
  "Pagination",
  "Icon",
  "Spinner",
  "Skeleton",
  "Stack",
  "Grid",
  "Divider",
  "Toaster",
];

test("I18N-22 the screenshot references are the ones visual-tests made: the captures match them without an update", () => {
  // VIS-01 and VIS-02 compare every section with these files in the same run; this pins that i18n changed none.
  const root = new URL("./__screenshots__/", import.meta.url);
  const files = readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".png") && !ADDED.some((n) => e.name.startsWith(n + "-")))
    .map((e) => `${e.parentPath.split("__screenshots__/")[1]}/${e.name}`)
    .sort();
  expect(files).toHaveLength(174);
  const hash = createHash("sha256");
  for (const f of files) hash.update(f).update(readFileSync(new URL(f, root)));
  // sha256 of the 174 references as re-recorded once with each section captured alone,
  // and with the three phone TestRunReport captures after the DataHeader title wraps (FBL-36).
  expect(hash.digest("hex")).toBe("3f025150296417863726bd14a0d006d3d129b35f15feda6fdc57d4993ff0dbca");
});
