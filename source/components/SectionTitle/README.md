# SectionTitle

Opens a section: a short `stroke-heavy` signal bar and "SECTION 02" in mono, then the title in `title` over a `stroke-rule` rule.

**Consumer provides:** `title`, optional `index` (number or string) and `meta` (right-aligned, `ink-muted`). Full container width; leave `space-8` above it.

- Do: number sections in page order with two digits: 01, 02, 03.
- Don't: use it for subheads inside a section; use `heading` type there.
