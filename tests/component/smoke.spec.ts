import { fileURLToPath } from "node:url";
import { devices, expect, test, type Page } from "@playwright/test";
import { FIXTURES, isolate, openAll, openFixture, openStory, section, SECTIONS, THEMES } from "../support/story";

// Root selector that proves each component rendered.
const ROOTS: Record<string, string> = {
  DataHeader: ".ds-header",
  SectionTitle: ".ds-section",
  Readout: ".ds-readout",
  Tag: ".ds-tag",
  DataTable: ".ds-table",
  FieldList: ".ds-fields",
  Schematic: "svg.ds-schematic",
  Hierarchy: ".ds-tree",
  Quote: ".ds-quote",
  Footnotes: ".ds-notes",
  StatusFlag: ".ds-flag",
  CheckLog: ".ds-checklog",
  StageIcon: "svg.ds-stage",
  Assertion: ".ds-assert",
  BarChart: ".ds-bars",
  Comparison: ".ds-compare",
  Connector: "svg.ds-connector",
  Contents: ".ds-contents",
  Dimension: "svg.ds-dim",
  ErrorNotice: ".ds-errnote",
  LineChart: "svg.ds-linechart",
  Meter: ".ds-meter",
  ProportionDial: "svg.ds-dial",
  Redacted: ".ds-redact",
  TextField: ".ds-textfield",
  Timeline: ".ds-timeline",
  ToleranceBar: ".ds-tol",
  Transcript: ".ds-transcript",
  Button: ".ds-btn",
  IconButton: ".ds-btn-icon",
  Link: "a.ds-link",
  Checkbox: ".ds-fc-box",
  Switch: ".ds-fc-sw",
  RadioGroup: "fieldset.ds-radios",
  Select: "select.ds-select-input",
  Dialog: "dialog.ds-dialog",
  Popover: ".ds-popover:not(.ds-menu)",
  Tooltip: ".ds-tooltip",
  Menu: ".ds-popover.ds-menu",
  Tabs: ".ds-tabs",
  Accordion: ".ds-accordion",
  Pagination: "nav.ds-pagination",
  Icon: "svg.ds-icon",
  Spinner: ".ds-spinner",
  Skeleton: ".ds-skeleton",
  Stack: ".ds-stack",
  Grid: ".ds-grid",
  Divider: "hr.ds-divider",
  Toaster: "section.ds-toaster",
};

/** The components of dist/index.js: its function and forwardRef exports but toast(), which shows in the Toaster story. */
async function libraryExports(): Promise<string[]> {
  const mod = await import(fileURLToPath(new URL("../../dist/index.js", import.meta.url)));
  expect(typeof mod.toast).toBe("function");
  return Object.keys(mod)
    .filter((k) => typeof mod[k] === "function" || mod[k]?.$$typeof === Symbol.for("react.forward_ref"))
    .filter((k) => k !== "toast")
    .sort();
}

/**
 * Opens Overview/All in `theme` and checks each section with a soft assertion: it is on the page and no console or page
 * error names it. An error that names no section fails the last assertion, which holds them all.
 */
async function expectNoErrors(page: Page, theme: string): Promise<void> {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  await openAll(page, theme);
  await page.waitForLoadState("networkidle");
  for (const name of SECTIONS) {
    await expect.soft(section(page, name), `${name} (${theme}) is on Overview/All`).toBeAttached();
    expect
      .soft(
        errors.filter((e) => e.includes(name)),
        `${name} (${theme}) logged an error`,
      )
      .toEqual([]);
  }
  expect.soft(errors, `Overview/All (${theme}) logged an error`).toEqual([]);
}

// Opening every story takes more than the default 30 s under a full parallel run; the assertions are the same.
test.beforeEach(() => test.setTimeout(120_000));

test("GAL-01 sections equal the function exports of dist/index.js", async ({ page }) => {
  const exported = await libraryExports();
  expect(exported).toHaveLength(49);
  await openAll(page, "paper");
  for (const name of exported)
    expect.soft(await page.locator(`section[data-component="${name}"]`).count(), `${name} has one section`).toBe(1);
  const found = await page
    .locator("section[data-component]")
    .evaluateAll((els) => els.map((e) => [e.id, e.getAttribute("data-component")!]));
  for (const [id, comp] of found) expect.soft(id).toBe(comp);
  expect(found.map((p) => p[0]).sort()).toEqual(exported);
});

test("GAL-02 every section renders at least one component root", async ({ page }) => {
  await openAll(page, "paper");
  for (const name of await libraryExports()) {
    const sel = ROOTS[name];
    expect(sel, `no root selector for ${name}`).toBeTruthy();
    await expect.soft(page.locator(`section#${name} > h2`), name).toHaveText(name);
    await expect.soft(section(page, name).locator(sel).first(), name).toBeAttached();
  }
});

for (const theme of THEMES) {
  test(`GAL-03 no console or page errors on load (${theme})`, async ({ page }) => {
    await expectNoErrors(page, theme);
  });
}

test("GAL-07 IBM Plex fonts load locally", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (r) => /fonts\.(googleapis|gstatic)\.com/.test(r.url()) && external.push(r.url()));
  await openStory(page, "DataHeader", "paper");
  const loaded = await page.evaluate(async () => {
    await Promise.all([
      document.fonts.load('500 16px "IBM Plex Mono"'),
      document.fonts.load('700 16px "IBM Plex Sans Condensed"'),
    ]);
    const has = (family: string, weight: string) =>
      [...document.fonts].some(
        (f) => f.family.replace(/"/g, "") === family && f.weight === weight && f.status === "loaded",
      );
    return [
      document.fonts.check('500 16px "IBM Plex Mono"'),
      document.fonts.check('700 16px "IBM Plex Sans Condensed"'),
      has("IBM Plex Mono", "500"),
      has("IBM Plex Sans Condensed", "700"),
    ];
  });
  expect(loaded).toEqual([true, true, true, true]);
  expect(external).toEqual([]);
});

test("GAL-15 typing into an uncontrolled TextField shows the text", async ({ page }) => {
  await openStory(page, "TextField", "paper");
  const input = page.locator("section#TextField input.ds-tf-input");
  await input.fill("Deputy approver");
  await expect(input).toHaveValue("Deputy approver");
});

test("TRR-01 the composition section is marked as a composition", async ({ page }) => {
  await openStory(page, "TestRunReport", "paper");
  const section = page.locator("section#TestRunReport");
  await expect(section).toHaveAttribute("data-composition", "TestRunReport");
  await expect(section).not.toHaveAttribute("data-component", /.*/);
});

test("TRR-02 the composition renders its components in the card's order", async ({ page }) => {
  await openStory(page, "TestRunReport", "paper");
  const roots = [
    "header",
    "errnote",
    "readout",
    "section",
    "checklog",
    "assert",
    "tol",
    "textfield",
    "fields",
    "notes",
  ];
  const order = await page.locator("section#TestRunReport").evaluate((el, roots) => {
    const names: string[] = [];
    for (const node of el.querySelectorAll("*")) {
      const root = roots.find((r) => node.classList.contains("ds-" + r));
      if (root && names[names.length - 1] !== root) names.push(root);
    }
    return names;
  }, roots);
  expect(order).toEqual([
    "header",
    "errnote",
    "readout",
    "section",
    "checklog",
    "section",
    "assert",
    "tol",
    "section",
    "textfield",
    "fields",
    "notes",
  ]);
  // One value per component, from source/components/TestRunReport/preview.html (case-insensitive: labels are uppercased).
  const text = (await page.locator("section#TestRunReport").textContent())!.toLowerCase();
  for (const value of [
    "Regression run",
    "Run 0427 · Build 3.18.2",
    "Release blocked: 2 checks failed",
    "CHK-121 · p95 latency 1.84 s, limit 1.20 s",
    "Rerun after fix #1182",
    "−1.4% vs run 0426",
    "14:32",
    "Failure detail",
    "Checkout suite",
    "500 Internal Server Error at 120 rps",
    "checkout.spec.ts:88",
    "Error rate",
    "Write a reason before waiving a failed check.",
    "Who signs off on build 3.18.2.",
    "CHK-114 (server error)",
    "Load profile: 120 requests per second for 60 s against staging.",
  ]) {
    expect(text, value).toContain(value.toLowerCase());
  }
  await expect(page.locator("section#TestRunReport input")).toHaveValue("Release manager");
});

// The phone tests: the Pixel 7 window, as the gallery-phone project had it.
const { defaultBrowserType: _browser, ...pixel7 } = devices["Pixel 7"];
test.describe("on a phone", () => {
  test.use(pixel7);

  test("GAL-08 FBL-35 no horizontal page scroll", async ({ page }) => {
    await openAll(page, "paper");
    await page.waitForLoadState("networkidle");
    for (const name of SECTIONS) {
      await isolate(page, name);
      // innerWidth grows with an overflowing page on a phone, so only clientWidth holds the width of the window.
      const m = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        width: document.documentElement.clientWidth,
      }));
      expect.soft(m.scroll, name).toBe(m.width);
    }
  });

  test("FBL-36 a DataHeader title with a word wider than the window breaks and the page does not scroll", async ({
    page,
  }) => {
    await openStory(page, "DataHeader", "paper");
    await page.waitForLoadState("networkidle");
    const m = await page
      .locator("section#DataHeader .ds-header-title")
      .first()
      .evaluate((title) => {
        title.textContent = "W".repeat(80);
        const root = document.documentElement;
        return { right: title.getBoundingClientRect().right, width: root.clientWidth, scroll: root.scrollWidth };
      });
    expect(m.right).toBeLessThanOrEqual(m.width);
    expect(m.scroll).toBe(m.width);
  });

  test("FBL-41 a running DataHeader title with a word wider than the window breaks and the page does not scroll", async ({
    page,
  }) => {
    await openStory(page, "DataHeader", "paper");
    await page.waitForLoadState("networkidle");
    const m = await page
      .locator("section#DataHeader .ds-running-title")
      .first()
      .evaluate((title) => {
        title.textContent = "W".repeat(80);
        const root = document.documentElement;
        return { right: title.getBoundingClientRect().right, width: root.clientWidth, scroll: root.scrollWidth };
      });
    expect(m.right).toBeLessThanOrEqual(m.width);
    expect(m.scroll).toBe(m.width);
  });
});

// SUI-09: Overview/All opens in each theme with no console error and no page error, in any of its sections.
for (const theme of THEMES) {
  test(`SUI-09 Overview/All loads with no console or page error, every section checked (${theme})`, async ({
    page,
  }) => {
    await expectNoErrors(page, theme);
  });
}

// SUI-09: the test-only fixture stories load with no console error and no page error, in each theme.
for (const theme of THEMES) {
  test(`SUI-09 the fixture stories load with no console or page error (${theme})`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    for (const { section: name } of FIXTURES) {
      await openFixture(page, name, theme);
      await page.waitForLoadState("networkidle");
    }
    expect(errors).toEqual([]);
  });
}
