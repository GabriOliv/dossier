import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const COMPONENTS = [
  "TextField",
  "Checkbox",
  "Switch",
  "RadioGroup",
  "Select",
  "Assertion",
  "ErrorNotice",
  "SectionTitle",
  "CheckLog",
  "StatusFlag",
  "ToleranceBar",
  "BarChart",
  "LineChart",
  "Schematic",
  "ProportionDial",
  "Hierarchy",
  "Redacted",
  "Readout",
  "StageIcon",
  "Contents",
  "Dialog",
  "Pagination",
  "Spinner",
  "Toaster",
];

/** The spec's "Textos" table, ptBR column. */
const TABLE_PT_BR = {
  TextField: { required: "Obrigatório" },
  Checkbox: { required: "Obrigatório" },
  Switch: { required: "Obrigatório" },
  RadioGroup: { required: "Obrigatório" },
  Select: { required: "Obrigatório" },
  Assertion: { label: "Asserção", expected: "Esperado", actual: "Obtido", pass: "Passou", fail: "Falhou" },
  ErrorNotice: { error: "Erro" },
  SectionTitle: { section: "Seção" },
  CheckLog: { title: "Verificações", pass: "Passou", fail: "Falhou", skip: "Ignorado", pending: "Pendente" },
  StatusFlag: { pass: "Passou", fail: "Falhou", skip: "Ignorado", pending: "Pendente" },
  ToleranceBar: { within: "Dentro do limite", out: "Fora da faixa", value: "Valor", limit: "limite" },
  BarChart: { name: "Gráfico de barras" },
  LineChart: { name: "Gráfico de linhas" },
  Schematic: { name: "Esquema" },
  ProportionDial: { name: "Proporção" },
  Hierarchy: { name: "Hierarquia" },
  Redacted: { name: "Ocultado" },
  Readout: { up: "alta", down: "baixa", flat: "sem mudança" },
  StageIcon: { A: "Estágio A · Semente", B: "Estágio B · Broto", C: "Estágio C · Árvore", D: "Estágio D · Fruto" },
  Contents: { page: "Pág." },
  Dialog: { close: "Fechar" },
  Pagination: { name: "Paginação", previous: "Anterior", next: "Próxima", page: "Página" },
  Spinner: { label: "Carregando" },
  Toaster: { name: "Notificações", close: "Fechar" },
};

type Set = Record<string, Record<string, string>>;
/** The built sets, by URL so the type check does not need dist/ to exist yet. */
const built = (file: string) => import(new URL(`../../dist/locales/${file}`, import.meta.url).href);
const load = async () => ({ en: (await built("en.js")).en as Set, ptBR: (await built("pt-BR.js")).ptBR as Set });

test("I18N-10 the package exports en and ptBR from locales/en and locales/pt-BR, one key per component", async () => {
  expect(pkg.exports["./locales/en"]).toEqual({ types: "./dist/locales/en.d.ts", default: "./dist/locales/en.js" });
  expect(pkg.exports["./locales/pt-BR"]).toEqual({
    types: "./dist/locales/pt-BR.d.ts",
    default: "./dist/locales/pt-BR.js",
  });
  for (const f of ["en.js", "en.d.ts", "pt-BR.js", "pt-BR.d.ts"])
    expect(() => readFileSync(`dist/locales/${f}`), f).not.toThrow();
  const { en, ptBR } = await load();
  expect(Object.keys(en).sort()).toEqual([...COMPONENTS].sort());
  expect(Object.keys(ptBR).sort()).toEqual([...COMPONENTS].sort());
});

test("I18N-11 en and ptBR have the same keys per component, each a non-empty string", async () => {
  const { en, ptBR } = await load();
  for (const c of COMPONENTS) {
    expect(Object.keys(ptBR[c]).sort(), c).toEqual(Object.keys(en[c]).sort());
    for (const set of [en, ptBR])
      for (const [k, v] of Object.entries(set[c])) {
        expect(typeof v, `${c}.${k}`).toBe("string");
        expect(v.length, `${c}.${k}`).toBeGreaterThan(0);
      }
  }
});

test("I18N-13 every ptBR value equals the spec's table", async () => {
  expect((await load()).ptBR).toEqual(TABLE_PT_BR);
});

test("PRM-04 en and ptBR have the key required for Checkbox, Switch, RadioGroup and Select, as Required and Obrigatório", async () => {
  const { en, ptBR } = await load();
  for (const c of ["Checkbox", "Switch", "RadioGroup", "Select"]) {
    expect(en[c], `en.${c}`).toEqual({ required: "Required" });
    expect(ptBR[c], `ptBR.${c}`).toEqual({ required: "Obrigatório" });
  }
});

test("OVL-05 en and ptBR have Dialog.close, as Close and Fechar", async () => {
  const { en, ptBR } = await load();
  expect(en.Dialog).toEqual({ close: "Close" });
  expect(ptBR.Dialog).toEqual({ close: "Fechar" });
});

test("DIS-04 en and ptBR have Pagination.name, previous, next and page, as the spec's table gives them", async () => {
  const { en, ptBR } = await load();
  expect(en.Pagination).toEqual({ name: "Pagination", previous: "Previous", next: "Next", page: "Page" });
  expect(ptBR.Pagination).toEqual({ name: "Paginação", previous: "Anterior", next: "Próxima", page: "Página" });
});

test("FBL-04 en and ptBR have Spinner.label, Toaster.name and Toaster.close, as the spec's table gives them", async () => {
  const { en, ptBR } = await load();
  expect(en.Spinner).toEqual({ label: "Loading" });
  expect(ptBR.Spinner).toEqual({ label: "Carregando" });
  expect(en.Toaster).toEqual({ name: "Notifications", close: "Close" });
  expect(ptBR.Toaster).toEqual({ name: "Notificações", close: "Fechar" });
});
