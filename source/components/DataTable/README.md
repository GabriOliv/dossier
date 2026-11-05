# DataTable

A ruled data table: mono heads over a `stroke-rule` rule, hairline `rule-soft` row separators, numeric columns in `datum`, right-aligned.

**Consumer provides:** `columns` (`key`, `label`, `numeric`), `rows` keyed by column, optional `caption` and `highlightRows` (indexes). The table fills its container's width.

- Do: mark `numeric` on every column of numbers or codes so they align on tabular figures.
- Do: highlight one or two rows at most; the highlight is `signal-tint` plus the `stroke-heavy` index bar.
- Don't: zebra stripes, vertical rules, or cell backgrounds other than the highlight.
