# Schematic

The signature diagram: concentric rings (outer solid, inner dotted) with degree ticks, a crosshair, nodes on the rings and 45° leader lines out to mono callouts.

**Consumer provides:** `nodes` (`ring`, `angle` in degrees from 3 o'clock clockwise, `label`, `active`), optional `size` (outer diameter, default 240), `rings` (default 4), `labelWidth` (callout room each side, default 120), `ticks` and an accessible `title`. The SVG scales down to its container.

- Do: one `active` node, filled `signal`; every other node is a `paper` disc outlined in `ink`.
- Do: spread nodes so callouts on the same side sit at least 20px apart vertically.
- Don't: fill rings, add gradients or glows, or label anything inside the outer ring.
