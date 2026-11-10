"use client";
import { forwardRef, useRef, useState, type ReactNode } from "react";
import { cls } from "../lib/cls";
import type { NativeProps } from "../lib/native";
import { useStableId } from "../lib/useStableId";

export interface Tab {
  value: string;
  label: ReactNode;
  content: ReactNode;
  /** The tab stays in the list with `aria-disabled`; the arrow keys skip it and a click on it does nothing. */
  disabled?: boolean;
}

interface TabsOwnProps {
  /** The tabs, in order. Every panel is rendered; only the selected one shows. */
  tabs: Tab[];
  /** The selected tab: the consumer holds the state and sets it on `onChange`. */
  value?: string;
  /** The tab selected first when the component holds the state. Default: the first enabled tab. */
  defaultValue?: string;
  /** Called with the tab's value when a click or an arrow key, Home or End selects another tab. */
  onChange?: (value: string) => void;
  /** The accessible name of the tab list. */
  label?: string;
  className?: string;
}

export type TabsProps = TabsOwnProps & NativeProps<"div", TabsOwnProps>;

/**
 * Tabs with automatic activation: the arrow keys, Home and End move focus to an enabled tab and show its panel, and
 * Tab moves on to the panel. With `value` the consumer holds the selection; without it the component does.
 */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  { tabs, value, defaultValue, onChange, label, className, ...rest },
  ref,
) {
  const base = useStableId("ds-tabs-");
  const enabled = tabs.flatMap((tab, i) => (tab.disabled ? [] : [i]));
  const [own, setOwn] = useState(defaultValue ?? tabs[enabled[0]]?.value);
  // Without `value`, a stored tab that is no longer in `tabs` (tabs loaded later, or removed) falls back to the first
  // enabled one.
  const current = value !== undefined ? value : tabs.some((tab) => tab.value === own) ? own : tabs[enabled[0]]?.value;
  const selected = tabs.findIndex((tab) => tab.value === current);
  // The tab that Tab reaches: the selected one, else the first enabled one.
  const stop = selected >= 0 ? selected : enabled[0];
  const nodes = useRef<(HTMLButtonElement | null)[]>([]);

  const select = (i: number) => {
    if (tabs[i].disabled || i === selected) return;
    if (value === undefined) setOwn(tabs[i].value);
    onChange?.(tabs[i].value);
  };
  const move = (i: number | undefined) => {
    if (i === undefined) return;
    nodes.current[i]?.focus();
    select(i);
  };

  return (
    <div {...rest} ref={ref} className={cls("ds-tabs", className)}>
      <div
        role="tablist"
        aria-label={label}
        className="ds-tabs-list"
        onKeyDown={(e) => {
          const at = nodes.current.indexOf(e.target as HTMLButtonElement);
          if (at < 0 || !enabled.length) return;
          // From the focused tab, which a consumer holding `value` may not have selected yet.
          const from = enabled.indexOf(at);
          const keys: Record<string, () => number> = {
            ArrowRight: () => enabled[(from + 1) % enabled.length],
            ArrowLeft: () => enabled[from < 0 ? enabled.length - 1 : (from - 1 + enabled.length) % enabled.length],
            Home: () => enabled[0],
            End: () => enabled[enabled.length - 1],
          };
          if (!keys[e.key]) return;
          e.preventDefault();
          move(keys[e.key]());
        }}
      >
        {tabs.map((tab, i) => (
          <button
            key={i}
            ref={(el) => {
              nodes.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${base}-tab-${i}`}
            aria-controls={`${base}-panel-${i}`}
            aria-selected={i === selected}
            aria-disabled={tab.disabled || undefined}
            tabIndex={i === stop ? 0 : -1}
            className="ds-t-label ds-tab"
            onClick={() => select(i)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab, i) => (
        <div
          key={i}
          role="tabpanel"
          id={`${base}-panel-${i}`}
          aria-labelledby={`${base}-tab-${i}`}
          tabIndex={0}
          hidden={i !== selected}
          className="ds-t-body ds-tabs-panel"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
});
