import { expect, test, type Locator, type Page } from "@playwright/test";
import { computed, openStory, section, styleOf, tabTo, THEMES } from "../support/story";

// Computed styles of the action components in each theme, measured on the Button and Link stories.
const MIX = (accent: string) => `color-mix(in srgb, var(${accent}) 85%, var(--ds-ink))`;

/** The first Button of the Button story called `name`. */
const button = (page: Page, name: string): Locator =>
  section(page, "Button").getByRole("button", { name, exact: true }).first();

for (const theme of THEMES) {
  test(`BTN-02 a solid Button is filled with signal and its text is on-signal, and hover and press mix in ink, ${theme}`, async ({
    page,
  }) => {
    await openStory(page, "Button", theme);
    const solid = button(page, "Approve");
    expect(await styleOf(solid, "background-color")).toBe(await computed(page, "background-color", "var(--ds-signal)"));
    expect(await styleOf(solid, "color")).toBe(await computed(page, "color", "var(--ds-on-signal)"));
    const mixed = await computed(page, "background-color", MIX("--ds-signal"));
    expect(mixed).not.toBe(await computed(page, "background-color", "var(--ds-signal)"));
    await solid.hover();
    expect(await styleOf(solid, "background-color")).toBe(mixed);
    expect(await styleOf(solid, "border-top-color")).toBe(mixed);
    await page.mouse.move(0, 0);
    expect(await styleOf(solid, "background-color")).not.toBe(mixed);
    // Pressed with the keyboard, the pointer elsewhere: Space held down on the focused button.
    await tabTo(page, solid);
    await page.keyboard.down("Space");
    expect(await styleOf(solid, "background-color")).toBe(mixed);
    await page.keyboard.up("Space");
  });

  test(`BTN-03 a text Button has no visible border and signal text, and the panel shows on hover, ${theme}`, async ({
    page,
  }) => {
    await openStory(page, "Button", theme);
    const text = button(page, "Cancel");
    expect(await styleOf(text, "color")).toBe(await computed(page, "color", "var(--ds-signal)"));
    expect(await styleOf(text, "border-top-color")).toBe("rgba(0, 0, 0, 0)");
    expect(await styleOf(text, "background-color")).toBe("rgba(0, 0, 0, 0)");
    await text.hover();
    expect(await styleOf(text, "background-color")).toBe(await computed(page, "background-color", "var(--ds-panel)"));
    await page.mouse.move(0, 0);
    await tabTo(page, text);
    await page.keyboard.down("Space");
    expect(await styleOf(text, "background-color")).toBe(await computed(page, "background-color", "var(--ds-panel)"));
    await page.keyboard.up("Space");
  });

  test(`BTN-04 an outline Button is ink on a square hair border; danger turns every variant to contrast-error, ${theme}`, async ({
    page,
  }) => {
    await openStory(page, "Button", theme);
    const outline = button(page, "Review");
    const ink = await computed(page, "color", "var(--ds-ink)");
    const error = await computed(page, "color", "var(--ds-contrast-error)");
    expect(error).not.toBe(ink);
    expect(await styleOf(outline, "color")).toBe(ink);
    expect(await styleOf(outline, "border-top-color")).toBe(ink);
    expect(await styleOf(outline, "border-top-width")).toBe("1px");
    expect(await styleOf(outline, "border-top-left-radius")).toBe("0px");
    expect(await styleOf(outline, "background-color")).toBe("rgba(0, 0, 0, 0)");
    await outline.hover();
    expect(await styleOf(outline, "background-color")).toBe(
      await computed(page, "background-color", "var(--ds-panel)"),
    );
    await page.mouse.move(0, 0);
    await tabTo(page, outline);
    await page.keyboard.down("Space");
    expect(await styleOf(outline, "background-color")).toBe(
      await computed(page, "background-color", "var(--ds-panel)"),
    );
    await page.keyboard.up("Space");

    const danger = button(page, "Reject");
    expect(await styleOf(danger, "color")).toBe(error);
    expect(await styleOf(danger, "border-top-color")).toBe(error);

    expect(await styleOf(button(page, "Discard"), "color")).toBe(error);

    const solid = button(page, "Delete");
    expect(await styleOf(solid, "background-color")).toBe(error);
    expect(await styleOf(solid, "border-top-color")).toBe(error);
    expect(await styleOf(solid, "color")).toBe(await computed(page, "color", "var(--ds-on-signal)"));
    const mixed = await computed(page, "background-color", MIX("--ds-contrast-error"));
    await solid.hover();
    expect(await styleOf(solid, "background-color")).toBe(mixed);
  });

  test(`BTN-09 a Button focused by keyboard shows the focus ring, in every variant, ${theme}`, async ({ page }) => {
    await openStory(page, "Button", theme);
    for (const [variant, name] of [
      ["outline", "Review"],
      ["solid", "Approve"],
      ["text", "Cancel"],
    ] as const) {
      const target = button(page, name);
      await page.mouse.move(0, 0);
      await target.evaluate((el) => (el as HTMLElement).blur());
      expect(await styleOf(target, "box-shadow"), "before focus").toBe("none");
      await tabTo(page, target);
      expect(await styleOf(target, "box-shadow"), variant).toBe(
        await computed(page, "box-shadow", "var(--ds-focus-ring)"),
      );
      expect(await styleOf(target, "outline-style"), variant).toBe("none");
    }
  });
}

test("BTN-06 a Button with size sm is shorter than the standard one with the same text", async ({ page }) => {
  await openStory(page, "Button", "paper");
  const row = (caption: string) => section(page, "Button").locator(".gal-variant", { hasText: caption });
  const standard = row("variant=").getByRole("button", { name: "Review", exact: true });
  const small = row('size="sm"').getByRole("button", { name: "Review", exact: true });
  const [standardHeight, smallHeight] = [(await standard.boundingBox())!.height, (await small.boundingBox())!.height];
  expect(smallHeight).toBeLessThan(standardHeight);
  expect(smallHeight).toBeGreaterThanOrEqual(24);
  for (const b of [standard, small])
    expect(await styleOf(b, "padding-left")).toBe(await computed(page, "width", "var(--ds-space-4)"));
});

for (const theme of THEMES) {
  // The Link story holds a Link and a plain `<a class="ds-link">` side by side, as a router's link would be.
  const links = (page: Page) => ({
    component: section(page, "Link").getByRole("link", { name: "full documentation" }),
    plain: section(page, "Link").getByRole("link", { name: "changelog" }),
  });

  test(`LNK-02 a Link is signal-coloured and underlined, ${theme}`, async ({ page }) => {
    await openStory(page, "Link", theme);
    // A host's own `a` rule, in a layer below the components, as a reset or Infima would be.
    await page.addStyleTag({ content: "@layer dossier.base { a { color: rgb(255, 0, 0); text-decoration: none; } }" });
    const signal = await computed(page, "color", "var(--ds-signal)");
    expect(signal).not.toBe(await computed(page, "color", "var(--ds-ink)"));
    expect(await styleOf(links(page).component, "color")).toBe(signal);
    expect(await styleOf(links(page).component, "text-decoration-line")).toBe("underline");
  });

  test(`LNK-04 a Link focused by keyboard shows the focus ring and no outline, ${theme}`, async ({ page }) => {
    await openStory(page, "Link", theme);
    const { component } = links(page);
    expect(await styleOf(component, "box-shadow"), "before focus").toBe("none");
    await tabTo(page, component);
    await expect(component).toBeFocused();
    expect(await styleOf(component, "box-shadow")).toBe(await computed(page, "box-shadow", "var(--ds-focus-ring)"));
    expect(await styleOf(component, "outline-style")).toBe("none");
  });

  test(`LNK-03 an a element with class ds-link that is not the Link looks and focuses like the Link, ${theme}`, async ({
    page,
  }) => {
    await openStory(page, "Link", theme);
    const { component, plain } = links(page);
    const read = async (link: Locator) => ({
      color: await styleOf(link, "color"),
      line: await styleOf(link, "text-decoration-line"),
      shadow: await styleOf(link, "box-shadow"),
    });
    await tabTo(page, component);
    const first = await read(component);
    await tabTo(page, plain);
    await expect(plain).toBeFocused();
    const second = await read(plain);
    expect(first.shadow).not.toBe("none");
    expect(second).toEqual(first);
  });
}
