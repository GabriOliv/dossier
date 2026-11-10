import { test } from "@playwright/test";
import { Footnotes, type FootnotesProps } from "../../src/components/Footnotes";
import { expectMarkup } from "./markup";
import { render } from "./oracle";

const cases: [string, FootnotesProps][] = [
  [
    "two notes without ids",
    {
      notes: [
        { text: "File number is the GitHub account ID." },
        { text: "Live means the entry opens a published site. Source means it opens the repository." },
      ],
    },
  ],
  ["ten notes, ids past 09", { notes: Array.from({ length: 10 }, (_, i) => ({ text: `n${i}` })) }],
  ["explicit id", { notes: [{ id: "A", text: "x" }], className: "x" }],
];

test("VIS-11 Footnotes markup matches its snapshot", () => {
  expectMarkup(
    "Footnotes",
    cases.map(([name, props]) => [name, render(<Footnotes {...props} />)]),
  );
});
