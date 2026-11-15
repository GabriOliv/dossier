# @gabrioliv/dossier

The Dossier design system for React: components, tokens and ready-made CSS in one package. Used by the portfolio, by QA Garden and by any other React project, so no repo has to rebuild the style.

**[Landing page, with a live sample and the install command](https://gabrioliv.github.io/dossier/)**

**[Storybook with the props and examples of each component](https://gabrioliv.github.io/dossier/storybook/)**

- ESM, TypeScript types and built CSS (no `@import` and no PostCSS).
- React 18 or 19 as a `peerDependency`. It does not depend on `react-dom`.
- Local IBM Plex fonts (`woff2`): no request to Google Fonts.
- Works with SSR (the Docusaurus static build included).

## Install

The package installs from GitHub, from the tarball attached to each release (the same file `npm pack` makes):

```bash
npm install https://github.com/GabriOliv/dossier/releases/download/v1.1.0/gabrioliv-dossier-1.1.0.tgz
```

Your project's `package.json` keeps the version fixed in the URL. To update, change the version in both places of the URL and run your project's tests.

## Usage

### Vite (or another bundler)

```tsx
import "@gabrioliv/dossier/styles.css";
import "@gabrioliv/dossier/base.css"; // optional: only in an app built entirely in Dossier
import { DataHeader, Readout } from "@gabrioliv/dossier";

export function Page() {
  return (
    <>
      <DataHeader title="Run 0427" code="File 0427 · Rev B" kicker="Section 01" />
      <Readout label="Pass rate" value="98.6" unit="%" tone="signal" />
    </>
  );
}
```

Theme: `data-theme="paper"` (the default), `"void"` or `"blueprint"` on `<html>` or on any block.

### Docusaurus

```ts
// docusaurus.config.ts, in the classic preset
theme: {
  customCss: [require.resolve("@gabrioliv/dossier/docusaurus.css"), "./src/css/custom.css"],
},
```

```mdx
import { Readout } from "@gabrioliv/dossier";

<Readout label="Pass rate" value="98.6" unit="%" />
```

Paper and Void follow the Docusaurus light/dark switch, and the Infima variables (`--ifm-*`) come from the tokens. Blueprint is available per block: `<div data-theme="blueprint">`.

`docusaurus.css` also styles what a Docusaurus site draws from Markdown and from its theme, with no color to write in your own CSS: the headings, tables, quotes and links of a document, the DocSearch modal, tag chips, touch targets on phones, and the code blocks and Mermaid diagrams below.

#### Code and diagrams

Code blocks and Mermaid diagrams take only tokens of the active theme, so they follow the light/dark switch:

| Element                            | Color                                |
| ---------------------------------- | ------------------------------------ |
| Code block ground                  | `--ds-panel`                         |
| Comments in code                   | `--ds-ink-muted`                     |
| Keywords in code                   | `--ds-signal`                        |
| Any other code text                | `--ds-ink`                           |
| Diagram nodes (no class)           | `--ds-panel` fill, `--ds-ink` stroke |
| Diagram groups (no class)          | `--ds-paper` fill, `--ds-ink` stroke |
| Edges, arrowheads and diagram text | `--ds-ink`                           |
| Edge labels                        | `--ds-paper` ground                  |
| Diagram font                       | IBM Plex Sans                        |

Prism writes its colors in `style` attributes and Mermaid in a `<style>` element with ids, so `docusaurus.css` sets these colors with `!important`, scoped to `.theme-code-block` and to `svg[id^="mermaid-svg"]`. That is a trade-off: a site that wants another palette has to use `!important` too. Mermaid does not accept `var()` in a `classDef`, so a class of a diagram gets its tokens from your own CSS: give the node the class with `class B ship` (no `classDef`) and write a rule that is more specific than the bridge's and has `!important` too:

```css
svg[id^="mermaid-svg"] .node.ship rect {
  fill: var(--ds-signal-tint) !important;
  stroke: var(--ds-signal) !important;
}
```

## Entry points

| Import                                             | Content                                      | Used by                          |
| -------------------------------------------------- | -------------------------------------------- | -------------------------------- |
| `@gabrioliv/dossier`                               | Components and types                         | Everyone                         |
| `@gabrioliv/dossier/styles.css`                    | Fonts, tokens and components, no global rule | Vite and others                  |
| `@gabrioliv/dossier/base.css`                      | `body`, `:focus-visible`, `color-scheme`     | Only an app dedicated to Dossier |
| `@gabrioliv/dossier/docusaurus.css`                | `styles.css` + dark → Void + Infima styles   | Docusaurus                       |
| `@gabrioliv/dossier/tokens.css`, `.../tokens.json` | The tokens only                              | Slides and other tools           |
| `@gabrioliv/dossier/assets/*`                      | SVGs (stages, banners, diagrams, animations) | Whoever needs them               |

The typography classes have a prefix: `.ds-t-display`, `.ds-t-title`, `.ds-t-figure`, `.ds-t-figure-xl`, `.ds-t-heading`, `.ds-t-body`, `.ds-t-caption`, `.ds-t-label` and `.ds-t-datum`. To cite a footnote, use `<sup class="ds-t-label ds-ref">01</sup>`.

## Components

`DataHeader`, `SectionTitle`, `Readout`, `Tag`, `DataTable`, `FieldList`, `Schematic`, `Hierarchy`, `Quote`, `Footnotes`, `StatusFlag`, `CheckLog`, `StageIcon`, `Assertion`, `BarChart`, `Comparison`, `Connector`, `Contents`, `Dimension`, `ErrorNotice`, `LineChart`, `Meter`, `ProportionDial`, `Redacted`, `TextField`, `Timeline`, `ToleranceBar`, `Transcript`, `Button`, `IconButton`, `Link`, `Checkbox`, `Switch`, `RadioGroup`, `Select`, `Dialog`, `Popover`, `Tooltip`, `Menu`, `Tabs`, `Accordion`, `Pagination`, `Icon`, `Spinner`, `Skeleton`, `Stack`, `Grid`, `Divider`, `Toaster` and `toast`. The props and examples are in the published [Storybook](https://gabrioliv.github.io/dossier/storybook/), where the Overview stories show the variants and states of each component in the three themes, and in the package types. The QA Garden maturity stages are in [docs/maturity-stages.md](docs/maturity-stages.md).

## Links and routers

`Link` renders an `<a class="ds-link">`. The `ds-link` class is public: put it on the link of your router, as in `<NextLink className="ds-link">`, to get the same look without replacing the router's component.

```tsx
import NextLink from "next/link";
import { Link } from "@gabrioliv/dossier";

<Link href="/docs">Documentation</Link>;
<NextLink href="/docs" className="ds-link">
  Documentation
</NextLink>;
```

## Overlays

`Dialog`, `Popover`, `Tooltip` and `Menu` open over the page on the native `<dialog>` element and the Popover API. `Dialog` is controlled: your state holds `open`, and `onClose` runs on Escape, on the close button and on a click on the backdrop. Only setting `open` to `false` closes it. The close button is named "Close"; pass `labels={ptBR.Dialog}` or `labels={{ close: "..." }}` for another text.

```tsx
import { useState } from "react";
import { Button, Dialog } from "@gabrioliv/dossier";

export function DeleteFile() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Delete file</Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Delete file"
        description="The file leaves the folder and cannot be restored."
        actions={
          <Button variant="solid" tone="danger" onClick={() => setOpen(false)}>
            Delete
          </Button>
        }
      />
    </>
  );
}
```

`Popover` and `Menu` take a `trigger` element and open from it; `Tooltip` wraps the trigger and takes a text `content`. `ref` and the native attributes go to the `<dialog>` for `Dialog` and to the panel (the popover, the tip or the menu) for the others.

## Disclosure

`Tabs`, `Accordion` and `Pagination` split a long page. `Tabs` takes `tabs` (`value`, `label`, `content`, `disabled?`) and shows one panel at a time: the arrow keys, Home and End move focus and show the panel. Without `value` it holds the selection itself, from `defaultValue`; with `value` and `onChange` you hold it. `Accordion` takes `items` (`title`, `content`, `defaultOpen?`) on native `<details>`, so it works without JS; `exclusive` keeps one item open at a time.

`Pagination` takes `page`, `total` and `siblings`. With `href` and no `onChange`, each page is a real link, so it works in a Server Component and without JS:

```tsx
import { Pagination } from "@gabrioliv/dossier";

export default function Runs({ page, total }: { page: number; total: number }) {
  return <Pagination page={page} total={total} href={(n) => `/runs?page=${n}`} />;
}
```

Without `href`, each page is a button and `onChange(page, event)` runs on click. With both, the links stay and `onChange` runs on the click before the browser follows the link: call `event.preventDefault()` in it to route on the client instead. The nav is named "Pagination" and each number "Page 5"; pass `labels={ptBR.Pagination}` for Portuguese. `ref` and the native attributes go to the root element of each. `onChange` is a function, so a `Pagination` with `onChange` needs a Client Component.

## Feedback and layout

Mount one `<Toaster />` near the root of the app and call `toast()` from any handler, with no context to pass down:

```tsx
import { Button, Toaster, toast } from "@gabrioliv/dossier";

export function App() {
  return (
    <>
      <Button onClick={() => toast({ title: "File saved", description: "run-0042.pdf" })}>Save</Button>
      <Toaster />
    </>
  );
}
```

`toast({ title, description?, tone?, duration? })` returns the toast's id, and `toast.dismiss(id)` closes it. A default toast leaves after 6 s, paused while the pointer or focus is on it; `tone: "error"` and `duration: Infinity` stay until closed. Up to 3 show at a time at the bottom right (the full width at the bottom on a phone), the others wait in order. The Toaster is a region named "Notifications" with a `role="status"` and a `role="alert"` container; pass `labels={ptBR.Toaster}` for Portuguese.

`Spinner` shows four cells lit in steps, still with reduced motion; `Button` and `IconButton` take `loading`, which shows a Spinner, sets `aria-busy` and ignores clicks. `Skeleton` is a still placeholder (`variant` `text` or `block` with `height`). `Stack` and `Grid` lay items out on the `--ds-space-*` scale (`gap` 1, 2, 3, 4, 6, 8 or 12); `Grid` takes `columns` or `minColumnWidth`. `Divider` is an `<hr>` in three weights, or vertical. `Icon` draws one of 22 icons by `name`, 16 or 24 px, in `currentColor`.

## Shared component API

Every component forwards its `ref` to its root element and accepts the native attributes of that element: `id`, `aria-*`, `data-*`, `style`, `role` and handlers such as `onClick`.

- On a conflict the consumer's value wins: an `aria-label`, `role` or `id` you pass replaces the component's own.
- `className` is added to the component's own classes. `style` is merged with the component's, and your keys win.
- A component prop keeps its meaning when it shares a name with an HTML attribute: `title` on `DataHeader` is the heading text, not the `title` attribute.
- `TextField` sends `ref` and the native attributes to its `<input>`, or to its `<textarea>` with `multiline`; `className` stays on the outer `div`. An `id` you pass becomes the field id that the label and the message follow. An `aria-describedby` you pass replaces the link to the hint or error.
- `Checkbox`, `Switch` and `Select` send `ref` and the native attributes to their `<input>` or `<select>`, and keep `className` on the outer `div`, as `TextField` does. `RadioGroup` sends them to its `<fieldset>`; its radios share the `name` you pass, or a generated one.
- `DataHeader`, `SectionTitle`, `Comparison` and `ErrorNotice` take `level` (1 to 6) to set the heading tag. Without it, or with a value outside 1 to 6, they keep `h1`, `h2`, `h3` and `h3`. The `running` DataHeader has no heading and ignores `level`.

```tsx
const email = useRef<HTMLInputElement>(null);

<TextField ref={email} label="Email" autoComplete="email" data-testid="email" />;
<SectionTitle level={3} index="02" title="Findings" />;
```

## Server Components and sourcemaps

Each component without state works in React Server Components: import it in a Server Component and pass `format` functions there. A component that needs the client carries `"use client"` at the top of its own file in `dist`, so it never marks the others. `Dialog`, `Popover`, `Tooltip` and `Menu` carry it, because they hold state and effects: use them from a Client Component, since their callbacks (`onClose`, `onSelect`) are functions. `Tabs` carries it too, since it holds the selection. `Accordion` and `Pagination` carry no state, so they work in a Server Component, except a `Pagination` with `onChange`. `Button` and `IconButton` work there too, except with `loading`, which needs a Client Component. `Toaster` and `toast` carry it; `Icon`, `Spinner`, `Skeleton`, `Stack`, `Grid` and `Divider` do not.

The package ships a sourcemap beside each `.js` file, with the original TSX inside, so stack traces and the debugger show `src/components/<Name>.tsx`.

## Theming

`styles.css` puts Dossier in cascade layers, so your own CSS without a layer wins without `!important` or a longer selector. Every token is a `--ds-<name>` custom property, such as `--ds-ink`, `--ds-signal` or `--ds-space-2`; the old names without `--ds-` are deprecated aliases. The full token list, the layer order and how to add a theme of your own are in [docs/theming.md](docs/theming.md).

## Labels and number formats

Every fixed text a component shows or announces is English by default, and each component that has one takes `labels` to change it. The package ships a Brazilian Portuguese set, one object per component; a key you leave out stays in English. Numbers keep their `format` prop.

```tsx
import { BarChart, StageIcon, TextField } from "@gabrioliv/dossier";
import { ptBR } from "@gabrioliv/dossier/locales/pt-BR";

<TextField label="E-mail" required labels={ptBR.TextField} />;
<BarChart data={data} format={(v) => v.toLocaleString("pt-BR")} labels={ptBR.BarChart} />;
<StageIcon stage="B" labels={ptBR.StageIcon} />;
```

`StageIcon` is named in English by default ("Stage B · Sprout"). `labels={ptBR.StageIcon}` gives the Portuguese names ("Estágio B · Broto"). Texts Dossier shows in capitals stay as written in the DOM and are uppercased by the CSS, so screen readers read words, not letters.

## Versioning

The package follows [Semantic Versioning](https://semver.org), with this policy:

- Versioning is strict semver: a break needs a major release.
- A deprecated API keeps working for at least one minor release before it goes away.

A deprecation is marked in two places: `@deprecated` on the type, so the editor strikes it through, and a line under `Deprecated` in the [CHANGELOG](CHANGELOG.md). Every release has its own section there.

## Development

Everything runs in the `node` container of [compose.yaml](compose.yaml) (image `mcr.microsoft.com/playwright:v1.64.1-noble`). Nothing is installed on the machine. [CONTRIBUTING.md](CONTRIBUTING.md) explains how to contribute and what a new component needs.

```bash
docker compose run --rm node npm ci                  # install
docker compose run --rm node npm test                # build, then unit tests (SSR in React 18 and 19, CSS, tokens)
docker compose run --rm node npm run test:consumer   # pack and test in the Vite and Docusaurus fixtures
docker compose run --rm node npm run build:all       # build the library, the Storybook and the landing, once each
docker compose run --rm node npm run test:all        # build:all, then every test but the consumer suite; stops at the first failure
docker compose run --rm node npm run test:all:full   # the same with the consumer suite, reporting every failure
docker compose run --rm node npm run format          # Prettier check
docker compose run --rm node npm pack --dry-run      # what goes in the package
docker compose run --rm -p 127.0.0.1:6006:6006 node npm run storybook    # Storybook at http://localhost:6006
docker compose run --rm node npm run build:storybook # static Storybook in storybook-static/
```

The same commands are in `.vscode/tasks.json` (Terminal → Run Task → `Docker: …`).

- Storybook (`.storybook/`, stories in `stories/`) imports the components from `src/`, with hot reload, and the CSS from `dist/`: `npm run storybook` builds first. The theme changes from the toolbar.

- `source/` keeps version `1793668292-91b3` of the Dossier artifact, as a reference only (`cd source && sha256sum -c SHA256SUMS`). The original bundle, `source/components/bundle.js`, is only the source for CMP-16 and for the tests of the defect fixed in ProportionDial; the expected markup of each component is its snapshot.
- Each push to `main` publishes the landing at `/dossier/` and the Storybook at `/dossier/storybook/` to GitHub Pages ([pages.yml](.github/workflows/pages.yml)), from the build of the test run. A failing test blocks the deploy.

### Screenshots and markup snapshots

The tests live in folders named after their kind: `tests/unit` (markup, CSS, tokens, scripts), `tests/component` (computed styles and behaviour), `tests/visual` (screenshots), `tests/a11y` (axe and forced colors), `tests/docs` (the Storybook docs pages), `tests/site` (the landing) and `tests/consumer` (the packed tarball in the Vite and Docusaurus fixtures). Every browser test opens the built Storybook (`iframe.html?id=<story>`), except the landing tests, which open the built landing.

The screenshot references are one per `Overview` story, theme and project (desktop and phone), in `tests/visual/__screenshots__/`, plus the captures of the open overlays. The unit tests compare each component's markup with `tests/unit/__snapshots__/<Name>.html`, the only expected markup. Each capture holds only its story's section, so adding a story changes no other reference. A missing reference fails the test. References are generated only in the container, so they match CI pixel for pixel. After a change on purpose, regenerate them, read the diff, and commit it:

```bash
docker compose run --rm node npm run test:visual:update   # screenshots of every Overview story
docker compose run --rm node npm run test:markup:update   # markup snapshots of every component
```

When a test fails in CI, the workflow uploads `test-results/` as an artifact, with the diff image of each screenshot.

## Release

To cut a release:

1. Raise the `version` in `package.json`, in the two root entries of `package-lock.json` and in the install URL of this README.
2. Move the `Unreleased` lines of `CHANGELOG.md` to a new `## [<version>] - <YYYY-MM-DD>` section.
3. Make the commit on `main`.
4. Push `main`: `git push origin main`. The workflow only accepts a tag whose commit is already on GitHub's `main`.
5. Create the tag: `git tag v<version>`.
6. Push the tag: `git push origin v<version>`.

The `.github/workflows/release.yml` workflow checks that the tag matches `package.json` and that the commit is on `main`. `preflight.mjs` fails if `CHANGELOG.md` has no `## [<version>]` section for that version. Then it runs the same jobs as a pull request (`test.yml`: Prettier, unit tests, browser tests, consumer tests and publint). It then attaches the tested tarball to the GitHub Release, with the text of that changelog section as the release notes, and installs the public URL to confirm.

A manual run (`workflow_dispatch`) runs those tests and keeps the tarball as an artifact. It checks neither the tag nor `main`, and it creates no release.

## License

The code is under the MIT license (see [LICENSE](LICENSE)).

The IBM Plex fonts are distributed under the SIL Open Font License 1.1 (`dist/fonts/LICENSE-*.txt`).
