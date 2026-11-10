import { expect, test } from "@playwright/test";
import { place, type Placement } from "../../src/lib/position";

// A 100x20 trigger at x 200 to 300, y 300 to 320, in a 1000x800 viewport; the panel is 80x50 and the gap 4 px.
const trigger = { top: 300, bottom: 320, left: 200, right: 300 };
const panel = { width: 80, height: 50 };
const viewport = { width: 1000, height: 800 };

test("POP-03 place puts the panel on the requested side and edge when it fits", () => {
  const table: [Placement, { top: number; left: number; placement: Placement }][] = [
    ["bottom-start", { top: 324, left: 200, placement: "bottom-start" }],
    ["bottom-end", { top: 324, left: 220, placement: "bottom-end" }],
    ["top-start", { top: 246, left: 200, placement: "top-start" }],
    ["top-end", { top: 246, left: 220, placement: "top-end" }],
  ];
  for (const [placement, expected] of table) {
    expect(place(trigger, panel, viewport, placement), placement).toEqual(expected);
  }
});

test("POP-04 place flips a bottom panel above the trigger when it does not fit below", () => {
  // 300 + 20 + 4 + 50 = 374 > 360: no room below; 300 - 4 - 50 = 246 >= 0: room above.
  const short = { width: 1000, height: 360 };
  expect(place(trigger, panel, short, "bottom-start")).toEqual({ top: 246, left: 200, placement: "top-start" });
  expect(place(trigger, panel, short, "bottom-end")).toEqual({ top: 246, left: 220, placement: "top-end" });
  // Exactly enough room below keeps it below.
  expect(place(trigger, panel, { width: 1000, height: 374 }, "bottom-start").placement).toBe("bottom-start");
});

test("POP-04 place flips a top panel below the trigger when it does not fit above", () => {
  const high = { top: 30, bottom: 50, left: 200, right: 300 };
  expect(place(high, panel, viewport, "top-start")).toEqual({ top: 54, left: 200, placement: "bottom-start" });
  expect(place(high, panel, viewport, "top-end")).toEqual({ top: 54, left: 220, placement: "bottom-end" });
});

test("POP-04 place keeps the requested side when the panel fits on neither side", () => {
  const tall = { width: 80, height: 500 };
  expect(place(trigger, tall, viewport, "bottom-start")).toEqual({ top: 324, left: 200, placement: "bottom-start" });
  expect(place(trigger, tall, viewport, "top-start")).toEqual({ top: -204, left: 200, placement: "top-start" });
});
