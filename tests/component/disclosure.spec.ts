import { devices, expect, test } from "@playwright/test";
import { computed, section, openStory, THEMES } from "../support/story";

// Computed styles and native behaviour of Tabs and Accordion in each theme, measured on their stories.

for (const theme of THEMES) {
  test(`TAB-09 the selected tab has a signal bar of stroke-heavy under it and the others are ink-muted, ${theme}`, async ({
    page,
  }) => {
    await openStory(page, "Tabs", theme);
    // The first tabs of the story: three tabs, the first selected.
    const tablist = section(page, "Tabs").getByRole("tablist").first();
    const s = await tablist.locator("[role=tab]").evaluateAll((all) =>
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
          // computed widths are serialized to four decimals: 91.7812px for a 91.78125 px tab
          width: Math.abs(parseFloat(bar.width) - own.width) < 0.001,
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
    expect(await tablist.evaluate((l) => getComputedStyle(l).borderBottomWidth)).toBe(hair);
  });

  test(`TAB-10 at the gallery-phone width tabs that do not fit scroll inside the tablist and the page has no horizontal scroll, ${theme}`, async ({
    page,
  }) => {
    await page.setViewportSize(devices["Pixel 7"].viewport);
    await openStory(page, "Tabs", theme);
    // The tabs wider than the list: seven tabs that do not fit a phone.
    const list = section(page, "Tabs").getByRole("tablist", { name: "Report sections" });
    const s = await list.evaluate((l) => {
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
    const last = await list.evaluate((l) => {
      const tab = l.lastElementChild!.getBoundingClientRect();
      const box = l.getBoundingClientRect();
      return tab.right <= box.right + 0.5 && tab.left >= box.left;
    });
    expect(last).toBe(true);
  });

  test(`ACC-07 each summary shows a CSS square with + when closed and − when open, and no native triangle, ${theme}`, async ({
    page,
  }) => {
    await openStory(page, "Accordion", theme);
    // The first accordion of the story: three items, the second one open.
    const summaries = section(page, "Accordion").locator(".ds-accordion").first().locator("summary");
    const marks = await summaries.evaluateAll((all) =>
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
    expect(marks.map((m) => m.content)).toEqual(['"+"', '"−"', '"+"']);
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
    await summaries.filter({ hasText: "How do I ship?" }).click();
    await summaries.filter({ hasText: "Can I return it?" }).click();
    expect(await summaries.evaluateAll((all) => all.map((s) => getComputedStyle(s, "::before").content))).toEqual([
      '"−"',
      '"+"',
      '"+"',
    ]);
  });
}

test("ACC-06 the browser opens a closed item when find in page reaches text inside it", async ({ page }) => {
  // A link to a text fragment runs the browser's find in page on the new document; it needs the click's user activation.
  const ship = () => section(page, "Accordion").locator("details", { hasText: "How do I ship?" });
  const isOpen = () => ship().evaluate((d) => (d as HTMLDetailsElement).open);
  await openStory(page, "Accordion", "paper");
  expect(await isOpen()).toBe(false);
  await expect(page.getByText("The order leaves in two business days.")).toBeHidden();
  // From another story, a link to the Accordion story with the fragment.
  await openStory(page, "Link", "paper");
  await page.evaluate((href) => {
    const a = document.body.appendChild(document.createElement("a"));
    a.id = "go";
    a.href = href;
    a.textContent = "Accordion";
  }, `iframe.html?id=overview--accordion&viewMode=story&globals=theme:paper#:~:text=two%20business%20days`);
  await page.click("#go");
  await page.waitForURL("**/iframe.html?id=overview--accordion*#:~:text=*");
  await expect.poll(isOpen).toBe(true);
  await expect(page.getByText("The order leaves in two business days.")).toBeVisible();
});
