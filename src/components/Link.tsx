import { forwardRef, type ReactNode } from "react";
import { cls } from "../lib/cls";
import type { NativeProps } from "../lib/native";

interface LinkOwnProps {
  children?: ReactNode;
  className?: string;
}

export type LinkProps = LinkOwnProps & NativeProps<"a", LinkOwnProps>;

/**
 * An `<a class="ds-link">`. To style the link of a router, put the class on it: `<NextLink className="ds-link">`.
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link({ children, className, ...rest }, ref) {
  return (
    <a {...rest} ref={ref} className={cls("ds-link", className)}>
      {children}
    </a>
  );
});
