# Connector

An orthogonal hairline arrow ending in a triangle pointer: it runs from one corner of its box to the opposite corner, either leg first, or straight when one side is 0.

**Consumer provides:** `width` and `height` (px), `from` (start corner), `first` (`vertical` or `horizontal`) and `active`. The SVG adds 6px each side for the pointer; position it yourself between the blocks it links.

- Do: use it to show sequence or cause between two or three blocks.
- Do: one `active` connector per composition, on the step under discussion.
- Don't: diagonal or curved arrows, or connectors crossing text.
