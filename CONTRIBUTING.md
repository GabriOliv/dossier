# Contributing

Thanks for helping with `@gabrioliv/dossier`. This page is all you need to open a pull request that passes CI on the first try.

## Environment

Everything runs in the `node` container of [compose.yaml](compose.yaml). Nothing is installed on your machine, and every command below starts with `docker compose run --rm node`.

```bash
docker compose run --rm node npm ci                  # install
docker compose run --rm node npm test                # build, then the unit tests
docker compose run --rm node npm run build           # type check and build dist/
docker compose run --rm node npm run format          # Prettier check
docker compose run --rm node npm run build:gallery   # build the library and the gallery
docker compose run --rm node npm run test:gallery    # gallery tests: screenshots, axe, forced colors
docker compose run --rm node npm run test:consumer   # pack and test in the Vite and Docusaurus fixtures
docker compose run --rm node npm run build:storybook # static Storybook in storybook-static/
docker compose run --rm node npm run test:storybook  # Storybook tests: every docs page opens, desktop and phone
```

To fix a format failure, run `docker compose run --rm node npx prettier --write --print-width 120 --tab-width 2 --no-use-tabs <files>`.

Screenshots and markup snapshots are generated only in the container, so they match CI pixel for pixel. After a change on purpose, regenerate them, read the diff and commit it:

```bash
docker compose run --rm node npm run test:visual:update   # screenshots of every gallery section
docker compose run --rm node npm run test:markup:update   # markup snapshots of every component
```

### Running one test file

The full gallery run is slow. Build first, then name the file and the project:

```bash
docker compose run --rm node npm run build
docker compose run --rm node npx playwright test tests/unit/button.spec.tsx --project unit
docker compose run --rm node npm run build:gallery
docker compose run --rm -e PW_GALLERY=1 node npx playwright test tests/gallery/forms.spec.ts --project gallery
```

Add `-g "<test id>"` (for example `-g "PRM-07"`) to run one test of the file.

## Commits and pull requests

Commits follow [Conventional Commits](https://www.conventionalcommits.org/): `feat(button): add loading`, `fix(menu): close on Tab`, `docs: ...`, `test: ...`, `ci: ...`.

A pull request with a change a consumer can see adds a line under `Unreleased` in [CHANGELOG.md](CHANGELOG.md), in `Added`, `Changed`, `Deprecated`, `Removed` or `Fixed`. CI does not check this, so the reviewer does. A deprecation also gets `@deprecated` on the type. The version policy is in the [Versioning](README.md#versioning) section of the README.

## A new component

Check each item before you open the pull request.

- [ ] `ref` goes to the root element, and the native attributes of that element are accepted.
- [ ] If it has a fixed text, it takes `labels`, with the keys in both `en` and `ptBR` (`src/locales/`).
- [ ] `"use client"` only if it uses state or effects.
- [ ] A section in the gallery (`gallery/src/App.tsx`), with `id` and `data-component` equal to the component name.
- [ ] A story (`stories/<Name>.stories.tsx`) and an MDX page (`stories/<Name>.mdx`) with `Usage`, `Do and don't`, `Accessibility` and `Props`, in this order.
- [ ] A markup snapshot (`npm run test:markup:update`).
- [ ] Screenshots of the gallery section (`npm run test:visual:update`).
- [ ] Zero axe violations: the gallery scan runs on the whole page.
- [ ] Forced colors: a mark that draws with a background or border still shows in Windows High Contrast.
- [ ] A line in `CHANGELOG.md` under `Unreleased`.

The tests also count and list components, so these steps keep CI green:

- Export it from `src/index.ts` as `export { Name, type NameProps } from "./components/Name";`. The snapshot and gallery tests find components by that line.
- Add it to the list in the README's `Components` section. DOC-05 compares that list with the exports.
- Update the component counts in the tests that hard-code them (`49` components, `50` with `toast`, `50` gallery sections and the `324` references of VIS-04): `tests/unit/dist-layout.spec.ts`, `tests/unit/markup.spec.ts`, `tests/unit/react-server.spec.ts`, `tests/unit/release/docs.spec.ts`, `tests/gallery/gallery.spec.ts` and `tests/gallery/visual.spec.ts`.
- Add it to `CASES_API` in `tests/unit/api.spec.tsx`, which checks `ref` and the native attributes, and to the SSR samples in `tests/ssr/samples.mjs`.
- Add two lines to `tests/unit/api-types.ts`, which API-07 and API-08 in `tests/unit/api.spec.tsx` require for every name in `CASES_API`. `export const <Name>Accepts: L.<Name>Props = {...}` passes the required props and a few native attributes of the root. `// @ts-expect-error dangerouslySetInnerHTML is not a prop` above `export const <Name>NoInnerHTML: L.<Name>Props = {...}` passes `dangerouslySetInnerHTML: html`. Copy the lines of an existing component.
- Add its name to `ADDED` in `tests/gallery/uppercase.spec.ts`. I18N-22 counts the screenshot references of the older sections, so the captures of a new one stay out of that count only when the name is in the list.
- With `labels`, add it to `COMPONENTS` and to the ptBR table in `tests/unit/locales.spec.ts`.
- With `"use client"`, add its file to `CLIENT` in `tests/unit/dist-layout.spec.ts`. No other file in `dist` may carry the directive.
- An interactive component (a focusable element, a handler or a control inside) needs a `KEYS` entry in `tests/unit/component-docs.spec.ts`, and its `Accessibility` section must name each key. Add to `LIMITS` there only for a known limit that the `Do and don't` section states.
- CSS goes in `src/styles/components.css` under a comment such as `/* Name */`. CSS-01 in `tests/unit/css.spec.ts` compares that file with the original, so give your block a `.match(...)` and a `.replace(...)` in that test, as the existing blocks have.
- A new mark in forced colors goes in `MARKS` in `tests/gallery/marks.ts`.
