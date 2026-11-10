// Browser entry bundled by forms-mount.ts: like mount-entry.tsx, for the form controls, but with the package stylesheet
// and a per-call event log that mount.ts lacks. `window.mountForm(name, props,
// handlers)` mounts one with createRoot and a ref. Each prop named in `handlers` gets a function that logs, per call,
// the `value` and `checked` of the event's target in `window.formCalls[containerId][handler]`.
import { createElement, createRef, version } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { Checkbox } from "../../src/components/Checkbox";
import { RadioGroup } from "../../src/components/RadioGroup";
import { Select } from "../../src/components/Select";
import { Switch } from "../../src/components/Switch";

const components: Record<string, any> = { Checkbox, RadioGroup, Select, Switch };
let count = 0;
const formCalls: Record<string, Record<string, { value: string; checked: boolean }[]>> = {};
const formRefs: Record<string, Element | null> = {};

function mountForm(name: string, props: Record<string, unknown> = {}, handlers: string[] = []) {
  const container = document.createElement("div");
  container.id = "f" + ++count;
  document.body.append(container);
  const log = (formCalls[container.id] = {} as (typeof formCalls)[string]);
  for (const h of handlers) {
    log[h] = [];
    props = {
      ...props,
      [h]: (e: { target: { value: string; checked: boolean } }) =>
        log[h].push({ value: e.target.value, checked: e.target.checked }),
    };
  }
  const ref = createRef<Element>();
  flushSync(() => createRoot(container).render(createElement(components[name], { ...props, ref })));
  const el = (formRefs[container.id] = ref.current);
  return { version, id: container.id, ref: el ? el.tagName.toLowerCase() : null };
}

(window as any).mountForm = mountForm;
(window as any).formCalls = formCalls;
(window as any).formRefs = formRefs;
