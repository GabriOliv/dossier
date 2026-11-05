# Readout

One labelled figure: `label` in mono over a number with its unit, ruled on top, with an optional trend line. `size="hero"` sets the figure in `figure-xl` for the one number a page or slide is about.

**Consumer provides:** `label`, `value` (already formatted: separators, decimals, a short suffix like "k"), optional `unit` (as written: `%`, `km`, `σ`), `note`, `tone`, `size`, `trend` (`up`, `down`, `flat`) and `delta` (the change in words and numbers). Lay several out in a row with `space-6` gaps (the `.ds-row` helper does this).

- Do: `tone="signal"` on the one figure that matters most; the rest stay `ink`.
- Do: always pair `trend` with `delta`; the triangle never carries meaning alone, and up is not "good" by colour.
- Do: one hero per page or slide, alone or beside a short Quote statement.
- Don't: use it for non-numeric values; that is a Tag or plain `body` text.
- Don't: more than six readouts in a row.
