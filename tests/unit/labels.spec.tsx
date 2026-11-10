import { expect, test } from "@playwright/test";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as lib from "../../src/index";
import { en } from "../../src/locales/en";
import { ptBR } from "../../src/locales/pt-BR";
import type { Locale } from "../../src/locales/types";

type Labels = Record<string, string> | undefined;

/** One row per rendered case: the component's label set, how it renders with `labels`, and the keys it shows. */
interface Row {
  name: keyof Locale;
  render: (labels: Labels) => ReactElement;
  keys: string[];
}

export const ROWS: Row[] = [
  { name: "TextField", render: (l) => <lib.TextField label="E-mail" required labels={l} />, keys: ["required"] },
  { name: "Checkbox", render: (l) => <lib.Checkbox label="Aceito" required labels={l} />, keys: ["required"] },
  { name: "Switch", render: (l) => <lib.Switch label="Notificações" required labels={l} />, keys: ["required"] },
  {
    name: "RadioGroup",
    render: (l) => <lib.RadioGroup label="Plano" required options={[{ value: "a", label: "Básico" }]} labels={l} />,
    keys: ["required"],
  },
  {
    name: "Select",
    render: (l) => <lib.Select label="País" required options={[{ value: "br", label: "Brasil" }]} labels={l} />,
    keys: ["required"],
  },
  {
    name: "Assertion",
    render: (l) => <lib.Assertion expected="200" actual="500" labels={l} />,
    keys: ["label", "expected", "actual", "fail"],
  },
  { name: "Assertion", render: (l) => <lib.Assertion expected="200" actual="200" labels={l} />, keys: ["pass"] },
  { name: "ErrorNotice", render: (l) => <lib.ErrorNotice title="Blocked" code="R-1" labels={l} />, keys: ["error"] },
  {
    name: "SectionTitle",
    render: (l) => <lib.SectionTitle index="02" title="Findings" labels={l} />,
    keys: ["section"],
  },
  {
    name: "CheckLog",
    render: (l) => (
      <lib.CheckLog
        checks={(["pass", "fail", "skip", "pending"] as const).map((result, i) => ({
          id: "C" + i,
          label: "c",
          result,
        }))}
        labels={l}
      />
    ),
    keys: ["title", "pass", "fail", "skip", "pending"],
  },
  ...(["pass", "fail", "skip", "pending"] as const).map(
    (status): Row => ({
      name: "StatusFlag",
      render: (l) => <lib.StatusFlag status={status} labels={l} />,
      keys: [status],
    }),
  ),
  {
    name: "ToleranceBar",
    render: (l) => <lib.ToleranceBar label="" value={1} max={2} unit="ms" labels={l} />,
    keys: ["within", "value", "limit"],
  },
  {
    name: "ToleranceBar",
    render: (l) => <lib.ToleranceBar label="" value={3} max={2} unit="ms" labels={l} />,
    keys: ["out", "value", "limit"],
  },
  { name: "BarChart", render: (l) => <lib.BarChart data={[{ label: "A", value: 1 }]} labels={l} />, keys: ["name"] },
  {
    name: "LineChart",
    render: (l) => (
      <lib.LineChart
        data={[
          { x: "a", y: 1 },
          { x: "b", y: 2 },
        ]}
        labels={l}
      />
    ),
    keys: ["name"],
  },
  {
    name: "Schematic",
    render: (l) => <lib.Schematic nodes={[{ ring: 1, angle: 0, label: "core" }]} labels={l} />,
    keys: ["name"],
  },
  { name: "ProportionDial", render: (l) => <lib.ProportionDial value={40} labels={l} />, keys: ["name"] },
  { name: "Hierarchy", render: (l) => <lib.Hierarchy root={{ label: "R" }} labels={l} />, keys: ["name"] },
  { name: "Redacted", render: (l) => <lib.Redacted labels={l} />, keys: ["name"] },
  ...(["up", "down", "flat"] as const).map(
    (trend): Row => ({
      name: "Readout",
      render: (l) => <lib.Readout label="Rate" value="9" trend={trend} labels={l} />,
      keys: [trend],
    }),
  ),
  ...(["A", "B", "C", "D"] as const).map(
    (stage): Row => ({ name: "StageIcon", render: (l) => <lib.StageIcon stage={stage} labels={l} />, keys: [stage] }),
  ),
  {
    name: "Contents",
    render: (l) => <lib.Contents items={[{ title: "Scope", page: 4 }]} labels={l} />,
    keys: ["page"],
  },
  {
    name: "Dialog",
    render: (l) => (
      <lib.Dialog open title="Excluir arquivo" onClose={() => {}} labels={l}>
        Texto
      </lib.Dialog>
    ),
    keys: ["close"],
  },
  {
    name: "Pagination",
    render: (l) => <lib.Pagination page={2} total={3} labels={l} />,
    keys: ["name", "previous", "next", "page"],
  },
  { name: "Spinner", render: (l) => <lib.Spinner labels={l} />, keys: ["label"] },
  { name: "Toaster", render: (l) => <lib.Toaster labels={l} />, keys: ["name"] },
];

/**
 * Keys a server render cannot show: the close button of a toast exists only once a toast is open in the browser.
 * TST-07 (tests/unit/toaster.spec.tsx) checks it is named Close and takes labels.close.
 */
const BROWSER_ONLY: Partial<Record<keyof Locale, string[]>> = { Toaster: ["close"] };

const html = (row: Row, labels: Labels) => renderToStaticMarkup(row.render(labels));
/** What a person reads or hears: the text nodes and the aria-label values, not class names. */
const words = (html: string) =>
  [...html.matchAll(/aria-label="([^"]*)"/g)].map((m) => m[1]).join(" ") + " " + html.replace(/<[^>]+>/g, " ");
/** How many times `word` stands alone in what is read: "Pass" is not in "Passou". */
const count = (html: string, word: string) =>
  words(html).match(new RegExp(`(?<![\\p{L}])${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}])`, "gu"))
    ?.length ?? 0;
const hasWord = (html: string, word: string) =>
  new RegExp(`(?<![\\p{L}])${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}])`, "u").test(words(html));
const set = (locale: Locale, name: keyof Locale) => locale[name] as Record<string, string>;
/** Every English value of the table, of every component. */
const ALL_EN = Object.entries(en).flatMap(([name, keys]) => Object.entries(keys).map(([k, v]) => [`${name}.${k}`, v]));
/**
 * Each place key `k` fills reads its English text: swapping `k` for a marker takes away exactly one English text per
 * marker, so the English text sits where the key goes ("limit" inside "Within limit" stays).
 */
const expectEnglishAt = (row: Row, k: string) => {
  const swapped = html(row, { [k]: "Zqk" });
  const places = count(swapped, "Zqk");
  expect(places, `${row.name}.${k}`).toBeGreaterThan(0);
  const english = set(en, row.name)[k];
  expect(count(html(row, undefined), english) - count(swapped, english), `${row.name}.${k}`).toBe(places);
};

test("I18N-01 with its ptBR labels each component shows every ptBR text of the case and no English one", () => {
  for (const row of ROWS) {
    const out = html(row, set(ptBR, row.name));
    for (const k of row.keys) expect(out, `${row.name}.${k}`).toContain(set(ptBR, row.name)[k]);
    for (const [k, v] of ALL_EN) expect(hasWord(out, v), `${row.name}: ${k} (en)`).toBe(false);
  }
});

test("I18N-02 without labels each component shows the English texts where the fixed texts were", () => {
  for (const row of ROWS) {
    // The defaults are the English set, key for key.
    expect(html(row, undefined), row.name).toBe(html(row, set(en, row.name)));
    for (const k of row.keys) expectEnglishAt(row, k);
  }
});

test("I18N-03 labels with one key change that key and leave the others in English", () => {
  for (const row of ROWS)
    for (const k of row.keys) {
      const out = html(row, { [k]: `Zq${row.keys.indexOf(k)}x` });
      expect(out, `${row.name}.${k}`).toContain(`Zq${row.keys.indexOf(k)}x`);
      // Fewer of the English text than without labels (another key's English text may contain it: "Within limit").
      expect(count(out, set(en, row.name)[k]), `${row.name}.${k}`).toBeLessThan(
        count(html(row, undefined), set(en, row.name)[k]),
      );
      for (const other of row.keys.filter((o) => o !== k))
        expect(out, `${row.name}.${other}`).toContain(set(en, row.name)[other]);
    }
});

test("I18N-04 a required TextField with labels.required reads ' · Obrigatório' after its label", () => {
  const out = renderToStaticMarkup(<lib.TextField label="E-mail" required labels={{ required: "Obrigatório" }} />);
  expect(out).toContain('<span class="ds-tf-req"> · Obrigatório</span>');
});

test("I18N-12 every English value is the text the component shows without labels", () => {
  for (const row of ROWS) for (const k of row.keys) expectEnglishAt(row, k);
  // Every key of each component in the table is shown by at least one row.
  for (const name of new Set(ROWS.map((r) => r.name)))
    expect(
      [
        ...new Set([...ROWS.filter((r) => r.name === name).flatMap((r) => r.keys), ...(BROWSER_ONLY[name] ?? [])]),
      ].sort(),
      name,
    ).toEqual(Object.keys(en[name]).sort());
});

test("I18N-30 a label given as an empty string falls back to English", () => {
  for (const row of ROWS)
    for (const k of row.keys) expect(html(row, { [k]: "" }), `${row.name}.${k}`).toBe(html(row, undefined));
});

test("I18N-31 labels undefined or {} give the same markup as no labels", () => {
  for (const row of ROWS) {
    const none = renderToStaticMarkup(row.render(undefined));
    expect(html(row, {}), row.name).toBe(none);
  }
});

test("I18N-05 an out-of-range ToleranceBar with ptBR reads 'Fora da faixa +<excess><unit>' and names Valor, limite, fora da faixa", () => {
  const out = renderToStaticMarkup(
    <lib.ToleranceBar label="" value={2.5} max={2} unit="ms" labels={ptBR.ToleranceBar} />,
  );
  const state = out.match(/<span class="ds-t-label ds-tol-state">([\s\S]*?)<\/span><\/span><\/div>/)![1];
  expect(state.replace(/<svg[\s\S]*?<\/svg>/, "").replace(/<[^>]+>/g, "")).toBe("Fora da faixa +0.5 ms");
  const name = out.match(/class="ds-tol-track" role="img" aria-label="([^"]*)"/)![1].toLowerCase();
  for (const part of ["valor", "limite", "fora da faixa"]) expect(name).toContain(part);
});

test("I18N-06 a CheckLog with ptBR sums its passes and failures as '<n> Passou · <m> Falhou'", () => {
  const checks = [
    { label: "a", result: "pass" },
    { label: "b", result: "pass" },
    { label: "c", result: "fail" },
  ] as const;
  const out = renderToStaticMarkup(<lib.CheckLog checks={[...checks]} labels={ptBR.CheckLog} />);
  const sum = out.match(/<span class="ds-t-label ds-log-sum">([\s\S]*?)<\/span><\/div>/)![1];
  expect(sum.replace(/<[^>]+>/g, "")).toBe("2 Passou · 1 Falhou");
});

test("I18N-07 without labels each StageIcon is named in English", () => {
  const names = { A: "Stage A · Seed", B: "Stage B · Sprout", C: "Stage C · Tree", D: "Stage D · Fruit" };
  for (const [stage, name] of Object.entries(names)) {
    const out = renderToStaticMarkup(<lib.StageIcon stage={stage as keyof typeof names} />);
    expect(out, stage).toContain(`role="img" aria-label="${name}"`);
    expect(out, stage).toContain(`<title>${name}</title>`);
  }
});

test("I18N-12 the table covers every component with a label set", () => {
  expect([...new Set(ROWS.map((r) => r.name))].sort()).toEqual(Object.keys(en).sort());
});
