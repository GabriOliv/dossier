import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

// Renders Pagination, Button and IconButton from dist through React Flight (tests/ssr/flight.mjs), once for all tests.
type Flight = Record<string, { errors: string[]; payload: string }>;
const flight = JSON.parse(
  execFileSync(
    "node",
    ["--conditions=react-server", "--import", "./tests/ssr/register-react19.mjs", "tests/ssr/flight.mjs"],
    { encoding: "utf8" },
  ),
) as Flight;
const handler = "Event handlers cannot be passed to Client Component props.";
const section = (heading: string) =>
  readFileSync("README.md", "utf8")
    .split(/^## /m)
    .find((s) => s.startsWith(`${heading}\n`)) ?? "";

test("RVW-01 Flight renders Pagination with href and no onChange with no error", () => {
  expect(flight["pagination-href"].errors).toEqual([]);
});

test("RVW-02 the Flight payload of Pagination with href holds the address of pages 1, 2 and 3", () => {
  for (const n of [1, 2, 3]) expect(flight["pagination-href"].payload).toContain(`/runs?page=${n}`);
});

test("RVW-03 Flight renders Pagination with no href and no onChange with no error", () => {
  expect(flight["pagination-buttons"].errors).toEqual([]);
});

test("RVW-17 Flight reports the event handler error for Pagination given onChange", () => {
  expect(flight["pagination-onchange"].errors).toEqual([handler]);
});

test("RVW-19 Flight reports no error for Pagination given onChange with total 1, which renders nothing", () => {
  expect(flight["pagination-onchange-single"].errors).toEqual([]);
});

test("RVW-20 the README Server Components section excepts Pagination with onChange", () => {
  expect(section("Server Components and sourcemaps")).toContain(
    "`Accordion` and `Pagination` carry no state, so they work in a Server Component, except a `Pagination` with `onChange`.",
  );
});

test("RVW-06 the README Disclosure section says Pagination with onChange needs a Client Component", () => {
  expect(section("Disclosure")).toContain(
    "`onChange` is a function, so a `Pagination` with `onChange` needs a Client Component.",
  );
});

test("RVW-08 the README Server Components section says loading on Button and IconButton needs a Client Component", () => {
  expect(section("Server Components and sourcemaps")).toContain(
    "`Button` and `IconButton` work there too, except with `loading`, which needs a Client Component.",
  );
});

test("RVW-09 Flight renders Button without loading with no error", () => {
  expect(flight.button.errors).toEqual([]);
});

test("RVW-10 Flight reports the event handler error for Button with loading", () => {
  expect(flight["button-loading"].errors).toEqual([handler]);
});

test("RVW-11 Flight renders IconButton without loading with no error", () => {
  expect(flight.iconbutton.errors).toEqual([]);
});

test("RVW-12 Flight reports the event handler error for IconButton with loading", () => {
  expect(flight["iconbutton-loading"].errors).toEqual([handler]);
});
