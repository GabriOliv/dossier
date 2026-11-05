# ProportionDial

One share of a whole: a `signal` arc on the outer ring from 12 o'clock, a disc of dots with the share's sector in `ink` and the rest in `rule-soft`, and a leader to the percentage in `figure` with its label underneath. Optional category callouts sit on the ring like the Schematic's.

**Consumer provides:** `value` (0–100), `label`, optional `segments` (`angle` from 3 o'clock clockwise, `label`), `size`, `labelWidth`, `dotStep` and `title`. The SVG scales down to its container.

- Do: one dial per figure, one share per dial.
- Do: place segment callouts on the side away from the value callout (it sits at the arc's end).
- Don't: use it for several categories that add up to 100%; that is a BarChart.
