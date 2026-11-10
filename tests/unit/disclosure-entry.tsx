// Browser entry bundled by disclosure-mount.ts: `window.mountDisclosure(scene, props)` mounts one of the scenes below
// with createRoot, next to the package stylesheet. A scene holds the component's state the way a consumer would, and
// counts each callback in `window.disclosureCalls[containerId][callback]`.
import { useEffect, useState, version, type ReactElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { Accordion } from "../../src/components/Accordion";
import { Dialog } from "../../src/components/Dialog";
import { Pagination } from "../../src/components/Pagination";
import { Tabs } from "../../src/components/Tabs";

type Count = (name: string) => void;

/**
 * A Pagination with `page`, `total`, `siblings` and `labels`. With `links`, page n links to `?page=n`; with `change`,
 * each onChange counts `onChange:<page>:<event type>:<tag of the clicked element>`, and with `prevent` it also cancels
 * the click.
 */
function PaginationScene({
  count,
  links,
  change,
  prevent,
  ...props
}: {
  count: Count;
  links?: boolean;
  change?: boolean;
  prevent?: boolean;
  page: number;
  total: number;
  siblings?: number;
  labels?: Record<string, string>;
}) {
  return (
    <Pagination
      id="pg"
      {...props}
      href={links ? (n) => `?page=${n}` : undefined}
      onChange={
        change
          ? (n, e) => {
              count(`onChange:${n}:${e.type}:${e.currentTarget.tagName}`);
              if (prevent) e.preventDefault();
            }
          : undefined
      }
    />
  );
}

/**
 * An Accordion `#<id>` (`acc` by default) with an item per `titles` (Envio, Trocas, Pagamento by default), whose
 * content is `Texto de <title>`, open by default at the indexes of `open`.
 */
function AccordionScene({
  id = "acc",
  titles = ["Envio", "Trocas", "Pagamento"],
  open = [],
  exclusive,
}: {
  id?: string;
  titles?: string[];
  open?: number[];
  exclusive?: boolean;
}) {
  return (
    <Accordion
      id={id}
      exclusive={exclusive}
      items={titles.map((title, i) => ({ title, content: `Texto de ${title}`, defaultOpen: open.includes(i) }))}
    />
  );
}

interface TabSpec {
  value: string;
  label: string;
  disabled?: boolean;
}

const TABS: TabSpec[] = [
  { value: "a", label: "Resumo" },
  { value: "b", label: "Checks" },
  { value: "c", label: "Logs" },
];

/**
 * `#before`, then a Tabs `#tabs` named `Visões do run` with `tabs` (Resumo a, Checks b, Logs c by default), each panel
 * `Painel <label>`, then `#after`. Each onChange counts `onChange:<value>`. With `controlled` the scene holds `value`
 * (starting at `value`) and sets it on onChange, unless `keep`; otherwise it passes `defaultValue`.
 */
function TabsScene({
  count,
  tabs: first = TABS,
  controlled,
  keep,
  value: start,
  defaultValue,
  then,
}: {
  count: Count;
  tabs?: TabSpec[];
  controlled?: boolean;
  keep?: boolean;
  value?: string;
  defaultValue?: string;
  /** Tabs that replace `tabs` 50 ms after mount, as when they load later. */
  then?: TabSpec[];
}) {
  const [value, setValue] = useState(start);
  const [tabs, setTabs] = useState(first);
  useEffect(() => {
    if (!then) return;
    const t = setTimeout(() => setTabs(then), 50);
    return () => clearTimeout(t);
  }, []);
  return (
    <>
      <button id="before">Before</button>
      <Tabs
        id="tabs"
        label="Visões do run"
        tabs={tabs.map((tab) => ({ ...tab, content: `Painel ${tab.label}` }))}
        value={controlled ? value : undefined}
        defaultValue={defaultValue}
        onChange={(next) => {
          count("onChange:" + next);
          if (controlled && !keep) setValue(next);
        }}
      />
      <button id="after">After</button>
    </>
  );
}

/** An open Dialog `#dlg` holding the Tabs of TabsScene and a button `#last`. onClose counts `onClose` and closes it. */
function TabsInDialogScene({ count }: { count: Count }) {
  const [open, setOpen] = useState(true);
  return (
    <Dialog
      id="dlg"
      title="Run 42"
      open={open}
      onClose={() => {
        count("onClose");
        setOpen(false);
      }}
    >
      <Tabs
        id="tabs"
        tabs={TABS.map((tab) => ({ ...tab, content: `Painel ${tab.label}` }))}
        onChange={(next) => count("onChange:" + next)}
      />
      <button id="last">Last</button>
    </Dialog>
  );
}

const scenes: Record<string, (p: any) => ReactElement | null> = {
  Pagination: PaginationScene,
  Accordion: AccordionScene,
  Tabs: TabsScene,
  TabsInDialog: TabsInDialogScene,
};
let n = 0;
const disclosureCalls: Record<string, Record<string, number>> = {};

(window as any).mountDisclosure = (scene: string, props: Record<string, unknown> = {}) => {
  const container = document.createElement("div");
  container.id = "d" + ++n;
  document.body.append(container);
  const counts: Record<string, number> = (disclosureCalls[container.id] = {});
  const count: Count = (name) => (counts[name] = (counts[name] ?? 0) + 1);
  const Scene = scenes[scene];
  flushSync(() => createRoot(container).render(<Scene {...props} count={count} />));
  return { version, id: container.id };
};
(window as any).disclosureCalls = disclosureCalls;
