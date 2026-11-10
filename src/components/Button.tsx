import { forwardRef, type MouseEvent, type ReactNode } from "react";
import { cls } from "../lib/cls";
import type { NativeProps } from "../lib/native";
import { Spinner } from "./Spinner";

interface ButtonOwnProps {
  /** `outline` (default), `solid` for the main action, `text` for the quiet ones. Anything else renders as `outline`. */
  variant?: "outline" | "solid" | "text";
  /** `danger` swaps the accent for the error colour, for destructive actions. Anything else renders as `default`. */
  tone?: "default" | "danger";
  /** `sm` is the compact size; the default is the standard one. */
  size?: "sm";
  /**
   * A Spinner over the label, which keeps its place so the width does not change. The button stays focusable and
   * has `aria-busy`, but a click, Enter or Space neither calls `onClick` nor submits a form.
   */
  loading?: boolean;
  children?: ReactNode;
  className?: string;
}

export type ButtonProps = ButtonOwnProps & NativeProps<"button", ButtonOwnProps>;

const ignore = (event: MouseEvent<HTMLButtonElement>) => event.preventDefault();

/** A square button in three variants. `type` is `button` unless the consumer says `submit` or `reset`. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, tone, size, loading, type = "button", children, className, onClick, ...rest },
  ref,
) {
  return (
    <button
      type={type}
      aria-busy={loading ? true : undefined}
      onClick={loading ? ignore : onClick}
      {...rest}
      ref={ref}
      className={cls(
        "ds-t-label ds-btn",
        variant === "solid" || variant === "text" ? "ds-btn-" + variant : "ds-btn-outline",
        tone === "danger" && "ds-btn-danger",
        size === "sm" && "ds-btn-sm",
        loading && "ds-btn-loading",
        className,
      )}
    >
      {loading ? (
        <>
          <span className="ds-btn-label">{children}</span>
          <Spinner className="ds-btn-spinner" aria-hidden="true" />
        </>
      ) : (
        children
      )}
    </button>
  );
});
