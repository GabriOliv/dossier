# DataHeader

Page headers in two variants: `band` (default) opens a page with an `inverse` band holding the title and file code, then a meta row closed by a `stroke-rule` rule; `running` is the slim line repeated at the top of every following page or slide.

**Consumer provides:** `title` (band: 1–3 words; running: the document name), optional `code` ("File 0427 · Rev B"), `kicker` (band: section marker in `signal` after the index square; running: the current section in `ink-muted`) and `meta` (band: right-aligned metadata; running: the page number, "03 / 12"). All text is uppercased for you. Full container width; no padding of its own.

- Do: one band per document, on its first page; a running header on every page after it.
- Do: keep `code` in the `FILE nnnn · REV X` pattern so pages index together.
- Don't: put `signal` anything inside the band (it fails contrast on `inverse` in every theme).
- Don't: stack two headers or use either as a section title; sections use SectionTitle.
