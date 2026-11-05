# Maturity stages

QA Garden notes are published before they are finished and mature through revisions. Each note carries one stage tag, `stageA` to `stageD`, and each stage has one geometric icon. The four icons replace the old emoji markers and are built only from the primitives Iconography allows: circle, triangle, square and arc. Iconography's rules still hold everywhere else.

## The cycle

| Stage | Icon | Tag | Reading | Form and meaning |
| --- | --- | --- | --- | --- |
| A | Semente | `stageA` | Iniciais | Hollow circle under a ground line. The idea exists but has not sprouted. |
| B | Broto | `stageB` | Melhorados | Stem with two alternate leaves. The note has broken the surface and had its first revision. |
| C | Árvore | `stageC` | Intermediários | Two layers of triangles over a trunk. Revisions accumulate in layers. |
| D | Fruto | `stageD` | Completos | Circle in `signal` (solid at 16 px, outlined at 48 px) with stalk and leaf. The note is complete and ready to harvest. |

- The R5 ring that surrounds the seed in A is exactly the fruit of D: the cycle closes, and the fruit carries the seed of the next idea.

## Construction

- Module 16 and only two radii, R3 and R5 (3:5 ≈ 1:φ).
- Leaves are lenses of two R5 arcs (B) or two R3 arcs (D). The tree uses equilateral triangles inscribed in R3 and R5.
- Use the files in `assets/stages/`. Never redraw, reproportion or approximate a stage. The construction boards in `assets/stages/pranchas/` show the grid and the dimensions.

## Sizes

| Size | Drawing | Use between | Where |
| --- | --- | --- | --- |
| `sm` · 16 px | filled | 14 and 24 px | tag chips, lists, the title of a tag page |
| `lg` · 48 px | 1 px stroke | 48 and 128 px | cards and headers |

- The large icon is the small one with more detail. Never mix both sizes in the same line.
- The 48 px stroke stays at 1 px at any size (`vector-effect: non-scaling-stroke`).

## Color

- Draw every stage in `ink`. `signal` appears only on the fruit, stage D.
- Never give each stage its own colour, and never use `contrast-error`.
- Stages are told apart by form, not colour: they must read in black and white.
- No plate, border, shadow or ground behind an icon: the background stays transparent.

## Order and ruler

- Always show the stages in order, A → D.
- In large contexts an icon may sit beside the stage ruler: four squares, the current one filled in `signal`.

## Accessibility

- Next to the stage name, mark the icon `aria-hidden="true"` so the stage is not read twice.
- On its own, give it `aria-label="Estágio A · Semente"` (and `Estágio B · Broto`, `Estágio C · Árvore`, `Estágio D · Fruto`). Every file also carries that text in its `<title>`.
- Where SVG cannot go (tab title, meta description, tooltip, search), write the stage as text.

## Files

One asset group, `assets/stages/`, 36 SVGs named `estagio-<a–d>-<name>-<16|48>[-dossier-<theme>].svg`:

- `base/`: `currentColor`, with `var(--signal, #002fa7)` on the fruit. For inline use (React, MDX); follows the page theme.
- `paper/`, `void/`, `blueprint/`: the fixed `ink` and `signal` of each theme. For `<img>` and the asset library.
- `pranchas/`: four 360 × 240 construction boards in the Garden banner format.

## In the QA Garden

- One legend: the "Organização por Evolução" section of the "Comece a Leitura" page shows the four icons at 48 px with name and definition. That is where the reader learns the cycle; everywhere else on the site the icon appears alone.
- Tags: wrap (swizzle) the Docusaurus `Tag` component and map `stageA`–`stageD` to the 16 px icon. Render it inline with `currentColor`: Docusaurus switches theme through `data-theme`, and an `<img>` does not see that switch. This is the Docusaurus `Tag`; Dossier's own `Tag` stays icon-free.
- Component: `<StageIcon stage="A|B|C|D" size="sm|lg" />`, with `sm` = 16 px filled and `lg` = 48 px stroke. It lives in the Garden codebase and is not exported by `window.Dossier`.
