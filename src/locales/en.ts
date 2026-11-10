import type { Locale } from "./types";

/** English texts: the defaults every component uses without `labels`. */
export const en = {
  TextField: { required: "Required" },
  Checkbox: { required: "Required" },
  Switch: { required: "Required" },
  RadioGroup: { required: "Required" },
  Select: { required: "Required" },
  Assertion: { label: "Assertion", expected: "Expected", actual: "Actual", pass: "Pass", fail: "Fail" },
  ErrorNotice: { error: "Error" },
  SectionTitle: { section: "Section" },
  CheckLog: { title: "Checks", pass: "Pass", fail: "Fail", skip: "Skipped", pending: "Pending" },
  StatusFlag: { pass: "Pass", fail: "Fail", skip: "Skipped", pending: "Pending" },
  ToleranceBar: { within: "Within limit", out: "Out of range", value: "Value", limit: "limit" },
  BarChart: { name: "Bar chart" },
  LineChart: { name: "Line chart" },
  Schematic: { name: "Schematic" },
  ProportionDial: { name: "Share" },
  Hierarchy: { name: "Hierarchy" },
  Redacted: { name: "Redacted" },
  Readout: { up: "up", down: "down", flat: "no change" },
  StageIcon: { A: "Stage A · Seed", B: "Stage B · Sprout", C: "Stage C · Tree", D: "Stage D · Fruit" },
  Contents: { page: "P." },
  Dialog: { close: "Close" },
  Pagination: { name: "Pagination", previous: "Previous", next: "Next", page: "Page" },
  Spinner: { label: "Loading" },
  Toaster: { name: "Notifications", close: "Close" },
} as const satisfies Locale;

export type { Locale };
