import { expect, test } from "@playwright/test";
import { Select, type SelectProps } from "../../src/components/Select";
import { formCalls, formRefIs, onEachReact } from "./forms-mount";
import { expectMarkup } from "./markup";
import { render } from "./oracle";

const options = [
  { value: "br", label: "Brasil" },
  { value: "pt", label: "Portugal" },
  { value: "ao", label: "Angola" },
];

const cases: [string, SelectProps][] = [
  ["options", { label: "País", options }],
  ["placeholder", { label: "País", options, placeholder: "Escolha" }],
  ["value", { label: "País", options, value: "pt", onChange: () => {} }],
  ["defaultValue", { label: "País", options, defaultValue: "ao", name: "country" }],
  ["a disabled option", { label: "País", options: [options[0], { ...options[1], disabled: true }, options[2]] }],
  ["hint", { label: "País", options, hint: "Where you live." }],
  ["error replaces the hint", { label: "País", options, hint: "Soft.", error: "Pick a country." }],
  ["required", { label: "País", options, required: true }],
  ["required with labels", { label: "País", options, required: true, labels: { required: "Obrigatório" } }],
  ["disabled", { label: "País", options, disabled: true }],
  ["id and className", { label: "País", options, id: "x", hint: "Hint.", className: "y" }],
];

test("SEL-01 Select markup matches its snapshot", () => {
  expectMarkup(
    "Select",
    cases.map(([name, props]) => [name, render(<Select {...props} />)]),
  );
});

test("SEL-01 Select is a label for a select with one option per item, with the item's value and text", async ({
  page,
}) => {
  await onEachReact(page, "Select", { label: "País", options }, [], async (_, root) => {
    const select = root.locator("select");
    const id = await select.getAttribute("id");
    expect(id).toBeTruthy();
    await expect(root.locator(`label[for="${id}"]`)).toHaveText("País");
    const items = await select
      .locator("option")
      .evaluateAll((all) => all.map((o) => [(o as HTMLOptionElement).value, o.textContent]));
    expect(items).toEqual([
      ["br", "Brasil"],
      ["pt", "Portugal"],
      ["ao", "Angola"],
    ]);
  });
});

test("SEL-02 a placeholder is a first empty, disabled option that is selected without value or defaultValue", async ({
  page,
}) => {
  await onEachReact(page, "Select", { label: "País", options, placeholder: "Escolha" }, [], async (_, root) => {
    const first = root.locator("option").first();
    await expect(root.locator("option")).toHaveCount(4);
    expect(
      await first.evaluate((o: HTMLOptionElement) => ({ value: o.value, disabled: o.disabled, text: o.textContent })),
    ).toEqual({ value: "", disabled: true, text: "Escolha" });
    expect(await root.locator("select").evaluate((s: HTMLSelectElement) => [s.selectedIndex, s.value])).toEqual([
      0,
      "",
    ]);
  });
  // A defaultValue of the consumer's wins over the placeholder.
  const props = { label: "País", options, placeholder: "Escolha", defaultValue: "pt" };
  await onEachReact(page, "Select", props, [], async (_, root) => {
    expect(await root.locator("select").evaluate((s: HTMLSelectElement) => s.value)).toBe("pt");
  });
});

test("SEL-03 choosing an option calls onChange once and gives the select that option's value", async ({ page }) => {
  await onEachReact(page, "Select", { label: "País", options }, ["onChange"], async (r, root) => {
    const select = root.locator("select");
    await select.selectOption({ label: "Portugal" });
    expect(await select.evaluate((s: HTMLSelectElement) => s.value)).toBe("pt");
    expect((await formCalls(page, r.id)).onChange).toEqual([{ value: "pt" }]);
  });
});

test("SEL-04 the hint is what the select's aria-describedby points to", async ({ page }) => {
  await onEachReact(page, "Select", { label: "País", options, hint: "Soft." }, [], async (_, root) => {
    const target = await root.locator("select").getAttribute("aria-describedby");
    expect(target).toBeTruthy();
    await expect(page.locator(`[id="${target}"]`)).toHaveText("Soft.");
  });
});

test("SEL-04 an error sets aria-invalid, is what aria-describedby points to, and hides the hint", async ({ page }) => {
  const props = { label: "País", options, hint: "Soft.", error: "Pick a country." };
  await onEachReact(page, "Select", props, [], async (_, root) => {
    const select = root.locator("select");
    await expect(select).toHaveAttribute("aria-invalid", "true");
    const target = await select.getAttribute("aria-describedby");
    expect(target).toBeTruthy();
    await expect(page.locator(`[id="${target}"]`)).toHaveText("Pick a country.");
    await expect(root).not.toContainText("Soft.");
  });
});

test("SEL-04 required puts required on the select and ' · Required' (or labels.required) at the end of the label", async ({
  page,
}) => {
  await onEachReact(page, "Select", { label: "País", options, required: true }, [], async (_, root) => {
    expect(await root.locator("select").evaluate((s: HTMLSelectElement) => s.required)).toBe(true);
    expect(await root.locator("label").textContent()).toBe("País · Required");
  });
  const labels = { required: "Obrigatório" };
  await onEachReact(page, "Select", { label: "País", options, required: true, labels }, [], async (_, root) => {
    expect(await root.locator("label").textContent()).toBe("País · Obrigatório");
  });
});

test("SEL-04 id goes on the select and id-msg on the hint or the error", async ({ page }) => {
  await onEachReact(page, "Select", { label: "País", options, id: "x", hint: "Soft." }, [], async (_, root) => {
    await expect(root.locator("select")).toHaveAttribute("id", "x");
    await expect(root.locator("label")).toHaveAttribute("for", "x");
    await expect(root.locator("#x-msg")).toHaveText("Soft.");
    await expect(root.locator("select")).toHaveAttribute("aria-describedby", "x-msg");
  });
  await onEachReact(page, "Select", { label: "País", options, id: "x", error: "Bad." }, [], async (_, root) => {
    await expect(root.locator("#x-msg")).toHaveText("Bad.");
  });
});

test("SEL-04 an undefined id keeps the generated id on the Select, its label and its message", async ({ page }) => {
  await onEachReact(page, "Select", { label: "País", options, id: undefined, hint: "Soft." }, [], async (_, root) => {
    const id = await root.locator("select").getAttribute("id");
    expect(id).toBeTruthy();
    await expect(root.locator("label")).toHaveAttribute("for", id!);
    expect(await root.locator("select").getAttribute("aria-describedby")).toBe(`${id}-msg`);
    await expect(page.locator(`[id="${id}-msg"]`)).toHaveText("Soft.");
  });
});

test("SEL-04 a disabled Select ignores the label and the arrow keys, and has a dashed border", async ({ page }) => {
  await onEachReact(page, "Select", { label: "País", options, disabled: true }, ["onChange"], async (r, root) => {
    const select = root.locator("select");
    const text = (await root.getByText("País").boundingBox())!;
    await page.mouse.click(text.x + text.width / 2, text.y + text.height / 2);
    await select.focus();
    await page.keyboard.press("ArrowDown");
    expect(await select.evaluate((s: HTMLSelectElement) => s.value)).toBe("br");
    expect((await formCalls(page, r.id)).onChange).toEqual([]);
    await expect(select).toBeDisabled();
    expect(await select.evaluate((el) => getComputedStyle(el).borderTopStyle)).toBe("dashed");
  });
});

test("SEL-05 the ref of a mounted Select is its select", async ({ page }) => {
  await onEachReact(page, "Select", { label: "País", options }, [], async (r) => {
    expect(r.ref).toBe("select");
    expect(await formRefIs(page, r.id, "select")).toBe(true);
  });
});

test("SEL-30 a value that is not among the options leaves the first enabled option selected, without error", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await onEachReact(page, "Select", { label: "País", options, value: "zz" }, ["onChange"], async (_, root) => {
    expect(await root.locator("select").evaluate((s: HTMLSelectElement) => [s.selectedIndex, s.value])).toEqual([
      0,
      "br",
    ]);
  });
  const skipFirst = [{ ...options[0], disabled: true }, options[1], options[2]];
  await onEachReact(
    page,
    "Select",
    { label: "País", options: skipFirst, value: "zz" },
    ["onChange"],
    async (_, root) => {
      expect(await root.locator("select").evaluate((s: HTMLSelectElement) => [s.selectedIndex, s.value])).toEqual([
        1,
        "pt",
      ]);
    },
  );
  expect(errors).toEqual([]);
});
