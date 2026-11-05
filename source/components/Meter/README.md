# Meter

A segmented rating: a row of square cells, filled up to the value, with the label on the left and "7/10" on the right.

**Consumer provides:** `label`, whole-number `value`, `max` (cell count, default 10) and `tone`. Stack several with `space-3` gaps so the cells line up.

- Do: `tone="signal"` on one meter per group at most.
- Do: keep the same `max` for every meter in a group.
- Don't: use it for precise figures; show those in a Readout.
