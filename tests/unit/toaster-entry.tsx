// Browser entry bundled by toaster-mount.ts. `window.mountToaster(props)` mounts a `<Toaster {...props} />` in a new
// container with createRoot and returns its id, `window.renderToaster(id, props)` renders it again with new props, and
// `window.unmountToaster(id)` unmounts it. `window.toast` is the package's `toast`, so a test calls it the way a
// handler would; `window.reactVersion` is the React that runs.
import { version } from "react";
import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { Toaster, toast } from "../../src/components/Toaster";

let n = 0;
const roots: Record<string, Root> = {};

(window as any).mountToaster = (props: Record<string, unknown> = {}) => {
  const container = document.createElement("div");
  container.id = "t" + ++n;
  document.body.append(container);
  const root = (roots[container.id] = createRoot(container));
  flushSync(() => root.render(<Toaster {...props} />));
  return { id: container.id };
};
(window as any).renderToaster = (id: string, props: Record<string, unknown> = {}) =>
  flushSync(() => roots[id].render(<Toaster {...props} />));
(window as any).unmountToaster = (id: string) => roots[id].unmount();
(window as any).toast = toast;
(window as any).reactVersion = version;
