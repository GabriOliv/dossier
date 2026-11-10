import { expect, test } from "@playwright/test";
import { Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { RadioGroup, type RadioGroupProps } from "../../src/components/RadioGroup";
import { formCalls, onEachReact } from "./forms-mount";
import { expectMarkup } from "./markup";
import { render } from "./oracle";

const options = [
  { value: "a", label: "Basic" },
  { value: "b", label: "Team" },
  { value: "c", label: "Company" },
];

const cases: [string, RadioGroupProps][] = [
  ["three options", { label: "Plano", options }],
  ["name", { label: "Plano", options, name: "plano" }],
  ["value", { label: "Plano", options, value: "b", onChange: () => {} }],
  ["defaultValue", { label: "Plano", options, defaultValue: "c" }],
  ["hint", { label: "Plano", options, hint: "You can change it later." }],
  ["error replaces the hint", { label: "Plano", options, hint: "Soft.", error: "Pick a plan." }],
  ["required", { label: "Plano", options, required: true }],
  ["required with labels", { label: "Plano", options, required: true, labels: { required: "Obrigatório" } }],
  ["a disabled option", { label: "Plano", options: [options[0], { ...options[1], disabled: true }, options[2]] }],
  ["a disabled group", { label: "Plano", options, disabled: true }],
  ["no options", { label: "Plano", options: [] }],
  ["id and className", { label: "Plano", options, id: "x", hint: "Hint.", className: "y" }],
];

test("RAD-01 RadioGroup markup matches its snapshot", () => {
  expectMarkup(
    "RadioGroup",
    cases.map(([name, props]) => [name, render(<RadioGroup {...props} />)]),
  );
});

test("RAD-01 RadioGroup is a fieldset with a legend and one radio per option, each inside a label with the option's label", async ({
  page,
}) => {
  await onEachReact(page, "RadioGroup", { label: "Plano", options }, [], async (r, root) => {
    expect(r.ref).toBe("fieldset");
    await expect(root.locator("fieldset > legend")).toHaveText("Plano");
    const radios = root.locator('fieldset input[type="radio"]');
    await expect(radios).toHaveCount(3);
    const labels = await radios.evaluateAll((all) => all.map((el) => el.closest("label")?.textContent));
    expect(labels).toEqual(["Basic", "Team", "Company"]);
    const values = await radios.evaluateAll((all) => all.map((el) => (el as HTMLInputElement).value));
    expect(values).toEqual(["a", "b", "c"]);
  });
});

test("RAD-01 a required RadioGroup requires its radios and ends its legend with ' · Required' or labels.required", async ({
  page,
}) => {
  await onEachReact(page, "RadioGroup", { label: "Plano", options, required: true }, [], async (_, root) => {
    expect(await root.locator("legend").textContent()).toBe("Plano · Required");
    expect(
      await root.locator("input").evaluateAll((all) => all.map((el) => (el as HTMLInputElement).required)),
    ).toEqual([true, true, true]);
  });
  const labels = { required: "Obrigatório" };
  await onEachReact(page, "RadioGroup", { label: "Plano", options, required: true, labels }, [], async (_, root) => {
    expect(await root.locator("legend").textContent()).toBe("Plano · Obrigatório");
  });
});

test("RAD-02 without name the radios of a group share one name that no other group on the page has", async ({
  page,
}) => {
  const markup = renderToStaticMarkup(
    <Fragment>
      <RadioGroup label="One" options={options} />
      <RadioGroup label="Two" options={options} />
    </Fragment>,
  );
  await page.setContent(markup);
  const names = await page
    .locator("fieldset")
    .evaluateAll((sets) => sets.map((set) => [...set.querySelectorAll("input")].map((el) => el.name)));
  expect(names).toHaveLength(2);
  for (const group of names) {
    expect(group[0]).toBeTruthy();
    expect(group).toEqual([group[0], group[0], group[0]]);
  }
  expect(names[0][0]).not.toBe(names[1][0]);
});

test("RAD-03 name goes on every radio", async ({ page }) => {
  await onEachReact(page, "RadioGroup", { label: "Plano", options, name: "plano" }, [], async (_, root) => {
    const names = await root.locator("input").evaluateAll((all) => all.map((el) => (el as HTMLInputElement).name));
    expect(names).toEqual(["plano", "plano", "plano"]);
  });
});

test("RAD-04 arrow down from the checked, focused first option checks and focuses the second and calls onChange once with its value", async ({
  page,
}) => {
  await onEachReact(
    page,
    "RadioGroup",
    { label: "Plano", options, defaultValue: "a" },
    ["onChange"],
    async (r, root) => {
      const radios = root.locator("input");
      await page.keyboard.press("Tab");
      await expect(radios.nth(0)).toBeFocused();
      await expect(radios.nth(0)).toBeChecked();
      await page.keyboard.press("ArrowDown");
      await expect(radios.nth(1)).toBeChecked();
      await expect(radios.nth(1)).toBeFocused();
      await expect(radios.nth(0)).not.toBeChecked();
      expect((await formCalls(page, r.id)).onChange).toEqual([{ value: "b", checked: true }]);
    },
  );
});

test("RAD-05 with value b only the radio b is checked", async ({ page }) => {
  await onEachReact(page, "RadioGroup", { label: "Plano", options, value: "b" }, ["onChange"], async (_, root) => {
    const checked = await root.locator("input").evaluateAll((all) => all.map((el) => (el as HTMLInputElement).checked));
    expect(checked).toEqual([false, true, false]);
  });
});

test("RAD-06 an error is what the fieldset's aria-describedby points to, marks every radio invalid and hides the hint", async ({
  page,
}) => {
  const props = { label: "Plano", options, hint: "Soft.", error: "Pick a plan." };
  await onEachReact(page, "RadioGroup", props, [], async (_, root) => {
    const target = await root.locator("fieldset").getAttribute("aria-describedby");
    expect(target).toBeTruthy();
    await expect(page.locator(`[id="${target}"]`)).toHaveText("Pick a plan.");
    await expect(root).not.toContainText("Soft.");
    const invalid = await root.locator("input").evaluateAll((all) => all.map((el) => el.getAttribute("aria-invalid")));
    expect(invalid).toEqual(["true", "true", "true"]);
  });
});

test("RAD-07 a disabled option has a disabled radio and the arrow key skips it", async ({ page }) => {
  const opts = [options[0], { ...options[1], disabled: true }, options[2]];
  await onEachReact(
    page,
    "RadioGroup",
    { label: "Plano", options: opts, defaultValue: "a" },
    ["onChange"],
    async (r, root) => {
      const radios = root.locator("input");
      await expect(radios.nth(1)).toBeDisabled();
      await page.keyboard.press("Tab");
      await expect(radios.nth(0)).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await expect(radios.nth(2)).toBeChecked();
      await expect(radios.nth(2)).toBeFocused();
      await expect(radios.nth(1)).not.toBeChecked();
      expect((await formCalls(page, r.id)).onChange).toEqual([{ value: "c", checked: true }]);
    },
  );
});

test("RAD-10 an empty options list renders the fieldset and its legend and no radio, without error", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  await onEachReact(page, "RadioGroup", { label: "Plano", options: [] }, [], async (_, root) => {
    await expect(root.locator("fieldset > legend")).toHaveText("Plano");
    await expect(root.locator("input")).toHaveCount(0);
  });
  expect(errors).toEqual([]);
});
