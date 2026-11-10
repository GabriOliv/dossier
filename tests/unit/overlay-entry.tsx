// Browser entry bundled by overlay-mount.ts: `window.mountOverlay(scene, props)` mounts one of the scenes below with
// createRoot, next to the package stylesheet. A scene holds the overlay's state the way a consumer would, and counts
// each callback in `window.overlayCalls[containerId][callback]`.
import { useState, version, type ReactElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { Dialog } from "../../src/components/Dialog";
import { Menu } from "../../src/components/Menu";
import { Popover } from "../../src/components/Popover";
import { Tooltip } from "../../src/components/Tooltip";
import type { Placement } from "../../src/lib/position";

type Count = (name: string) => void;

/**
 * A button `#opener` that opens a Dialog holding `#first` (an input) and `#last` (a button). `onClose` sets `open` to
 * false, unless `keep`. `open` is the starting state. The page is taller than the window, so it can scroll.
 */
function DialogScene({ count, keep, open: start = false, ...props }: { count: Count; keep?: boolean; open?: boolean }) {
  const [open, setOpen] = useState(start);
  return (
    <>
      <button id="opener" onClick={() => setOpen(true)}>
        Open
      </button>
      <Dialog
        title="Excluir arquivo"
        {...props}
        open={open}
        onClose={() => {
          count("onClose");
          if (!keep) setOpen(false);
        }}
      >
        <input id="first" aria-label="Name" />
        <button id="last">Last</button>
      </Dialog>
      <div style={{ height: 3000 }} />
    </>
  );
}

/** Dialog `#outer` holds `#inner-opener`, which opens Dialog `#inner` from inside it. Each closes on `onClose`. */
function NestedScene({ count }: { count: Count }) {
  const [outer, setOuter] = useState(false);
  const [inner, setInner] = useState(false);
  return (
    <>
      <button id="opener" onClick={() => setOuter(true)}>
        Open
      </button>
      <Dialog
        id="outer"
        title="Outer"
        open={outer}
        onClose={() => {
          count("outer");
          setOuter(false);
        }}
      >
        <button id="inner-opener" onClick={() => setInner(true)}>
          Open inner
        </button>
        <Dialog
          id="inner"
          title="Inner"
          open={inner}
          onClose={() => {
            count("inner");
            setInner(false);
          }}
        >
          <button id="inner-button">Inner button</button>
        </Dialog>
      </Dialog>
    </>
  );
}

/**
 * `top` px of page, then `#trigger` (which counts `onClick`) and the Popover `#panel` holding `#inside` and `#last`,
 * then `#after`; the page is taller than the window. Each onOpenChange counts `onOpenChange:<value>`. With
 * `controlled` the scene holds `open` (starting at `open`) and sets it on onOpenChange, unless `keep`. `trigger`
 * replaces the trigger element, for a value that is not one.
 */
function PopoverScene({
  count,
  controlled,
  keep,
  open: start = false,
  top = 100,
  trigger,
  placement,
}: {
  count: Count;
  controlled?: boolean;
  keep?: boolean;
  open?: boolean;
  top?: number;
  trigger?: unknown;
  placement?: Placement;
}) {
  const [open, setOpen] = useState(start);
  return (
    <>
      <div style={{ height: top }} />
      <Popover
        id="panel"
        placement={placement}
        trigger={
          trigger === undefined ? (
            <button id="trigger" onClick={() => count("onClick")}>
              Filtros
            </button>
          ) : (
            (trigger as ReactElement)
          )
        }
        open={controlled ? open : undefined}
        onOpenChange={(next) => {
          count("onOpenChange:" + next);
          if (!keep) setOpen(next);
        }}
      >
        <button id="inside">Inside</button>
        <button id="last">Last</button>
      </Popover>
      <button id="after">After</button>
      <div style={{ height: 3000 }} />
    </>
  );
}

/** 200 px of page, then a Tooltip `Copiar` on `#trigger` (disabled with `disabled`), then `#other`, in a page taller than the window. */
function TooltipScene({ disabled }: { disabled?: boolean }) {
  return (
    <>
      <div style={{ height: 200 }} />
      <Tooltip id="tip" content="Copiar">
        <button id="trigger" disabled={disabled}>
          C
        </button>
      </Tooltip>
      <button id="other">Other</button>
      <div style={{ height: 3000 }} />
    </>
  );
}

/**
 * `top` px of page, then a Menu `#menu` on `#trigger` with an item per `labels` (Editar, Duplicar, Excluir by default),
 * each `disabled` or `danger` by index, then `#after`, in a page taller than the window. Each onSelect counts
 * `onSelect:<label>`. `trigger` replaces the trigger element, for a value that is not one.
 */
function MenuScene({
  count,
  labels = ["Editar", "Duplicar", "Excluir"],
  disabled = [],
  danger = [],
  top = 100,
  trigger,
}: {
  count: Count;
  labels?: string[];
  disabled?: number[];
  danger?: number[];
  top?: number;
  trigger?: unknown;
}) {
  return (
    <>
      <div style={{ height: top }} />
      <Menu
        id="menu"
        trigger={trigger === undefined ? <button id="trigger">Ações</button> : (trigger as ReactElement)}
        items={labels.map((label, i) => ({
          label,
          onSelect: () => count("onSelect:" + label),
          disabled: disabled.includes(i),
          tone: danger.includes(i) ? "danger" : undefined,
        }))}
      />
      <button id="after">After</button>
      <div style={{ height: 3000 }} />
    </>
  );
}

/**
 * The four overlays at once, each with a ref, an `id` `r-<name>`, a `data-testid`, `aria-label`, a style, a class `x`
 * and an `onClick`. The element each ref received is kept in `window.overlayRefs[name]`.
 */
function RefsScene({ count }: { count: Count }) {
  const own = (name: string) => ({
    id: "r-" + name,
    "data-testid": name,
    "aria-label": "L-" + name,
    className: "x",
    style: { marginTop: 4 },
    onClick: () => count("onClick:" + name),
    ref: (el: Element | null) => {
      overlayRefs[name] = el;
    },
  });
  return (
    <>
      <Dialog title="T" open={false} onClose={() => {}} {...own("Dialog")} />
      <Popover trigger={<button>P</button>} {...own("Popover")} />
      <Tooltip content="C" {...own("Tooltip")}>
        <button>T</button>
      </Tooltip>
      <Menu trigger={<button>M</button>} items={[{ label: "Editar", onSelect: () => {} }]} {...own("Menu")} />
    </>
  );
}

/**
 * An open Dialog `#dlg` holding a Popover `#p-panel` on `#p-trigger`, a Menu `#m-menu` on `#m-trigger` and a Tooltip
 * `#t-tip` (Copiar) on `#t-trigger`. The Dialog's onClose counts `onClose` and closes it.
 */
function InDialogScene({ count }: { count: Count }) {
  const [open, setOpen] = useState(true);
  return (
    <Dialog
      id="dlg"
      title="Filtros"
      open={open}
      onClose={() => {
        count("onClose");
        setOpen(false);
      }}
    >
      <Popover id="p-panel" trigger={<button id="p-trigger">Filtro</button>}>
        <button id="p-inside">Inside</button>
      </Popover>
      <Menu
        id="m-menu"
        trigger={<button id="m-trigger">Ações</button>}
        items={[{ label: "Editar", onSelect: () => count("onSelect:Editar") }]}
      />
      <Tooltip id="t-tip" content="Copiar">
        <button id="t-trigger">C</button>
      </Tooltip>
    </Dialog>
  );
}

const scenes: Record<string, (p: any) => ReactElement> = {
  Refs: RefsScene,
  Dialog: DialogScene,
  Nested: NestedScene,
  Popover: PopoverScene,
  Tooltip: TooltipScene,
  Menu: MenuScene,
  InDialog: InDialogScene,
};
let n = 0;
const overlayCalls: Record<string, Record<string, number>> = {};
const overlayRefs: Record<string, Element | null> = {};

(window as any).mountOverlay = (scene: string, props: Record<string, unknown> = {}) => {
  const container = document.createElement("div");
  container.id = "o" + ++n;
  document.body.append(container);
  const counts: Record<string, number> = (overlayCalls[container.id] = {});
  const count: Count = (name) => (counts[name] = (counts[name] ?? 0) + 1);
  const Scene = scenes[scene];
  flushSync(() => createRoot(container).render(<Scene {...props} count={count} />));
  return { version, id: container.id };
};
(window as any).overlayCalls = overlayCalls;
(window as any).overlayRefs = overlayRefs;
