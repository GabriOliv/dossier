import { expect, test } from "@playwright/test";
import { pageItems } from "../../src/lib/pages";

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

test("PAG-01 pageItems(5, 20, 1) is 1, …, 4, 5, 6, …, 20", () => {
  expect(pageItems(5, 20, 1)).toEqual([1, "…", 4, 5, 6, "…", 20]);
});

test("PAG-06 a single hidden page is shown in place of the …", () => {
  const table: [number, number, (number | "…")[]][] = [
    [4, 20, [1, 2, 3, 4, 5, "…", 20]],
    [17, 20, [1, "…", 16, 17, 18, 19, 20]],
  ];
  for (const [page, total, expected] of table) expect(pageItems(page, total, 1), `${page}/${total}`).toEqual(expected);
});

test("PAG-07 pageItems(10, 20, 2) is 1, …, 8 to 12, …, 20", () => {
  expect(pageItems(10, 20, 2)).toEqual([1, "…", 8, 9, 10, 11, 12, "…", 20]);
});

test("PAG-09 a page below 1 counts as 1 and one above total as total", () => {
  expect(pageItems(0, 20, 1)).toEqual(pageItems(1, 20, 1));
  expect(pageItems(-3, 20, 1)).toEqual(pageItems(1, 20, 1));
  expect(pageItems(21, 20, 1)).toEqual(pageItems(20, 20, 1));
  expect(pageItems(99, 20, 1)).toEqual(pageItems(20, 20, 1));
  expect(pageItems(0, 20, 1)).toContain(1);
  expect(pageItems(99, 20, 1)).toContain(20);
});

test("DIS-33 with total 7 and siblings 1 every page from 1 to 7 shows, with no …, at any page", () => {
  for (const page of range(1, 7)) expect(pageItems(page, 7, 1), `page ${page}`).toEqual(range(1, 7));
});

test("PAG-06 every cut keeps first, last, current and siblings, and no … stands for a single page", () => {
  const wrong: string[] = [];
  for (const siblings of [0, 1, 2]) {
    for (const total of range(1, 30)) {
      for (const page of range(1, total)) {
        const items = pageItems(page, total, siblings);
        const at = `page ${page}, total ${total}, siblings ${siblings}: ${items.join(" ")}`;
        const numbers = items.filter((i): i is number => i !== "…");
        const near = range(Math.max(1, page - siblings), Math.min(total, page + siblings));
        if ([1, total, ...near].some((n) => !numbers.includes(n))) wrong.push(`${at} misses a page`);
        items.forEach((item, i) => {
          const prev = items[i - 1];
          const next = items[i + 1];
          // A … sits between two numbers and stands for 2 or more pages; two adjacent numbers are consecutive.
          if (item === "…" && (typeof prev !== "number" || typeof next !== "number" || next - prev - 1 < 2))
            wrong.push(`${at} has a … for less than 2 pages`);
          if (item !== "…" && typeof next === "number" && next !== item + 1) wrong.push(`${at} skips a page`);
        });
      }
    }
  }
  expect(wrong).toEqual([]);
});
