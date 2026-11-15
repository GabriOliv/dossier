# Changelog

All notable changes to `@gabrioliv/dossier` are listed here, newest first. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the version numbers follow the policy in the [Versioning](README.md#versioning) section of the README.

## [Unreleased]

## [1.1.0] - 2026-11-13

### Added

- `.ds-btn` on a link (`<a class="ds-t-label ds-btn ds-btn-solid">`, the `Link` of your router): inline flex, no underline, and the text color kept on hover, so a link looks like a `Button`.
- `docusaurus.css` styles the Markdown of a document with the tokens: h2 with a signal bar, capitals and a 2 px rule, tables with a head rule and hairlines, quotes in the `Quote` look, underlined signal links, a 68ch measure for paragraphs and lists, `hr` and inline code.
- `docusaurus.css` gives the leftovers of Infima and the DocSearch modal the tokens: the gray scales, the shadows and the search variables, square breadcrumbs, category rows and back to top button, and a 1 px ink border on the pagination cards.
- `docusaurus.css` sizes the touch targets on phones, below 997 px: 44 x 44 px for the menu button, the search button, the close button of the menu and the color mode button, and 24 x 24 px for the tag chips and the breadcrumb links.
- `docusaurus.css` draws every tag chip as a rectangle with a 1 px ink border and a transparent ground, without the point and the hole that Infima draws, and the count of the tags index inside the chip, in mono.
- `docusaurus.css` paints the code blocks (Prism) and the Mermaid diagrams with the tokens: a panel ground, comments in ink-muted, keywords in signal, the rest in ink, nodes and timeline events in panel and groups in paper with an ink stroke, lines and the edges of every diagram type in ink, and the diagram text in IBM Plex Sans. Prism and Mermaid write their colors in style attributes, so these rules use `!important`: a site with another palette needs it too. The palette is in the Docusaurus section of the README.
- `docusaurus.css` gives the chrome of the Docusaurus theme the Dossier rules: square corners, no shadow, surfaces and backgrounds in tokens, the keyboard focus ring of the components (the outline comes back in the system color in forced colors), tag chips and table heads as labels in mono, and admonitions in ink, signal and contrast-error. The Infima danger color (`--ifm-color-danger` and its dark steps) is contrast-error.
- `docusaurus.css` draws the Markdown footnotes (`[^1]`) in the look of `Footnotes`: a short rule above the notes, the number in signal mono with two digits, the text in ink-muted at caption size, no back arrow, and the mark in the text in signal mono.
- `href` on an item of `Contents`: the title is a link to that address, in the typography of the title. An item without `href` keeps the markup of 1.0.0.

### Changed

- `FieldList` below 640 px stacks the label above the value in every row, in the `record`, `definition` and two column looks.
- `Contents` below 640 px lays each item out as the number and one column, with the title, the description and the page stacked, and no empty row for a missing description or page.

## [1.0.0] - 2026-11-09

### Added

- The package, installed from the tarball attached to the GitHub Release, with TypeScript types, ESM, and server rendering with React 18 and 19.
- 28 components for technical documents: `DataHeader`, `SectionTitle`, `Readout`, `Tag`, `DataTable`, `FieldList`, `Schematic`, `Hierarchy`, `Quote`, `Footnotes`, `StatusFlag`, `CheckLog`, `StageIcon`, `Assertion`, `BarChart`, `Comparison`, `Connector`, `Contents`, `Dimension`, `ErrorNotice`, `LineChart`, `Meter`, `ProportionDial`, `Redacted`, `TextField`, `Timeline`, `ToleranceBar` and `Transcript`.
- `Button`, `IconButton`, `Link` (with the public class `ds-link` for the link of your router), `Checkbox`, `Switch`, `RadioGroup` and `Select`, on native elements.
- `Dialog`, `Popover`, `Tooltip` and `Menu`, on the native `<dialog>` element and the Popover API.
- `Tabs`, `Accordion` and `Pagination`.
- `Icon` (22 icons), `Spinner`, `Skeleton`, `Stack`, `Grid`, `Divider`, and `Toaster` with the `toast()` function.
- `ref` and the native attributes of the root element on every component. `TextField` sends them to its `<input>` (or `<textarea>` with `multiline`). Your `aria-*`, `role`, `id` and `style` win over the component's own, and `className` is added to its classes.
- `level` (1 to 6) on `DataHeader`, `SectionTitle`, `Comparison` and `ErrorNotice` to set the heading tag.
- `loading` on `Button` and `IconButton`, which shows a `Spinner`, sets `aria-busy` and ignores clicks.
- `labels` on every component that has a fixed text, to change that text, plus the sets `en` in `@gabrioliv/dossier/locales/en` and `ptBR` in `@gabrioliv/dossier/locales/pt-BR`.
- `StageIcon` is named in English by default ("Stage B · Sprout"). Pass `labels={ptBR.StageIcon}` for the Portuguese names ("Estágio B · Broto").
- Components that need the client carry `"use client"` at the top of their own file in `dist`, so the others work in React Server Components. `Pagination` with `onChange`, and `Button` and `IconButton` with `loading`, need a Client Component.
- A sourcemap beside each `.js` file of the package, with the original TSX inside.
- The themes Paper, Void and Blueprint, set with `data-theme`.
- Every token as `--ds-<name>` (`--ds-ink`, `--ds-signal`, `--ds-space-2`), the tokens as `tokens.json`, and a theming guide in `docs/theming.md` with the layer order, the token list and a theme of your own.
- The CSS entry points `styles.css`, `base.css`, `docusaurus.css` and `tokens.css`, and the SVG assets, with the IBM Plex fonts bundled.
- `styles.css` puts Dossier in the cascade layers `dossier.tokens`, `dossier.base` and `dossier.components`, so your own CSS without a layer wins over Dossier whatever its specificity. `docusaurus.css` has no layers.
- Texts shown in capitals keep the case you wrote in the DOM, and the CSS makes them uppercase on screen. Screen readers read words, not letters.
- In forced-colors mode (Windows High Contrast), the marks that Dossier draws with a background color stay visible: `Tag` solid, `StatusFlag` of a failure and the nodes of `Hierarchy`.
- The scrolling tree of `Hierarchy` can be reached and scrolled with the keyboard.

### Deprecated

- The CSS custom properties without the `--ds-` prefix (`--paper`, `--ink`, `--signal`, `--space-2` and the rest): use `--ds-paper`, `--ds-ink`, `--ds-signal`, `--ds-space-2` and so on. The old names are aliases for reading only. Setting an old name does not change the components. They will be removed in a future major release.
