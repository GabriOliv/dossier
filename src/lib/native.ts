import type { ComponentPropsWithoutRef, ElementType } from "react";

/**
 * Native attributes of the root element `E` that a component passes through, minus its own props, `children`
 * (the component draws its content) and `dangerouslySetInnerHTML`.
 */
export type NativeProps<E extends ElementType, Own> = Omit<
  ComponentPropsWithoutRef<E>,
  keyof Own | "children" | "dangerouslySetInnerHTML"
>;

export type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

/** `"h" + level` when `level` is a whole number from 1 to 6, else `fallback`. */
export function headingTag(level: number | undefined, fallback: HeadingTag): HeadingTag {
  return Number.isInteger(level) && level! >= 1 && level! <= 6 ? (("h" + level) as HeadingTag) : fallback;
}
