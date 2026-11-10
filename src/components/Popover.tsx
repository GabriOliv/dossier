"use client";
import {
  cloneElement,
  forwardRef,
  isValidElement,
  useEffect,
  useImperativeHandle,
  useReducer,
  useRef,
  useState,
  type HTMLAttributes,
  type MouseEvent,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { cls } from "../lib/cls";
import type { NativeProps } from "../lib/native";
import { follow, type Placement } from "../lib/position";
import { useStableId } from "../lib/useStableId";

interface PopoverOwnProps {
  /** The element that opens the panel, in general a Button. It gets `aria-expanded`, `aria-controls` and a click that toggles the panel, after its own `onClick`. */
  trigger: ReactElement;
  /** Where the panel goes next to the trigger: `bottom-start` (default), `bottom-end`, `top-start` or `top-end`. It flips to the other side when it does not fit in the window. */
  placement?: Placement;
  /** Opens the panel when true and closes it when false: with it, only this prop opens and closes the panel. Leave it out to let the Popover hold the state. */
  open?: boolean;
  /** Called with the state each gesture asks for: the trigger click, Escape and a click outside the panel. */
  onOpenChange?: (open: boolean) => void;
  children?: ReactNode;
  className?: string;
}

export type PopoverProps = PopoverOwnProps & NativeProps<"div", PopoverOwnProps>;

interface TriggerProps {
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  onPointerDown?: (e: PointerEvent<HTMLElement>) => void;
}

// The React 18 types do not know the popover attribute; React 18 renders it as any lowercase attribute.
const AUTO = { popover: "auto" } as HTMLAttributes<HTMLDivElement>;

/**
 * A panel tied to its trigger, on the native Popover API (`popover="auto"`): it opens in the top layer, a click outside
 * and Escape close it, and focus moves freely in and out of it. When it closes with focus inside, focus goes back to
 * the trigger. A `trigger` that is not a React element renders as it came, with no panel.
 */
export const Popover = forwardRef<HTMLDivElement, PopoverProps>(function Popover(
  { trigger, placement = "bottom-start", open: controlled, onOpenChange, children, className, id: idProp, ...rest },
  ref,
) {
  const autoId = useStableId("ds-pop-");
  const id = idProp ?? autoId;
  const node = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => node.current!);
  const [own, setOwn] = useState(false);
  // A controlled panel the browser closed while `open` stays true renders again, so the effect below shows it again.
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const open = controlled ?? own;
  const ask = (next: boolean) => {
    if (controlled === undefined) setOwn(next);
    else rerender();
    onOpenChange?.(next);
  };
  /** Whether the panel was open when the pointer pressed the trigger; null outside a press. */
  const pressedOpen = useRef<boolean | null>(null);
  /** Whether focus was inside the panel when it started to close, or when the press that closes it began. */
  const focusInside = useRef(false);
  const opener = () => document.querySelector<HTMLElement>(`[aria-controls="${id}"]`);

  useEffect(() => {
    const panel = node.current;
    if (panel && open !== panel.matches(":popover-open")) {
      if (open) panel.showPopover();
      else panel.hidePopover();
    }
  });

  useEffect(() => {
    const panel = node.current;
    const el = opener();
    if (!open || !panel || !el) return;
    return follow(el, panel, placement);
  }, [open, placement, id]);

  useEffect(() => {
    const panel = node.current;
    if (!panel) return;
    const inside = () => panel.contains(document.activeElement);
    // A press outside moves focus out of the panel before the browser closes it: where focus was is read on the press.
    const press = () => {
      if (panel.matches(":popover-open")) focusInside.current = inside();
    };
    const before = (e: Event) => {
      focusInside.current = (e as ToggleEvent).newState === "closed" && (focusInside.current || inside());
    };
    const after = (e: Event) => {
      if ((e as ToggleEvent).newState !== "closed") return;
      // Hiding the panel drops the focus it held: it goes back to the trigger, unless the closing click moved it on.
      if (focusInside.current && (!document.activeElement || document.activeElement === document.body))
        opener()?.focus();
      focusInside.current = false;
      // Still open here means the browser closed it: Escape or a click outside.
      if (open) ask(false);
    };
    window.addEventListener("pointerdown", press, true);
    panel.addEventListener("beforetoggle", before);
    panel.addEventListener("toggle", after);
    return () => {
      window.removeEventListener("pointerdown", press, true);
      panel.removeEventListener("beforetoggle", before);
      panel.removeEventListener("toggle", after);
    };
  });

  if (!isValidElement(trigger)) return <>{trigger}</>;
  const theirs = trigger.props as TriggerProps;

  return (
    <>
      {cloneElement(trigger as ReactElement<TriggerProps & Record<string, unknown>>, {
        "aria-expanded": open,
        "aria-controls": id,
        onPointerDown: (e: PointerEvent<HTMLElement>) => {
          theirs.onPointerDown?.(e);
          pressedOpen.current = node.current!.matches(":popover-open");
        },
        onClick: (e: MouseEvent<HTMLElement>) => {
          theirs.onClick?.(e);
          // The panel itself, not `open`: after Escape the browser hides it at once, but tells React only on the
          // toggle event, which a click that comes first does not wait for.
          const was = pressedOpen.current ?? node.current!.matches(":popover-open");
          pressedOpen.current = null;
          // The press on the trigger of an open panel was a click outside it: the browser has closed the panel.
          if (was && !node.current!.matches(":popover-open")) return;
          ask(!was);
        },
      })}
      <div {...AUTO} {...rest} ref={node} id={id} className={cls("ds-popover", className)}>
        {children}
      </div>
    </>
  );
});
