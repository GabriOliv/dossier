import { test } from "@playwright/test";
import { CheckLog, type CheckLogProps } from "../../src/components/CheckLog";
import type { CheckResult } from "../../src/components/StatusFlag";
import { expectMarkup } from "./markup";
import { render } from "./oracle";

const suite = (results: CheckResult[]): CheckLogProps => ({
  title: "Result",
  checks: ["computer_science", "software_testing", "quality_assurance"].map((label, i) => ({
    id: `CHK-0${i + 1}`,
    label,
    result: results[i],
  })),
});

const cases: [string, CheckLogProps][] = [
  ["three pending", suite(["pending", "pending", "pending"])],
  ["one pass, two pending", suite(["pass", "pending", "pending"])],
  ["three pass", suite(["pass", "pass", "pass"])],
  [
    "fail and skip with detail, duration, default title",
    {
      checks: [
        { id: "CHK-1", label: "a", result: "fail", detail: "expected 200", duration: "2.1 s" },
        { label: "b", result: "skip" },
      ],
      className: "x",
    },
  ],
];

test("VIS-11 CheckLog markup matches its snapshot", () => {
  expectMarkup(
    "CheckLog",
    cases.map(([name, props]) => [name, render(<CheckLog {...props} />)]),
  );
});
