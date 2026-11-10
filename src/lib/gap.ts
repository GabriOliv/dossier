/** The steps of the `--ds-space-*` scale that Stack and Grid take as a `gap`. */
const GAPS = [1, 2, 3, 4, 6, 8, 12] as const;
export type Gap = (typeof GAPS)[number];

/** `gap` when it is a step of the scale, else 3. */
export const gapOf = (gap: unknown): Gap => ((GAPS as readonly unknown[]).includes(gap) ? (gap as Gap) : 3);
