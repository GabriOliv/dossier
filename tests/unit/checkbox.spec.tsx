import { expect, test } from "@playwright/test";
import { Checkbox, type CheckboxProps } from "../../src/components/Checkbox";
import { formCalls, formRefIs, onEachReact } from "./forms-mount";
import { expectMarkup } from "./markup";
import { render } from "./oracle";

const cases: [string, CheckboxProps][] = [
  ["label only", { label: "Aceito" }],
  ["checked by default", { label: "Aceito", defaultChecked: true, name: "terms", value: "yes" }],
  ["hint", { label: "Aceito", hint: "You can change it later." }],
  ["error replaces the hint", { label: "Aceito", hint: "You can change it later.", error: "Accept to go on." }],
  ["required", { label: "Aceito", required: true }],
  ["required with labels", { label: "Aceito", required: true, labels: { required: "Obrigatório" } }],
  ["disabled", { label: "Aceito", disabled: true }],
  ["id and className", { label: "Aceito", id: "x", hint: "Hint.", className: "y" }],
];

test("CHK-01 Checkbox markup matches its snapshot", () => {
  expectMarkup(
    "Checkbox",
    cases.map(([name, props]) => [name, render(<Checkbox {...props} />)]),
  );
});

test("CHK-01 Checkbox renders an input type checkbox inside a label whose text is the label", async ({ page }) => {
  await onEachReact(page, "Checkbox", { label: "Aceito" }, [], async (_, root) => {
    const label = root.locator("label");
    await expect(label.locator('input[type="checkbox"]')).toHaveCount(1);
    await expect(label).toHaveText("Aceito");
  });
});

test("CHK-02 clicking the label text checks an unchecked Checkbox", async ({ page }) => {
  await onEachReact(page, "Checkbox", { label: "Aceito" }, [], async (_, root) => {
    await expect(root.locator("input")).not.toBeChecked();
    await root.getByText("Aceito").click();
    await expect(root.locator("input")).toBeChecked();
  });
});

test("CHK-03 Space on a focused Checkbox flips it and calls onChange once per press", async ({ page }) => {
  await onEachReact(page, "Checkbox", { label: "Aceito" }, ["onChange"], async (r, root) => {
    const box = root.locator("input");
    await page.keyboard.press("Tab");
    await expect(box).toBeFocused();
    await page.keyboard.press("Space");
    await expect(box).toBeChecked();
    expect((await formCalls(page, r.id)).onChange.map((c) => c.checked)).toEqual([true]);
    await page.keyboard.press("Space");
    await expect(box).not.toBeChecked();
    expect((await formCalls(page, r.id)).onChange.map((c) => c.checked)).toEqual([true, false]);
  });
});

test("CHK-04 the hint is what the Checkbox's aria-describedby points to", async ({ page }) => {
  await onEachReact(page, "Checkbox", { label: "Aceito", hint: "Soft." }, [], async (_, root) => {
    const target = await root.locator("input").getAttribute("aria-describedby");
    expect(target).toBeTruthy();
    await expect(page.locator(`[id="${target}"]`)).toHaveText("Soft.");
  });
});

test("CHK-05 an error sets aria-invalid, is what aria-describedby points to, and hides the hint", async ({ page }) => {
  const props = { label: "Aceito", hint: "Soft.", error: "Accept to go on." };
  await onEachReact(page, "Checkbox", props, [], async (_, root) => {
    const box = root.locator("input");
    await expect(box).toHaveAttribute("aria-invalid", "true");
    const target = await box.getAttribute("aria-describedby");
    expect(target).toBeTruthy();
    await expect(page.locator(`[id="${target}"]`)).toHaveText("Accept to go on.");
    await expect(root).not.toContainText("Soft.");
  });
});

test("CHK-06 required puts required on the input and ' · Required' (or labels.required) at the end of the label", async ({
  page,
}) => {
  await onEachReact(page, "Checkbox", { label: "Aceito", required: true }, [], async (_, root) => {
    expect(await root.locator("input").evaluate((el: HTMLInputElement) => el.required)).toBe(true);
    expect(await root.locator("label").textContent()).toMatch(/^Aceito · Required$/);
  });
  const labels = { required: "Obrigatório" };
  await onEachReact(page, "Checkbox", { label: "Aceito", required: true, labels }, [], async (_, root) => {
    expect(await root.locator("label").textContent()).toMatch(/^Aceito · Obrigatório$/);
  });
});

test("CHK-07 id goes on the input and id-msg on the hint or the error", async ({ page }) => {
  await onEachReact(page, "Checkbox", { label: "Aceito", id: "x", hint: "Soft." }, [], async (_, root) => {
    await expect(root.locator("input")).toHaveAttribute("id", "x");
    await expect(root.locator("#x-msg")).toHaveText("Soft.");
    await expect(root.locator("input")).toHaveAttribute("aria-describedby", "x-msg");
  });
  await onEachReact(page, "Checkbox", { label: "Aceito", id: "x", error: "Bad." }, [], async (_, root) => {
    await expect(root.locator("#x-msg")).toHaveText("Bad.");
  });
});

test("CHK-07 an undefined id keeps the generated id on the Checkbox, its label and its message", async ({ page }) => {
  await onEachReact(page, "Checkbox", { label: "Aceito", id: undefined, hint: "Soft." }, [], async (_, root) => {
    const id = await root.locator("input").getAttribute("id");
    expect(id).toBeTruthy();
    expect(await root.locator("input").getAttribute("aria-describedby")).toBe(`${id}-msg`);
    await expect(page.locator(`[id="${id}-msg"]`)).toHaveText("Soft.");
  });
});

test("CHK-11 a disabled Checkbox ignores a click on the label and Space, and has a dashed border", async ({ page }) => {
  await onEachReact(page, "Checkbox", { label: "Aceito", disabled: true }, ["onChange"], async (r, root) => {
    const box = root.locator("input");
    const text = (await root.getByText("Aceito").boundingBox())!;
    await page.mouse.click(text.x + text.width / 2, text.y + text.height / 2);
    await box.focus();
    await page.keyboard.press("Space");
    await expect(box).not.toBeChecked();
    expect((await formCalls(page, r.id)).onChange).toEqual([]);
    expect(await box.evaluate((el) => getComputedStyle(el).borderTopStyle)).toBe("dashed");
  });
});

test("CHK-13 the ref of a mounted Checkbox is its input", async ({ page }) => {
  await onEachReact(page, "Checkbox", { label: "Aceito" }, [], async (r) => {
    expect(r.ref).toBe("input");
    expect(await formRefIs(page, r.id, "input")).toBe(true);
  });
});
