import { expect, test } from "@playwright/test";
import { renderToStaticMarkup } from "react-dom/server";
import { Link, type LinkProps } from "../../src/components/Link";
import { expectMarkup } from "./markup";
import { render } from "./oracle";

const cases: [string, LinkProps][] = [
  ["href and text", { href: "/x", children: "Documentation" }],
  ["className", { href: "/x", className: "y", children: "Documentation" }],
  ["target and rel", { href: "https://example.com", target: "_blank", rel: "noreferrer", children: "External" }],
  [
    "element children",
    {
      href: "/x",
      children: (
        <>
          Docs <em>now</em>
        </>
      ),
    },
  ],
  ["id and aria-label", { href: "/x", id: "x", "aria-label": "Read the docs", children: "Docs" }],
];

test("LNK-01 Link markup matches its snapshot", () => {
  expectMarkup(
    "Link",
    cases.map(([name, props]) => [name, render(<Link {...props} />)]),
  );
});

test("LNK-01 a Link with href /x and children is an a element with href /x and class ds-link around the children", () => {
  expect(renderToStaticMarkup(<Link href="/x">Documentation</Link>)).toBe(
    '<a href="/x" class="ds-link">Documentation</a>',
  );
  expect(
    renderToStaticMarkup(
      <Link href="/x">
        Docs <em>now</em>
      </Link>,
    ),
  ).toBe('<a href="/x" class="ds-link">Docs <em>now</em></a>');
});

test("LNK-01 className is added after ds-link and native attributes reach the anchor", () => {
  expect(
    renderToStaticMarkup(
      <Link href="/x" className="x" target="_blank" rel="noreferrer">
        Docs
      </Link>,
    ),
  ).toBe('<a href="/x" target="_blank" rel="noreferrer" class="ds-link x">Docs</a>');
});
