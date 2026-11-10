import { forwardRef } from "react";
import { cls } from "../lib/cls";
import type { NativeProps } from "../lib/native";

interface SkeletonOwnProps {
  /** "text" (default): one line of body text high. "block": as high as `height`. */
  variant?: "text" | "block";
  /** The height of a "block", a CSS length or a number of px; the default is `--ds-space-12`. Ignored by "text". */
  height?: string | number;
  className?: string;
}

export type SkeletonProps = SkeletonOwnProps & NativeProps<"div", SkeletonOwnProps>;

/**
 * A still placeholder for content on its way, in `--ds-panel`: no gradient and no movement. It is hidden from assistive
 * tech; put `aria-busy` on the container that loads.
 */
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(function Skeleton(
  { variant, height, className, style, ...rest },
  ref,
) {
  const block = variant === "block";
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cls("ds-skeleton", block ? "ds-skeleton-block" : "ds-t-body ds-skeleton-text", className)}
      style={block && height !== undefined ? { height, ...style } : style}
      {...rest}
    />
  );
});
