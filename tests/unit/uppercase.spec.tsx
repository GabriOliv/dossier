import { readdirSync, readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as lib from "../../src/index";

/** Every component that uppercased a text in JS, rendered with mixed-case values for each of those texts. */
const CASES: [string, ReactElement, string[]][] = [
  [
    "DataHeader",
    <lib.DataHeader title="Run Title" code="Code Ab" kicker="Kick Er" meta="Meta Data" />,
    ["Run Title", "Code Ab", "Kick Er", "Meta Data"],
  ],
  [
    "DataHeader running",
    <lib.DataHeader variant="running" title="Run Title" code="Code Ab" kicker="Kick Er" meta="Meta Data" />,
    ["Run Title", "Code Ab", "Kick Er", "Meta Data"],
  ],
  [
    "SectionTitle",
    <lib.SectionTitle index="0a" title="Find Ings" meta="Pages Two" />,
    ["0a", "Find Ings", "Pages Two"],
  ],
  ["Readout", <lib.Readout label="Pass Rate" value="9" />, ["Pass Rate"]],
  ["Tag", <lib.Tag>Live Now</lib.Tag>, ["Live Now"]],
  [
    "DataTable",
    <lib.DataTable caption="Sector Index" columns={[{ key: "a", label: "Col Umn" }]} rows={[{ a: "x" }]} />,
    ["Sector Index", "Col Umn"],
  ],
  ["FieldList", <lib.FieldList fields={[{ label: "Sec Tor", value: "v" }]} />, ["Sec Tor"]],
  ["Hierarchy", <lib.Hierarchy root={{ label: "Root", code: "Co De" }} />, ["Co De"]],
  [
    "Quote",
    <lib.Quote source="Field Notes" code="Fn Twelve">
      Measure Twice
    </lib.Quote>,
    ["Field Notes", "Fn Twelve", "Measure Twice"],
  ],
  [
    "Quote statement",
    <lib.Quote variant="statement" kicker="Key Message">
      Every Result
    </lib.Quote>,
    ["Key Message", "Every Result"],
  ],
  ["StatusFlag", <lib.StatusFlag status="pass">Act Ive</lib.StatusFlag>, ["Act Ive"]],
  [
    "CheckLog",
    <lib.CheckLog title="Check Out" checks={[{ id: "Chk One", label: "l", result: "pass" }]} />,
    ["Check Out", "Chk One"],
  ],
  ["Assertion", <lib.Assertion label="Status Code" expected="1" actual="1" />, ["Status Code"]],
  ["BarChart", <lib.BarChart data={[{ label: "Bar One", value: 1 }]} />, ["Bar One"]],
  ["Comparison", <lib.Comparison columns={[{ code: "Op Ta", title: "Opt Ion", items: [] }]} />, ["Op Ta", "Opt Ion"]],
  ["Dimension", <lib.Dimension label="Wide Span" />, ["Wide Span"]],
  [
    "ErrorNotice",
    <lib.ErrorNotice title="Release Blocked" code="Run Two" meta="Ten Am" action="Rerun It" />,
    ["Release Blocked", "Run Two", "Ten Am", "Rerun It"],
  ],
  [
    "LineChart",
    <lib.LineChart
      data={[
        { x: "Jan Feb", y: 1 },
        { x: "Mar Apr", y: 2 },
      ]}
    />,
    ["Jan Feb", "Mar Apr"],
  ],
  ["Meter", <lib.Meter label="Cover Age" value={3} />, ["Cover Age"]],
  [
    "ProportionDial",
    <lib.ProportionDial value={40} label="Of Cases" segments={[{ angle: 40, label: "Pass Ed" }]} />,
    ["Of Cases", "Pass Ed"],
  ],
  ["Schematic", <lib.Schematic nodes={[{ ring: 1, angle: 0, label: "Co Re" }]} />, ["Co Re"]],
  ["TextField", <lib.TextField label="E Mail" />, ["E Mail"]],
  ["Timeline", <lib.Timeline events={[{ at: "Day One", label: "t" }]} />, ["Day One"]],
  ["ToleranceBar", <lib.ToleranceBar label="Lat Ency" value={1} max={2} />, ["Lat Ency"]],
  [
    "Transcript",
    <lib.Transcript title="Call Log" lines={[{ speaker: "Ana Lu", text: "t" }]} />,
    ["Call Log", "Ana Lu"],
  ],
  ["Contents", <lib.Contents items={[{ title: "Intro Duction", page: "1" }]} />, ["Intro Duction"]],
];

test("I18N-20 every text a component uppercased in JS keeps the case it came with in the DOM", () => {
  for (const [name, element, texts] of CASES) {
    const html = renderToStaticMarkup(element);
    for (const t of texts) {
      expect(html, `${name}: ${t}`).toContain(t);
      if (t !== t.toUpperCase()) expect(html, `${name}: ${t}`).not.toContain(t.toUpperCase());
    }
  }
});

test("I18N-24 src/components calls neither toUpperCase() nor up()", () => {
  const files = readdirSync("src/components").filter((f) => f.endsWith(".tsx"));
  expect(files.length).toBeGreaterThan(25);
  for (const f of files) {
    const code = readFileSync(`src/components/${f}`, "utf8").replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "");
    expect(code, f).not.toMatch(/toUpperCase\s*\(|(?<![\w.])up\s*\(|[,(]\s*up\s*\)/);
  }
  expect(readFileSync("src/lib/cls.ts", "utf8")).not.toMatch(/export function up\b/);
});
