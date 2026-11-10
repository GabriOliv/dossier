import { expect, test } from "@playwright/test";
import { Hierarchy, type HierarchyProps } from "../../src/components/Hierarchy";
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

test("VIS-11 Hierarchy markup matches its snapshot", () => {
  expectMarkup(
    "Hierarchy",
    cases.map(([name, props]) => [name, render(<Hierarchy {...props} />)]),
  );
});

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
