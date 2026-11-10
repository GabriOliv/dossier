/** The fixed texts of every component that has one, by component and key. Each value is a plain string. */
export interface Locale {
  TextField: { required: string };
  Checkbox: { required: string };
  Switch: { required: string };
  RadioGroup: { required: string };
  Select: { required: string };
  Assertion: { label: string; expected: string; actual: string; pass: string; fail: string };
  ErrorNotice: { error: string };
  SectionTitle: { section: string };
  CheckLog: { title: string; pass: string; fail: string; skip: string; pending: string };
  StatusFlag: { pass: string; fail: string; skip: string; pending: string };
  ToleranceBar: { within: string; out: string; value: string; limit: string };
  BarChart: { name: string };
  LineChart: { name: string };
  Schematic: { name: string };
  ProportionDial: { name: string };
  Hierarchy: { name: string };
  Redacted: { name: string };
  Readout: { up: string; down: string; flat: string };
  StageIcon: { A: string; B: string; C: string; D: string };
  Contents: { page: string };
  Dialog: { close: string };
  Pagination: { name: string; previous: string; next: string; page: string };
  Spinner: { label: string };
  Toaster: { name: string; close: string };
}
