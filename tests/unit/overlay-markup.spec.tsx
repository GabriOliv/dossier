import { test } from "@playwright/test";
import type { ReactElement } from "react";
import { Button } from "../../src/components/Button";
import { Dialog } from "../../src/components/Dialog";
import { Menu } from "../../src/components/Menu";
import { Popover } from "../../src/components/Popover";
import { Tooltip } from "../../src/components/Tooltip";
import { expectMarkup } from "./markup";
import { render } from "./oracle";

const noop = () => {};
const trigger = <Button>Ações</Button>;

const cases = (list: [string, ReactElement][]): [string, string][] => list.map(([name, el]) => [name, render(el)]);

test("OVL-01 Dialog markup matches its snapshot", () => {
  expectMarkup(
    "Dialog",
    cases([
      ["title", <Dialog open={false} onClose={noop} title="Excluir arquivo" />],
      [
        "description, children and actions",
        <Dialog
          open={false}
          onClose={noop}
          title="Excluir arquivo"
          description="Não pode ser desfeito."
          actions={<Button>Cancelar</Button>}
        >
          Os links deixam de funcionar.
        </Dialog>,
      ],
      ["alert", <Dialog open={false} onClose={noop} title="Descartar?" alert />],
      [
        "labels.close and className",
        <Dialog open={false} onClose={noop} title="T" labels={{ close: "Fechar" }} className="y" />,
      ],
      ["id and aria-label", <Dialog open={false} onClose={noop} title="T" id="x" aria-label="Excluir" />],
    ]),
  );
});

test("OVL-01 Popover markup matches its snapshot", () => {
  expectMarkup(
    "Popover",
    cases([
      ["trigger and children", <Popover trigger={trigger}>Filtros</Popover>],
      [
        "open",
        <Popover trigger={trigger} open onOpenChange={noop}>
          Filtros
        </Popover>,
      ],
      [
        "id and className",
        <Popover trigger={trigger} id="x" className="y">
          Filtros
        </Popover>,
      ],
    ]),
  );
});

test("OVL-01 Tooltip markup matches its snapshot", () => {
  expectMarkup(
    "Tooltip",
    cases([
      [
        "content",
        <Tooltip content="Copiar">
          <Button>C</Button>
        </Tooltip>,
      ],
      [
        "id and className",
        <Tooltip content="Copiar" id="x" className="y">
          <Button>C</Button>
        </Tooltip>,
      ],
      [
        "trigger with aria-describedby",
        <Tooltip content="Copiar">
          <Button aria-describedby="ext">C</Button>
        </Tooltip>,
      ],
    ]),
  );
});

test("OVL-01 Menu markup matches its snapshot", () => {
  const items = [
    { label: "Editar", onSelect: noop },
    { label: "Duplicar", onSelect: noop, disabled: true },
    { label: "Excluir", onSelect: noop, tone: "danger" as const },
  ];
  expectMarkup(
    "Menu",
    cases([
      ["items", <Menu trigger={trigger} items={items} />],
      ["id and className", <Menu trigger={trigger} items={items} id="x" className="y" />],
      ["no items", <Menu trigger={trigger} items={[]} />],
    ]),
  );
});
