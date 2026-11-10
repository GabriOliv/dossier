"use client";
import {
  cloneElement,
  forwardRef,
  isValidElement,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement,
} from "react";
import { cls } from "../lib/cls";
import type { NativeProps } from "../lib/native";
import type { Placement } from "../lib/position";
import { Popover } from "./Popover";

export interface MenuItem {
  label: string;
  /** Called when the item is chosen, by click, Enter or Space. The menu closes first. */
  onSelect: () => void;
  /** The item stays in the list with `aria-disabled`, the arrow keys skip it and choosing it does nothing. */
  disabled?: boolean;
  /** `danger` shows the item in the error colour, for a destructive action. */
  tone?: "danger";
}

interface MenuOwnProps {
  /** The element that opens the menu, in general a Button or an IconButton. */
  trigger: ReactElement;
  /** The actions, in order. With none the trigger is `aria-disabled` and opens nothing. */
  items: MenuItem[];
  /** Where the menu goes next to the trigger, as in Popover. */
  placement?: Placement;
  className?: string;
}

export type MenuProps = MenuOwnProps & NativeProps<"div", MenuOwnProps>;

interface TriggerProps {
  onKeyDown?: (e: KeyboardEvent<HTMLElement>) => void;
}

/**
 * A button that opens a flat list of actions (`role="menu"`), on a Popover. Opening it, by click, Enter, Space or the
 * down arrow, moves focus to the first enabled item; the arrow keys, Home and End move between the enabled items.
 * Choosing an item closes the menu and moves focus back to the trigger; Escape, Tab and a click outside close it
 * without choosing.
 */
export const Menu = forwardRef<HTMLDivElement, MenuProps>(function Menu(
  { trigger, items, placement, className, onKeyDown, ...rest },
  ref,
) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => panel.current!);
  const nodes = useRef<(HTMLButtonElement | null)[]>([]);
  // The focused item, set with the focus itself: a key pressed before React renders `current` again still steps from it.
  const at = useRef(0);
  const enabled = items.flatMap((item, i) => (item.disabled ? [] : [i]));
  const focus = (i: number | undefined) => {
    if (i === undefined) return;
    at.current = i;
    setCurrent(i);
    nodes.current[i]?.focus();
  };
  const step = (by: number) => focus(enabled[(enabled.indexOf(at.current) + by + enabled.length) % enabled.length]);
  // Opens the menu, by click, Enter, Space or the down arrow on the trigger. After Escape the browser hides the panel at
  // once, but tells React only on the toggle event: `open` can still be true here, and `setOpen(true)` would change
  // nothing. The panel is shown again, so that late event finds it open and leaves it so, and the first item is focused.
  const show = () => {
    if (open && panel.current && !panel.current.matches(":popover-open")) {
      panel.current.showPopover();
      focus(enabled[0]);
    } else setOpen(true);
  };

  // The Popover inside has shown the menu by now: its effects run before these.
  useEffect(() => {
    if (open) focus(enabled[0]);
  }, [open]);

  if (!isValidElement(trigger)) return <>{trigger}</>;
  const opener = trigger as ReactElement<TriggerProps & Record<string, unknown>>;
  if (!items.length) return cloneElement(opener, { "aria-haspopup": "menu", "aria-disabled": true });
  const theirs = opener.props;
  const keys: Record<string, () => void> = {
    ArrowDown: () => step(1),
    ArrowUp: () => step(-1),
    Home: () => focus(enabled[0]),
    End: () => focus(enabled[enabled.length - 1]),
  };

  return (
    <Popover
      role="menu"
      {...rest}
      ref={panel}
      className={cls("ds-menu", className)}
      placement={placement}
      open={open}
      onOpenChange={(next) => (next ? show() : setOpen(false))}
      trigger={cloneElement(opener, {
        "aria-haspopup": "menu",
        onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
          theirs.onKeyDown?.(e);
          if (e.key !== "ArrowDown") return;
          e.preventDefault();
          show();
        },
      })}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (keys[e.key]) {
          e.preventDefault();
          keys[e.key]();
        } else if (e.key === "Tab") setOpen(false);
      }}
    >
      {items.map((item, i) => (
        <button
          key={i}
          ref={(el) => {
            nodes.current[i] = el;
          }}
          type="button"
          role="menuitem"
          tabIndex={i === current ? 0 : -1}
          aria-disabled={item.disabled || undefined}
          className={cls("ds-t-body ds-menu-item", item.tone === "danger" && "ds-menu-danger")}
          onClick={() => {
            if (item.disabled) return;
            setOpen(false);
            item.onSelect();
          }}
        >
          {item.label}
        </button>
      ))}
    </Popover>
  );
});
