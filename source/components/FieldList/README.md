# FieldList

Label/value rows in two variants: `record` (default), mono labels in a 144px column beside one-line values; `definition`, a semibold term beside a longer description under a `stroke-rule` rule.

**Consumer provides:** `fields` (`label`, `value`, `mono` for codes, dates and coordinates, `active` for the one value to flag), `variant`, and for records `columns` (1 or 2). Fills its container.

- Do: records for identity sheets (designation, code, status first); definitions for glossaries, scope notes and "what this document contains".
- Do: keep definition descriptions to one or two sentences.
- Don't: use it for numeric comparisons across items; that is a DataTable.
