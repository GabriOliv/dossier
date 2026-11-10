import { test } from "@playwright/test";
import { StatusFlag, type StatusFlagProps } from "../../src/components/StatusFlag";
import { expectMarkup } from "./markup";
import { render } from "./oracle";

const cases: [string, StatusFlagProps][] = [
  ["pass", { status: "pass" }],
  ["fail", { status: "fail" }],
  ["skip", { status: "skip" }],
  ["pending", { status: "pending" }],
  ["pass with the word Active", { status: "pass", children: "Active" }],
];

test("VIS-11 StatusFlag markup matches its snapshot", () => {
  expectMarkup(
    "StatusFlag",
    cases.map(([name, props]) => [name, render(<StatusFlag {...props} />)]),
  );
});
