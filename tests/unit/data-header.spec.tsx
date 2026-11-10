import { test } from "@playwright/test";
import { DataHeader, type DataHeaderProps } from "../../src/components/DataHeader";
import { expectMarkup } from "./markup";
import { render } from "./oracle";

const cases: [string, DataHeaderProps][] = [
  [
    "band as the page uses it",
    { title: "Gabriel O. Laureano", code: "File 43646296 · Rev 0427", kicker: "Subject file", meta: "Suite 3/3 pass" },
  ],
  ["band with title only", { title: "Gabriel O. Laureano" }],
  ["band with meta and no kicker", { title: "T", meta: "M", className: "x" }],
  ["running variant", { variant: "running", title: "T", code: "C", kicker: "K", meta: "03 / 12" }],
];

test("VIS-11 DataHeader markup matches its snapshot", () => {
  expectMarkup(
    "DataHeader",
    cases.map(([name, props]) => [name, render(<DataHeader {...props} />)]),
  );
});
