import { test } from "@playwright/test";
import { SectionTitle, type SectionTitleProps } from "../../src/components/SectionTitle";
import { expectMarkup } from "./markup";
import { render } from "./oracle";

const cases: [string, SectionTitleProps][] = [
  ["with index and meta", { index: "02", title: "Stack", meta: "7 tools · 4 skills" }],
  ["without meta", { index: "01", title: "Profile suite" }],
  ["numeric index", { index: 3, title: "Certifications", meta: "ISTQB · 4 on record" }],
  ["without index", { title: "Gists", className: "x" }],
];

test("VIS-11 SectionTitle markup matches its snapshot", () => {
  expectMarkup(
    "SectionTitle",
    cases.map(([name, props]) => [name, render(<SectionTitle {...props} />)]),
  );
});
