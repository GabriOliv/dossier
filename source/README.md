Dossier lays information out like a technical file: a strict grid, monochrome ink, hairline rules, geometric diagrams and one signal blue. Every page should look as if it was printed from a classified archive and still be easy to scan.

## Content fundamentals

- Write like a field report: third person, present tense, declarative. No "I", rarely "you".
- Lead with the fact, then the qualifier: "Stability holds at 98.6% across nine cycles."
- Labels are 1–3 words in mono caps: `POPULATION`, `LAST CONTACT`, `SECTOR`. Components uppercase them for you; write them in sentence case in data.
- Every number carries a unit; units keep their own case (`%`, `km`, `σ`).
- Give each page a file code in the pattern `FILE 0427 · REV B`, and each section a kicker in the pattern `SECTION 01 — OVERVIEW`.
- On slides, each one carries a single message: a Quote statement or a hero Readout, then the evidence (chart, table, comparison). Put the number first in the statement.
- Trends are stated in words and numbers ("+12% vs Q2") next to the triangle; up is not "good" by colour.
- No emoji, no exclamation marks, no marketing adjectives.
- Withheld text is shown with Redacted, sized to the text it replaces. Remove the real text from the data first; never hide it with styling.

## Color

- Start every page on `paper`. Text is `ink`; labels, footnotes and secondary figures are `ink-muted`.
- `signal` is the only accent and covers at most a tenth of a page: the index square, the one key figure, the active node, the highlighted row's bar, a solid Tag.
- Signal text sits on `paper`, `panel` or `signal-tint`. Never put `signal` on `inverse`: it fails contrast in every theme.
- Text on a `signal` fill is `on-signal`; text on the `inverse` band is `on-inverse`. Never hard-code white.
- `rule` (an alias of `ink`) draws structure. `rule-soft` is decorative only: grids, row separators, crosshairs.
- `signal-tint` is the only tinted fill. No gradients, no glows, no transparency effects.
- `contrast-error` is reserved for errors and negative results (failed checks, out-of-tolerance values, destructive actions). It is the only second hue, sits on `paper` or `panel`, takes `on-signal` text when used as a fill, and always comes with a word. Never use it for a downward trend or as decoration.

## Themes

- **Paper** (default): print-like, for documents, reports and slides.
- **Void**: the dark screen version. The band flips to light and `signal` brightens to stay legible.
- **Blueprint**: cyanotype ground with light linework, for architecture sketches, wireframes and technical drawings. `signal` becomes a pale cyan here.
- All text pairs named above hold 4.5:1 or better in all three themes.

## Type

- `display` (IBM Plex Sans Condensed 700, uppercase) appears once per page, inside the DataHeader band.
- `title` for section titles, uppercase, followed by a `stroke-rule` rule `space-3` below.
- `heading` (uppercase, tracked) for subheads and table captions; `body` for running text in columns no wider than 64ch; `caption` for footnotes.
- `label` (IBM Plex Mono, tracked caps) for every field label, code, tag and callout. `datum` for numbers in tables.
- `figure` is numerals only: Readout, Contents numbers, the ProportionDial value. `figure-xl` is the hero number, once per page or slide.
- Load the three families from Google Fonts: IBM Plex Sans Condensed (600, 700), IBM Plex Sans (400, 600), IBM Plex Mono (400, 500). `components/bundle.css` imports them.

## Layout

- 12-column grid, page margin `space-12`, gutter `space-6`, everything on an 8px grid.
- A page reads top-down as modules: DataHeader → readout row → text column + diagram → table → footnotes. Separate modules with `space-8` and a rule, not boxes.
- Compose asymmetrically: a narrow label column (2–3 cols) beside a wide content column. Leave at least a third of the page empty.
- Corners are square (`radius-none`). Only diagram nodes are round (`radius-node`).
- No shadows or elevation. The only shadow token is `focus-ring`.

## Lines and diagrams

- Three weights carry the hierarchy: `stroke-hair` (rings, leaders, outlines), `stroke-rule` (under headers and table heads), `stroke-heavy` (one index bar per section).
- Diagrams are built from primitives: circles, concentric rings, dotted inner rings, degree ticks, crosshairs, squares, triangles as pointers.
- Leader lines leave a node at 45°, then run horizontally to a mono callout outside the figure. Never label inside the outer ring.
- One active element per diagram, in `signal`. Everything else is `ink` on `paper`.

## Iconography

- No icon font and no pictograms. Use geometric primitives only: the filled square (index marker, list bullet), the circle (node), the triangle (pointer, trend, arrowhead), drawn in SVG with `ink` or `signal`.
- Arrows are orthogonal (Connector): straight or one right-angle bend, hairline, triangle head. No curved or diagonal arrows.
- Decoration such as glows, stars, orbits and photographic backgrounds is out of system.
- The system has no logo. Set a product or project name in `display` on the band; do not draw a mark.

## States and motion

- Focus: `focus-ring`, a 2px ground-colour gap then 2px of solid `signal`, square.
- Hover on interactive text: underline in `signal`. Active or selected: `signal` fill or the `stroke-heavy` bar.
- Motion is optional. If used: linear 120ms opacity or position changes, no easing curves, no bounce.

## Components

Page structure
- DataHeader: the title band that opens a document (`band`), or the slim running header on every later page or slide (`running`).
- SectionTitle: signal bar, section number and title over a rule.
- Contents: numbered table of contents; repeat it with the current section active as a divider.
- Footnotes: numbered notes under a short rule; reference them with `<sup class="label ds-ref">01</sup>`.

Data
- Readout: a labelled figure, with optional trend; `size="hero"` for the one number a slide is about.
- Tag: square status label in three variants.
- DataTable: ruled table with mono heads and tabular numbers.
- FieldList: label/value record sheet (`record`) or term/description glossary (`definition`).
- Meter: segmented rating in square cells.

Diagrams
- BarChart: horizontal bars on one axis, one bar in signal.
- LineChart: one trend line over a hatched area, values as callouts, one active point.
- ProportionDial: one share of a whole as a signal arc and a sector of dots.
- Timeline: evenly spaced events on an axis ending in a pointer.
- Schematic: concentric-ring diagram with nodes and callouts.
- Hierarchy: top-down tree of square nodes with orthogonal connectors.
- Dimension: blueprint measure line for wireframes and specs.
- Connector: orthogonal arrow linking blocks in a sequence.

Text
- Quote: uppercase pull quote with a source line (`quote`), or the slide's key message with an eyebrow and a note (`statement`).
- Comparison: two or three parallel criteria columns.
- Transcript: time-coded dialogue log.
- Redacted: inline black bar for withheld text.

Status (the only components that use `contrast-error`)
- StatusFlag: PASS / FAIL / SKIPPED / PENDING flag with a mark and a word.
- ErrorNotice: the blocking error under the page header, with the next step.
- CheckLog: list of checks with a pass/fail summary; failed rows explain themselves.
- Assertion: expected against actual for one check.
- ToleranceBar: a measured value against its allowed range.

Forms
- TextField: square input with label, hint and error state.

Compositions
- TestRunReport: a failed regression run as one page; the reference order for any report that has failures.

Every component with an `active` or `tone` option takes it once per instance: one signal element per figure.

Components live in `components/bundle.js` as `window.Dossier` and expect React 18 on the page.


---

## Consuming this system (generated — do not edit)

Every path named below is under `project/` in this design system: read `project/api/tokens.md`, not `api/tokens.md`.

`components/bundle.js` defines `window.Dossier` (27 components); `components/bundle.css` is its stylesheet; `tokens.css` is every token as a CSS variable plus `@font-face` for the fonts. `components/bundle.css` reads its variables from `tokens.css`. The bundle needs react 18 (not packed in this system: bring your own copy) (`window.React`), react-dom 18 (not packed in this system: bring your own copy) (`window.ReactDOM`), loaded before it. Build any UI by mounting these components; never hand-build a control or draw an icon the system provides.

- **Standalone page:** inline `tokens.css` and `components/bundle.css` in a `<style>`, then the library files and `components/bundle.js` as classic scripts (a file containing `</style`, `</script` or `<!--` breaks an inline element: write the sequence `<\/style`, `<\/script` or `\x3C!--` in your copy, or load that file by URL).
- **Design canvas:** bring `tokens.css`, `components/bundle.css`, `components/bundle.js` and `components/index.d.ts` (for the editor’s props panel) onto the canvas in full, as the canvas type’s design-system components reference says (a server-side copy first where it offers one); in each artboard that uses this system, right after the `support.js` line, load `tokens.css` first, then the stylesheet, then the script; skip the library files (the artboard supplies React); mount with `<x-import component-from-global-scope="Dossier.<Comp>" …>`.
- **Slides deck, or any surface that cannot run the bundle:** tokens only — the values are on `api/tokens.md`; the deck takes `tokens.json` by file path for its colour pickers.

**Read, per thing:** a component’s props, parts and examples: `api/components/<Comp>.md`; token values: `api/tokens.md`; stored assets and their paths: `api/assets/<Group>.md`. After this README, fetch the cards and fonts you need in ONE message as parallel calls — none depends on another.

**Two rules.** Before you use a thing — a component, a token group, an icon, an asset — read its card from the index below; a value you did not read from a card is a guess. `tokens.json`, `manifest.json`, `components/index.d.ts` and `design-system.json` are sources for tools: hand them over. `components/<Comp>/README.md` is the long-form second read a card links to; `SKILL.md` and `artifact-type/` beside them are authoring guidance, not needed to consume the system.

## Index (generated — do not edit)

**Tokens**

- `api/tokens.md` — Every token: surface, text, fill, palette, type, spacing, radius, shadow, stroke. (10.8k)

**Icons and assets**

- `api/assets/animations.md` — 3 files, by asset id. (1.0k)
- `api/assets/banners.md` — 2 files, by asset id. (0.8k)

**Components** (`api/components/<Comp>.md`, 28; 1 of them showcase pages)

- **Page structure**: `DataHeader` — Page headers in two variants: band (default) opens a page with an inverse band holding the title and file code, then a meta row closed by a stroke-rule rule; r… · `SectionTitle` — Opens a section: a short stroke-heavy signal bar and "SECTION 02" in mono, then the title in title over a stroke-rule rule · `Footnotes` — Numbered notes under a short hairline rule: signal mono numbers beside caption text in ink-muted · `Contents` — A numbered table of contents: figure numbers, uppercase title section names, a short description in ink-muted and an optional page reference, rows on hairline…
- **Data**: `Readout` — One labelled figure: label in mono over a number with its unit, ruled on top, with an optional trend line. size="hero" sets the figure in figure-xl for the one… · `Tag` — A square, outlined label in mono caps for status, revision or classification · `DataTable` — A ruled data table: mono heads over a stroke-rule rule, hairline rule-soft row separators, numeric columns in datum, right-aligned · `FieldList` — Label/value rows in two variants: record (default), mono labels in a 144px column beside one-line values; definition, a semibold term beside a longer descripti… · `Meter` — A segmented rating: a row of square cells, filled up to the value, with the label on the left and "7/10" on the right
- **Diagrams**: `BarChart` — Horizontal bars in ink on a single hairline axis, values printed at the end in datum, with a 0 / half / max scale row · `Timeline` — Evenly spaced events on one hairline axis that ends in a triangle pointer: mono position above, square marker on the axis, label and note below · `Schematic` — The signature diagram: concentric rings (outer solid, inner dotted) with degree ticks, a crosshair, nodes on the rings and 45° leader lines out to mono callout… · `Hierarchy` — A top-down tree: the root on the inverse fill, every other node a square outlined box with mono code and label, joined by orthogonal hairline connectors · `Dimension` — A blueprint measure: a hairline with end extension lines, 45° architectural ticks and the value centred above in mono · `LineChart` — One trend line in ink over a hatched area, on a hairline baseline with evenly spaced mono x labels · `ProportionDial` — One share of a whole: a signal arc on the outer ring from 12 o'clock, a disc of dots with the share's sector in ink and the rest in rule-soft, and a leader to… · `Connector` — An orthogonal hairline arrow ending in a triangle pointer: it runs from one corner of its box to the opposite corner, either leg first, or straight when one si…
- **Text**: `Quote` — Large uppercase text in title, in two variants: quote (default), an attributed quote opened by a hanging signal mark under a stroke-rule rule, with a dashed so… · `Transcript` — A time-coded dialogue log: time in ink-muted mono, speaker in mono, line in body, rows split by hairline rule-soft separators · `Redacted` — An inline inverse bar that stands in for withheld text, sized by character count · `Comparison` — Two or three parallel columns weighed against each other: each opens with a stroke-rule rule, a mono code, an uppercase title, a lead sentence and a list with…
- **Status**: `StatusFlag` — The result of one check as a square mono flag: PASS (ink outline, filled square), FAIL (contrast-error fill, cross, on-signal text), SKIPPED (dashed muted outl… · `ErrorNotice` — A blocking error at the top of a page or module: a stroke-heavy contrast-error rule, the error mark with "ERROR · ", an uppercase title, an explanation, an opt… · `CheckLog` — A list of checks with their results: a heading with a pass/fail/skip summary (fail count in contrast-error), then rows of id, label, detail, duration and a Sta… · `Assertion` — Expected against actual for one check: a mono label with a StatusFlag, then EXPECTED and ACTUAL rows in mono · `ToleranceBar` — One measured value against its allowed range: the range as a panel band on a hairline scale, the value as a marker with a triangle pointer
- **Forms**: `TextField` — A square text input (or textarea) with a mono label above and a hint or error below
- **Compositions**: `TestRunReport` (showcase page) — A composition, not an exported component: a failed regression run laid out as one Dossier page, showing where each error component belongs
