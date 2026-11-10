import { expect, test } from "@playwright/test";
import { headingTag } from "../../src/lib/native";

test("API-24 headingTag maps each level from 1 to 6 to its heading tag", () => {
  expect([1, 2, 3, 4, 5, 6].map((l) => headingTag(l, "h3"))).toEqual(["h1", "h2", "h3", "h4", "h5", "h6"]);
  expect(headingTag(2, "h3")).toBe("h2");
  expect(headingTag(undefined, "h3")).toBe("h3");
});

test("API-25 headingTag falls back for a level outside 1 to 6 or not whole", () => {
  for (const level of [0, 7, 2.5, -1, NaN]) expect(headingTag(level, "h1"), String(level)).toBe("h1");
});
