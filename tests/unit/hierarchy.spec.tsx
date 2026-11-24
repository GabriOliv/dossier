import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { renderToString } from "react-dom/server";
import { Hierarchy, type HierarchyNode, type HierarchyProps } from "../../src/components/Hierarchy";
import { expectMarkup } from "./markup";
import { render } from "./oracle";

const cases: [string, HierarchyProps][] = [
  [
    "CTFL, CTAL, then CT-TAS and CTAL-TM",
    {
      title: "ISTQB credential structure",
      root: {
        code: "CTFL",
        label: "Foundation",
        children: [
          {
            code: "CTAL",
            label: "Advanced",
            children: [
              { code: "CT-TAS", label: "Test Automation Strategy" },
              { code: "CTAL-TM", label: "Test Management" },
            ],
          },
        ],
      },
    },
  ],
  ["single root", { root: { code: "CTFL", label: "Foundation" } }],
  [
    "active node without code",
    { root: { label: "Root", children: [{ label: "Leaf", active: true }] }, className: "x" },
  ],
];

test("A11Y-40 the Hierarchy root is focusable with tabindex 0", () => {
  const html = render(<Hierarchy title="Tree" root={{ label: "R", children: [{ label: "C" }] }} />);
  expect(html.match(/^<div [^>]*>/)![0]).toBe('<div class="ds-tree" aria-label="Tree" tabindex="0">');
  expect(html.match(/tabindex/g)).toHaveLength(1);
});

test("A11Y-41 a tabIndex from the consumer replaces the Hierarchy's own", () => {
  for (const [tabIndex, attr] of [
    [-1, 'tabindex="-1"'],
    [3, 'tabindex="3"'],
  ] as const) {
    const html = render(<Hierarchy root={{ label: "R" }} tabIndex={tabIndex} />);
    expect(html.match(/^<div [^>]*>/)![0]).toBe(`<div class="ds-tree" aria-label="Hierarchy" ${attr}>`);
  }
});

test("CERT-01 Hierarchy renders nothing without a root", () => {
  expect(render(<Hierarchy root={null} />)).toBe("");
  expect(render(<Hierarchy root={null} />)).toBe("");
});

const LAYOUTS = [
  ["top-down", "ds-tree"],
  ["left-right", "ds-tree ds-tree-lr"],
  ["folder", "ds-tree ds-tree-folder"],
] as const;

const TREE: HierarchyNode = {
  code: "CTFL",
  label: "Foundation",
  children: [{ label: "Advanced", children: [{ label: "Test Management", active: true }] }, { label: "Agile" }],
};

test("VIS-11 Hierarchy markup matches its snapshot", () => {
  expectMarkup("Hierarchy", [
    ...cases.map(([name, props]): [string, string] => [name, render(<Hierarchy {...props} />)]),
    ...LAYOUTS.map(([layout]): [string, string] => [
      `layout ${layout}`,
      render(<Hierarchy title="Credentials" root={TREE} layout={layout} />),
    ]),
  ]);
});

test("TREE-05 the cases of 1.1.0 keep their markup byte for byte in the snapshot", () => {
  const text = readFileSync("tests/unit/__snapshots__/Hierarchy.html", "utf8");
  const before = text.slice(0, text.indexOf("\n## layout "));
  // sha256 of tests/unit/__snapshots__/Hierarchy.html at v1.1.0, which held only these cases.
  expect(createHash("sha256").update(before).digest("hex")).toBe(
    "a4e0356987291d069f59d3bcbfb6a0a39fa21474b7a9a78cba79680961d36d39",
  );
  // The 1.1.0 cases, rendered now without layout, are that text, in the format of expectMarkup.
  const now = cases.map(([name, props]) => `## ${name}\n${render(<Hierarchy {...props} />)}\n`).join("\n");
  expect(now).toBe(before);
});

test("TREE-15 every layout keeps the name, tabindex 0 and the nested lists of the top-down tree", () => {
  const plain = render(<Hierarchy title="Credentials" root={TREE} />);
  for (const [layout, cls] of LAYOUTS) {
    const html = render(<Hierarchy title="Credentials" root={TREE} layout={layout} />);
    expect(html.match(/^<div [^>]*>/)![0], layout).toBe(`<div class="${cls}" aria-label="Credentials" tabindex="0">`);
    // Past the root tag the markup is the top-down tree's: the same <ul>/<li> nesting and nodes.
    expect(html.replace(/^<div [^>]*>/, ""), layout).toBe(plain.replace(/^<div [^>]*>/, ""));
    expect(html.match(/<ul>/g), layout).toHaveLength(3);
    expect(html.match(/<li>/g), layout).toHaveLength(4);
  }
});

test("TREE-16 a layout other than the three renders the top-down markup", () => {
  const plain = render(<Hierarchy title="Credentials" root={TREE} />);
  for (const layout of ["diagonal", "", "LEFT-RIGHT"]) {
    expect(render(<Hierarchy title="Credentials" root={TREE} layout={layout as HierarchyProps["layout"]} />)).toBe(
      plain,
    );
  }
  expect(render(<Hierarchy title="Credentials" root={TREE} layout="top-down" />)).toBe(plain);
});

test("TREE-17 every layout renders on the server, and Hierarchy is not a client component", () => {
  expect(readFileSync("src/components/Hierarchy.tsx", "utf8")).not.toContain('"use client"');
  for (const [layout] of LAYOUTS) {
    const html = renderToString(<Hierarchy root={TREE} layout={layout} />);
    expect(html, layout).toContain(">Test Management</span>");
  }
});
