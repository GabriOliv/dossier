import { expect, test, type Page } from "@playwright/test";
import { fileURLToPath } from "node:url";

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

const NEW = [
  "Assertion",
  "BarChart",
  "Comparison",
  "Connector",
  "Contents",
  "Dimension",
  "ErrorNotice",
  "LineChart",
  "Meter",
  "ProportionDial",
  "Redacted",
  "TextField",
  "Timeline",
  "ToleranceBar",
  "Transcript",
];

const PAPER: Record<string, string> = { paper: "#f4f4f1", void: "#0a0b0d", blueprint: "#0f3270" };

/** The components of dist/index.js: its function and forwardRef exports but toast(), which shows in the Toaster section. */
async function libraryExports(): Promise<string[]> {
  const mod = await import(fileURLToPath(new URL("../../dist/index.js", import.meta.url)));
  expect(typeof mod.toast).toBe("function");
  return Object.keys(mod)
    .filter((k) => typeof mod[k] === "function" || mod[k]?.$$typeof === Symbol.for("react.forward_ref"))
    .filter((k) => k !== "toast")
    .sort();
}

const paperToken = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--paper").trim().toLowerCase());

test("GAL-01 sections equal the function exports of dist/index.js", async ({ page }) => {
  const exported = await libraryExports();
  expect(exported).toHaveLength(49);
  await page.goto(".");
  const pairs = await page
    .locator("section[data-component]")
    .evaluateAll((els) => els.map((e) => [e.id, e.getAttribute("data-component")]));
  for (const [id, comp] of pairs) expect(id).toBe(comp);
  expect(pairs.map((p) => p[0]).sort()).toEqual(exported);
});

test("GAL-02 every section renders at least one component root", async ({ page }) => {
  await page.goto(".");
  for (const name of await libraryExports()) {
    const sel = ROOTS[name];
    expect(sel, `no root selector for ${name}`).toBeTruthy();
    await expect(page.locator(`section#${name} > h2`)).toHaveText(name);
    await expect(page.locator(`section#${name}`).locator(sel).first(), name).toBeAttached();
  }
});

for (const theme of ["paper", "void", "blueprint"]) {
  test(`GAL-03 no console or page errors on load (${theme})`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    await page.goto(`?theme=${theme}`);
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await page.waitForLoadState("networkidle");
    expect(errors).toEqual([]);
  });
}

test("GAL-04 the theme selector switches data-theme and tokens", async ({ page }) => {
  await page.goto("?theme=paper");
  expect(await paperToken(page)).toBe(PAPER.paper);
  for (const [theme, label] of [
    ["void", "Void"],
    ["blueprint", "Blueprint"],
    ["paper", "Paper"],
  ]) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    expect(await paperToken(page)).toBe(PAPER[theme]);
  }
});

test("GAL-05 ?theme=blueprint works", async ({ page }) => {
  await page.goto("?theme=blueprint");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "blueprint");
  expect(await paperToken(page)).toBe(PAPER.blueprint);
  await expect(page.getByRole("button", { name: "Blueprint" })).toHaveAttribute("aria-pressed", "true");
});

test("GAL-06 the theme choice persists across reload", async ({ page }) => {
  await page.goto(".");
  await page.getByRole("button", { name: "Void", exact: true }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "void");
  expect(await paperToken(page)).toBe(PAPER.void);
});

test("GAL-07 IBM Plex fonts load locally", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (r) => /fonts\.(googleapis|gstatic)\.com/.test(r.url()) && external.push(r.url()));
  await page.goto(".");
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

test("GAL-08 FBL-35 no horizontal page scroll", async ({ page }, info) => {
  test.skip(info.project.name !== "gallery-phone", "phone project only");
  await page.goto(".");
  await page.waitForLoadState("networkidle");
  // innerWidth grows with an overflowing page on a phone, so only clientWidth holds the width of the window.
  const m = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    width: document.documentElement.clientWidth,
  }));
  expect(m.scroll).toBe(m.width);
});

test("FBL-36 a DataHeader title with a word wider than the window breaks and the page does not scroll", async ({
  page,
}, info) => {
  test.skip(info.project.name !== "gallery-phone", "phone project only");
  await page.goto(".");
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
}, info) => {
  test.skip(info.project.name !== "gallery-phone", "phone project only");
  await page.goto(".");
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

test("GAL-09 nav links jump to the section", async ({ page }) => {
  await page.goto(".");
  for (const name of ["Tag", "StageIcon"]) {
    await page.getByRole("navigation", { name: "Components" }).getByRole("link", { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`#${name}$`));
    await expect(page.locator(`section#${name}`)).toBeInViewport();
  }
});

test("GAL-14 nav links jump to each new component's section", async ({ page }) => {
  await page.goto(".");
  for (const name of NEW) {
    await page.getByRole("navigation", { name: "Components" }).getByRole("link", { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`#${name}$`));
    await expect(page.locator(`section#${name}`)).toBeInViewport();
  }
});

test("GAL-15 typing into an uncontrolled TextField shows the text", async ({ page }) => {
  await page.goto(".");
  const input = page.locator("section#TextField input.ds-tf-input");
  await input.fill("Deputy approver");
  await expect(input).toHaveValue("Deputy approver");
});

test("GAL-16 the header counts 49 components", async ({ page }) => {
  await page.goto(".");
  await expect(page.locator(".gal-wrap > .ds-header")).toContainText(/49 components/i);
});

test("TRR-01 the composition section is marked as a composition", async ({ page }) => {
  await page.goto(".");
  const section = page.locator("section#TestRunReport");
  await expect(section).toHaveAttribute("data-composition", "TestRunReport");
  await expect(section).not.toHaveAttribute("data-component", /.*/);
});

test("TRR-02 the composition renders its components in the card's order", async ({ page }) => {
  await page.goto(".");
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

test("TRR-03 the nav link jumps to the composition", async ({ page }) => {
  await page.goto(".");
  await page
    .getByRole("navigation", { name: "Components" })
    .getByRole("link", { name: "TestRunReport", exact: true })
    .click();
  await expect(page).toHaveURL(/#TestRunReport$/);
  await expect(page.locator("section#TestRunReport")).toBeInViewport();
});

test("A11Y-42 each scroll wrapper of the gallery is focusable and a region named after its example", async ({
  page,
}) => {
  await page.goto(".");
  const wrappers = await page.locator(".gal-scroll").evaluateAll((els) =>
    els.map((el) => ({
      tabindex: el.getAttribute("tabindex"),
      role: el.getAttribute("role"),
      label: el.getAttribute("aria-label"),
      // Inside a Variant the example's name is its caption; elsewhere there is none.
      caption: el.closest(".gal-variant")?.querySelector(".gal-cap")?.textContent ?? null,
    })),
  );
  expect(wrappers.length).toBeGreaterThanOrEqual(9);
  for (const w of wrappers) {
    expect({ tabindex: w.tabindex, role: w.role }).toEqual({ tabindex: "0", role: "region" });
    if (w.caption !== null) expect(w.label).toBe(w.caption);
  }
  expect(wrappers.filter((w) => w.caption === null).map((w) => w.label)).toEqual(["Check results"]);
  expect(new Set(wrappers.map((w) => w.label)).size).toBe(wrappers.length);
  expect(wrappers.every((w) => !!w.label)).toBe(true);
});

test("A11Y-31 the fix for the gallery's own scroll wrappers lives in gallery/, not in src/", async ({ page }) => {
  const { readdirSync, readFileSync } = await import("node:fs");
  const src = readdirSync("src", { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => readFileSync(`${e.parentPath}/${e.name}`, "utf8"));
  expect(src.length).toBeGreaterThan(30);
  expect(src.filter((text) => text.includes("gal-scroll"))).toEqual([]);
  expect(readFileSync("gallery/src/App.tsx", "utf8")).toContain('className="gal-scroll" tabIndex={0} role="region"');
  await page.goto(".");
  await expect(page.locator("#Connector .gal-scroll").first()).toHaveAttribute("role", "region");
});

test("FBL-10 the gallery nav links are 13px and wrap into as many rows as they need, inside the window", async ({
  page,
}) => {
  await page.goto(".");
  const links = page.getByRole("navigation", { name: "Components" }).getByRole("link");
  await expect(links).toHaveCount(50);
  const m = await links.evaluateAll((all) => ({
    sizes: [...new Set(all.map((a) => getComputedStyle(a).fontSize))],
    rows: new Set(all.map((a) => Math.round(a.getBoundingClientRect().top))).size,
    right: Math.max(...all.map((a) => a.getBoundingClientRect().right)),
    width: document.documentElement.clientWidth,
  }));
  expect(m.sizes).toEqual(["13px"]);
  expect(m.rows).toBeGreaterThan(1);
  expect(m.right).toBeLessThanOrEqual(m.width);
});
