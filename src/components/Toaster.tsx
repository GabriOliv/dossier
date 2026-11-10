"use client";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  useSyncExternalStore,
  type HTMLAttributes,
} from "react";
import { cls } from "../lib/cls";
import { pick } from "../lib/labels";
import type { NativeProps } from "../lib/native";
import {
  add,
  claim,
  dismiss,
  pause,
  resume,
  serverSnapshot,
  snapshot,
  subscribe,
  type ToastItem,
  type ToastOptions,
} from "../lib/toast-store";
import { en } from "../locales/en";
import type { Locale } from "../locales/types";
import { Icon } from "./Icon";
import { IconButton } from "./IconButton";

export type { ToastOptions };

/**
 * Shows a toast in the `<Toaster />` of the page, or queues it until one mounts, and returns its id (null for an
 * empty title). `toast.dismiss(id)` closes it.
 */
export const toast = Object.assign((options: ToastOptions): string | null => add(options), {
  dismiss: (id: string): void => dismiss(id),
});

interface ToasterOwnProps {
  /** Fixed texts, each falling back to English: the region's `name` and the `close` button. */
  labels?: Partial<Locale["Toaster"]>;
  className?: string;
}

export type ToasterProps = ToasterOwnProps & NativeProps<"section", ToasterOwnProps>;

// The React 18 types do not know the popover attribute; React 18 renders it as any lowercase attribute.
const MANUAL = { popover: "manual" } as HTMLAttributes<HTMLElement>;

/** One toast: its time stops while the pointer is over it or focus is inside it. */
function Toast({ item, close }: { item: ToastItem; close: string }) {
  const over = useRef(false);
  const focused = useRef(false);
  const update = () => (over.current || focused.current ? pause : resume)(item.id);
  return (
    <div
      className={cls("ds-toast", item.tone === "error" && "ds-toast-error")}
      onPointerEnter={() => {
        over.current = true;
        update();
      }}
      onPointerLeave={() => {
        over.current = false;
        update();
      }}
      onFocus={() => {
        focused.current = true;
        update();
      }}
      onBlur={(e) => {
        if (e.currentTarget.contains(e.relatedTarget)) return;
        focused.current = false;
        update();
      }}
    >
      {item.tone === "error" && <Icon name="error" className="ds-toast-mark" />}
      <div className="ds-toast-body">
        <p className="ds-t-body ds-toast-title">{item.title}</p>
        {item.description && <p className="ds-t-caption ds-toast-desc">{item.description}</p>}
      </div>
      <IconButton label={close} variant="text" size="sm" onClick={() => dismiss(item.id)}>
        <Icon name="close" />
      </IconButton>
    </div>
  );
}

/**
 * The live region where `toast()` shows its messages, at the bottom right (the full width at the bottom on a phone),
 * in the top layer. It is always rendered, with a `role="status"` container for default toasts and a `role="alert"`
 * one for errors, so a screen reader announces each new toast. Mount one per page: only the first one mounted shows
 * the toasts. Up to 3 show at a time; the others wait in order of arrival.
 */
export const Toaster = forwardRef<HTMLElement, ToasterProps>(function Toaster({ labels, className, ...rest }, ref) {
  const [me] = useState(() => ({}));
  const node = useRef<HTMLElement>(null);
  useImperativeHandle(ref, () => node.current!);
  const state = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  useEffect(() => {
    if (!node.current!.matches(":popover-open")) node.current!.showPopover();
    return claim(me);
  }, [me]);
  const toasts = state.owner === me ? state.toasts : [];
  const close = pick(labels?.close, en.Toaster.close);
  const list = (error: boolean) =>
    toasts.filter((t) => (t.tone === "error") === error).map((t) => <Toast key={t.id} item={t} close={close} />);
  return (
    <section
      {...MANUAL}
      role="region"
      aria-label={pick(labels?.name, en.Toaster.name)}
      {...rest}
      ref={node}
      className={cls("ds-toaster", className)}
    >
      <div role="status" className="ds-toaster-list">
        {list(false)}
      </div>
      <div role="alert" className="ds-toaster-list">
        {list(true)}
      </div>
    </section>
  );
});
