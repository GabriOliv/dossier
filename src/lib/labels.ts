/** The label to show: the consumer's value, or the default when it is missing or empty. */
export const pick = (value: string | undefined, fallback: string): string => value || fallback;
