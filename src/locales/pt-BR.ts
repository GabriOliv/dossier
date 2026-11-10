import type { Locale } from "./types";

/** Brazilian Portuguese texts, passed per component: `labels={ptBR.TextField}`. */
export const ptBR = {
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
} as const satisfies Locale;

export type { Locale };
