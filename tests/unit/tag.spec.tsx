import { test } from "@playwright/test";
import { Tag, type TagProps } from "../../src/components/Tag";
import { expectMarkup } from "./markup";
import { render } from "./oracle";

const cases: [string, TagProps][] = [
  ["outline by default", { children: "TypeScript" }],
  ["solid", { variant: "solid", children: "Live" }],
  ["inverse", { variant: "inverse", children: "Archived", className: "x" }],
];

test("VIS-11 Tag markup matches its snapshot", () => {
  expectMarkup(
    "Tag",
    cases.map(([name, props]) => [name, render(<Tag {...props} />)]),
  );
});
