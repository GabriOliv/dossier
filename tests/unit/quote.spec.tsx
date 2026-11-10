import { test } from "@playwright/test";
import { Quote, type QuoteProps } from "../../src/components/Quote";
import { expectMarkup } from "./markup";
import { render } from "./oracle";

const roles = ["computer scientist.", "software tester.", "qa engineer.", "test strategist."].map((r, i) => (
  <span key={r} className={i === 2 ? "ds-hl" : undefined}>
    {r}
  </span>
));

const cases: [string, QuoteProps][] = [
  ["statement with kicker and four roles, one highlighted", { variant: "statement", kicker: "Role", children: roles }],
  ["statement with note", { variant: "statement", children: "Stability holds.", note: "Nine cycles." }],
  ["sourced quote with code", { children: "Quality is a habit.", source: "Field report", code: "FILE 0427" }],
  ["quote without source", { children: "Plain.", className: "x" }],
];

test("VIS-11 Quote markup matches its snapshot", () => {
  expectMarkup(
    "Quote",
    cases.map(([name, props]) => [name, render(<Quote {...props} />)]),
  );
});
