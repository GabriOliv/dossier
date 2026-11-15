import { existsSync, lstatSync, readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

// Served by playwright.config.ts when PW_CONSUMER is set (npm run test:consumer builds them first).
const VITE = "http://127.0.0.1:4301/";
const DOCU = "http://127.0.0.1:4302";
const PLAIN = "http://127.0.0.1:4303";

/** Computed properties compared between the two hosts, on every element inside each probe. */
const PROPS = [
  "display",
  "position",
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "line-height",
  "letter-spacing",
  "text-transform",
  "text-align",
  "white-space",
  "vertical-align",
  "color",
  "background-color",
  "border-top-width",
  "border-top-style",
  "border-top-color",
  "border-right-width",
  "border-right-style",
  "border-right-color",
  "border-bottom-width",
  "border-bottom-style",
  "border-bottom-color",
  "border-left-width",
  "border-left-style",
  "border-left-color",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "list-style-type",
  "box-shadow",
  "fill",
  "stroke",
  "stroke-width",
];

/** Collects console errors and uncaught page errors, which is where React reports hydration mismatches. */
function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(String(e)));
  return errors;
}

async function probeStyles(page: Page) {
  await page.locator("[data-slice]").waitFor();
  await page.evaluate(() => document.fonts.ready);
  return page.evaluate((props) => {
    const out: Record<string, { path: string; style: Record<string, string> }[]> = {};
    for (const probe of document.querySelectorAll<HTMLElement>("[data-slice] [data-probe]")) {
      out[probe.dataset.probe!] = [...probe.querySelectorAll("*")].map((el, i) => {
        const cs = getComputedStyle(el);
        const style: Record<string, string> = {};
        for (const p of props) style[p] = cs.getPropertyValue(p);
        return { path: `${i} ${el.tagName.toLowerCase()}.${el.getAttribute("class") ?? ""}`, style };
      });
    }
    return out;
  }, PROPS);
}

test("CONS-01 both fixtures install the packed tarball, not a link, and render the same slice", () => {
  for (const dir of ["fixtures/vite", "fixtures/docusaurus"]) {
    const pkg = `${dir}/node_modules/@gabrioliv/dossier`;
    expect(lstatSync(pkg).isSymbolicLink(), pkg).toBe(false);
    expect(existsSync(`${pkg}/dist/index.js`)).toBe(true);
    expect(existsSync(`${pkg}/src`), "only dist and docs are packed").toBe(false);
  }
  expect(readFileSync("fixtures/docusaurus/src/components/Slice.tsx", "utf8")).toBe(
    readFileSync("fixtures/vite/src/Slice.tsx", "utf8"),
  );
});

test("CONS-02 vite build and docusaurus build produced the pages", () => {
  expect(existsSync("fixtures/vite/dist/index.html")).toBe(true);
  expect(existsSync("fixtures/docusaurus/build/slice/index.html")).toBe(true);
  expect(existsSync("fixtures/docusaurus/build/mermaid/index.html")).toBe(true);
  expect(existsSync("fixtures/docusaurus/build-plain/mermaid/index.html")).toBe(true);
  // The static HTML is server-rendered: the slice is in it before any script runs.
  expect(readFileSync("fixtures/docusaurus/build/slice/index.html", "utf8")).toContain('class="ds-table"');
});

for (const [name, url] of [
  ["vite /", VITE],
  ["docusaurus /slice", `${DOCU}/slice`],
  ["docusaurus /", `${DOCU}/`],
  ["docusaurus /mermaid", `${DOCU}/mermaid`],
]) {
  test(`CONS-03 no console or hydration error on ${name}`, async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(url);
    await page.waitForLoadState("networkidle");
    if (url.endsWith("/mermaid")) await page.locator(".docusaurus-mermaid-container svg").waitFor();
    expect(errors).toEqual([]);
  });
}

test("CONS-04 computed styles are the same in the Vite and the Docusaurus fixture", async ({ browser }) => {
  const vite = await browser.newPage();
  const docu = await browser.newPage();
  await vite.goto(VITE);
  await docu.goto(`${DOCU}/slice`);
  const [a, b] = await Promise.all([probeStyles(vite), probeStyles(docu)]);
  expect(Object.keys(b).sort()).toEqual(Object.keys(a).sort());
  expect(a.DataTable.length).toBeGreaterThan(20);
  expect(a.DataHeader.some((e) => e.path.includes("h1.ds-t-display ds-header-title"))).toBe(true);
  const diffs: string[] = [];
  for (const [probe, els] of Object.entries(a)) {
    expect(
      b[probe].map((e) => e.path),
      probe,
    ).toEqual(els.map((e) => e.path));
    els.forEach((el, i) => {
      for (const p of PROPS) {
        if (el.style[p] !== b[probe][i].style[p]) {
          diffs.push(`${probe} ${el.path} ${p}: vite=${el.style[p]} docusaurus=${b[probe][i].style[p]}`);
        }
      }
    });
  }
  expect(diffs).toEqual([]);
});

async function mermaidLabels(page: Page, url: string) {
  await page.goto(url);
  const svg = page.locator(".docusaurus-mermaid-container svg");
  await svg.waitFor();
  return svg.evaluate((el) =>
    [...el.querySelectorAll(".label, .nodeLabel, .edgeLabel")].map((n) => {
      const cs = getComputedStyle(n);
      return `${n.getAttribute("class")}: ${cs.fontSize} ${cs.letterSpacing}`;
    }),
  );
}

test("CONS-05 Mermaid labels keep their font-size and letter-spacing with the package", async ({ browser }) => {
  const plain = await mermaidLabels(await browser.newPage(), `${PLAIN}/mermaid`);
  const withPkg = await mermaidLabels(await browser.newPage(), `${DOCU}/mermaid`);
  expect(plain.length).toBeGreaterThan(0);
  expect(plain.some((l) => l.startsWith("label"))).toBe(true);
  expect(withPkg).toEqual(plain);
});

test("CONS-06 with the dark theme active, --paper resolves to Void's #0a0b0d; Blueprint works per block", async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem("theme", "dark"));
  await page.goto(`${DOCU}/slice`);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const paper = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--paper").trim(),
  );
  expect(paper).toBe("#0a0b0d");
  // Infima paints the page ground on html, through the bridged --ifm-background-color.
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)).toBe("rgb(10, 11, 13)");
  const blueprint = await page
    .locator('[data-probe="blueprint"]')
    .evaluate((el) => getComputedStyle(el).getPropertyValue("--paper").trim());
  expect(blueprint).toBe("#0f3270");
});

test("CONS-06 in the light theme --paper stays Paper's #f4f4f1", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("theme", "light"));
  await page.goto(`${DOCU}/slice`);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  const paper = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue("--paper").trim(),
  );
  expect(paper).toBe("#f4f4f1");
});

async function focusAndBody(page: Page, url: string) {
  await page.goto(url);
  await page.locator("#focus-target, a").first().waitFor();
  const target = (await page.locator("#focus-target").count()) ? "#focus-target" : "article a";
  await page.locator(target).first().focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  return page.evaluate(() => {
    const a = document.activeElement as HTMLElement;
    const f = getComputedStyle(a);
    const b = getComputedStyle(document.body);
    return {
      focusVisible: a.matches(":focus-visible"),
      outlineStyle: f.outlineStyle,
      boxShadow: f.boxShadow,
      bodyMargin: b.margin,
      bodyFont: b.fontFamily,
      bodyBackground: b.backgroundColor,
    };
  });
}

test("CONS-07 without base.css the Vite page keeps the browser's body and :focus-visible", async ({ page }) => {
  const r = await focusAndBody(page, VITE);
  expect(r.focusVisible).toBe(true);
  expect(r.boxShadow).toBe("none");
  expect(r.outlineStyle).not.toBe("none");
  expect(r.bodyMargin).toBe("8px");
  expect(r.bodyBackground).toBe("rgba(0, 0, 0, 0)");
  expect(r.bodyFont).not.toContain("IBM Plex");
});

test("CONS-07 the Docusaurus site keeps its body margin and a visible focus with the package", async ({ browser }) => {
  // Since BRIDGE-04 the bridge draws the Dossier focus ring, so only the margin and a visible focus are kept.
  const plain = await focusAndBody(await browser.newPage(), `${PLAIN}/`);
  const withPkg = await focusAndBody(await browser.newPage(), `${DOCU}/`);
  expect(withPkg.focusVisible).toBe(true);
  expect(withPkg.outlineStyle !== "none" || withPkg.boxShadow !== "none").toBe(true);
  expect(withPkg.bodyMargin).toBe(plain.bodyMargin);
});

test("CONS-08 no style in the slice depends on the source order of the library's rules", async ({ page }) => {
  // Docusaurus minifies CSS with clean-css restructureRules, which moves rules that share declarations. A rule that
  // wins only by coming later (same specificity) then loses. Reversing every rule must change nothing.
  await page.goto(VITE);
  const normal = await probeStyles(page);
  await page.evaluate(() => {
    const sheet = [...document.styleSheets].find((s) => [...s.cssRules].some((r) => r.cssText.includes(".ds-tag")))!;
    const reversed = new CSSStyleSheet();
    reversed.replaceSync(
      [...sheet.cssRules]
        .map((r) => r.cssText)
        .reverse()
        .join("\n"),
    );
    sheet.disabled = true;
    document.adoptedStyleSheets = [reversed];
  });
  const reversed = await probeStyles(page);
  const diffs: string[] = [];
  for (const [probe, els] of Object.entries(normal)) {
    els.forEach((el, i) => {
      for (const p of PROPS) {
        const r = reversed[probe][i].style[p];
        if (el.style[p] !== r) diffs.push(`${probe} ${el.path} ${p}: in order=${el.style[p]} reversed=${r}`);
      }
    });
  }
  expect(diffs).toEqual([]);
});

test("I18N-14 both fixtures import @gabrioliv/dossier/locales/pt-BR and show its words", async ({ browser }) => {
  for (const url of [VITE, `${DOCU}/slice`]) {
    const page = await browser.newPage();
    await page.goto(url);
    const probe = page.locator('[data-probe="StatusFlag-ptBR"]');
    await expect(probe.locator(".ds-flag-pass")).toHaveText("Passou");
    await expect(probe.locator(".ds-flag-fail")).toHaveText("Falhou");
    await page.close();
  }
});

// The bridge tests read computed styles in the Docusaurus fixture, which has no CSS of its own beyond the package's
// docusaurus.css. Token values are the ones of Paper (light) and Void (dark).
type Mode = "light" | "dark";
const MODES: Mode[] = ["light", "dark"];
const TOKENS: Record<Mode, Record<string, string>> = {
  light: {
    paper: "#f4f4f1",
    panel: "#e6e6e1",
    ink: "#0b0c0e",
    rule: "#0b0c0e",
    inkMuted: "#50535a",
    ruleSoft: "#c6c7c1",
    signal: "#002fa7",
    signalTint: "#d7dff3",
    inverse: "#0b0c0e",
    onInverse: "#f4f4f1",
    onSignal: "#ffffff",
    contrastError: "#b42318",
  },
  dark: {
    paper: "#0a0b0d",
    panel: "#16181d",
    ink: "#eeeeea",
    rule: "#eeeeea",
    inkMuted: "#9ea1a8",
    ruleSoft: "#2c2f36",
    signal: "#2b7fff",
    signalTint: "#101a3c",
    inverse: "#eeeeea",
    onInverse: "#0a0b0d",
    onSignal: "#0a0b0d",
    contrastError: "#ff6a55",
  },
};
/** "#rrggbb" as the computed style prints it. */
const rgb = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${n >> 16}, ${(n >> 8) & 255}, ${n & 255})`;
};

async function openDoc(page: Page, path: string, mode: Mode) {
  await page.addInitScript((m) => localStorage.setItem("theme", m), mode);
  await page.goto(`${DOCU}${path}`);
  await expect(page.locator("html")).toHaveAttribute("data-theme", mode);
  await page.evaluate(() => document.fonts.ready);
}

for (const mode of MODES) {
  test(`BRIDGE-01 Markdown elements follow the Dossier tokens with only the package's CSS (${mode})`, async ({
    page,
  }) => {
    const c = TOKENS[mode];
    await openDoc(page, "/markdown", mode);
    const article = page.locator(".markdown");

    // DOC-05, DOC-06, DOC-07: every h2 has the signal bar, capitals by CSS and the 2 px rule.
    const h2s = await article.locator("h2").evaluateAll((els) =>
      els.map((el) => {
        const bar = getComputedStyle(el, "::before");
        const cs = getComputedStyle(el);
        const written = [...el.childNodes]
          .filter((n) => n.nodeType === Node.TEXT_NODE)
          .map((n) => n.textContent)
          .join("");
        return {
          written,
          bar: [bar.display, bar.width, bar.height, bar.backgroundColor],
          transform: cs.textTransform,
          rule: [cs.borderBottomWidth, cs.borderBottomStyle, cs.borderBottomColor],
        };
      }),
    );
    expect(h2s.map((h) => h.written)).toEqual([
      "Lists and rules",
      "Tables",
      "Quotes",
      "Code",
      "Admonitions",
      "Diagram",
    ]);
    for (const h of h2s) {
      expect(h.bar, "DOC-05").toEqual(["block", "32px", "6px", rgb(c.signal)]);
      expect(h.transform, "DOC-06").toBe("uppercase");
      expect(h.rule, "DOC-07").toEqual(["2px", "solid", rgb(c.rule)]);
    }

    // DOC-08: h3 to h6 keep their case.
    const lower = await article
      .locator("h3, h4, h5, h6")
      .evaluateAll((els) => els.map((el) => [el.tagName, getComputedStyle(el).textTransform]));
    expect(lower.map((l) => l[0])).toEqual(["H3", "H4", "H5", "H6"]);
    for (const [, transform] of lower) expect(transform, "DOC-08").toBe("none");

    // DOC-09 to DOC-11, DOC-13: cells, head rule, row hairlines and the alignment the Markdown wrote.
    const tables = await article.locator("table").evaluateAll((els) =>
      els.map((table) => {
        const cell = (el: Element) => {
          const cs = getComputedStyle(el);
          return {
            left: cs.borderLeftWidth,
            right: cs.borderRightWidth,
            bottom: [cs.borderBottomWidth, cs.borderBottomStyle, cs.borderBottomColor],
            background: cs.backgroundColor,
            color: cs.color,
            align: cs.textAlign,
          };
        };
        return {
          head: [...table.querySelectorAll("thead th")].map(cell),
          body: [...table.querySelectorAll("tbody tr")].map((tr) => [...tr.children].map(cell)),
        };
      }),
    );
    expect(tables).toHaveLength(2);
    for (const t of tables) {
      for (const cell of [...t.head, ...t.body.flat()]) {
        expect(cell.left, "DOC-09").toBe("0px");
        expect(cell.right, "DOC-09").toBe("0px");
      }
      for (const th of t.head) {
        expect(th.bottom, "DOC-10").toEqual(["2px", "solid", rgb(c.rule)]);
        expect(th.background, "DOC-10").toBe("rgba(0, 0, 0, 0)");
        expect(th.color, "DOC-10").toBe(rgb(c.inkMuted));
      }
      for (const td of t.body.flat()) expect(td.bottom, "DOC-11").toEqual(["1px", "solid", rgb(c.ruleSoft)]);
    }
    const [aligned, wide] = tables;
    expect(aligned.head.map((h) => h.align)).toEqual(["left", "center", "right"]);
    for (const row of aligned.body) expect(row.map((td) => td.align)).toEqual(["left", "center", "right"]);
    expect(wide.head.map((h) => h.align)).toEqual(["left", "left", "right", "center", "left"]);

    // DOC-12: at 1280 px each table is as wide as the column of the article.
    const widths = await article.locator("table").evaluateAll((els) =>
      els.map((table) => {
        const parent = getComputedStyle(table.parentElement!);
        const column =
          table.parentElement!.clientWidth - parseFloat(parent.paddingLeft) - parseFloat(parent.paddingRight);
        return { table: table.getBoundingClientRect().width, column };
      }),
    );
    for (const w of widths) expect(Math.abs(w.table - w.column), "DOC-12").toBeLessThanOrEqual(1);

    // DOC-14, DOC-15: the quote.
    const quote = await article.locator("blockquote").evaluate((el) => {
      const cs = getComputedStyle(el);
      const mark = getComputedStyle(el.firstElementChild!, "::before");
      return {
        top: [cs.borderTopWidth, cs.borderTopStyle, cs.borderTopColor],
        left: cs.borderLeftWidth,
        family: cs.fontFamily,
        size: cs.fontSize,
        transform: cs.textTransform,
        mark: [mark.content, mark.color],
        written: el.textContent?.trim(),
      };
    });
    expect(quote.top, "DOC-14").toEqual(["2px", "solid", rgb(c.rule)]);
    expect(quote.left, "DOC-14").toBe("0px");
    expect(quote.family, "DOC-15").toMatch(/^"?IBM Plex Sans Condensed"?/);
    expect(quote.size, "DOC-15").toBe("32px");
    expect(quote.transform, "DOC-15").toBe("uppercase");
    expect(quote.mark, "DOC-15").toEqual(['"“"', rgb(c.signal)]);
    expect(quote.written).toBe("Quality is never an accident; it is always the result of intelligent effort.");

    // DOC-16: links in the text.
    const links = await article
      .locator("p a, li a")
      .evaluateAll((els) => els.map((el) => [getComputedStyle(el).color, getComputedStyle(el).textDecorationLine]));
    expect(links).toHaveLength(2);
    for (const l of links) expect(l, "DOC-16").toEqual([rgb(c.signal), "underline"]);

    // DOC-17: a paragraph and each list are as wide as 68ch in their own font, in 16 px text.
    const measure = await article.evaluate((root) => {
      const out: { tag: string; width: number; limit: number; size: string; column: number }[] = [];
      for (const el of root.querySelectorAll<HTMLElement>(":scope > p, :scope > ul, :scope > ol")) {
        const probe = document.createElement("div");
        probe.style.cssText = "width:68ch;height:0;visibility:hidden";
        el.appendChild(probe);
        const limit = probe.getBoundingClientRect().width;
        probe.remove();
        out.push({
          tag: el.tagName,
          width: el.getBoundingClientRect().width,
          limit,
          size: getComputedStyle(el).fontSize,
          column: root.clientWidth,
        });
      }
      return out;
    });
    expect(new Set(measure.map((m) => m.tag))).toEqual(new Set(["P", "UL", "OL"]));
    const longest = measure.find((m) => m.tag === "P")!;
    expect(longest.limit, "the column must be wider than 68ch for the limit to show").toBeLessThan(longest.column);
    for (const m of measure) {
      expect(m.size, "DOC-17").toBe("16px");
      expect(Math.abs(m.width - m.limit), `DOC-17 ${m.tag}`).toBeLessThanOrEqual(1);
    }
  });
}

/** The channels of a computed color: `rgb()`, `rgba()` or `color(srgb ...)`, with the alpha. */
function channels(color: string) {
  const legacy = color.match(/^rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)$/);
  if (legacy) return { rgb: [legacy[1], legacy[2], legacy[3]].map(Number), alpha: Number(legacy[4] ?? 1) };
  const modern = color.match(/^color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)$/);
  if (modern)
    return {
      rgb: [modern[1], modern[2], modern[3]].map((v) => Math.round(Number(v) * 255)),
      alpha: Number(modern[4] ?? 1),
    };
  throw new Error(`unreadable color ${color}`);
}

/** True when `color` is transparent or a token of the mode, at any opacity. */
function isToken(color: string, mode: Mode) {
  const { rgb: c, alpha } = channels(color);
  if (alpha === 0) return true;
  return Object.values(TOKENS[mode]).some((hex) => channels(rgb(hex)).rgb.every((v, i) => v === c[i]));
}

/** Answers the search request with three hits, so the modal shows results without a network. */
async function mockSearch(page: Page) {
  const hit = (id: string, type: string, lvl2: string | null, content: string | null, anchor: string) => ({
    objectID: id,
    type,
    url: `${DOCU}/markdown#${anchor}`,
    url_without_anchor: `${DOCU}/markdown`,
    anchor,
    content,
    hierarchy: {
      lvl0: "Documentation",
      lvl1: "Markdown elements",
      lvl2,
      lvl3: null,
      lvl4: null,
      lvl5: null,
      lvl6: null,
    },
    _highlightResult: {
      hierarchy: {
        lvl0: { value: "Documentation", matchLevel: "none", matchedWords: [] },
        lvl1: {
          value: "<mark>Mark</mark>down elements",
          matchLevel: "full",
          fullyHighlighted: false,
          matchedWords: ["mark"],
        },
        ...(lvl2 ? { lvl2: { value: lvl2, matchLevel: "none", matchedWords: [] } } : {}),
      },
    },
    ...(content
      ? { _snippetResult: { content: { value: "A <mark>mark</mark> in the text", matchLevel: "full" } } }
      : {}),
  });
  const hits = [
    hit("1", "lvl1", null, null, "top"),
    hit("2", "lvl2", "Tables", null, "tables"),
    hit("3", "content", "Quotes", "Quality is never an accident", "quotes"),
  ];
  await page.route(/algolia/, (route) => {
    const cors = {
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "*",
      "access-control-allow-methods": "*",
    };
    if (route.request().method() === "OPTIONS") return route.fulfill({ status: 204, headers: cors });
    const count = (JSON.parse(route.request().postData() || "{}").requests ?? [{}]).length;
    const result = {
      hits,
      nbHits: hits.length,
      page: 0,
      nbPages: 1,
      hitsPerPage: 20,
      query: "mark",
      params: "",
      processingTimeMS: 1,
    };
    return route.fulfill({
      status: 200,
      headers: { ...cors, "content-type": "application/json" },
      body: JSON.stringify({ results: Array.from({ length: count }, () => result) }),
    });
  });
}

for (const mode of MODES) {
  test(`BRIDGE-02 Infima leftovers and the search modal use only tokens, with square corners and no shadow (${mode})`, async ({
    page,
  }) => {
    const c = TOKENS[mode];
    await mockSearch(page);
    await openDoc(page, "/markdown", mode);
    await page.waitForLoadState("networkidle");
    const style = (selector: string, props: string[]) =>
      page
        .locator(selector)
        .evaluateAll(
          (els, p) => els.map((el) => Object.fromEntries(p.map((k) => [k, getComputedStyle(el).getPropertyValue(k)]))),
          props,
        );

    // LEFT-01, LEFT-02: breadcrumbs, category rows and the back to top button.
    for (const selector of [".breadcrumbs__link", ".theme-doc-sidebar-container .menu__list-item-collapsible"]) {
      const found = await style(selector, ["border-radius"]);
      expect(found.length, selector).toBeGreaterThan(0);
      for (const f of found) expect(f["border-radius"], `LEFT-01 ${selector}`).toBe("0px");
    }
    await page.mouse.move(640, 400);
    await page.mouse.wheel(0, 3000);
    await page.waitForTimeout(300);
    await page.mouse.wheel(0, -400);
    const top = page.locator(".theme-back-to-top-button");
    await expect(top).toBeVisible();
    expect(await style(".theme-back-to-top-button", ["border-radius", "box-shadow"]), "LEFT-01, LEFT-02").toEqual([
      { "border-radius": "0px", "box-shadow": "none" },
    ]);
    await page.mouse.wheel(0, -4000);

    // LEFT-05, LEFT-06: the rule and the inline code.
    expect(await style("article hr", ["background-color"]), "LEFT-05").toEqual([{ "background-color": rgb(c.rule) }]);
    const inline = await style("article p code", ["background-color"]);
    expect(inline.length).toBeGreaterThan(0);
    for (const i of inline) expect(i["background-color"], "LEFT-06").toBe(rgb(c.panel));

    // LEFT-07: the border of the pagination cards.
    const cards = await style(".pagination-nav__link", [
      "border-top-width",
      "border-top-style",
      "border-top-color",
      "border-left-width",
      "border-left-color",
      "border-right-color",
      "border-bottom-color",
    ]);
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) {
      expect(card["border-top-width"], "LEFT-07").toBe("1px");
      expect(card["border-left-width"], "LEFT-07").toBe("1px");
      expect(card["border-top-style"], "LEFT-07").toBe("solid");
      for (const side of ["top", "left", "right", "bottom"]) {
        expect(card[`border-${side}-color`], `LEFT-07 ${side}`).toBe(rgb(c.ink));
      }
    }

    // LEFT-04: the modal, opened with the button and again with Ctrl+K, shows results painted with tokens only.
    for (const open of ["button", "Ctrl+K"]) {
      if (open === "button") await page.locator(".navbar .DocSearch-Button").click();
      else await page.keyboard.press("Control+k");
      await page.locator(".DocSearch-Modal").waitFor();
      await page.keyboard.type("mark");
      await expect(page.locator(".DocSearch-Hit")).toHaveCount(3);
      const modal = await page.locator(".DocSearch-Container").evaluate((root) => {
        const out: { path: string; prop: string; value: string }[] = [];
        const els = [root, ...root.querySelectorAll("*")].filter((el) => !el.closest(".DocSearch-Logo"));
        for (const el of els) {
          const cs = getComputedStyle(el);
          const path = [el.tagName.toLowerCase(), ...el.classList].join(".");
          for (const prop of ["color", "background-color"]) out.push({ path, prop, value: cs.getPropertyValue(prop) });
          for (const side of ["top", "right", "bottom", "left"]) {
            if (parseFloat(cs.getPropertyValue(`border-${side}-width`)) > 0) {
              out.push({ path, prop: `border-${side}-color`, value: cs.getPropertyValue(`border-${side}-color`) });
            }
          }
        }
        const radii = [".DocSearch-Modal", ".DocSearch-Form", ".DocSearch-Hit a"].map((s) =>
          [...root.querySelectorAll(s)].map((el) => [
            s,
            getComputedStyle(el).borderRadius,
            getComputedStyle(el).boxShadow,
          ]),
        );
        return { out, radii: radii.flat() };
      });
      const off = modal.out.filter((o) => !isToken(o.value, mode)).map((o) => `${o.path} ${o.prop} ${o.value}`);
      expect(off, `LEFT-04 colors of the modal opened with ${open}`).toEqual([]);
      expect(modal.radii.length).toBeGreaterThanOrEqual(5);
      for (const [selector, radius, shadow] of modal.radii) {
        expect(radius, `LEFT-01 ${selector}`).toBe("0px");
        expect(shadow, `LEFT-02 ${selector}`).toBe("none");
      }
      await page.keyboard.press("Escape");
      await expect(page.locator(".DocSearch-Modal")).toHaveCount(0);
    }
  });
}

test("TOUCH bridge: on a 390 px phone the controls are 44 x 44 px and the chips and breadcrumbs 24 x 24 px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openDoc(page, "/markdown", "light");
  await page.waitForLoadState("networkidle");
  const size = async (selector: string) => {
    const boxes = await page.locator(selector).evaluateAll((els) =>
      els
        .map((el) => el.getBoundingClientRect())
        .filter((r) => r.width > 0 && r.height > 0)
        .map((r) => ({ width: r.width, height: r.height })),
    );
    expect(boxes.length, selector).toBeGreaterThan(0);
    return boxes;
  };
  const atLeast = async (selector: string, min: number, id: string) => {
    for (const box of await size(selector)) {
      expect(box.width, `${id} ${selector} width`).toBeGreaterThanOrEqual(min);
      expect(box.height, `${id} ${selector} height`).toBeGreaterThanOrEqual(min);
    }
  };

  // TOUCH-01, TOUCH-02: the menu button and the search button of the navbar.
  await atLeast(".navbar__toggle", 44, "TOUCH-01");
  await atLeast(".navbar .DocSearch-Button", 44, "TOUCH-02");

  // TOUCH-05, TOUCH-06: the tag chips and the breadcrumb links.
  await atLeast('a[rel="tag"]', 24, "TOUCH-05");
  await atLeast(".breadcrumbs__link", 24, "TOUCH-06");

  // TOUCH-03, TOUCH-04: with the menu open, its close button and the color mode button.
  await page.locator(".navbar__toggle").click();
  await expect(page.locator(".navbar-sidebar--show")).toBeVisible();
  await atLeast(".navbar-sidebar__close", 44, "TOUCH-03");
  await atLeast(".navbar-sidebar__brand button[class*=toggleButton]", 44, "TOUCH-04");
});

for (const mode of MODES) {
  test(`BRIDGE-03 tag chips are ink rectangles with the count inside (${mode})`, async ({ page }) => {
    const c = TOKENS[mode];
    for (const path of ["/markdown", "/tags"]) {
      await openDoc(page, path, mode);
      const chips = await page.locator('a[rel="tag"]').evaluateAll((els) =>
        els.map((el) => {
          const cs = getComputedStyle(el);
          const count = el.querySelector("span");
          const box = el.getBoundingClientRect();
          const inner = count?.getBoundingClientRect();
          return {
            text: cs.color,
            border: ["top", "right", "bottom", "left"].map((s) => [
              cs.getPropertyValue(`border-${s}-width`),
              cs.getPropertyValue(`border-${s}-style`),
              cs.getPropertyValue(`border-${s}-color`),
            ]),
            background: cs.backgroundColor,
            radius: cs.borderRadius,
            before: [getComputedStyle(el, "::before").content, getComputedStyle(el, "::after").content],
            count: count
              ? {
                  family: getComputedStyle(count).fontFamily,
                  inside:
                    inner!.left >= box.left &&
                    inner!.right <= box.right &&
                    inner!.top >= box.top &&
                    inner!.bottom <= box.bottom,
                }
              : null,
          };
        }),
      );
      expect(chips.length, path).toBeGreaterThan(0);
      for (const chip of chips) {
        expect(chip.text, `TAGS-04 text on ${path}`).toBe(rgb(c.ink));
        expect(chip.border, `TAGS-04 border on ${path}`).toEqual(Array(4).fill(["1px", "solid", rgb(c.ink)]));
        expect(chip.background, `TAGS-04 background on ${path}`).toBe("rgba(0, 0, 0, 0)");
        expect(chip.radius, `TAGS-05 rectangle on ${path}`).toBe("0px");
        for (const content of chip.before)
          expect(["none", "normal"], `TAGS-05 ::before and ::after on ${path}`).toContain(content);
      }
      if (path === "/tags") {
        const counted = chips.filter((chip) => chip.count);
        expect(counted.length, "the index shows a count in each chip").toBe(chips.length);
        for (const chip of counted) {
          expect(chip.count!.inside, "the count is inside the chip").toBe(true);
          expect(chip.count!.family, "the count is in mono").toMatch(/^"?IBM Plex Mono"?/);
        }
      }
    }
  });
}

for (const mode of MODES) {
  test(`BRIDGE-05 code and Mermaid diagrams use the token palette (${mode})`, async ({ page }) => {
    const c = TOKENS[mode];
    await openDoc(page, "/markdown", mode);
    await page.locator(".docusaurus-mermaid-container svg").first().waitFor();

    // CODE-01 to CODE-04: ground in panel, comments in ink-muted, keywords in signal, the rest in ink.
    const code = await page
      .locator(".theme-code-block")
      .first()
      .evaluate((block) => {
        const color = (el: Element) => getComputedStyle(el).color;
        const tokens = [...block.querySelectorAll<HTMLElement>(".token")].map((el) => ({
          kinds: [...el.classList].filter((k) => k !== "token").join(" "),
          color: color(el),
        }));
        return {
          pre: [getComputedStyle(block.querySelector("pre")!).backgroundColor, color(block.querySelector("pre")!)],
          block: getComputedStyle(block).backgroundColor,
          lines: [...block.querySelectorAll(".token-line")].map(color),
          tokens,
        };
      });
    expect(code.pre[0], "CODE-01 pre").toBe(rgb(c.panel));
    expect(code.block, "CODE-01 block").toBe(rgb(c.panel));
    expect(code.pre[1], "CODE-04 pre").toBe(rgb(c.ink));
    for (const line of code.lines) expect(line, "CODE-04 line").toBe(rgb(c.ink));
    const kinds = new Set(code.tokens.flatMap((t) => t.kinds.split(" ")));
    for (const kind of ["comment", "keyword", "function", "punctuation", "operator", "builtin", "plain"]) {
      expect(kinds, `the sample has a ${kind} token`).toContain(kind);
    }
    for (const t of code.tokens) {
      const want = t.kinds.includes("comment") ? c.inkMuted : t.kinds.includes("keyword") ? c.signal : c.ink;
      expect(t.color, `CODE-02, CODE-03, CODE-04 token ${t.kinds}`).toBe(rgb(want));
    }

    // DIAG-01 to DIAG-03: font, token-only paints, nodes and groups.
    const diagram = await page
      .locator(".docusaurus-mermaid-container svg")
      .first()
      .evaluate((svg) => {
        const paints: { path: string; prop: string; value: string }[] = [];
        const fonts: string[] = [getComputedStyle(svg).fontFamily];
        const shapes = "rect, circle, ellipse, polygon, path, line, polyline";
        for (const el of svg.querySelectorAll(`${shapes}, text, tspan, foreignObject *`)) {
          const cs = getComputedStyle(el);
          const path = [el.tagName.toLowerCase(), ...el.classList].join(".");
          if (el.closest("foreignObject")) {
            paints.push(
              { path, prop: "color", value: cs.color },
              { path, prop: "background-color", value: cs.backgroundColor },
            );
            fonts.push(cs.fontFamily);
          } else {
            paints.push({ path, prop: "fill", value: cs.fill }, { path, prop: "stroke", value: cs.stroke });
            if (el.matches("text, tspan")) fonts.push(cs.fontFamily);
          }
        }
        const group = (selector: string) =>
          [...svg.querySelectorAll(selector)].map((el) => [getComputedStyle(el).fill, getComputedStyle(el).stroke]);
        return {
          paints,
          fonts,
          labels: [...svg.querySelectorAll(".nodeLabel, .edgeLabel")].map((el) => getComputedStyle(el).fontFamily),
          nodes: group(
            ".node:not(.ship) > rect, .node:not(.ship) > polygon, .node:not(.ship) > path, .node:not(.ship) > circle",
          ),
          classed: group(".node.ship > rect, .node.ship > polygon, .node.ship > path, .node.ship > circle"),
          clusters: group(".cluster > rect"),
        };
      });
    for (const f of [...diagram.fonts, ...diagram.labels]) expect(f, "DIAG-01").toMatch(/^"?IBM Plex Sans"?,/);
    expect(diagram.labels.length).toBeGreaterThan(0);
    const offPalette = diagram.paints
      .filter((p) => p.value !== "none" && !isToken(p.value, mode))
      .map((p) => `${p.path} ${p.prop} ${p.value}`);
    expect(offPalette, "DIAG-02").toEqual([]);
    // A timeline diagram draws its own boxes and lines; they take the tokens too. Opened in dark, this fixture
    // leaves the second diagram unrendered, with or without the package, so the timeline is read in light only.
    if (mode === "light") {
      await page.locator(".docusaurus-mermaid-container svg").nth(1).waitFor({ state: "attached" });
      const timeline = await page
        .locator(".docusaurus-mermaid-container svg")
        .nth(1)
        .evaluate((svg) =>
          Array.from(svg.querySelectorAll("rect, circle, ellipse, polygon, path, line, polyline, text")).flatMap(
            (el) => {
              const cs = getComputedStyle(el);
              const path = [el.tagName.toLowerCase(), ...Array.from(el.classList)].join(".");
              // A line has no inside, so only its stroke paints.
              const fill = el.tagName.toLowerCase() === "line" ? [] : [{ path, prop: "fill", value: cs.fill }];
              return [...fill, { path, prop: "stroke", value: cs.stroke }];
            },
          ),
        );
      expect(timeline.length).toBeGreaterThan(0);
      const offTimeline = timeline
        .filter((p) => p.value !== "none" && !isToken(p.value, mode))
        .map((p) => `${p.path} ${p.prop} ${p.value}`);
      expect(offTimeline, "DIAG-02 timeline").toEqual([]);
    }
    // A site paints a class of its own with a more specific rule that has !important too (fixtures/docusaurus custom.css).
    expect(diagram.classed, "the classed node").toEqual([[rgb(c.signalTint), rgb(c.signal)]]);
    expect(diagram.nodes.length).toBeGreaterThan(0);
    expect(diagram.clusters.length).toBeGreaterThan(0);
    for (const [fill, stroke] of [...diagram.nodes, ...diagram.clusters]) {
      expect([rgb(c.paper), rgb(c.panel)], "DIAG-03 fill").toContain(fill);
      expect(stroke, "DIAG-03 stroke").toBe(rgb(c.ink));
    }
  });
}

for (const mode of MODES) {
  test(`BRIDGE-04 the chrome of the Docusaurus theme is square and flat, with the Dossier focus ring and labels (${mode})`, async ({
    page,
  }) => {
    const c = TOKENS[mode];
    const surfaces = [c.paper, c.panel, c.inverse].map(rgb);
    const values = (selector: string, prop: string, pseudo?: string) =>
      page.evaluate(
        ([s, p, ps]) => [
          ...new Set(
            [...document.querySelectorAll(s)].map((el) => getComputedStyle(el, ps || null).getPropertyValue(p)),
          ),
        ],
        [selector, prop, pseudo ?? ""] as const,
      );

    // CHROME-01, CHROME-02: square corners and no shadow.
    await openDoc(page, "/markdown", mode);
    await page.waitForLoadState("networkidle");
    for (const selector of [
      "button",
      ".DocSearch-Button",
      ".theme-admonition",
      ".theme-doc-sidebar-container .menu__link",
      ".pagination-nav__link",
      'a[rel="tag"]',
      ".theme-code-block",
      ".theme-code-block pre",
      "p code",
    ]) {
      expect(await values(selector, "border-radius"), `CHROME-01 ${selector}`).toEqual(["0px"]);
    }
    for (const selector of [".navbar", ".theme-admonition", ".pagination-nav__link", ".theme-code-block"]) {
      expect(await values(selector, "box-shadow"), `CHROME-02 ${selector}`).toEqual(["none"]);
    }

    // CHROME-03: the surfaces of the navbar, the side menu and the pagination cards.
    for (const selector of [".navbar", ".theme-doc-sidebar-container", ".pagination-nav__link"]) {
      const found = await values(selector, "background-color");
      expect(found.length, selector).toBeGreaterThan(0);
      for (const bg of found) expect(surfaces, `CHROME-03 ${selector}`).toContain(bg);
    }

    // CHROME-04, CHROME-05: the keyboard focus ring in a link of the text, the buttons and a menu item; a click draws none.
    const ring = `${rgb(c.paper)} 0px 0px 0px 2px, ${rgb(c.signal)} 0px 0px 0px 4px`;
    const toggle = page.getByRole("button", { name: /switch between dark and light mode/i });
    const targets = {
      link: page.locator(".markdown :is(p, li) a[href]:not(.hash-link)").first(),
      button: toggle,
      search: page.locator(".navbar .DocSearch-Button"),
      menu: page.locator(".theme-doc-sidebar-container .menu__link").first(),
    };
    for (const [name, target] of Object.entries(targets)) {
      for (let i = 0; i < 80 && !(await target.evaluate((el) => el === document.activeElement)); i++) {
        await page.keyboard.press("Tab");
      }
      // DocSearch's button transitions all properties, so the ring is read when the transition has ended.
      await expect
        .poll(() => target.evaluate((el) => getComputedStyle(el).boxShadow), { message: `CHROME-04/05 ${name}` })
        .toBe(ring);
    }

    // CHROME-06, CHROME-07: chips and table heads as labels, with the text of the DOM as written.
    const label = (selector: string) =>
      page
        .locator(selector)
        .first()
        .evaluate((el) => {
          const cs = getComputedStyle(el);
          return [cs.fontFamily.split(",")[0].replace(/["']/g, "").trim(), cs.textTransform, el.textContent];
        });
    expect(await label('a[rel="tag"]')).toEqual(["IBM Plex Mono", "uppercase", "markdown"]);
    expect(await label(".markdown th")).toEqual(["IBM Plex Mono", "uppercase", "Left"]);

    // CHROME-08, CHROME-09: admonitions in tokens only, danger in contrast-error.
    const admonition = (type: string) =>
      page
        .locator(`.theme-admonition-${type}`)
        .first()
        .evaluate((el) => {
          const cs = getComputedStyle(el);
          return {
            border: [...new Set([cs.borderTopColor, cs.borderRightColor, cs.borderBottomColor, cs.borderLeftColor])],
            title: getComputedStyle(el.firstElementChild!).color,
            background: cs.backgroundColor,
          };
        });
    for (const type of ["note", "tip", "info", "warning"]) {
      const a = await admonition(type);
      for (const border of a.border) expect([c.ink, c.signal].map(rgb), `CHROME-08 ${type} border`).toContain(border);
      expect([c.ink, c.signal].map(rgb), `CHROME-08 ${type} title`).toContain(a.title);
      expect([c.paper, c.panel, c.signalTint].map(rgb), `CHROME-08 ${type} background`).toContain(a.background);
    }
    expect(await admonition("danger"), "CHROME-09").toMatchObject({
      border: [rgb(c.contrastError)],
      title: rgb(c.contrastError),
    });

    // CHROME-12: every background in the navbar and the side menu, at rest and under the pointer, is a surface token;
    // only the active link of the menu may be signal-tint.
    const offSurface = () =>
      page.evaluate(
        ([want, tint]) => {
          const transparent = (v: string) => v === "transparent" || /^rgba\(.*,\s*0\)$/.test(v);
          const found: string[] = [];
          const scope = ".navbar, .navbar *, .theme-doc-sidebar-container, .theme-doc-sidebar-container *";
          for (const el of document.querySelectorAll(scope)) {
            if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
            const active = el.matches(".theme-doc-sidebar-container .menu__link--active");
            for (const pseudo of [null, "::before", "::after"]) {
              const bg = getComputedStyle(el, pseudo).backgroundColor;
              if (transparent(bg) || want.includes(bg) || (active && !pseudo && bg === tint)) continue;
              found.push(`${[el.tagName.toLowerCase(), ...el.classList].join(".")}${pseudo ?? ""} ${bg}`);
            }
          }
          return found;
        },
        [surfaces, rgb(c.signalTint)] as const,
      );
    await page.mouse.move(0, 700);
    expect(await offSurface(), "CHROME-12 at rest").toEqual([]);
    for (const [name, target] of [
      ["menu link", page.locator(".theme-doc-sidebar-container .menu__link:not(.menu__link--active)").first()],
      ["color mode", toggle],
    ] as const) {
      await target.hover();
      await target.evaluate((el) => Promise.all(el.getAnimations().map((a) => a.finished.catch(() => {}))));
      expect(await offSurface(), `CHROME-12 hover ${name}`).toEqual([]);
    }

    // A click on the color mode button draws no ring. It comes last, because the click changes the mode.
    await page.locator(".markdown h1").click();
    await toggle.click();
    await expect(toggle).toBeFocused();
    expect(await toggle.evaluate((el) => getComputedStyle(el).boxShadow), "a click draws no ring").toBe("none");
  });
}

for (const mode of MODES) {
  test(`FN Markdown footnotes take the look of Footnotes (${mode})`, async ({ page }) => {
    const c = TOKENS[mode];
    await openDoc(page, "/notes", mode);
    const fn = await page.locator("section[data-footnotes]").evaluate((section) => {
      const ol = section.querySelector(":scope > ol")!;
      const li = ol.querySelector(":scope > li")!;
      const num = getComputedStyle(li, "::before");
      const rule = getComputedStyle(ol, "::before");
      const nested = [...li.querySelectorAll("p, li")].map((el) => {
        const cs = getComputedStyle(el);
        return [cs.color, cs.fontSize];
      });
      const back = section.querySelector("a.data-footnote-backref");
      const mark = getComputedStyle(document.querySelector("sup > a[data-footnote-ref]")!);
      return {
        numContent: num.content,
        numColor: num.color,
        numFont: num.fontFamily,
        textColor: getComputedStyle(li).color,
        textSize: getComputedStyle(li).fontSize,
        nested,
        maxWidth: getComputedStyle(ol).maxWidth,
        rule: [rule.borderTopWidth, rule.borderTopStyle, rule.borderTopColor, rule.width],
        backVisible: back ? back.getClientRects().length > 0 : false,
        mark: [mark.fontFamily, mark.color, mark.textDecorationLine],
      };
    });
    // FN-01: the number in signal mono, two digits.
    expect(fn.numContent).toContain("decimal-leading-zero");
    expect(fn.numColor).toBe(rgb(c.signal));
    expect(fn.numFont).toMatch(/IBM Plex Mono/);
    // FN-02: the text in ink-muted at caption size, at most 560 px wide.
    expect(fn.textColor).toBe(rgb(c.inkMuted));
    expect(fn.textSize).toBe("12px");
    expect(fn.maxWidth).toBe("560px");
    // FN-08: nested lists keep the size and color of the note.
    expect(fn.nested.length).toBeGreaterThan(2);
    for (const [color, size] of fn.nested) expect([color, size]).toEqual([rgb(c.inkMuted), "12px"]);
    // FN-03: a short 1 px ink rule above the notes.
    expect(fn.rule).toEqual(["1px", "solid", rgb(c.rule), "96px"]);
    // FN-04: no back arrow.
    expect(fn.backVisible).toBe(false);
    // FN-05: the mark in the text in signal mono, without underline.
    expect(fn.mark[0]).toMatch(/IBM Plex Mono/);
    expect(fn.mark[1]).toBe(rgb(c.signal));
    expect(fn.mark[2]).toBe("none");
  });
}
