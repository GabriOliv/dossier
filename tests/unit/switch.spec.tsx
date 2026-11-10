import { expect, test } from "@playwright/test";
import { Switch, type SwitchProps } from "../../src/components/Switch";
import { formCalls, formRefIs, onEachReact } from "./forms-mount";
import { expectMarkup } from "./markup";
import { render } from "./oracle";

const cases: [string, SwitchProps][] = [
  ["label only", { label: "Notificações" }],
  ["on by default", { label: "Notificações", defaultChecked: true, name: "alerts" }],
  ["hint", { label: "Notificações", hint: "By e-mail." }],
  ["error replaces the hint", { label: "Notificações", hint: "By e-mail.", error: "Turn it on to go on." }],
  ["required", { label: "Notificações", required: true }],
  ["disabled", { label: "Notificações", disabled: true }],
  ["id and className", { label: "Notificações", id: "x", hint: "Hint.", className: "y" }],
];

test("CHK-08 Switch markup matches its snapshot", () => {
  expectMarkup(
    "Switch",
    cases.map(([name, props]) => [name, render(<Switch {...props} />)]),
  );
});

test("CHK-08 Switch renders an input type checkbox with role switch inside a label whose text is the label", async ({
  page,
}) => {
  await onEachReact(page, "Switch", { label: "Notificações" }, [], async (_, root) => {
    const label = root.locator("label");
    await expect(label.locator('input[type="checkbox"][role="switch"]')).toHaveCount(1);
    await expect(label).toHaveText("Notificações");
  });
});

test("CHK-08 Switch gives its input and message the ids, hint, error and required texts Checkbox gives", async ({
  page,
}) => {
  const hint = { label: "Notificações", id: "x", hint: "Soft." };
  await onEachReact(page, "Switch", hint, [], async (_, root) => {
    await expect(root.locator("input")).toHaveAttribute("id", "x");
    await expect(root.locator("input")).toHaveAttribute("aria-describedby", "x-msg");
    await expect(root.locator("#x-msg")).toHaveText("Soft.");
  });
  const error = { label: "Notificações", id: "x", hint: "Soft.", error: "Turn it on." };
  await onEachReact(page, "Switch", error, [], async (_, root) => {
    await expect(root.locator("input")).toHaveAttribute("aria-invalid", "true");
    await expect(root.locator("input")).toHaveAttribute("aria-describedby", "x-msg");
    await expect(root.locator("#x-msg")).toHaveText("Turn it on.");
    await expect(root).not.toContainText("Soft.");
  });
  await onEachReact(page, "Switch", { label: "Notificações", required: true }, [], async (_, root) => {
    expect(await root.locator("input").evaluate((el: HTMLInputElement) => el.required)).toBe(true);
    expect(await root.locator("label").textContent()).toMatch(/^Notificações · Required$/);
  });
});

test("CHK-08 an undefined id keeps the generated id on the Switch, its label and its message", async ({ page }) => {
  await onEachReact(page, "Switch", { label: "Notificações", id: undefined, hint: "Soft." }, [], async (_, root) => {
    const id = await root.locator("input").getAttribute("id");
    expect(id).toBeTruthy();
    expect(await root.locator("input").getAttribute("aria-describedby")).toBe(`${id}-msg`);
    await expect(page.locator(`[id="${id}-msg"]`)).toHaveText("Soft.");
  });
});

test("CHK-09 Space on a focused Switch flips it and moves its button to the other side", async ({ page }) => {
  await onEachReact(page, "Switch", { label: "Notificações" }, ["onChange"], async (r, root) => {
    const input = root.locator("input");
    /** Which half of the switch the button's centre is in. */
    const side = () =>
      root.locator(".ds-fc-thumb").evaluate((thumb) => {
        const track = thumb.parentElement!.getBoundingClientRect();
        const b = thumb.getBoundingClientRect();
        return b.x + b.width / 2 < track.x + track.width / 2 ? "left" : "right";
      });
    expect(await side()).toBe("left");
    await page.keyboard.press("Tab");
    await expect(input).toBeFocused();
    await page.keyboard.press("Space");
    await expect(input).toBeChecked();
    expect(await side()).toBe("right");
    expect((await formCalls(page, r.id)).onChange.map((c) => c.checked)).toEqual([true]);
    await page.keyboard.press("Space");
    await expect(input).not.toBeChecked();
    expect(await side()).toBe("left");
  });
});

test("CHK-11 a disabled Switch ignores a click on the label and Space, and has a dashed border", async ({ page }) => {
  await onEachReact(page, "Switch", { label: "Notificações", disabled: true }, ["onChange"], async (r, root) => {
    const input = root.locator("input");
    const text = (await root.getByText("Notificações").boundingBox())!;
    await page.mouse.click(text.x + text.width / 2, text.y + text.height / 2);
    await input.focus();
    await page.keyboard.press("Space");
    await expect(input).not.toBeChecked();
    expect((await formCalls(page, r.id)).onChange).toEqual([]);
    expect(await input.evaluate((el) => getComputedStyle(el).borderTopStyle)).toBe("dashed");
  });
});

test("CHK-13 the ref of a mounted Switch is its input", async ({ page }) => {
  await onEachReact(page, "Switch", { label: "Notificações" }, [], async (r) => {
    expect(r.ref).toBe("input");
    expect(await formRefIs(page, r.id, "input")).toBe(true);
  });
});
