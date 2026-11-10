"use client";
import {
  cloneElement,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type FocusEvent,
  type HTMLAttributes,
  type PointerEvent,
  type ReactElement,
} from "react";
import { cls } from "../lib/cls";
import type { NativeProps } from "../lib/native";
import { follow } from "../lib/position";
import { useStableId } from "../lib/useStableId";

interface TooltipOwnProps {
  /** The tip, text only: it describes the trigger. */
  content: string;
  /** The trigger, one element that takes the pointer and focus, in general an IconButton. */
  children: ReactElement;
  className?: string;
}

export type TooltipProps = TooltipOwnProps & NativeProps<"div", TooltipOwnProps>;

interface TriggerProps {
  "aria-describedby"?: string;
  onPointerEnter?: (e: PointerEvent<HTMLElement>) => void;
  onPointerLeave?: (e: PointerEvent<HTMLElement>) => void;
  onFocus?: (e: FocusEvent<HTMLElement>) => void;
  onBlur?: (e: FocusEvent<HTMLElement>) => void;
}

/** How long the pointer or keyboard focus stays on the trigger before the tip shows, in ms. */
const SHOW_DELAY = 500;
/** How long the tip stays after the pointer and focus leave, in ms: time for the pointer to cross onto the tip. */
const HIDE_DELAY = 100;

// The React 18 types do not know the popover attribute; React 18 renders it as any lowercase attribute.
const MANUAL = { popover: "manual" } as HTMLAttributes<HTMLDivElement>;

/**
 * A short text tip for its trigger (`children`), which it describes by `aria-describedby`. It shows above the trigger
 * after the pointer or keyboard focus has stayed on it for 500 ms, stays while the pointer is over the trigger or the
 * tip, and hides on Escape or once pointer and focus have left. A disabled trigger never shows it.
 */
export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(function Tooltip(
  { content, children, className, id: idProp, onPointerEnter, onPointerLeave, ...rest },
  ref,
) {
  const autoId = useStableId("ds-tip-");
  const id = idProp ?? autoId;
  const node = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => node.current!);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const trigger = useRef<HTMLElement | null>(null);
  /** Pointer over the trigger or the tip, and keyboard focus on the trigger. */
  const over = useRef(false);
  const focused = useRef(false);
  /** Stops placing the shown tip and listening for Escape. */
  const stop = useRef<(() => void) | null>(null);

  const hide = () => {
    clearTimeout(timer.current);
    stop.current?.();
    stop.current = null;
    if (node.current?.matches(":popover-open")) node.current.hidePopover();
  };
  const show = () => {
    const tip = node.current!;
    tip.showPopover();
    const unfollow = follow(trigger.current!, tip, "top-start");
    const onKey = (e: KeyboardEvent) => {
      // Cancelled, so the Escape that hides the tip does not also close a Dialog or Popover the tip is in.
      if (e.key !== "Escape") return;
      e.preventDefault();
      hide();
    };
    document.addEventListener("keydown", onKey);
    stop.current = () => {
      unfollow();
      document.removeEventListener("keydown", onKey);
    };
  };
  const update = () => {
    clearTimeout(timer.current);
    const wanted = over.current || focused.current;
    const shown = node.current!.matches(":popover-open");
    if (wanted && !shown) timer.current = setTimeout(show, SHOW_DELAY);
    else if (!wanted && shown) timer.current = setTimeout(hide, HIDE_DELAY);
  };
  useEffect(() => hide, []);

  const theirs = children.props as TriggerProps;
  return (
    <>
      {cloneElement(children as ReactElement<TriggerProps>, {
        "aria-describedby": theirs["aria-describedby"] ? `${theirs["aria-describedby"]} ${id}` : id,
        onPointerEnter: (e) => {
          theirs.onPointerEnter?.(e);
          if (e.currentTarget.matches(":disabled")) return;
          trigger.current = e.currentTarget;
          over.current = true;
          update();
        },
        onPointerLeave: (e) => {
          theirs.onPointerLeave?.(e);
          over.current = false;
          update();
        },
        onFocus: (e) => {
          theirs.onFocus?.(e);
          // Only keyboard focus: a click already brought the pointer.
          if (!e.currentTarget.matches(":focus-visible")) return;
          trigger.current = e.currentTarget;
          focused.current = true;
          update();
        },
        onBlur: (e) => {
          theirs.onBlur?.(e);
          focused.current = false;
          update();
        },
      })}
      <div
        {...MANUAL}
        role="tooltip"
        {...rest}
        ref={node}
        id={id}
        className={cls("ds-t-caption ds-tooltip", className)}
        onPointerEnter={(e) => {
          onPointerEnter?.(e);
          over.current = true;
          update();
        }}
        onPointerLeave={(e) => {
          onPointerLeave?.(e);
          over.current = false;
          update();
        }}
      >
        {content}
      </div>
    </>
  );
});
