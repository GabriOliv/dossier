import { readFileSync } from "node:fs";
import { Session } from "node:inspector/promises";
import { runInNewContext } from "node:vm";
import { expect, test } from "@playwright/test";
import React, { type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Redacted } from "../../src/components/Redacted";
import { Meter } from "../../src/components/Meter";
import { Comparison } from "../../src/components/Comparison";
import { Contents } from "../../src/components/Contents";
import { Transcript } from "../../src/components/Transcript";
import { Assertion } from "../../src/components/Assertion";
import { ErrorNotice } from "../../src/components/ErrorNotice";
import { BarChart } from "../../src/components/BarChart";
import { Timeline } from "../../src/components/Timeline";
import { Dimension } from "../../src/components/Dimension";
import { Connector } from "../../src/components/Connector";
import { ProportionDial } from "../../src/components/ProportionDial";
import { LineChart } from "../../src/components/LineChart";
import { ToleranceBar } from "../../src/components/ToleranceBar";
import { TextField } from "../../src/components/TextField";
import { CASES } from "./cases";
import { expectMarkup } from "./markup";
import { render } from "./oracle";

const PORTS: Record<string, ComponentType<any>> = {
  Redacted,
  Meter,
  Comparison,
  Contents,
  Transcript,
  Assertion,
  ErrorNotice,
  BarChart,
  Timeline,
  Dimension,
  Connector,
  ProportionDial,
  LineChart,
  ToleranceBar,
  TextField,
};

for (const [name, C] of Object.entries(PORTS)) {
  test(`VIS-11 ${name} markup matches its snapshot`, () => {
    expectMarkup(
      name,
      CASES[name].map(([caseName, props]) => [caseName, render(<C {...props} />)]),
    );
  });
}

const dts = readFileSync(new URL("../../source/components/index.d.ts", import.meta.url), "utf8");

/** `[name, type]` of each top-level field of `export interface <iface> { ... }` in index.d.ts. */
function fields(iface: string): [string, string][] {
  const start = dts.indexOf(`export interface ${iface} {`);
  if (start < 0) throw new Error(`no ${iface} in index.d.ts`);
  const body = dts.slice(dts.indexOf("{", start) + 1, dts.indexOf("\n}", start));
  return [...body.matchAll(/^ {2}(\w+)\??: (.+);$/gm)].map((m) => [m[1], m[2]]);
}

/** Interfaces of index.d.ts named in a field type, e.g. `BarDatum` in `BarDatum[]`. */
const nested = (type: string) =>
  [...type.matchAll(/\b([A-Z]\w+)\b/g)].map((m) => m[1]).filter((n) => dts.includes(`export interface ${n} {`));

test("CMP-16 every case table covers every prop of index.d.ts", () => {
  expect(Object.keys(CASES).sort()).toEqual([
    "Assertion",
    "BarChart",
    "Comparison",
    "Connector",
    "Contents",
    "Dimension",
    "ErrorNotice",
    "LineChart",
    "Meter",
    "ProportionDial",
    "Redacted",
    "TextField",
    "Timeline",
    "ToleranceBar",
    "Transcript",
  ]);
  for (const [name, cases] of Object.entries(CASES)) {
    const props = cases.map(([, p]) => p as Record<string, unknown>);
    const used = new Set(props.flatMap((p) => Object.keys(p)));
    const top = fields(name + "Props");
    expect(
      top.filter(([f]) => !used.has(f)).map(([f]) => f),
      `${name}: props with no case`,
    ).toEqual([]);
    // Fields of nested interfaces (list items, segments, columns) are covered by the values passed in that prop.
    for (const [field, type] of top) {
      for (const iface of nested(type)) {
        const values = props.flatMap((p) => [p[field]].flat()).filter((v) => v && typeof v === "object");
        const seen = new Set(values.flatMap((v) => Object.keys(v as object)));
        expect(
          fields(iface)
            .filter(([f]) => !seen.has(f))
            .map(([f]) => f),
          `${name}.${field} (${iface}): fields with no case`,
        ).toEqual([]);
      }
    }
  }
});

// Blocks of the 15 originals that no meaningful props reach, by line of source/components/bundle.js, with the reason.
const UNREACHED: Record<number, string> = {
  411: "leader(): `ex = qx + sx * 12` runs only when the 45° stub overshoots the callout column, which needs a negative radius",
};

test("CMP-16 the cases run every block of the 15 originals", async () => {
  const source = readFileSync(new URL("../../source/components/bundle.js", import.meta.url), "utf8");
  const session = new Session();
  session.connect();
  await session.post("Profiler.enable");
  await session.post("Profiler.startPreciseCoverage", { callCount: true, detailed: true });
  // A fresh copy of the original, compiled after coverage starts so V8 counts every block.
  const sandbox: { window: { React: typeof React; Dossier?: Record<string, ComponentType<any>> } } = {
    window: { React },
  };
  runInNewContext(source, sandbox, { filename: "dossier-bundle-coverage.js" });
  for (const [name, cases] of Object.entries(CASES)) {
    for (const [, props] of cases) renderToStaticMarkup(React.createElement(sandbox.window.Dossier![name], props));
  }
  const { result } = await session.post("Profiler.takePreciseCoverage");
  await session.post("Profiler.stopPreciseCoverage");
  session.disconnect();

  const fns = result.find((s) => s.url.endsWith("dossier-bundle-coverage.js"))!.functions;
  const targets = fns.filter((f) => [...Object.keys(CASES), "leader"].includes(f.functionName));
  expect(targets.map((f) => f.functionName).sort()).toEqual([...Object.keys(CASES), "leader"].sort());
  const line = (offset: number) => source.slice(0, offset).split("\n").length;
  const unreached = new Map<number, string>();
  for (const t of targets) {
    const [{ startOffset: s, endOffset: e }] = t.ranges;
    for (const f of fns) {
      if (f.ranges[0].startOffset < s || f.ranges[0].endOffset > e) continue;
      for (const r of f.ranges) {
        const code = source.slice(r.startOffset, r.endOffset);
        // V8 also reports the empty tail after a return; only code counts.
        // `var p = props || {}`: React always passes a props object, so the fallback never runs.
        const propsFallback = /^\s*var p = props \|\| \{\};/.test(source.split("\n")[line(r.startOffset) - 1]);
        if (r.count === 0 && /[^\s});]/.test(code) && !propsFallback) {
          unreached.set(line(r.startOffset), `${t.functionName}: ${code.trim().slice(0, 80)}`);
        }
      }
    }
  }
  const unexpected = [...unreached].filter(([l]) => !(l in UNREACHED));
  expect(unexpected, "blocks of the originals that no case runs").toEqual([]);
  expect(
    Object.keys(UNREACHED).filter((l) => !unreached.has(Number(l))),
    "allow-listed lines that now run",
  ).toEqual([]);
});
