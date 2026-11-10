import { Redacted } from "../../src/components/Redacted";
/** Parity cases per component: [case name, props]. Each list covers every prop of index.d.ts and every branch of the original. */
export const CASES: Record<string, [string, object][]> = {
  Redacted: [
    ["default length", {}],
    ["explicit length", { length: 20 }],
    ["length below the minimum", { length: 1 }],
    ["length above the maximum", { length: 100 }],
    ["zero length falls back to the default", { length: 0 }],
    ["className", { length: 5, className: "x" }],
  ],
  Meter: [
    ["defaults: max 10, ink tone", { label: "Coverage", value: 7 }],
    ["signal tone", { label: "Coverage", value: 7, tone: "signal" }],
    ["explicit ink tone", { label: "Coverage", value: 3, tone: "ink" }],
    ["explicit max", { label: "Steps", value: 3, max: 5 }],
    ["value 0", { label: "Empty", value: 0 }],
    ["value above max is clamped", { label: "Over", value: 15, max: 8 }],
    ["negative value is clamped", { label: "Under", value: -3 }],
    ["fractional value is rounded", { label: "Frac", value: 2.6, className: "x" }],
  ],
  Comparison: [
    ["list prop absent", {}],
    [
      "two columns with every field, first active",
      {
        columns: [
          { code: "X1", title: "Option one", lead: "The lead.", items: ["a", "b"], active: true },
          { code: "X2", title: "Option two", lead: "Other lead.", items: ["c"] },
        ],
        className: "x",
      },
    ],
    [
      "three columns, code defaults to A, B, C",
      { columns: [{ title: "One" }, { title: "Two", active: true }, { title: "Three", lead: "L" }] },
    ],
    [
      "extra columns are dropped",
      { columns: [{ title: "One" }, { title: "Two" }, { title: "Three" }, { title: "Four", code: "Z" }] },
    ],
    ["lead and items absent", { columns: [{ title: "Bare", code: "B" }] }],
    ["empty items list", { columns: [{ title: "Empty", items: [] }] }],
    ["no columns", { columns: [] }],
  ],
  Contents: [
    ["list prop absent", {}],
    [
      "every field present",
      {
        items: [
          { index: "A1", title: "Intro", description: "First part.", page: 3, active: true },
          { title: "Body", description: "Second part.", page: "iv" },
        ],
        className: "x",
      },
    ],
    ["title only, index defaults to 01, 02", { items: [{ title: "One" }, { title: "Two" }] }],
    ["page 0 still shows", { items: [{ title: "Zero", page: 0 }] }],
    ["index 0 as given", { items: [{ title: "Zero", index: "0" }] }],
    [
      "ten items, index defaults pad to 09 then 10",
      { items: Array.from({ length: 10 }, (_, i) => ({ title: "S" + i, active: i === 9 })) },
    ],
    ["no items", { items: [] }],
  ],
  Transcript: [
    ["list prop absent", {}],
    [
      "title and every line field",
      {
        title: "Interview 04",
        lines: [
          { time: "04:12", speaker: "Ana", text: "Hello there.", active: true },
          { time: "04:20", speaker: "Bo", text: <Redacted length={12} /> },
        ],
        className: "x",
      },
    ],
    ["no title, no time, not active", { lines: [{ speaker: "Ana", text: "Plain." }] }],
    ["no lines", { title: "Empty", lines: [] }],
  ],
  Assertion: [
    [
      "equal values pass, every field present",
      { label: "CHK-114 · status code", expected: 200, actual: "200", location: "checkout.spec.ts:88", className: "x" },
    ],
    ["different values fail, default label", { expected: "a", actual: "b" }],
    ["pass true overrides a mismatch", { label: "Forced", expected: 1, actual: 2, pass: true }],
    ["pass false overrides a match", { label: "Forced", expected: 1, actual: 1, pass: false }],
    ["element values, no location", { label: "Nodes", expected: <b>x</b>, actual: <i>y</i> }],
  ],
  ErrorNotice: [
    [
      "every prop present, live",
      {
        title: "Build blocked",
        code: "e-114",
        meta: "12:04 utc",
        children: "Two sentences of explanation.",
        items: ["first failure", "second failure"],
        action: "Re-run the suite",
        live: true,
        className: "x",
      },
    ],
    ["title only, not live", { title: "Plain failure" }],
    ["code without meta", { title: "T", code: "x1" }],
    ["meta without code", { title: "T", meta: "now" }],
    ["children without items or action", { title: "T", children: <em>why</em> }],
    ["empty items", { title: "T", items: [] }],
    ["items and action without children", { title: "T", items: [<b key="b">bold</b>], action: "Fix it" }],
    ["live false", { title: "T", live: false }],
  ],
  BarChart: [
    ["list prop absent", {}],
    [
      "every prop, active bar, unit and format",
      {
        data: [
          { label: "Alpha", value: 40, active: true },
          { label: "Beta", value: 25 },
        ],
        max: 100,
        unit: "ms",
        format: (v: number) => v.toFixed(1),
        scale: true,
        title: "Latency",
        className: "x",
      },
    ],
    [
      "defaults: max is the largest value, no unit, plain format",
      {
        data: [
          { label: "A", value: 3 },
          { label: "B", value: 6 },
        ],
      },
    ],
    ["scale false drops the scale row", { data: [{ label: "A", value: 3 }], scale: false }],
    ["value above max is clamped to 100%", { data: [{ label: "A", value: 30 }], max: 10 }],
    [
      "negative value is clamped to 0%",
      {
        data: [
          { label: "A", value: -5 },
          { label: "B", value: 5 },
        ],
      },
    ],
    ["all zero values fall back to max 1", { data: [{ label: "A", value: 0 }] }],
    ["no data", { data: [] }],
    ["odd max gives a fractional half tick", { data: [{ label: "A", value: 1 }], max: 5 }],
  ],
  Timeline: [
    ["list prop absent", {}],
    [
      "every event field, active event with a note",
      {
        events: [
          { at: "Cycle 10", label: "Kickoff", note: "Scope agreed." },
          { at: "Cycle 12", label: "Review", note: "Two findings.", active: true },
          { at: "Cycle 14", label: "Close" },
        ],
        className: "x",
      },
    ],
    ["one event, no note, not active", { events: [{ at: "2026", label: "Only" }] }],
    [
      "six events",
      { events: Array.from({ length: 6 }, (_, i) => ({ at: "T+0" + i, label: "Step " + i, active: i === 5 })) },
    ],
    ["empty note is omitted", { events: [{ at: "T0", label: "A", note: "" }] }],
    ["no events", { events: [] }],
  ],
  Dimension: [
    ["defaults: length 240, label from length", {}],
    ["every prop", { length: 100, label: "Width", active: true, className: "x" }],
    ["numeric label", { length: 80, label: 42 }],
    ["numeric label 0 is kept", { label: 0 }],
    ["empty label is kept", { label: "" }],
    ["length 0 falls back to 240", { length: 0 }],
    ["active only", { active: true }],
  ],
  Connector: [
    ["defaults: 160 x 64, bottom-right, vertical first", {}],
    ["every prop", { width: 100, height: 50, from: "top-left", first: "horizontal", active: true, className: "x" }],
    ["from top-right", { from: "top-right" }],
    ["from bottom-left", { from: "bottom-left" }],
    ["from bottom-right, horizontal first", { from: "bottom-right", first: "horizontal" }],
    ["from top-left, vertical first", { from: "top-left", first: "vertical" }],
    ["from top-right, horizontal first", { from: "top-right", first: "horizontal" }],
    ["from bottom-left, horizontal first", { from: "bottom-left", first: "horizontal" }],
    ["width 0 is a straight vertical arrow", { width: 0 }],
    ["height 0 is a straight horizontal arrow", { height: 0 }],
    ["width 0 horizontal first", { width: 0, first: "horizontal" }],
    ["height 0 vertical first", { height: 0, first: "vertical" }],
    ["both 0 does not divide by zero", { width: 0, height: 0 }],
    ["active only", { active: true }],
  ],
  ProportionDial: [
    [
      "every prop",
      {
        value: 42,
        label: "of cases",
        segments: [
          { angle: 90, label: "Passed" },
          { angle: 200, label: "Failed" },
        ],
        size: 200,
        labelWidth: 150,
        dotStep: 10,
        title: "Share of cases",
        className: "x",
      },
    ],
    ["defaults, no label, no segments", { value: 30 }],
    ["value 0", { value: 0 }],
    ["value 100 draws a full circle", { value: 100 }],
    ["value below 0 is clamped", { value: -20, label: "Under" }],
    ["value above 100 is clamped", { value: 150, label: "Over" }],
    ["value above half, large arc", { value: 75, label: "Most" }],
    ["value exactly 50", { value: 50 }],
    ["non-numeric value falls back to 0", { value: NaN }],
    ["title without label", { value: 10, title: "Custom" }],
    [
      "segments on both sides of the dial",
      {
        value: 60,
        segments: [
          { angle: 0, label: "Right" },
          { angle: 180, label: "Left" },
          { angle: 270, label: "Top" },
          { angle: 45, label: "Low right" },
        ],
      },
    ],
    ["segment without angle defaults to 0", { value: 20, segments: [{ label: "Zero" } as any] }],
    ["empty segments", { value: 20, segments: [] }],
    ["wide size and tiny dot step", { value: 33, size: 120, dotStep: 20 }],
  ],
  LineChart: [
    ["list prop absent", {}],
    [
      "every prop",
      {
        data: [
          { x: "Jan", y: 10 },
          { x: "Feb", y: 25, callout: true },
          { x: "Mar", y: 18, active: true },
          { x: "Apr", y: 30 },
        ],
        unit: "%",
        format: (v: number) => v.toFixed(1),
        yMin: 5,
        yMax: 40,
        area: true,
        width: 600,
        height: 200,
        title: "Pass rate",
        className: "x",
      },
    ],
    [
      "defaults: size 720 x 240, area, y range from 0 to the largest value",
      {
        data: [
          { x: "A", y: 3 },
          { x: "B", y: 9 },
          { x: "C", y: 5 },
        ],
      },
    ],
    [
      "area false drops the hatched polygon",
      {
        data: [
          { x: "A", y: 3 },
          { x: "B", y: 9 },
        ],
        area: false,
      },
    ],
    ["no points", { data: [] }],
    ["one point: centred, no line, no area", { data: [{ x: "Solo", y: 4 }] }],
    ["one active point", { data: [{ x: "Solo", y: 4, active: true }] }],
    [
      "callout and active without format or unit",
      {
        data: [
          { x: "A", y: 1, callout: true },
          { x: "B", y: 2, active: true },
          { x: "C", y: 3 },
        ],
      },
    ],
    [
      "all equal values give a flat range",
      {
        data: [
          { x: "A", y: 5 },
          { x: "B", y: 5 },
        ],
        yMin: 5,
        yMax: 5,
      },
    ],
    [
      "values outside yMin and yMax",
      {
        data: [
          { x: "A", y: -10 },
          { x: "B", y: 100 },
        ],
        yMin: 0,
        yMax: 50,
      },
    ],
    [
      "yMin 0 and yMax 0 are kept, not defaulted",
      {
        data: [
          { x: "A", y: 0 },
          { x: "B", y: 0 },
        ],
        yMin: 0,
        yMax: 0,
      },
    ],
    [
      "negative y values default yMax to yMin plus one",
      {
        data: [
          { x: "A", y: -3 },
          { x: "B", y: -1 },
        ],
      },
    ],
  ],
  ToleranceBar: [
    [
      "every prop, within the range",
      {
        label: "Latency",
        value: 120,
        min: 100,
        max: 200,
        scaleMin: 50,
        scaleMax: 250,
        unit: "ms",
        format: (v: number) => v.toFixed(1),
        className: "x",
      },
    ],
    ["within a max-only limit, default scale", { label: "Errors", value: 3, max: 5 }],
    ["above max", { label: "Errors", value: 8, max: 5, unit: "%" }],
    ["below min", { label: "Coverage", value: 60, min: 80, unit: "%" }],
    ["within a min-only limit", { label: "Coverage", value: 90, min: 80 }],
    [
      "above max with min and max, formatted difference",
      { label: "Size", value: 10.3333, min: 1, max: 5, format: (v: number) => "<" + v + ">" },
    ],
    ["below min with min and max", { label: "Size", value: 0.5, min: 2, max: 5 }],
    ["value equal to max and to min stays within", { label: "Edge", value: 5, min: 5, max: 5 }],
    ["no min and no max", { label: "Free", value: 7 }],
    ["value 0 with no limits falls back to scale 1", { label: "Zero", value: 0 }],
    ["scaleMin above min clamps the band start", { label: "Clip", value: 5, min: 1, max: 9, scaleMin: 3, scaleMax: 7 }],
    ["max at scaleMax hides its tick", { label: "Full", value: 4, max: 10, scaleMax: 10 }],
    ["min at scaleMin hides its tick", { label: "Floor", value: 4, min: 0, max: 10 }],
    ["scaleMin equal to scaleMax", { label: "Flat", value: 2, max: 3, scaleMin: 4, scaleMax: 4 }],
    ["non-numeric value falls back to 0", { value: NaN, label: "Nan", max: 5 }],
    ["label absent", { value: 1, max: 2 } as any],
  ],
  TextField: [
    [
      "every prop on an input, hint shown",
      {
        label: "Email",
        name: "email",
        type: "email",
        value: "a@b.c",
        onChange: () => {},
        placeholder: "you@example.com",
        hint: "We never share it.",
        required: true,
        disabled: true,
        className: "x",
      },
    ],
    ["label only: text input, no message", { label: "Name" }],
    ["defaultValue on an input", { label: "Name", defaultValue: "Ana" }],
    ["value wins over defaultValue", { label: "Name", value: "Bo", defaultValue: "Ana", onChange: () => {} }],
    ["empty value is still controlled", { label: "Name", value: "", onChange: () => {} }],
    ["error without hint", { label: "Name", error: "Enter a name." }],
    ["error wins over hint", { label: "Name", error: "Enter a name.", hint: "Your full name." }],
    ["hint without error", { label: "Name", hint: "Your full name." }],
    ["required only", { label: "Name", required: true }],
    ["disabled only", { label: "Name", disabled: true }],
    ["textarea defaults to 3 rows and ignores type", { label: "Notes", multiline: true, type: "email" }],
    [
      "textarea with rows, defaultValue, error",
      { label: "Notes", multiline: true, rows: 6, defaultValue: "Hi", error: "Too short." },
    ],
    [
      "textarea with value and hint",
      { label: "Notes", multiline: true, value: "Hello", onChange: () => {}, hint: "Markdown ok." },
    ],
    ["rows is ignored on an input", { label: "Name", rows: 9 }],
  ],
};
