# BarChart

Horizontal bars in `ink` on a single hairline axis, values printed at the end in `datum`, with a 0 / half / max scale row.

**Consumer provides:** `data` (`label`, `value`, `active`), optional `max`, `unit`, `format` and an accessible `title`. Fills its container's width.

- Do: one `active` bar in `signal`, the one the text talks about.
- Do: sort bars by value or by a meaningful order, never at random.
- Don't: gridlines, rounded bar ends, or more than 8 bars.
