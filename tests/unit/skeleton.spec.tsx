import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { renderToStaticMarkup } from "react-dom/server";
import { Skeleton } from "../../src/components/Skeleton";
import { Spinner } from "../../src/components/Spinner";

test("SKL-03 Skeleton and Spinner render on the server and their sources carry no use client", () => {
  expect(renderToStaticMarkup(<Skeleton variant="block" height={120} />)).toContain('aria-hidden="true"');
  expect(renderToStaticMarkup(<Skeleton />)).toContain("ds-skeleton-text");
  expect(renderToStaticMarkup(<Spinner />)).toContain('role="status"');
  for (const file of ["Skeleton", "Spinner"])
    expect(readFileSync(`src/components/${file}.tsx`, "utf8"), file).not.toMatch(/^\s*["']use client["']/);
});

test("SKL-03 a block Skeleton takes its height from the prop, a number as px, and a text Skeleton ignores it", () => {
  expect(renderToStaticMarkup(<Skeleton variant="block" height={120} />)).toContain('style="height:120px"');
  expect(renderToStaticMarkup(<Skeleton variant="block" height="3rem" />)).toContain('style="height:3rem"');
  expect(renderToStaticMarkup(<Skeleton variant="text" height={120} />)).not.toContain("style=");
});
