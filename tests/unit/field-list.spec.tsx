import { test } from "@playwright/test";
import { FieldList, type FieldListProps } from "../../src/components/FieldList";
import { expectMarkup } from "./markup";
import { render } from "./oracle";

const link = (
  <a className="pg-ext" href="https://github.com/gabrioliv" target="_blank" rel="noopener noreferrer">
    GabriOliv
  </a>
);

const cases: [string, FieldListProps][] = [
  [
    "record with an active row",
    {
      fields: [
        { label: "playwright", value: "End-to-end tests", active: true },
        { label: "git", value: "Version control" },
      ],
    },
  ],
  [
    "record with a React node value and mono",
    {
      fields: [
        { label: "github", value: link },
        { label: "id", value: "43646296", mono: true },
      ],
    },
  ],
  ["two columns", { fields: [{ label: "a", value: "1" }], columns: 2 }],
  ["definition", { fields: [{ label: "Term", value: "Description" }], variant: "definition", className: "x" }],
];

test("VIS-11 FieldList markup matches its snapshot", () => {
  expectMarkup(
    "FieldList",
    cases.map(([name, props]) => [name, render(<FieldList {...props} />)]),
  );
});
