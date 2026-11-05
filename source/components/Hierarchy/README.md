# Hierarchy

A top-down tree: the root on the `inverse` fill, every other node a square outlined box with mono code and label, joined by orthogonal hairline connectors.

**Consumer provides:** `root` (`label`, `code`, `active`, `children`, nested) and an accessible `title`. Centred in its container; scrolls sideways if wider.

- Do: one `active` node in `signal`.
- Do: keep it to three levels and about twelve nodes; split larger structures.
- Don't: diagonal connectors or rounded boxes.
