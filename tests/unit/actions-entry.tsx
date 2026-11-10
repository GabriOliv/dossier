// Browser entry bundled by actions-mount.ts: `window.mountAction(name, props, handlers)` mounts one of the action
// components with createRoot, as mount-entry.tsx does for the exported ones, but with the package stylesheet
// and a per-call event log that mount.ts lacks. Each prop named in `handlers` counts its calls in
// `window.actionCalls[containerId][handler]`. `window.rerenderAction(id, props)` renders the same component in
// container `id` again with new props, keeping the handlers.
import { createElement, version } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { Button } from "../../src/components/Button";
import { IconButton } from "../../src/components/IconButton";

const components: Record<string, any> = { Button, IconButton };
let count = 0;
const actionCalls: Record<string, Record<string, number>> = {};
const mounted: Record<
  string,
  { root: ReturnType<typeof createRoot>; name: string; handlers: Record<string, () => number> }
> = {};

(window as any).mountAction = (name: string, props: Record<string, unknown> = {}, handlers: string[] = []) => {
  const container = document.createElement("div");
  container.id = "a" + ++count;
  document.body.append(container);
  const counts: Record<string, number> = (actionCalls[container.id] = {});
  const calls: Record<string, () => number> = {};
  for (const h of handlers) {
    counts[h] = 0;
    calls[h] = () => counts[h]++;
  }
  const root = createRoot(container);
  mounted[container.id] = { root, name, handlers: calls };
  flushSync(() => root.render(createElement(components[name], { ...props, ...calls })));
  return { version, id: container.id };
};
(window as any).rerenderAction = (id: string, props: Record<string, unknown> = {}) => {
  const { root, name, handlers } = mounted[id];
  flushSync(() => root.render(createElement(components[name], { ...props, ...handlers })));
};
(window as any).actionCalls = actionCalls;
