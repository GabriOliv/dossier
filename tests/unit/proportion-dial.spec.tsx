import { expect, test } from "@playwright/test";
import { ProportionDial, type ProportionDialProps } from "../../src/components/ProportionDial";
import { CASES } from "./cases";
import { render, renderOriginal } from "./oracle";

/** Ink above and below the baseline: figure 48px digits, label 11px caps (cap height about 0.7 em). */
const INK: Record<string, [number, number]> = { "ds-pd-value": [34, 1], "ds-pd-label": [8, 2], "ds-pd-text": [8, 2] };

/** Each callout text of the markup with its side and vertical ink, and the viewBox's vertical span. */
function layout(html: string) {
  const [, top, height] = html.match(/viewBox="0 (-?[\d.]+) [\d.]+ ([\d.]+)"/)!.map(Number);
  const texts = [
    ...html.matchAll(/<text class="[^"]*(ds-pd-\w+)" x="[^"]*" y="([^"]*)" text-anchor="(\w+)">([^<]*)/g),
  ].map(([, cls, y, side, text]) => ({ text, side, top: Number(y) - INK[cls][0], bottom: Number(y) + INK[cls][1] }));
  return { texts, top, bottom: top + height };
}

function problems(props: ProportionDialProps) {
  const { texts, top, bottom } = layout(render(<ProportionDial {...props} />));
  const found: string[] = [];
  for (const t of texts) if (t.top < top || t.bottom > bottom) found.push(`${t.text} leaves the canvas`);
  for (let i = 0; i < texts.length; i++)
    for (let j = i + 1; j < texts.length; j++) {
      const [a, b] = [texts[i], texts[j]];
      if (a.side === b.side && a.top < b.bottom && b.top < a.bottom) found.push(`${a.text} overlaps ${b.text}`);
    }
  return found;
}

const STORY = {
  label: "Deep learning",
  segments: [
    { angle: -25, label: "Forecasting" },
    { angle: 35, label: "Ranking" },
    { angle: 150, label: "Personalization" },
  ],
};

test("DIAL-01 no callout text overlaps another or leaves the canvas, for every value", () => {
  const crowded = Array.from({ length: 18 }, (_, i) => ({ angle: i * 20, label: "Seg " + i }));
  for (let value = 0; value <= 100; value++) {
    for (const props of [
      { ...STORY, value },
      { value, segments: STORY.segments },
      { ...STORY, value, segments: crowded },
    ]) {
      expect(problems(props), `value ${value}, ${props.segments.length} segments`).toEqual([]);
    }
  }
});

test("DIAL-02 the original overlaps at 71% and clips the label at 50%, the defects DIAL-01 rules out", () => {
  const original = (props: ProportionDialProps) => layout(renderOriginal("ProportionDial", props));
  const at71 = original({ ...STORY, value: 71 }).texts;
  const label = at71.find((t) => t.text === "DEEP LEARNING")!;
  const seg = at71.find((t) => t.text === "PERSONALIZATION")!;
  expect(label.top < seg.bottom && seg.top < label.bottom).toBe(true);
  const at50 = original({ ...STORY, value: 50 });
  expect(at50.texts.find((t) => t.text === "DEEP LEARNING")!.bottom).toBeGreaterThan(at50.bottom);
});

test("DIAL-03 the fixed parity case changes only the colliding callout and the canvas height", () => {
  const props = CASES.ProportionDial.find(([name]) => name === "every prop")![1] as ProportionDialProps;
  const port = render(<ProportionDial {...props} />);
  const orig = renderOriginal("ProportionDial", props);
  const passed =
    /<polyline class="ds-pd-leader" points="250,248 [^"]*"><\/polyline>(<circle[^>]*><\/circle>)<text[^>]*>PASSED<\/text>/i;
  const strip = (html: string) =>
    html.replace(/viewBox="[^"]*" width="(\d+)" height="\d+"/, "$1").replace(passed, "$1");
  // The original uppercases its texts in JS; the port leaves that to CSS (I18N-20), so case is not compared.
  expect(strip(port).toUpperCase()).toBe(strip(orig).toUpperCase());
  expect(problems(props)).toEqual([]);
});
