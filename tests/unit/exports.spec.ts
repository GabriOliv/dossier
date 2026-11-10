import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const NEW = [
  "Assertion",
  "BarChart",
  "Comparison",
  "Connector",
  "Contents",
  "Dimension",
  "ErrorNotice",
  "LineChart",
  "Meter",
  "ProportionDial",
  "Redacted",
  "TextField",
  "Timeline",
  "ToleranceBar",
  "Transcript",
];

test("CMP-17 dist exports the 15 new components and their prop types", async () => {
  const lib = await import("../../dist/index.js");
  const dts = readFileSync("dist/index.d.ts", "utf8");
  for (const name of NEW) {
    const c = (lib as Record<string, any>)[name];
    expect(typeof c === "function" || c?.$$typeof === Symbol.for("react.forward_ref"), `${name} is a component`).toBe(
      true,
    );
    expect(dts, `${name}Props type`).toMatch(new RegExp(`\\btype ${name}Props\\b`));
  }
});

const PRIMITIVES = ["Button", "IconButton", "Link", "Checkbox", "RadioGroup", "Switch", "Select"];

test("PRM-01 dist exports Button, IconButton, Link, Checkbox, RadioGroup, Switch and Select, and the props type of each", async () => {
  const lib = await import("../../dist/index.js");
  const dts = readFileSync("dist/index.d.ts", "utf8");
  for (const name of PRIMITIVES) {
    const c = (lib as Record<string, any>)[name];
    expect(typeof c === "function" || c?.$$typeof === Symbol.for("react.forward_ref"), `${name} is a component`).toBe(
      true,
    );
    expect(dts, `${name}Props type`).toMatch(new RegExp(`\\btype ${name}Props\\b`));
  }
});

const OVERLAYS = ["Dialog", "Popover", "Tooltip", "Menu"];

test("OVL-01 dist exports Dialog, Popover, Tooltip and Menu, and the props type of each", async () => {
  const lib = await import("../../dist/index.js");
  const dts = readFileSync("dist/index.d.ts", "utf8");
  for (const name of OVERLAYS) {
    const c = (lib as Record<string, any>)[name];
    expect(typeof c === "function" || c?.$$typeof === Symbol.for("react.forward_ref"), `${name} is a component`).toBe(
      true,
    );
    expect(dts, `${name}Props type`).toMatch(new RegExp(`\\btype ${name}Props\\b`));
  }
  expect(dts).toMatch(/\btype MenuItem\b/);
});

const DISCLOSURE = ["Tabs", "Accordion", "Pagination"];

test("DIS-01 dist exports Tabs, Accordion and Pagination, and the props type of each", async () => {
  const lib = await import("../../dist/index.js");
  const dts = readFileSync("dist/index.d.ts", "utf8");
  for (const name of DISCLOSURE) {
    const c = (lib as Record<string, any>)[name];
    expect(typeof c === "function" || c?.$$typeof === Symbol.for("react.forward_ref"), `${name} is a component`).toBe(
      true,
    );
    expect(dts, `${name}Props type`).toMatch(new RegExp(`\\btype ${name}Props\\b`));
  }
  for (const type of ["Tab", "AccordionItem"]) expect(dts, type).toMatch(new RegExp(`\\b(type|interface) ${type}\\b`));
});

const FEEDBACK = ["Toaster", "Spinner", "Skeleton", "Stack", "Grid", "Divider", "Icon"];

test("FBL-01 dist exports Toaster, toast, Spinner, Skeleton, Stack, Grid, Divider and Icon, the props type of each and the options type of toast", async () => {
  const lib = await import("../../dist/index.js");
  const dts = readFileSync("dist/index.d.ts", "utf8");
  for (const name of FEEDBACK) {
    const c = (lib as Record<string, any>)[name];
    expect(typeof c === "function" || c?.$$typeof === Symbol.for("react.forward_ref"), `${name} is a component`).toBe(
      true,
    );
    expect(dts, `${name}Props type`).toMatch(new RegExp(`\\btype ${name}Props\\b`));
  }
  const toast = (lib as Record<string, any>).toast;
  expect(typeof toast).toBe("function");
  expect(typeof toast.dismiss).toBe("function");
  expect(dts).toMatch(/\btype ToastOptions\b/);
  expect(dts).toMatch(/\btype IconName\b/);
});
