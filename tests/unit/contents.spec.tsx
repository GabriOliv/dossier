import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { renderToStaticMarkup } from "react-dom/server";
import { Contents, type ContentsItem } from "../../src/components/Contents";

const styles = readFileSync("dist/styles.css", "utf8");

/** The contents in a page that has only the library's CSS, at `width` px. */
async function open(page: Page, items: ContentsItem[], width: number) {
  await page.setViewportSize({ width, height: 800 });
  await page.setContent(`<style>${styles}</style><body>${renderToStaticMarkup(<Contents items={items} />)}</body>`);
}

test("BRIDGE-06 an item with href renders its title as a link to href, in the typography of the title", async ({
  page,
}) => {
  const html = renderToStaticMarkup(
    <Contents
      items={[
        { title: "Intro", description: "First part.", page: 3, href: "/intro" },
        { title: "Body", href: "https://example.com/b?x=1&y=2" },
        { title: "Plain" },
      ]}
    />,
  );
  expect(html).toContain('<a href="/intro" class="ds-link ds-t-title ds-toc-title">Intro</a>');
  expect(html).toContain(
    '<a href="https://example.com/b?x=1&amp;y=2" class="ds-link ds-t-title ds-toc-title">Body</a>',
  );
  expect((html.match(/<a /g) ?? []).length).toBe(2);

  await open(page, [{ title: "Intro", href: "#intro" }, { title: "Plain" }], 1280);
  const link = page.getByRole("link", { name: "Intro" });
  await expect(link).toHaveAttribute("href", "#intro");
  const look = (el: Element) => {
    const cs = getComputedStyle(el);
    return [cs.fontFamily, cs.fontSize, cs.fontWeight, cs.textTransform];
  };
  expect(await link.evaluate(look)).toEqual(await page.locator("span.ds-toc-title").evaluate(look));
  expect(await link.evaluate((el) => getComputedStyle(el).textDecorationLine)).toBe("underline");
  await link.click();
  expect(page.url()).toContain("#intro");
});

test("BRIDGE-06 under 640 px an item is the index and one column: title, description and page stacked", async ({
  page,
}) => {
  const items: ContentsItem[] = [
    {
      title: "Configuration management and release engineering",
      description: "How a change goes from a branch to production, and who approves each step of the way.",
      page: 12,
      href: "#one",
    },
    { title: "Short" },
  ];
  const tracks = (width: number) =>
    open(page, items, width).then(() =>
      page
        .locator(".ds-toc-item")
        .first()
        .evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length),
    );
  expect(await tracks(640), "640 px keeps the four columns").toBe(4);
  expect(await tracks(1280), "1280 px keeps the four columns").toBe(4);
  expect(await tracks(639), "639 px has the index and one column").toBe(2);

  await open(page, items, 390);
  const box = (selector: string) =>
    page
      .locator(selector)
      .first()
      .evaluate((el) => el.getBoundingClientRect().toJSON());
  const [index, title, desc, pageRef] = await Promise.all([
    box(".ds-toc-index"),
    box(".ds-toc-title"),
    box(".ds-toc-desc"),
    box(".ds-toc-page"),
  ]);
  expect(index.right, "the index is left of the title").toBeLessThanOrEqual(title.left);
  expect(desc.left, "the description lines up with the title").toBeCloseTo(title.left, 0);
  expect(pageRef.left, "the page lines up with the title").toBeCloseTo(title.left, 0);
  expect(title.bottom, "the title is above the description").toBeLessThanOrEqual(desc.top);
  expect(desc.bottom, "the description is above the page").toBeLessThanOrEqual(pageRef.top);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, "no horizontal overflow at 390 px").toBeLessThanOrEqual(0);
  // An item without a description or a page leaves no empty row.
  const short = await page
    .locator(".ds-toc-item")
    .nth(1)
    .evaluate((el) => el.getBoundingClientRect().height);
  const long = await page
    .locator(".ds-toc-item")
    .first()
    .evaluate((el) => el.getBoundingClientRect().height);
  expect(short).toBeLessThan(long / 2);
});

test("BRIDGE-07 an item without href renders the title as text, with the markup of version 1.0.0", () => {
  expect(
    renderToStaticMarkup(<Contents items={[{ title: "One", description: "First.", page: 3, active: true }]} />),
  ).toBe(
    '<ol class="ds-contents"><li class="ds-toc-item ds-toc-on"><span class="ds-t-figure ds-toc-index">01</span><span class="ds-t-title ds-toc-title">One</span><span class="ds-t-body ds-toc-desc">First.</span><span class="ds-t-label ds-toc-page">P. 3</span></li></ol>',
  );
  // An empty href is no link, and the markup is the same as without the field.
  const plain = renderToStaticMarkup(<Contents items={[{ title: "One" }, { title: "Two" }]} />);
  expect(renderToStaticMarkup(<Contents items={[{ title: "One", href: "" }, { title: "Two" }]} />)).toBe(plain);
  expect(plain).not.toContain("<a");
  // A list that mixes both keeps the plain item as in 1.0.0.
  const mixed = renderToStaticMarkup(<Contents items={[{ title: "One", href: "/one" }, { title: "Two" }]} />);
  expect(mixed).toContain(
    '<li class="ds-toc-item"><span class="ds-t-figure ds-toc-index">02</span><span class="ds-t-title ds-toc-title">Two</span><span class="ds-t-body ds-toc-desc"></span><span class="ds-t-label ds-toc-page"></span></li>',
  );
});
