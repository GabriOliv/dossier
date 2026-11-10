"use client";
import { forwardRef, useEffect, useImperativeHandle, useRef, type MouseEvent, type ReactNode } from "react";
import { cls } from "../lib/cls";
import { pick } from "../lib/labels";
import type { NativeProps } from "../lib/native";
import { useStableId } from "../lib/useStableId";
import { en } from "../locales/en";
import type { Locale } from "../locales/types";
import { IconButton } from "./IconButton";

interface DialogOwnProps {
  /** Shows the dialog as a modal when true and closes it when false: the consumer holds the state. */
  open: boolean;
  /** Called on Escape, on the close button and on a click on the backdrop (unless `alert`). It should set `open` to false. */
  onClose: () => void;
  /** The heading, which names the dialog. */
  title: string;
  /** A line under the title, which describes the dialog. */
  description?: string;
  /** The buttons at the foot, in the order they show. */
  actions?: ReactNode;
  /** `role="alertdialog"`, for a confirmation: a click on the backdrop does not close it. */
  alert?: boolean;
  /** Fixed texts, each falling back to English. */
  labels?: Partial<Locale["Dialog"]>;
  children?: ReactNode;
  className?: string;
}

export type DialogProps = DialogOwnProps & NativeProps<"dialog", DialogOwnProps>;

const closeIcon = (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
    <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" fill="none" />
  </svg>
);

const FOCUSABLE = "a[href], button, input, select, textarea, [tabindex], [contenteditable]";

/** The elements of `root` that Tab reaches, in order: enabled, not removed by tabindex -1, and shown. */
const tabbable = (root: HTMLElement): HTMLElement[] =>
  [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => el.tabIndex >= 0 && !(el as HTMLButtonElement).disabled && el.checkVisibility(),
  );

/** The event is on the dialog itself, outside its box: on the backdrop. */
const outside = (e: MouseEvent<HTMLDialogElement>): boolean => {
  if (e.target !== e.currentTarget) return false;
  const r = e.currentTarget.getBoundingClientRect();
  return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
};

/**
 * A modal dialog on a native `<dialog>`, opened with `showModal()`: the page behind is inert, focus stays inside and
 * goes back to where it was on close. Escape, the close button and the backdrop call `onClose`; only `open` closes it.
 */
export const Dialog = forwardRef<HTMLDialogElement, DialogProps>(function Dialog(
  {
    open,
    onClose,
    title,
    description,
    actions,
    alert,
    labels,
    children,
    className,
    onKeyDown,
    onCancel,
    onClick,
    onPointerDown,
    ...rest
  },
  ref,
) {
  const titleId = useStableId("ds-dlg-");
  const descId = titleId + "-desc";
  const node = useRef<HTMLDialogElement>(null);
  useImperativeHandle(ref, () => node.current!);
  const pressedOutside = useRef(false);

  useEffect(() => {
    const dialog = node.current!;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      role={alert ? "alertdialog" : undefined}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      {...rest}
      ref={node}
      className={cls("ds-dialog", className)}
      // Escape is handled on keydown: cancelling it keeps the dialog open until `open` changes. A nested dialog
      // handles it first and cancels it, so the outer one leaves it alone. An open popover inside (a Popover, a Menu, a
      // Tooltip) is on top of the dialog: Escape is left to it.
      // Tab is kept inside too: from the last focusable element the browser would move focus to its own toolbar.
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (e.defaultPrevented) return;
        if (e.key === "Escape") {
          if (e.currentTarget.querySelector(":popover-open")) return;
          e.preventDefault();
          onClose();
        } else if (e.key === "Tab") {
          const all = tabbable(e.currentTarget);
          const edge = e.shiftKey ? all[0] : all[all.length - 1];
          if (!edge || document.activeElement !== edge) return;
          e.preventDefault();
          (e.shiftKey ? all[all.length - 1] : all[0]).focus();
        }
      }}
      // Any other close request of the browser (the Android back gesture) goes through `cancel`.
      onCancel={(e) => {
        onCancel?.(e);
        e.preventDefault();
        onClose();
      }}
      // A click on the backdrop targets the dialog itself, as do one on its border and a drag that starts inside and
      // ends outside: only a press and a release both outside its box close it.
      onPointerDown={(e) => {
        onPointerDown?.(e);
        pressedOutside.current = outside(e);
      }}
      onClick={(e) => {
        onClick?.(e);
        if (!alert && pressedOutside.current && outside(e)) onClose();
        pressedOutside.current = false;
      }}
    >
      <div className="ds-dialog-box">
        <div className="ds-dialog-head">
          <h2 id={titleId} className="ds-t-heading ds-dialog-title">
            {title}
          </h2>
          <IconButton label={pick(labels?.close, en.Dialog.close)} variant="text" size="sm" onClick={onClose}>
            {closeIcon}
          </IconButton>
        </div>
        {description ? (
          <p id={descId} className="ds-t-body ds-dialog-desc">
            {description}
          </p>
        ) : null}
        {children ? <div className="ds-t-body ds-dialog-body">{children}</div> : null}
        {actions ? <div className="ds-dialog-actions">{actions}</div> : null}
      </div>
    </dialog>
  );
});
