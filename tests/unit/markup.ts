import { expect } from "@playwright/test";

/**
 * Every case of a component as `## <case>` and its HTML, compared with the component's snapshot file: the only
 * expected markup.
 */
export function expectMarkup(component: string, cases: [string, string][]): void {
  const text = cases.map(([name, html]) => `## ${name}\n${html}\n`).join("\n");
  expect(text).toMatchSnapshot(`${component}.html`);
}
