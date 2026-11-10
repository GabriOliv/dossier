import { test } from "@playwright/test";
import type { ReactElement } from "react";
import { Accordion } from "../../src/components/Accordion";
import { Pagination } from "../../src/components/Pagination";
import { Tabs } from "../../src/components/Tabs";
import { expectMarkup } from "./markup";
import { render } from "./oracle";

const noop = () => {};

const cases = (list: [string, ReactElement][]): [string, string][] => list.map(([name, el]) => [name, render(el)]);

const tabs = [
  { value: "a", label: "Resumo", content: "Painel um" },
  { value: "b", label: "Checks", content: "Painel dois" },
  { value: "c", label: "Logs", content: "Painel três", disabled: true },
];

test("DIS-01 Tabs markup matches its snapshot", () => {
  expectMarkup(
    "Tabs",
    cases([
      ["tabs and label", <Tabs tabs={tabs} label="Visões do run" />],
      ["defaultValue", <Tabs tabs={tabs} defaultValue="b" />],
      ["value and onChange", <Tabs tabs={tabs} value="b" onChange={noop} />],
      ["value outside the tabs", <Tabs tabs={tabs} value="z" />],
      ["id and className", <Tabs tabs={tabs} id="x" className="y" />],
      ["no tabs", <Tabs tabs={[]} />],
    ]),
  );
});

test("DIS-01 Accordion markup matches its snapshot", () => {
  const items = [
    { title: "Envio", content: "Em dois dias úteis." },
    { title: "Trocas", content: "Em até trinta dias.", defaultOpen: true },
  ];
  expectMarkup(
    "Accordion",
    cases([
      ["items and defaultOpen", <Accordion items={items} />],
      ["exclusive", <Accordion items={items} exclusive />],
      ["id and className", <Accordion items={items} id="x" className="y" />],
    ]),
  );
});

test("DIS-01 Pagination markup matches its snapshot", () => {
  const href = (n: number) => `?page=${n}`;
  expectMarkup(
    "Pagination",
    cases([
      ["href", <Pagination page={5} total={20} href={href} />],
      ["onChange buttons", <Pagination page={2} total={5} onChange={noop} />],
      ["first page", <Pagination page={1} total={3} href={href} />],
      ["last page", <Pagination page={3} total={3} onChange={noop} />],
      ["siblings", <Pagination page={10} total={20} siblings={2} href={href} />],
      [
        "labels, id and className",
        <Pagination
          page={2}
          total={3}
          href={href}
          labels={{ name: "Paginação", previous: "Anterior", next: "Próxima", page: "Página" }}
          id="x"
          className="y"
        />,
      ],
    ]),
  );
});
