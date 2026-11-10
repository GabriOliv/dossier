import { forwardRef, type ReactNode } from "react";
import { cls } from "../lib/cls";
import type { NativeProps } from "../lib/native";

interface TagOwnProps {
  /** outline (default) = neutral; solid = signal, the active state; inverse = archived or restricted. */
  variant?: "outline" | "solid" | "inverse";
  /** Each string part is uppercased; an element is rendered as given. */
  children: ReactNode;
  className?: string;
}

export type TagProps = TagOwnProps & NativeProps<"span", TagOwnProps>;

/** Port of Dossier's Tag: a square label. */
export const Tag = forwardRef<HTMLSpanElement, TagProps>(function Tag({ variant, children, className, ...rest }, ref) {
  const v = variant === "solid" || variant === "inverse" ? variant : "outline";
  return (
    <span ref={ref} className={cls("ds-t-label", "ds-tag", "ds-tag-" + v, className)} {...rest}>
      {children}
    </span>
  );
});
