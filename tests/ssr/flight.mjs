// Under the react-server condition: renders Pagination, Button and IconButton from dist through React Flight, the
// renderer Next.js uses for Server Components, and prints for each named case the distinct errors it reported (the first
// line of each message, once however many elements raise it) and the payload it produced. An event handler on an element of a Server Component is such an error.
// Usage: node --conditions=react-server --import ./tests/ssr/register-react19.mjs tests/ssr/flight.mjs
import { PassThrough } from "node:stream";
import { createElement } from "react";
import { renderToPipeableStream } from "react-server-dom-webpack/server.node";
import { Button } from "../../dist/components/Button.js";
import { IconButton } from "../../dist/components/IconButton.js";
import { Pagination } from "../../dist/components/Pagination.js";

const href = (n) => `/runs?page=${n}`;
const cases = {
  "pagination-href": [Pagination, { page: 2, total: 3, href }],
  "pagination-buttons": [Pagination, { page: 2, total: 3 }],
  "pagination-onchange": [Pagination, { page: 2, total: 3, href, onChange: () => {} }],
  "pagination-onchange-single": [Pagination, { page: 1, total: 1, href, onChange: () => {} }],
  button: [Button, { children: "Save" }],
  "button-loading": [Button, { loading: true, children: "Saving" }],
  iconbutton: [IconButton, { label: "x", children: "x" }],
  "iconbutton-loading": [IconButton, { label: "x", loading: true, children: "x" }],
};

const render = (component, props) =>
  new Promise((resolve) => {
    const errors = [];
    const stream = new PassThrough();
    const chunks = [];
    stream.on("data", (c) => chunks.push(c));
    stream.on("end", () => resolve({ errors, payload: Buffer.concat(chunks).toString("utf8") }));
    renderToPipeableStream(
      createElement(component, props),
      {},
      {
        onError: (e) => {
          const line = String(e?.message ?? e).split("\n")[0];
          if (!errors.includes(line)) errors.push(line);
        },
      },
    ).pipe(stream);
  });

const out = {};
for (const [name, [component, props]] of Object.entries(cases)) out[name] = await render(component, props);
process.stdout.write(JSON.stringify(out));
