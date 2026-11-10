# Changelog

All notable changes to `@gabrioliv/dossier` are listed here, newest first. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the version numbers follow the policy in the [Versioning](README.md#versioning) section of the README.

## [Unreleased]

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
