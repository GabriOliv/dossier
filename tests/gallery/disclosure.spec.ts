import { readFileSync } from "node:fs";
import { devices, expect, test, type Page } from "@playwright/test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Accordion } from "../../src/components/Accordion";
import { Tabs } from "../../src/components/Tabs";

// Computed styles and native behaviour of Tabs, Accordion and Pagination in each theme. Each test renders a component
// on a blank page that holds dist/styles.css under the theme.
const THEMES = ["paper", "void", "blueprint"] as const;
const css = readFileSync("dist/styles.css", "utf8");
const doc = (theme: string, markup: string) =>
  // The viewport meta of the gallery, so a phone lays the page out at its own width.
  `<!doctype html><html data-theme="${theme}"><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}</style></head><body>${markup}</body></html>`;

async function open(page: Page, theme: string, markup: string): Promise<void> {
  await page.setContent(doc(theme, markup));
}
const accordion = () =>
  renderToStaticMarkup(
    createElement(Accordion, {
      items: [
        { title: "Envio", content: "O pedido sai em dois dias úteis." },
        { title: "Trocas", content: "Trocas em até trinta dias, com a nota fiscal.", defaultOpen: true },
      ],
    }),
  );

const tabs = (labels: string[]) =>
  renderToStaticMarkup(
    createElement(Tabs, {
      label: "Visões do run",
      tabs: labels.map((label, i) => ({ value: String(i), label, content: `Painel ${label}` })),
    }),
  );
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

for (const theme of THEMES) {
  test(`TAB-09 the selected tab has a signal bar of stroke-heavy under it and the others are ink-muted, ${theme}`, async ({
    page,
  }) => {
    await open(page, theme, tabs(["Resumo", "Checks", "Logs"]));
    const s = await page.$$eval("[role=tab]", (all) =>
      all.map((t) => {
        const bar = getComputedStyle(t, "::after");
        const own = t.getBoundingClientRect();
        return {
          selected: t.getAttribute("aria-selected"),
          color: getComputedStyle(t).color,
          bar: bar.content,
          background: bar.backgroundColor,
          height: bar.height,
          position: bar.position,
          // The bar spans the tab and sits on its bottom edge.
          width: parseFloat(bar.width) === own.width,
          bottom: bar.bottom,
          uppercase: getComputedStyle(t).textTransform,
          font: getComputedStyle(t).fontFamily,
        };
      }),
    );
    const signal = await computed(page, "background-color", "var(--ds-signal)");
    const heavy = await computed(page, "height", "var(--ds-stroke-heavy)");
    const muted = await computed(page, "color", "var(--ds-ink-muted)");
    const ink = await computed(page, "color", "var(--ds-ink)");
    expect(s.map((t) => t.selected)).toEqual(["true", "false", "false"]);
    expect(s[0]).toMatchObject({
      bar: '""',
      background: signal,
      height: heavy,
      position: "absolute",
      width: true,
      bottom: "0px",
      color: ink,
    });
    for (const t of s.slice(1)) {
      expect(t.color).toBe(muted);
      expect(t.bar).toBe("none");
    }
    expect(muted).not.toBe(ink);
    for (const t of s) {
      expect(t.uppercase).toBe("uppercase");
      expect(t.font).toContain("IBM Plex Mono");
    }
    // The tabs sit on a hair line.
    const hair = await computed(page, "width", "var(--ds-stroke-hair)");
    expect(await page.$eval("[role=tablist]", (l) => getComputedStyle(l).borderBottomWidth)).toBe(hair);
  });

  test(`TAB-10 at the gallery-phone width tabs that do not fit scroll inside the tablist and the page has no horizontal scroll, ${theme}`, async ({
    page,
  }) => {
    await page.setViewportSize(devices["Pixel 7"].viewport);
    await open(page, theme, tabs(["Resumo do run", "Checks de contrato", "Logs do runner", "Artefatos", "Histórico"]));
    const s = await page.$eval("[role=tablist]", (l) => {
      const before = l.scrollLeft;
      l.scrollLeft = 10000;
      const root = document.documentElement;
      return {
        overflowX: getComputedStyle(l).overflowX,
        overflows: l.scrollWidth > l.clientWidth,
        scrolled: l.scrollLeft > before,
        listFits: l.getBoundingClientRect().right <= root.clientWidth,
        pageScroll: root.scrollWidth - root.clientWidth,
        rows: new Set([...l.querySelectorAll("[role=tab]")].map((t) => t.getBoundingClientRect().top)).size,
      };
    });
    expect(s).toEqual({ overflowX: "auto", overflows: true, scrolled: true, listFits: true, pageScroll: 0, rows: 1 });
    // The last tab is reachable: scrolled into the list's box.
    const last = await page.$eval("[role=tablist]", (l) => {
      const tab = l.lastElementChild!.getBoundingClientRect();
      const box = l.getBoundingClientRect();
      return tab.right <= box.right + 0.5 && tab.left >= box.left;
    });
    expect(last).toBe(true);
  });

  test(`ACC-07 each summary shows a CSS square with + when closed and − when open, and no native triangle, ${theme}`, async ({
    page,
  }) => {
    await open(page, theme, accordion());
    const marks = await page.$$eval("summary", (all) =>
      all.map((s) => {
        const own = getComputedStyle(s);
        const mark = getComputedStyle(s, "::before");
        const box = { width: mark.width, height: mark.height };
        return {
          content: mark.content,
          square: box.width === box.height && parseFloat(box.width) > 0,
          border: [mark.borderTopWidth, mark.borderRightWidth, mark.borderBottomWidth, mark.borderLeftWidth],
          borderStyle: mark.borderTopStyle,
          radius: mark.borderTopLeftRadius,
          display: own.display,
          listStyle: own.listStyleType,
          marker: getComputedStyle(s, "::marker").content,
        };
      }),
    );
    expect(marks.map((m) => m.content)).toEqual(['"+"', '"−"']);
    for (const m of marks) {
      expect(m.square).toBe(true);
      expect(m.border).toEqual(["1px", "1px", "1px", "1px"]);
      expect(m.borderStyle).toBe("solid");
      expect(m.radius).toBe("0px");
      // A summary that is no list item, with no list style, draws no triangle.
      expect(m.display).not.toBe("list-item");
      expect(m.listStyle).toBe("none");
    }
    // The click flips the marks.
    await page.locator("summary", { hasText: "Envio" }).click();
    await page.locator("summary", { hasText: "Trocas" }).click();
    expect(await page.$$eval("summary", (all) => all.map((s) => getComputedStyle(s, "::before").content))).toEqual([
      '"−"',
      '"+"',
    ]);
  });
}

test("ACC-06 the browser opens a closed item when find in page reaches text inside it", async ({ page }) => {
  // A link to a text fragment runs the browser's find in page on the new document; it needs the click's user activation.
  await page.route("http://dossier.test/faq", (route) =>
    route.fulfill({ contentType: "text/html; charset=utf-8", body: doc("paper", accordion()) }),
  );
  await page.route("http://dossier.test/start", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<a id="go" href="/faq#:~:text=dois%20dias%20%C3%BAteis">FAQ</a>',
    }),
  );
  const envio = page.locator("details", { hasText: "Envio" });
  const isOpen = () => envio.evaluate((d) => (d as HTMLDetailsElement).open);
  await page.goto("http://dossier.test/faq");
  expect(await isOpen()).toBe(false);
  await expect(page.getByText("O pedido sai em dois dias úteis.")).toBeHidden();
  await page.goto("http://dossier.test/start");
  await page.click("#go");
  await page.waitForURL("**/faq#:~:text=*");
  await expect.poll(isOpen).toBe(true);
  await expect(page.getByText("O pedido sai em dois dias úteis.")).toBeVisible();
});
