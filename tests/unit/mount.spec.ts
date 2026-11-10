import { expect, test } from "@playwright/test";
import { load, mount } from "./mount";

for (const [label, react19, major] of [
  ["React 18", false, "18."],
  ["React 19", true, "19."],
] as const) {
  test(`API-01 the browser harness mounts Tag with ${label}`, async ({ page }) => {
    await load(page, react19);
    const r = await mount(page, "Tag", { children: "Live" });
    expect(r.version.startsWith(major), r.version).toBe(true);
    expect(r.text).toBe("Live");
    await expect(page.locator(`#${r.id} > span.ds-tag`)).toHaveText("Live");
  });
}
