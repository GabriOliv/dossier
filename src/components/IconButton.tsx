import { forwardRef, type ReactNode } from "react";
import { cls } from "../lib/cls";
import type { NativeProps } from "../lib/native";
import { Button } from "./Button";

interface IconButtonOwnProps {
  /** The accessible name, since the button shows only an icon. */
  label: string;
  variant?: "outline" | "solid" | "text";
  tone?: "default" | "danger";
  size?: "sm";
  /** A Spinner in place of the icon, as Button's `loading`; the button keeps its size and its `label`. */
  loading?: boolean;
  /** The icon: an SVG. */
  children?: ReactNode;
  className?: string;
}

export type IconButtonProps = IconButtonOwnProps & NativeProps<"button", IconButtonOwnProps>;

/** A square Button that shows an icon and is named by `label`. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, children, className, ...rest },
  ref,
) {
  return (
    <Button aria-label={label} {...rest} ref={ref} className={cls("ds-btn-icon", className)}>
      {children}
    </Button>
  );
});
