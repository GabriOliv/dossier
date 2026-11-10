# Theming

Dossier ships three themes: Paper (the default), Void and Blueprint. Set `data-theme="paper"`, `"void"` or `"blueprint"` on `<html>` or on any block. Every value a component draws with comes from a CSS custom property named `--ds-<name>`. This page lists them and shows how to add a theme of your own.

## Cascade layers

`styles.css` puts Dossier in three cascade layers, in this order: `@layer dossier.tokens, dossier.base, dossier.components;`. `base.css` uses `dossier.base` and starts with the same order line, so it can be imported before or after `styles.css`.

CSS without a layer wins over every layer. With `styles.css`, your own unlayered rule beats a Dossier rule whatever its specificity: `span.my-tag { color: ... }` changes a `Tag` without `!important`. With `docusaurus.css`, unlayered CSS does not win: that file has no layers, because Infima has none and would otherwise win over Dossier.

## Colour and shadow tokens

Each theme sets these. They are the ones a theme of your own defines.

| Token                 | Usage                                                                                                                                                                                                                                                                                                                                           |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--ds-paper`          | Page ground. Every page starts here.                                                                                                                                                                                                                                                                                                            |
| `--ds-panel`          | Recessed fields: table header rows, sidebars, diagram plates. Never a card with a shadow.                                                                                                                                                                                                                                                       |
| `--ds-ink`            | Primary text, rules and diagram strokes, on paper, panel and signal-tint.                                                                                                                                                                                                                                                                       |
| `--ds-ink-muted`      | Field labels, footnotes, secondary readouts, on paper and panel.                                                                                                                                                                                                                                                                                |
| `--ds-rule`           | Structural rules: under headers, table heads, section breaks. Alias of ink.                                                                                                                                                                                                                                                                     |
| `--ds-rule-soft`      | Decorative only: background grid, row separators, inactive rings. Never the only cue for anything.                                                                                                                                                                                                                                              |
| `--ds-signal`         | The one accent (replaces the archetype's red): highlighted data, active nodes, the index square, primary marks. As text, on paper, panel and signal-tint.                                                                                                                                                                                       |
| `--ds-signal-tint`    | Quiet fill behind signal or ink text: highlighted table row, selected region of a diagram.                                                                                                                                                                                                                                                      |
| `--ds-on-signal`      | Text and marks on a signal fill (solid Tag, filled node labels).                                                                                                                                                                                                                                                                                |
| `--ds-inverse`        | The header band and solid black blocks. Flips to light in Void and Blueprint.                                                                                                                                                                                                                                                                   |
| `--ds-on-inverse`     | Text on the inverse band (page title, file code).                                                                                                                                                                                                                                                                                               |
| `--ds-contrast-error` | Errors and negative results only: failed checks, out-of-tolerance values, destructive actions. As text and marks on paper and panel (4.9:1 or more in every theme; not on signal-tint). Text on a contrast-error fill is on-signal. Always paired with a word ("Error", "Failed", "Out of range"), never colour alone. Not for downward trends. |
| `--ds-focus-ring`     | Keyboard focus: a 2px ground-colour gap, then 2px of solid signal. Square, follows the box.                                                                                                                                                                                                                                                     |

## Scale tokens

These are the same in every theme and are set on `:root`.

| Token                 | Value                                                   | Usage                                                                                        |
| --------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `--ds-space-1`        | `4px`                                                   | Label to value, tag padding (vertical).                                                      |
| `--ds-space-2`        | `8px`                                                   | Tag padding (horizontal), table cell padding (vertical).                                     |
| `--ds-space-3`        | `12px`                                                  | Between a rule and the text it introduces.                                                   |
| `--ds-space-4`        | `16px`                                                  | Header band padding, table cell padding (horizontal).                                        |
| `--ds-space-6`        | `24px`                                                  | Column gutter, gap between readouts.                                                         |
| `--ds-space-8`        | `32px`                                                  | Between sections on a page.                                                                  |
| `--ds-space-12`       | `48px`                                                  | Page margin; height of the slim header band.                                                 |
| `--ds-radius-none`    | `0`                                                     | Bands, blocks, tags, tables, inputs: everything rectangular.                                 |
| `--ds-radius-node`    | `50%`                                                   | Diagram nodes and dots only.                                                                 |
| `--ds-stroke-hair`    | `1px`                                                   | Rings, leader lines, row separators, tag outlines.                                           |
| `--ds-stroke-rule`    | `2px`                                                   | Rule under a header row or section title.                                                    |
| `--ds-stroke-heavy`   | `6px`                                                   | The index bar beside a section start; once per section.                                      |
| `--ds-font-display`   | `"IBM Plex Sans Condensed", "Arial Narrow", sans-serif` | The display font family.                                                                     |
| `--ds-font-sans`      | `"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif`  | The sans font family.                                                                        |
| `--ds-font-mono`      | `"IBM Plex Mono", ui-monospace, Menlo, monospace`       | The mono font family.                                                                        |
| `--ds-text-display`   | `700 64px/60px var(--ds-font-display)`                  | Page title inside the inverse band. One per page, uppercase.                                 |
| `--ds-text-title`     | `700 32px/36px var(--ds-font-display)`                  | Section titles, uppercase.                                                                   |
| `--ds-text-figure`    | `600 48px/48px var(--ds-font-display)`                  | The big number in a Readout, Contents numbers, the value on a ProportionDial. Numerals only. |
| `--ds-text-figure-xl` | `600 120px/104px var(--ds-font-display)`                | Hero figure: Readout size hero. One per page or slide. Numerals and a short suffix only.     |
| `--ds-text-heading`   | `600 16px/20px var(--ds-font-sans)`                     | Subheads and table captions, uppercase.                                                      |
| `--ds-text-body`      | `400 14px/21px var(--ds-font-sans)`                     | Running text in columns no wider than 64ch.                                                  |
| `--ds-text-caption`   | `400 12px/16px var(--ds-font-sans)`                     | Footnotes and figure captions, in ink-muted.                                                 |
| `--ds-text-label`     | `500 11px/14px var(--ds-font-mono)`                     | Field labels, file codes, tags, diagram callouts, table heads. Always uppercase.             |
| `--ds-text-datum`     | `400 13px/20px var(--ds-font-mono)`                     | Numbers and codes in table cells, right-aligned, tabular.                                    |

## A theme of your own

Define every colour and shadow token under your own `data-theme` id, then set that id on `<html>` or on a block:

```css
[data-theme="sand"] {
  --ds-paper: #f3eee4;
  --ds-panel: #e5ddcd;
  --ds-ink: #1c1a17;
  --ds-ink-muted: #5b554b;
  --ds-rule: var(--ds-ink);
  --ds-rule-soft: #cfc6b4;
  --ds-signal: #8a3b12;
  --ds-signal-tint: #f0dccd;
  --ds-on-signal: #ffffff;
  --ds-inverse: #1c1a17;
  --ds-on-inverse: #f3eee4;
  --ds-contrast-error: #a8200d;
  --ds-focus-ring: 0 0 0 2px #f3eee4, 0 0 0 4px #8a3b12;
}
```

A token your theme leaves out keeps the value of the theme around it: Paper at `:root`. A dark theme of your own needs `color-scheme: dark` in the same rule, so native controls and scrollbars turn dark too.

## Old names

Every token is also declared under its old name without `--ds-`, such as `--ink` or `--space-2`, as `--ink: var(--ds-ink)`. The old colour and shadow names follow every theme, a theme of your own included. The names without `--ds-` are deprecated aliases: read the `--ds-` names, and set the `--ds-` names to change a value. Setting an old name does not change the components.
