# LineChart

One trend line in `ink` over a hatched area, on a hairline baseline with evenly spaced mono x labels. Values are shown as callouts on chosen points instead of a y axis; the active point gets a `signal` node, a halo ring and a large `title`-size callout.

**Consumer provides:** `data` (`x`, `y`, `callout`, `active`), optional `unit`, `format`, `yMin`, `yMax`, `area`, `width`, `height` and an accessible `title`. The SVG scales down to its container; keep the default size or larger so labels stay legible.

- Do: one `active` point, the one the headline is about; callouts on two or three other points at most (usually the start).
- Do: put the source in Footnotes or a `caption` under the chart.
- Don't: smooth curves, gradients, or more than one line; split series into separate charts.
