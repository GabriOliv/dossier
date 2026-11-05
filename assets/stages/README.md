# stages

The four maturity-stage icons: A · Semente, B · Broto, C · Árvore, D · Fruto. Concept, sizes and usage rules are in the Maturity stages section.

| Folder | Ink | Fruit (D only) | Use |
| --- | --- | --- | --- |
| `base/` | `currentColor` | `var(--signal, #002fa7)` | inline SVG (React, MDX); follows the page theme |
| `paper/` | `#0b0c0e` | `#002fa7` | `<img>` on `paper` |
| `void/` | `#eeeeea` | `#2b7fff` | `<img>` on the Void ground |
| `blueprint/` | `#f1f5ff` | `#7fdcff` | `<img>` on the Blueprint ground |
| `pranchas/` | Paper `ink`/`signal`; Void under `prefers-color-scheme: dark` | — | construction boards, 360 × 240 |

- Each folder runs 16 px A → D, then 48 px A → D; the boards run A → D.
- The themed colours are the `ink` and `signal` tokens of each theme, fixed in the file: they do not follow later token edits.
- Here the `base/` files show black ink and the Paper `signal`, because an `<img>` has no `currentColor` and no page variables. Inline them to inherit the theme.
- In an `<img>`, the boards' IBM Plex Mono import does not load and their labels fall back to the system monospace.
