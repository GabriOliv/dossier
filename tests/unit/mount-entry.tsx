// Browser entry bundled by mount.ts: `window.mount(name, props, handlers)` mounts one library component with
// createRoot and a ref, and reports what the ref received. Each prop named in `handlers` gets a function that counts
// its calls in `window.calls[containerId][handler]`. What the ref received is kept in `window.refs[containerId]`.
import { createElement, createRef, version } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import * as lib from "../../src/index";

let count = 0;
const calls: Record<string, Record<string, number>> = {};
const refs: Record<string, Element | null> = {};

function mount(name: string, props: Record<string, unknown> = {}, handlers: string[] = []) {
  const container = document.createElement("div");
  container.id = "m" + ++count;
  document.body.append(container);
  const counts: Record<string, number> = (calls[container.id] = {});
  for (const h of handlers) {
    counts[h] = 0;
    props = { ...props, [h]: () => counts[h]++ };
  }
  const ref = createRef<Element>();
  const component = (lib as Record<string, any>)[name];
  flushSync(() => createRoot(container).render(createElement(component, { ...props, ref })));
  const el = (refs[container.id] = ref.current);
  return {
    version,
    id: container.id,
    text: container.textContent,
    ref: el ? el.tagName.toLowerCase() : null,
    refIsRoot: el !== null && el === container.firstElementChild,
  };
}

(window as any).mount = mount;
(window as any).calls = calls;
(window as any).refs = refs;
