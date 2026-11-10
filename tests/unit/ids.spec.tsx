import { expect, test } from "@playwright/test";
import { renderToStaticMarkup, renderToString } from "react-dom/server";
import { LineChart } from "../../src/components/LineChart";
import { TextField } from "../../src/components/TextField";

const DATA = [
  { x: "A", y: 1 },
  { x: "B", y: 3 },
];

test("IDS-03 two LineCharts each fill with their own hatch pattern", () => {
  const html = renderToStaticMarkup(
    <div>
      <LineChart data={DATA} />
      <LineChart data={DATA} />
    </div>,
  );
  const svgs = html.match(/<svg[\s\S]*?<\/svg>/g) ?? [];
  expect(svgs).toHaveLength(2);
  const patternIds = svgs.map((s) => s.match(/<pattern id="([^"]+)"/)?.[1]);
  const fillIds = svgs.map((s) => s.match(/<polygon fill="url\(#([^)]+)\)"/)?.[1]);
  expect(patternIds[0]).toBeTruthy();
  expect(patternIds[1]).toBeTruthy();
  expect(patternIds[0]).not.toBe(patternIds[1]);
  expect(fillIds[0]).toBe(patternIds[0]);
  expect(fillIds[1]).toBe(patternIds[1]);
});

test("IDS-01 a TextField keeps its id across server renders", () => {
  const el = <TextField label="Name" />;
  const first = renderToString(el).match(/<input[^>]* id="([^"]*)"/)?.[1];
  const second = renderToString(el).match(/<input[^>]* id="([^"]*)"/)?.[1];
  expect(first).toBeTruthy();
  expect(second).toBe(first);
});

test("IDS-02 two TextFields get distinct ids that their labels and messages point at", () => {
  const html = renderToStaticMarkup(
    <div>
      <TextField label="One" hint="First hint." />
      <TextField label="Two" error="Second error." />
    </div>,
  );
  const fields = html.match(/<div class="ds-textfield[\s\S]*?<\/div><\/div>/g) ?? [];
  expect(fields).toHaveLength(2);
  const read = (f: string) => ({
    input: f.match(/<input[^>]* id="([^"]*)"/)?.[1],
    labelFor: f.match(/<label[^>]* for="([^"]*)"/)?.[1],
    describedBy: f.match(/<input[^>]* aria-describedby="([^"]*)"/)?.[1],
    msgId: f.match(/<div id="([^"]*)" class="[^"]*ds-tf-msg/)?.[1],
  });
  const [a, b] = fields.map(read);
  expect(a.input).toBeTruthy();
  expect(b.input).toBeTruthy();
  expect(a.input).not.toBe(b.input);
  for (const f of [a, b]) {
    expect(f.labelFor).toBe(f.input);
    expect(f.msgId).toBeTruthy();
    expect(f.describedBy).toBe(f.msgId);
  }
  expect(a.msgId).not.toBe(b.msgId);
});
